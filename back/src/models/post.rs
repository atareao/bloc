use chrono::{DateTime, Utc};
use regex::Regex;
use serde::{Deserialize, Serialize};
use slug::slugify;
use sqlx::{
    Error, FromRow, Row,
    postgres::{PgPool, PgRow},
    query, query_as,
};
use tracing::debug;

use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewPost {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub content: String,
    pub excerpt: Option<String>,
    pub meta: Option<String>,
    pub outline: Option<String>,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub meta: Option<String>,
    pub outline: Option<String>,
    pub comment_on: Option<bool>,
    pub private: Option<bool>,
    pub audio_url: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadPostParams {
    pub id: Option<String>,
    pub title: Option<String>,
    pub slug: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
}

impl Post {
    pub async fn create(pool: &PgPool, post: &NewPost) -> Result<Post, Error> {
        if post.content.is_empty() {
            return Err(Error::Decode("Content cannot be empty".into()));
        }
        let title =
            get_title(&post.content).ok_or(Error::Decode("Not found title in content".into()))?;
        let slug = slugify(&title);
        let now = Utc::now();
        let sql = "INSERT INTO posts (
                title,
                slug,
                content,
                excerpt, 
                meta,
                outline,
                comment_on,
                private,
                audio_url,
                published_at,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING *";
        query_as::<_, Post>(sql)
            .bind(title)
            .bind(slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(&post.meta)
            .bind(&post.outline)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(post.published_at)
            .bind(now)
            .bind(now)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, post: &Post) -> Result<Post, Error> {
        if post.content.is_empty() {
            return Err(Error::Decode("Content cannot be empty".into()));
        }
        let title =
            get_title(&post.content).ok_or(Error::Decode("Not found title in content".into()))?;
        let slug = slugify(&title);
        let sql = "UPDATE posts set 
                title = $1,
                slug = $2,
                content = $3,
                excerpt = $4,
                meta = $5,
                outline = $6,
                comment_on = $7,
                private = $8,
                audio_url = $9,
                published_at = $10,
                updated_at = $11
            WHERE
                id = $12
            RETURNING *";
        let now = Utc::now();
        query_as::<_, Post>(sql)
            .bind(&title)
            .bind(&slug)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(&post.meta)
            .bind(&post.outline)
            .bind(post.comment_on)
            .bind(post.private)
            .bind(&post.audio_url)
            .bind(post.published_at)
            .bind(now)
            .bind(post.id)
            .fetch_one(pool)
            .await
    }

    pub async fn assign_tags(
        pool: &PgPool,
        post_id: i32,
        tag_ids: Vec<i32>,
    ) -> Result<(), Error> {
        if tag_ids.is_empty() {
            return Ok(());
        }
        let post_ids_para_relacion: Vec<i32> = vec![post_id; tag_ids.len()];

        let sql_insert_relations = r#"
            INSERT INTO posts_tags (post_id, tag_id)
            SELECT * FROM UNNEST($1::INTEGER[], $2::INTEGER[]) 
            ON CONFLICT (post_id, tag_id) DO NOTHING;
        "#;
        sqlx::query(sql_insert_relations)
            .bind(&post_ids_para_relacion as &[i32]) // $1: Array de post_ids
            .bind(&tag_ids as &[i32]) // $2: Array de tag_ids
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Post, Error> {
        let sql = "SELECT * FROM posts WHERE id = $1";
        query_as::<_, Post>(sql).bind(id).fetch_one(pool).await
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

    pub async fn read_by_slug(pool: &PgPool, slug: &str) -> Result<Post, Error> {
        let sql = "SELECT * FROM posts WHERE slug = $1";
        query_as::<_, Post>(sql).bind(slug).fetch_one(pool).await
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
            && ["title", "id", "published_at", "created_at", "slug"].contains(&sort_by.as_str())
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
        query.bind(limit).bind(offset).fetch_all(pool).await
    }

    pub async fn delete(pool: &PgPool, post_id: i32) -> Result<Post, Error> {
        let sql = "DELETE FROM posts WHERE id = $1 RETURNING *";
        query_as::<_, Post>(sql).bind(post_id).fetch_one(pool).await
    }
}

fn get_title(content: &str) -> Option<String> {
    let re = Regex::new(r"^#\s+(.*)$").unwrap();
    let first_line = content.lines().next()?;
    if let Some(captures) = re.captures(first_line) {
        let title = captures.get(1)?.as_str().trim();
        return Some(title.to_string());
    }
    None
}
