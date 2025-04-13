mod api_response;
mod user;
mod value;
mod data;

pub use data::Data;
pub use api_response::ApiResponse;
pub use user::{User, TokenClaims, UserSchema, UserRegister};
pub use value::{NewValue, Value};
pub type Error = Box<dyn std::error::Error>;

use sqlx::postgres::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub secret: String,
}
