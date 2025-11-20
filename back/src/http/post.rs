use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing, Json, Router,
};
use tracing::{debug, error};

use crate::models::{
    ApiResponse,
    AppState,
    Post,
    NewPost,
    ReadPostParams,
    Pagination,
    PagedResponse,
};
use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};

pub fn post_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

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

pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadPostParams>,
) -> impl IntoResponse {
    debug!("Post: {:?}", params);
    if let Some(id) = params.id {
        let post_id: i32 = id.parse().unwrap_or(0);
        match Post::read(&app_state.pool, post_id).await {
            Ok(posts) => {
                debug!("Posts: {:?}", posts);
                ApiResponse::new(
                    StatusCode::OK, 
                    "Posts", 
                    Some(serde_json::to_value(posts).unwrap())
                ).into_response()
            },
            Err(e) => {
                error!("Error reading posts: {:?}", e);
                ApiResponse::new(
                    StatusCode::BAD_REQUEST, 
                    "Error reading posts", 
                    None
                ).into_response()
            }
        }
    }else if let Ok(posts) = Post::read_paged(&app_state.pool, &params).await &&
            let Ok(count) = Post::count_paged(&app_state.pool, &params).await {
        debug!("Posts: {:?}", posts);
        let limit = params.limit.unwrap_or(DEFAULT_LIMIT);
        let offset = params.page.unwrap_or(DEFAULT_PAGE) - 1;
        let total_pages = (count as f32 / limit as f32).ceil() as u32;
        let pagination = Pagination {
            page: offset + 1,
            limit,
            pages: total_pages,
            records: count,
            prev: if offset > 0 {
                Some(format!("/records?page={}&limit={}", offset, limit))
            }else{
                None
            },
            next: if (offset + 1) < total_pages {
                Some(format!("/records?page={}&limit={}", offset + 2, limit))
            }else{
                None
            },
        };
        PagedResponse::new(StatusCode::OK, "results", 
            Some(serde_json::to_value(posts).unwrap()),
            pagination)
            .into_response()
    }else{
        match Post::read_all(&app_state.pool).await {
            Ok(posts) => {
                debug!("Posts: {:?}", posts);
                ApiResponse::new(
                    StatusCode::OK, 
                    "Posts", 
                    Some(serde_json::to_value(posts).unwrap())).into_response()
            },
            Err(e) => {
                error!("Error reading posts: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading posts", None).into_response()
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



