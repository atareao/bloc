mod user;
mod health;
mod post;
mod comment;
mod tag;

pub use health::health_router;
pub use user::{
    user_router,
    api_user_router,
};
pub use post::post_router;
pub use comment::comment_router;
pub use tag::tag_router;
