mod response;
mod user;
mod post;
mod tag;
mod comment;

pub use response::{
    ApiResponse,
    CustomResponse,
    EmptyResponse,
    Pagination,
    PagedResponse,
};
pub use user::{User, TokenClaims, UserSchema, UserRegister};
pub use post::{NewPost, Post, ReadPostParams};
pub use tag::{NewTag, Tag, ReadTagParams};
pub use comment::{NewComment, Comment, ReadCommentParams};
pub type Error = Box<dyn std::error::Error>;

use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub secret: String,
}
