use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing, Json, Router,
};
use tracing::{debug, error};

use crate::models::{ApiResponse, AppState, Data, Topic, NewTopic};

pub fn topic_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
}

type Result = std::result::Result<ApiResponse, ApiResponse>;

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(topic): Json<NewTopic>,
) -> impl IntoResponse {
    debug!("Topic: {:?}", topic);
    match Topic::create(&app_state.pool, &topic).await {
        Ok(topic) => {
            debug!("Topic created: {:?}", topic);
            ApiResponse::new(StatusCode::CREATED, "Topic created", Data::One(serde_json::to_value(topic).unwrap()))
        },
        Err(e) => {
            error!("Error creating topic: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error creating topice", Data::None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(topic): Json<Topic>,
) -> impl IntoResponse {
    debug!("Update topic: {:?}", topic);
    match Topic::update(&app_state.pool, &topic).await {
        Ok(topic) => {
            debug!("Topic updated: {:?}", topic);
            ApiResponse::new(StatusCode::OK, "Topic updated", Data::One(serde_json::to_value(topic).unwrap()))
        },
        Err(e) => {
            error!("Error updating topic: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error updating topic", Data::None)
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct TopicParams {
    pub topic_id: Option<i32>
}
pub async fn read(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<TopicParams>,
) -> impl IntoResponse {
    debug!("Topic: {:?}", params);
    if let Some(topic_id) = params.topic_id {
        match Topic::read(&app_state.pool, topic_id).await {
            Ok(topics) => {
                debug!("Topics: {:?}", topics);
                ApiResponse::new(StatusCode::OK, "Topics", Data::One(serde_json::to_value(topics).unwrap()))
            },
            Err(e) => {
                error!("Error reading topics: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading topics", Data::None)
            }
        }
    }else{
        match Topic::read_all(&app_state.pool).await {
            Ok(topics) => {
                debug!("Topics: {:?}", topics);
                let values = topics.into_iter().map(|t| {
                    serde_json::to_value(t).unwrap()
                }).collect::<Vec<_>>();
                ApiResponse::new(StatusCode::OK, "Topics", Data::Some(values))
            },
            Err(e) => {
                error!("Error reading topics: {:?}", e);
                ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading topics", Data::None)
            }
        }
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Json(topic): Json<Topic>,
) -> impl IntoResponse {
    debug!("Topic: {:?}", &topic);
    match Topic::delete(&app_state.pool, &topic).await {
        Ok(topic) => {
            debug!("Topic deleted: {:?}", topic);
            ApiResponse::new(StatusCode::OK, "Topic deleted", Data::One(serde_json::to_value(topic).unwrap()))
        },
        Err(e) => {
            error!("Error deleting topic: {:?}", e);
            ApiResponse::new(StatusCode::BAD_REQUEST, "Error deleting topic", Data::None)
        }
    }
}



