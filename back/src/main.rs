mod http;
mod models;
mod constants;

use axum::{
    Router,
    http::{
        header::{
            ACCEPT,
            AUTHORIZATION,
            CONTENT_TYPE
        },
        Method,
    },
};
use tower_http::{
    trace::TraceLayer,
    cors::{
        CorsLayer,
        Any,
    },
};
use std::sync::Arc;
use sqlx::{
    postgres::PgPoolOptions,
    migrate::{
        Migrator,
        MigrateDatabase
    },
};
use tracing_subscriber::{
    EnvFilter,
    layer::SubscriberExt,
    util::SubscriberInitExt
};
use tower_http::services::{ServeDir, ServeFile};
use tracing::info;
use std::{
    str::FromStr,
    env::var,
    path::Path,
};
use http::{
    health_router,
    user_router,
    value_router,
    topic_router,
    tag_router,
    post_router,
};
use dotenv::dotenv;
use models::{
    AppState,
    Error,
};

#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv().ok();
    let log_level = var("RUST_LOG").unwrap_or("debug".to_string());
    tracing_subscriber::registry()
        .with(EnvFilter::from_str(&log_level).unwrap())
        .with(tracing_subscriber::fmt::layer())
        .init();
    info!("Log level: {log_level}");

    let db_url = var("DATABASE_URL").expect("DB_URL environment mandatory");
    info!("DB url: {}", db_url);
    let port = var("PORT").unwrap_or("3000".to_string());
    info!("Port: {}", port);
    let secret = var("SECRET").unwrap_or("esto-es-un-secreto".to_string());


    if !sqlx::Postgres::database_exists(&db_url).await.unwrap(){
        sqlx::Postgres::create_database(&db_url).await.unwrap();
    }

    let migrations = if var("RUST_ENV") == Ok("production".to_string()){
        std::env::current_exe().unwrap().parent().unwrap().join("migrations")
    }else{
        let crate_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        Path::new(&crate_dir).join("migrations")
    };
    info!("{}", &migrations.display());

    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&db_url)
        .await
        .expect("Pool failed");

    Migrator::new(migrations)
        .await
        .unwrap()
        .run(&pool)
        .await
        .unwrap();

    let api_routes = Router::new()
        .nest("/health", health_router())
        .nest("/auth", user_router())
        .nest("/values", value_router())
        .nest("/topics", topic_router())
        .nest("/tags", tag_router())
        .nest("/posts", post_router())
        .with_state(Arc::new(AppState {
            pool,
            secret,
    }));

    let cors = CorsLayer::new()
        //.allow_origin(url.parse::<HeaderValue>().unwrap())
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH,
            Method::DELETE])
        //.allow_credentials(true)
        .allow_headers([AUTHORIZATION, ACCEPT, CONTENT_TYPE]);

    let app = Router::new()
        .nest("/api/v1", api_routes)
        .fallback_service(ServeDir::new("static").fallback(ServeFile::new("static/index.html")))
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("🚀 Server started successfully");
    axum::serve(listener, app).await?;

    Ok(())
}

