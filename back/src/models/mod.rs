mod settings;
mod response;
mod user;
mod post;
mod tag;
mod comment;

use std::path::PathBuf;
pub use response::{
    ApiResponse,
    CustomResponse,
    EmptyResponse,
    Pagination,
    PagedResponse,
};
pub use user::{User, TokenClaims, UserSchema, UserRegister};
pub use post::{NewPost, Post, ReadPostParams, HtmlPost};
pub use tag::{NewTag, Tag, ReadTagParams};
pub use comment::{NewComment, Comment, ReadCommentParams};
pub type Error = Box<dyn std::error::Error>;

use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub secret: String,
    pub static_dir: PathBuf,
    pub upload_dir: PathBuf,
    pub base_url: String,
}
