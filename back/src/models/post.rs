use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};
use tracing::debug;
use std::str::FromStr;

use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewPost{
    pub class: String,
    pub parent_id: Option<i32>,
    pub title: Option<String>,
    pub slug: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub user_id: i32,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Post{
    id: i32,
    pub class: String,
    pub parent_id: Option<i32>,
    pub title: String,
    pub slug: String,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub user_id: i32,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadPostParams {
    pub id: Option<String>,
    pub parent_id: Option<String>,
    pub class: Option<String>,
    pub title: Option<String>,
    pub user_id: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
}

impl Post{
    fn from_row(row: PgRow) -> Self{
        Self{
            id: row.get("id"),
            class: row.get("class"),
            parent_id: row.get("parent_id"),
            title: row.get("title"),
            slug: row.get("slug"),
            content: row.get("content"),
            excerpt: row.get("excerpt"),
            user_id: row.get("user_id"),
            comment_on: row.get("comment_on"),
            private: row.get("private"),
            audio_url: row.get("audio_url"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, post: &NewPost) -> Result<Post, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO posts (
                class,
                parent_id,
                title,
                slug,
                content,
                excerpt, 
                user_id,
                comment_on,
                private,
                audio_url,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *";
        query(sql)
            .bind(&post.class)
            .bind(post.parent_id)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, post: &Post) -> Result<Post, Error> {
        let sql = "UPDATE posts set 
                class = $1
                parent_id = $2,
                title = $3,
                slug = $4,
                content = $5,
                excerpt = $6,
                user_id = $7,
                comment_on = $8,
                private = $9
                audio_url = $10,
                updated_at = $11
            WHERE
                id = $12
            RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&post.class)
            .bind(post.parent_id)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(now)
            .bind(post.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Post, Error> {
        let sql = "SELECT * FROM posts WHERE id = $1";
        query(sql)
            .bind(id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_all(pool: &PgPool) -> Result<Vec<Post>, Error> {
        let sql = "SELECT * FROM posts";
        query(sql)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn count_paged(pool: &PgPool, params: &ReadPostParams) -> Result<i64, Error> {
        let filters = vec![
            ("class", &params.class),
            ("parent_id", &params.parent_id),
            ("title", &params.title),
            ("user_id", &params.user_id),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT COUNT(*) total FROM posts WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            if *col == "topic_id"  || *col == "user_id" {
                sql.push_str(&format!(" AND {} = ${}", col, param_index));
            }else{
                sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
            }
        }
        let mut query = query(&sql);
        for (col, val) in active_filters {
            if col == "parent_id"  || col == "user_id" {
                let value: i32 = FromStr::from_str(val.as_str()).unwrap();
                query = query.bind(value);
            }else{
                query = query.bind(format!("%{}%", val));
            }
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
        let filters = vec![
            ("class", &params.class),
            ("parent_id", &params.parent_id),
            ("title", &params.title),
            ("user_id", &params.user_id),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM posts WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            if *col == "parent_id"  || *col == "user_id" {
                sql.push_str(&format!(" AND {} = ${}", col, param_index));
            }else{
                sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
            }
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && [
                "class",
                "parent_id",
                "title",
                "user_id",
            ]
            .contains(&sort_by.as_str())
        {
            if params.asc.unwrap_or(true) {
                sql.push_str(&format!(" ORDER BY {} ASC", sort_by));
            } else {
                sql.push_str(&format!(" ORDER BY {} DESC", sort_by));
            }
        }
        sql.push_str(&format!(" LIMIT ${} OFFSET ${}", limit_index, offset_index));
        let mut query = query(&sql);
        debug!("query sql: {}", sql);
        for (col, val) in &active_filters {
            if *col == "topic_id"  || *col == "user_id" {
                let value: i32 = FromStr::from_str(val.as_str()).unwrap();
                query = query.bind(value);
            }else{
                query = query.bind(format!("%{}%", val));
            }
        }
        let limit = params.limit.unwrap_or(DEFAULT_LIMIT) as i32;
        let offset = ((params.page.unwrap_or(DEFAULT_PAGE) - 1) as i32) * limit;
        query
            .bind(limit)
            .bind(offset)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, post: &Post) -> Result<Post, Error> {
        let sql = "DELETE FROM posts WHERE id = $1 RETURNING *";
        query(sql)
            .bind(post.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

}
