use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use slug::slugify;
use sqlx::{
    Error, Row,
    FromRow,
    postgres::{PgPool, PgRow},
    query,
    query_as,
};
use tracing::debug;

use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewPost {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub slug: String,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadPostParams {
    pub id: Option<String>,
    pub title: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
}

impl Post {
    pub async fn create(pool: &PgPool, post: &mut NewPost) -> Result<Post, Error> {
        if post.slug.is_none() {
            post.slug = post.title.as_ref().map(slugify);
        }
        let now = Utc::now();
        let sql = "INSERT INTO posts (
                title,
                slug,
                content,
                excerpt, 
                comment_on,
                private,
                audio_url,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) RETURNING *";
        query_as::<_, Post>(sql)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(now)
            .bind(now)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, post: &mut Post) -> Result<Post, Error> {
        post.slug = slugify(post.title.clone());
        let sql = "UPDATE posts set 
                title = $1,
                slug = $2,
                content = $3,
                excerpt = $4,
                comment_on = $5,
                private = $6,
                audio_url = $7,
                updated_at = $8
            WHERE
                id = $9
            RETURNING *";
        let now = Utc::now();
        query_as::<_, Post>(sql)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(now)
            .bind(post.id)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Post, Error> {
        let sql = "SELECT * FROM posts WHERE id = $1";
        query_as::<_, Post>(sql)
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn count_paged(pool: &PgPool, params: &ReadPostParams) -> Result<i64, Error> {
        let filters = vec![("title", &params.title)];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT COUNT(*) total FROM posts WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
        }
        let mut query = query(&sql);
        for (_col, val) in active_filters {
            query = query.bind(format!("%{}%", val));
        }
        query
            .map(|row: PgRow| {
                let count: i64 = row.get("total");
                count
            })
            .fetch_one(pool)
            .await
    }

    pub async fn read_paged(pool: &PgPool, params: &ReadPostParams) -> Result<Vec<Post>, Error> {
        let filters = vec![("title", &params.title)];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM posts WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && ["title"].contains(&sort_by.as_str())
        {
            if params.asc.unwrap_or(true) {
                sql.push_str(&format!(" ORDER BY {} ASC", sort_by));
            } else {
                sql.push_str(&format!(" ORDER BY {} DESC", sort_by));
            }
        }
        sql.push_str(&format!(" LIMIT ${} OFFSET ${}", limit_index, offset_index));
        let mut query = query_as::<_, Post>(&sql);
        debug!("query sql: {}", sql);
        for (_col, val) in &active_filters {
            query = query.bind(format!("%{}%", val));
        }
        let limit = params.limit.unwrap_or(DEFAULT_LIMIT) as i32;
        let offset = ((params.page.unwrap_or(DEFAULT_PAGE) - 1) as i32) * limit;
        query
            .bind(limit)
            .bind(offset)
            .fetch_all(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, post_id: i32) -> Result<Post, Error> {
        let sql = "DELETE FROM posts WHERE id = $1 RETURNING *";
        query_as::<_, Post>(sql)
            .bind(post_id)
            .fetch_one(pool)
            .await
    }
}
