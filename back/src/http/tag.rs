use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing, Json, Router,
};
use tracing::{debug, error};

use crate::models::{ApiResponse, AppState, Data, Tag, NewTag};

pub fn tag_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

type Result = std::result::Result<ApiResponse, ApiResponse>;

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(tag): Json<NewTag>,
) -> impl IntoResponse {
    debug!("Tag: {:?}", tag);
    match Tag::create(&app_state.pool, &tag).await {
        Ok(tag) => {
            debug!("Tag created: {:?}", tag);
            ApiResponse::new(StatusCode::CREATED, "Tag created", Data::One(serde_json::to_value(tag).unwrap()))
        },
        Err(e) => {
            error!("Error creating tag: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error creating tage", Data::None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(tag): Json<Tag>,
) -> impl IntoResponse {
    debug!("Update tag: {:?}", tag);
    match Tag::update(&app_state.pool, &tag).await {
        Ok(tag) => {
            debug!("Tag updated: {:?}", tag);
            ApiResponse::new(StatusCode::OK, "Tag updated", Data::One(serde_json::to_value(tag).unwrap()))
        },
        Err(e) => {
            error!("Error updating tag: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error updating tag", Data::None)
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct TagParams {
    pub tag_id: Option<i32>
}
pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<TagParams>,
) -> impl IntoResponse {
    debug!("Tag: {:?}", params);
    if let Some(tag_id) = params.tag_id {
        match Tag::read(&app_state.pool, tag_id).await {
            Ok(tags) => {
                debug!("Tags: {:?}", tags);
                ApiResponse::new(StatusCode::OK, "Tags", Data::One(serde_json::to_value(tags).unwrap()))
            },
            Err(e) => {
                error!("Error reading tags: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading tags", Data::None)
            }
        }
    }else{
        match Tag::read_all(&app_state.pool).await {
            Ok(tags) => {
                debug!("Tags: {:?}", tags);
                let values = tags.into_iter().map(|t| {
                    serde_json::to_value(t).unwrap()
                }).collect::<Vec<_>>();
                ApiResponse::new(StatusCode::OK, "Tags", Data::Some(values))
            },
            Err(e) => {
                error!("Error reading tags: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading tags", Data::None)
            }
        }
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Json(tag): Json<Tag>,
) -> impl IntoResponse {
    debug!("Tag: {:?}", &tag);
    match Tag::delete(&app_state.pool, &tag).await {
        Ok(tag) => {
            debug!("Tag deleted: {:?}", tag);
            ApiResponse::new(StatusCode::OK, "Tag deleted", Data::One(serde_json::to_value(tag).unwrap()))
        },
        Err(e) => {
            error!("Error deleting tag: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error deleting tag", Data::None)
        }
    }
}



