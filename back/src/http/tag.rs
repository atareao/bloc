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
    ApiResponse, AppState, NewTag, PagedResponse, Pagination, Tag, ReadTagParams,
};

pub fn tag_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(mut tag): Json<NewTag>,
) -> impl IntoResponse {
    debug!("Tag: {:?}", tag);
    match Tag::create(&app_state.pool, &mut tag).await {
        Ok(tag) => {
            debug!("Tag created: {:?}", tag);
            ApiResponse::new(
                StatusCode::CREATED,
                "Created",
                Some(serde_json::to_value(tag).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating tag: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(mut tag): Json<Tag>,
) -> impl IntoResponse {
    debug!("Update tag: {:?}", tag);
    match Tag::update(&app_state.pool, &mut tag).await {
        Ok(tag) => {
            debug!("Tag updated: {:?}", tag);
            ApiResponse::new(
                StatusCode::OK,
                "Tag updated",
                Some(serde_json::to_value(tag).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating tag: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadTagParams>,
) -> impl IntoResponse {
    debug!("Tag: {:?}", params);
    if let Some(id) = params.id {
        let tag_id: i32 = id.parse().unwrap_or(0);
        match Tag::read(&app_state.pool, tag_id).await {
            Ok(tags) => {
                debug!("Tags: {:?}", tags);
                ApiResponse::new(
                    StatusCode::OK,
                    "Tags",
                    Some(serde_json::to_value(tags).unwrap()),
                )
                .into_response()
            }
            Err(e) => {
                let msg = format!("Error reading tags: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None).into_response()
            }
        }
    } else if let Ok(tags) = Tag::read_paged(&app_state.pool, &params).await
        && let Ok(count) = Tag::count_paged(&app_state.pool, &params).await
    {
        debug!("Tags: {:?}", tags);
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
            Some(serde_json::to_value(tags).unwrap()),
            pagination,
        )
        .into_response()
    } else if let Some(post_id) = params.post_id && 
    let Ok(tags) = Tag::read_tags_for_post(&app_state.pool, post_id).await {
        debug!("Tags by post_id {}: {:?}", post_id, tags);
        ApiResponse::new(
            StatusCode::OK,
            "Tags",
            Some(serde_json::to_value(tags).unwrap()),
        )
        .into_response()
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading tags", None)
            .into_response()
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadTagParams>,
) -> impl IntoResponse {
    if let Some(id) = params.id {
        let tag_id: i32 = id.parse().unwrap_or(0);
        match Tag::delete(&app_state.pool, tag_id).await {
            Ok(tag) => {
                ApiResponse::new(
                    StatusCode::OK,
                    "Tag",
                    Some(serde_json::to_value(tag).unwrap()),
                )
            }
            Err(e) => {
                let msg = format!("Error deleting tag: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::NOT_FOUND, &msg, None)
            }
        }
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "tag_id is mandatory", None)
    }
}

