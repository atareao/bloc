use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewPost{
    pub title: String,
    pub slug: String,
    pub status: String,
    pub content: String,
    pub excerpt: String,
    pub user_id: i32,
    pub comment_on: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Post{
    id: i32,
    pub title: String,
    pub slug: String,
    pub status: String,
    pub content: String,
    pub excerpt: String,
    pub user_id: i32,
    pub comment_on: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl Post{
    fn from_row(row: PgRow) -> Self{
        Self{
            id: row.get("id"),
            title: row.get("title"),
            slug: row.get("slug"),
            status: row.get("status"),
            content: row.get("content"),
            excerpt: row.get("excerpt"),
            user_id: row.get("user_id"),
            comment_on: row.get("comment_on"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, post: &NewPost) -> Result<Post, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO posts (title, slug, status, content, excerpt, 
user_id, comment_on, created_at, updated_at) VALUES ($1, $2, $3, $4, %5, %6, %7, %8, %9) RETURNING *";
        query(sql)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.status)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, post: &Post) -> Result<Post, Error> {
        let sql = "UPDATE posts set title = $1, slug = $2, status = $3, content = $4,
excerpt = $5, user_id = $6, comment_on = $7, updated_at = $8 WHERE id = $9 RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.status)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
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

    pub async fn read_all_for_user(pool: &PgPool, user_id: i32) -> Result<Vec<Post>, Error> {
        let sql = "SELECT * FROM posts WHERE user_id = $1";
        query(sql)
            .bind(user_id)
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
