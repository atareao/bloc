use std::sync::Arc;

use axum::{
    extract::{Query, State, Path},
    http::StatusCode,
    response::IntoResponse,
    routing, Json, Router,
};
use tracing::{debug, error};

use crate::models::{ApiResponse, AppState, Data, Value, NewValue};

pub fn value_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/reference/{name}", routing::get(read_by_reference))
        .route("/", routing::delete(delete))
}

type Result = std::result::Result<ApiResponse, ApiResponse>;

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(value): Json<NewValue>,
) -> impl IntoResponse {
    debug!("Value: {:?}", value);
    match Value::create(&app_state.pool, &value).await {
        Ok(value) => {
            debug!("Value created: {:?}", value);
            ApiResponse::new(StatusCode::CREATED, "Value created", Data::One(serde_json::to_value(value).unwrap()))
        },
        Err(e) => {
            error!("Error creating value: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error creating valuee", Data::None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(value): Json<Value>,
) -> impl IntoResponse {
    debug!("Update value: {:?}", value);
    match Value::update(&app_state.pool, &value).await {
        Ok(value) => {
            debug!("Value updated: {:?}", value);
            ApiResponse::new(StatusCode::OK, "Value updated", Data::One(serde_json::to_value(value).unwrap()))
        },
        Err(e) => {
            error!("Error updating value: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error updating value", Data::None)
        }
    }
}

pub async fn read(
    State(app_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match Value::read_all(&app_state.pool).await {
        Ok(values) => {
            debug!("Values: {:?}", values);
            ApiResponse::new(StatusCode::OK, "Values", Data::One(serde_json::to_value(values).unwrap()))
        },
        Err(e) => {
            error!("Error reading values: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading values", Data::None)
        }
    }
}

pub async fn read_by_reference(
    Path(name): Path<String>,
    State(app_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match Value::read_by_reference(&app_state.pool, &name).await {
        Ok(key_values) => {
            debug!("KeyValues: {:?}", key_values);
            ApiResponse::new(
                StatusCode::OK, 
                &format!("KeyValues for {name}"),
                Data::One(serde_json::to_value(key_values).unwrap()))
        },
        Err(e) => {
            error!("Error reading values: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading values", Data::None)
        }
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Json(value): Json<Value>,
) -> impl IntoResponse {
    debug!("Value: {:?}", &value);
    match Value::delete(&app_state.pool, value.id).await {
        Ok(value) => {
            debug!("Value deleted: {:?}", value);
            ApiResponse::new(StatusCode::OK, "Value deleted", Data::One(serde_json::to_value(value).unwrap()))
        },
        Err(e) => {
            error!("Error deleting value: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error deleting value", Data::None)
        }
    }
}



