use std::sync::Arc;

use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing,
};
use tracing::{debug, error};

use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};
use crate::models::{
    ApiResponse, AppState, NewComment, PagedResponse, Pagination, Comment, ReadCommentParams,
};

pub fn comment_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(mut comment): Json<NewComment>,
) -> impl IntoResponse {
    debug!("Comment: {:?}", comment);
    match Comment::create(&app_state.pool, &mut comment).await {
        Ok(comment) => {
            debug!("Comment created: {:?}", comment);
            ApiResponse::new(
                StatusCode::CREATED,
                "Created",
                Some(serde_json::to_value(comment).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating comment: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(mut comment): Json<Comment>,
) -> impl IntoResponse {
    debug!("Update comment: {:?}", comment);
    match Comment::update(&app_state.pool, &mut comment).await {
        Ok(comment) => {
            debug!("Comment updated: {:?}", comment);
            ApiResponse::new(
                StatusCode::OK,
                "Comment updated",
                Some(serde_json::to_value(comment).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating comment: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadCommentParams>,
) -> impl IntoResponse {
    debug!("Comment: {:?}", params);
    if let Some(id) = params.id {
        let comment_id: i32 = id.parse().unwrap_or(0);
        match Comment::read(&app_state.pool, comment_id).await {
            Ok(comments) => {
                debug!("Comments: {:?}", comments);
                ApiResponse::new(
                    StatusCode::OK,
                    "Comments",
                    Some(serde_json::to_value(comments).unwrap()),
                )
                .into_response()
            }
            Err(e) => {
                let msg = format!("Error reading comments: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None).into_response()
            }
        }
    } else if let Ok(comments) = Comment::read_paged(&app_state.pool, &params).await
        && let Ok(count) = Comment::count_paged(&app_state.pool, &params).await
    {
        debug!("Comments: {:?}", comments);
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
            } else {
                None
            },
            next: if (offset + 1) < total_pages {
                Some(format!("/records?page={}&limit={}", offset + 2, limit))
            } else {
                None
            },
        };
        PagedResponse::new(
            StatusCode::OK,
            "results",
            Some(serde_json::to_value(comments).unwrap()),
            pagination,
        )
        .into_response()
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading comments", None)
            .into_response()
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadCommentParams>,
) -> impl IntoResponse {
    if let Some(id) = params.id {
        let comment_id: i32 = id.parse().unwrap_or(0);
        match Comment::delete(&app_state.pool, comment_id).await {
            Ok(comment) => {
                ApiResponse::new(
                    StatusCode::OK,
                    "Comment",
                    Some(serde_json::to_value(comment).unwrap()),
                )
            }
            Err(e) => {
                let msg = format!("Error deleting comment: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::NOT_FOUND, &msg, None)
            }
        }
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "comment_id is mandatory", None)
    }
}
