mod response;
mod user;
mod value;
mod data;
mod topic;
mod tag;
mod post;

pub use data::Data;
pub use response::{
    CustomResponse,
    EmptyResponse,
    Pagination,
    PagedResponse,
};
pub use user::{User, TokenClaims, UserSchema, UserRegister};
pub use value::{NewValue, Value};
pub use topic::{NewTopic, Topic};
pub use tag::{NewTag, Tag};
pub use post::{NewPost, Post};
pub type Error = Box<dyn std::error::Error>;

use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub secret: String,
}
