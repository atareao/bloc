use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing, Json, Router,
};
use tracing::{debug, error};

use crate::models::{ApiResponse, AppState, Post, NewPost};

pub fn post_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

type Result = std::result::Result<ApiResponse, ApiResponse>;

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(post): Json<NewPost>,
) -> impl IntoResponse {
    debug!("Post: {:?}", post);
    match Post::create(&app_state.pool, &post).await {
        Ok(post) => {
            debug!("Post created: {:?}", post);
            ApiResponse::new(
                StatusCode::CREATED, 
                "Created", 
                Some(serde_json::to_value(post).unwrap()))
        },
        Err(e) => {
            error!("Error creating post: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error creating poste", None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(post): Json<Post>,
) -> impl IntoResponse {
    debug!("Update post: {:?}", post);
    match Post::update(&app_state.pool, &post).await {
        Ok(post) => {
            debug!("Post updated: {:?}", post);
            ApiResponse::new(StatusCode::OK, "Post updated", Some(serde_json::to_value(post).unwrap()))
        },
        Err(e) => {
            error!("Error updating post: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error updating post", None)
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct PostParams {
    pub post_id: Option<i32>
}
pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<PostParams>,
) -> impl IntoResponse {
    debug!("Post: {:?}", params);
    if let Some(post_id) = params.post_id {
        match Post::read(&app_state.pool, post_id).await {
            Ok(posts) => {
                debug!("Posts: {:?}", posts);
                ApiResponse::new(StatusCode::OK, "Posts", Some(serde_json::to_value(posts).unwrap()))
            },
            Err(e) => {
                error!("Error reading posts: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading posts", None)
            }
        }
    }else{
        match Post::read_all(&app_state.pool).await {
            Ok(posts) => {
                debug!("Posts: {:?}", posts);
                ApiResponse::new(StatusCode::OK, "Posts", Some(serde_json::to_value(posts).unwrap()))
            },
            Err(e) => {
                error!("Error reading posts: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading posts", None)
            }
        }
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Json(post): Json<Post>,
) -> impl IntoResponse {
    debug!("Post: {:?}", &post);
    match Post::delete(&app_state.pool, &post).await {
        Ok(post) => {
            debug!("Post deleted: {:?}", post);
            ApiResponse::new(StatusCode::OK, "Post deleted", Some(serde_json::to_value(post).unwrap()))
        },
        Err(e) => {
            error!("Error deleting post: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error deleting post", None)
        }
    }
}



