use std::sync::Arc;
use regex::Regex;

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
    ApiResponse, AppState, NewPost, PagedResponse, Pagination, Post, ReadPostParams, Tag, HtmlPost
};

pub fn post_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", routing::post(create))
        .route("/", routing::patch(update))
        .route("/", routing::get(read))
        .route("/", routing::delete(delete))
        .route("/html", routing::get(read_html))
}

pub async fn create(
    State(app_state): State<Arc<AppState>>,
    Json(post): Json<NewPost>,
) -> impl IntoResponse {
    debug!("Post: {:?}", post);
    match Post::create(&app_state.pool, &post).await {
        Ok(post) => {
            let string_tags = get_tags( &post.content);
            let tags = Tag::create_or_update(&app_state.pool, string_tags)
                .await
                .unwrap_or_default();
            let id_tags = tags.iter().map(|t| t.id).collect::<Vec<i32>>();
            Post::assign_tags(&app_state.pool, post.id, id_tags)
                .await
                .unwrap_or_default();
            debug!("Post created: {:?}", post);
            ApiResponse::new(
                StatusCode::CREATED,
                "Created",
                Some(serde_json::to_value(post).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating post: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn update(
    State(app_state): State<Arc<AppState>>,
    Json(mut post): Json<Post>,
) -> impl IntoResponse {
    debug!("Update post: {:?}", post);
    match Post::update(&app_state.pool, &mut post).await {
        Ok(post) => {
            debug!("Post updated: {:?}", post);
            ApiResponse::new(
                StatusCode::OK,
                "Post updated",
                Some(serde_json::to_value(post).unwrap()),
            )
        }
        Err(e) => {
            let msg = format!("Error updating post: {:?}", e);
            error!("{}", &msg);
            ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None)
        }
    }
}

pub async fn read_html(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadPostParams>,
) -> impl IntoResponse {
    debug!("Post: {:?}", params);
    if let Some(slug) = params.slug {
        match Post::read_by_slug(&app_state.pool, slug.as_str()).await {
            Ok(post) => {
                debug!("Post: {:?}", post);
                let html_post = HtmlPost::new(&post);
                ApiResponse::new(
                    StatusCode::OK,
                    "Posts",
                    Some(serde_json::to_value(html_post).unwrap()),
                )
                .into_response()
            }
            Err(e) => {
                let msg = format!("Error reading posts: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None).into_response()
            }
        }
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading posts", None)
            .into_response()
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
                    Some(serde_json::to_value(posts).unwrap()),
                )
                .into_response()
            }
            Err(e) => {
                let msg = format!("Error reading posts: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None).into_response()
            }
        }
    }else if let Some(slug) = params.slug {
        match Post::read_by_slug(&app_state.pool, slug.as_str()).await {
            Ok(post) => {
                debug!("Post: {:?}", post);
                ApiResponse::new(
                    StatusCode::OK,
                    "Posts",
                    Some(serde_json::to_value(post).unwrap()),
                )
                .into_response()
            }
            Err(e) => {
                let msg = format!("Error reading posts: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::BAD_REQUEST, &msg, None).into_response()
            }
        }
    } else if let Ok(posts) = Post::read_paged(&app_state.pool, &params).await
        && let Ok(count) = Post::count_paged(&app_state.pool, &params).await
    {
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
            Some(serde_json::to_value(posts).unwrap()),
            pagination,
        )
        .into_response()
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "Error reading posts", None)
            .into_response()
    }
}

pub async fn delete(
    State(app_state): State<Arc<AppState>>,
    Query(params): Query<ReadPostParams>,
) -> impl IntoResponse {
    if let Some(id) = params.id {
        let post_id: i32 = id.parse().unwrap_or(0);
        match Post::delete(&app_state.pool, post_id).await {
            Ok(post) => {
                let message = if let Some(error) = Tag::delele_relations_for_post(&app_state.pool, post_id).await.err(){
                    format!("Error deleting post-tag relations: {:?}", error)
                }else{
                    "Post deleted".to_string()
                };
                ApiResponse::new(
                    StatusCode::OK,
                    &message,
                    Some(serde_json::to_value(post).unwrap()),
                )
            }
            Err(e) => {
                let msg = format!("Error deleting post: {:?}", e);
                error!("{}", &msg);
                ApiResponse::new(StatusCode::NOT_FOUND, &msg, None)
            }
        }
    } else {
        ApiResponse::new(StatusCode::BAD_REQUEST, "post_id is mandatory", None)
    }
}

fn get_tags(content: &str) -> Vec<String> {
    let re = Regex::new(r"#(\w+)").unwrap();
    let mut tags = Vec::new();
    for cap in re.captures_iter(content) {
        if let Some(tag) = cap.get(1) {
            tags.push(tag.as_str().to_string());
        }
    }
    tags
}
