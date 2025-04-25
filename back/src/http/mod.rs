mod user;
mod health;
mod value;
mod topic;
mod tag;
mod post;

pub use health::health_router;
pub use user::user_router;
pub use value::value_router;
pub use topic::topic_router;
pub use tag::tag_router;
pub use post::post_router;
