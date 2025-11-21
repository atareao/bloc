use std::sync::Arc;

use axum::{
    body,
    extract::State,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing, Json, Router,
};
use bcrypt::verify;
use tracing::{debug, error};

use axum_extra::extract::cookie::{Cookie, SameSite};
use jsonwebtoken::{encode, EncodingKey, Header};

use crate::models::{ApiResponse, AppState, TokenClaims, User, UserSchema, UserRegister};

pub fn user_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/login", routing::post(login))
        .route("/logout", routing::get(logout))
        .route("/register", routing::post(register))
}

pub fn api_user_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::get(read))
        .route("/any", routing::get(any_user_exists))
}


type Result = std::result::Result<ApiResponse, ApiResponse>;

pub async fn any_user_exists(State(app_state): State<Arc<AppState>>) -> impl IntoResponse {
    match User::any_user_exists(&app_state.pool).await {
        Ok(exists) => {
            debug!("Any user exists: {:?}", exists);
            let value = serde_json::json!({ "any_user_exists": exists });
            ApiResponse::new(StatusCode::OK, "Ok", Some(value))
        }
        Err(e) => {
            error!("Error checking if any user exists: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error checking if any user exists",None)
        }
    }
}

pub async fn login(State(app_state): State<Arc<AppState>>, Json(user_schema): Json<UserSchema>) -> Result {
    //) -> Result<Json<serde_json::Value>,(StatusCode, Json<serde_json::Value>)>{
    tracing::info!("init login");
    tracing::info!("User schema: {:?}", user_schema);
    let user = User::get_by_email(&app_state.pool, &user_schema.email)
        .await
        .map_err(|e| {
            let message = &format!("Error: {}", e);
            ApiResponse::new(StatusCode::FORBIDDEN, message, None)
        })?;
    if !user.active || !verify(&user_schema.password, &user.hashed_password).unwrap() {
        let message = "Invalid name or password. Please <a href='/login'>log in</a>";
        return Err(ApiResponse::new(StatusCode::FORBIDDEN, message, None));
    }

    let now = chrono::Utc::now();
    let iat = now.timestamp() as usize;
    let exp = (now + chrono::Duration::minutes(60)).timestamp() as usize;
    let claims: TokenClaims = TokenClaims {
        sub: user.email.to_string(),
        role: user.role.to_string(),
        user_id: user.id,
        exp,
        iat,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(app_state.secret.as_bytes()),
    )
    .map_err(|e| {
        let message = format!("Encoding JWT error: {}", e);
        ApiResponse::new(StatusCode::INTERNAL_SERVER_ERROR, &message, None)
    })
    .map(|token| {
        let value = serde_json::json!({"token": token});
        ApiResponse::new(StatusCode::OK, "Ok", Some(value))
    })
}

pub async fn register(
    State(app_state): State<Arc<AppState>>,
    Json(user_data): Json<UserRegister>,
) -> impl IntoResponse {
    debug!("User data: {:?}", user_data);
    match User::create(&app_state.pool, &user_data.username, &user_data.email, &user_data.password, &user_data.role).await {
        Ok(user) => {
            debug!("User created: {:?}", user);
            ApiResponse::new(StatusCode::CREATED, "User created", Some(serde_json::to_value(user).unwrap()))
        },
        Err(e) => {
            error!("Error creating user: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error creating user", None)
        }
    }
}

pub async fn logout() -> impl IntoResponse {
    debug!("Logout");
    let cookie = Cookie::build(("token", ""))
        .path("/")
        .max_age(cookie::time::Duration::hours(-1))
        .same_site(SameSite::Lax)
        .http_only(true)
        .build();

    tracing::info!("The cookie: {}", cookie.to_string());

    Response::builder()
        .status(StatusCode::SEE_OTHER)
        .header(header::LOCATION, "/")
        .header(header::SET_COOKIE, cookie.to_string())
        .body(body::Body::empty())
        .unwrap()
}

pub async fn read(
    State(app_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match User::read_all(&app_state.pool).await {
        Ok(values) => {
            debug!("Users: {:?}", values);
            ApiResponse::new(
                StatusCode::OK,
                "Users",
                Some(serde_json::to_value(values).unwrap_or_default()),
            )
        }
        Err(e) => {
            error!("Error reading values: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading values", None)
        }
    }
}

