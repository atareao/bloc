mod response;
mod user;
mod post;
mod class;

pub use response::{
    ApiResponse,
    CustomResponse,
    EmptyResponse,
    Pagination,
    PagedResponse,
};
pub use user::{User, TokenClaims, UserSchema, UserRegister};
pub use class::Class;
pub use post::{NewPost, Post, ReadPostParams};
pub type Error = Box<dyn std::error::Error>;

use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub secret: String,
}
