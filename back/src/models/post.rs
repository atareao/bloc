use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewPost{
    pub topic_id: i32,
    pub title: Option<String>,
    pub slug: Option<String>,
    pub status: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub user_id: i32,
    pub comment_on: Option<bool>,
    pub audio_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Post{
    id: i32,
    pub topic_id: i32,
    pub title: String,
    pub slug: String,
    pub status: String,
    pub content: String,
    pub excerpt: String,
    pub user_id: i32,
    pub comment_on: bool,
    pub audio_url: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadPostParams {
    pub id: Option<i32>,
    pub title: Option<String>,
    pub topic_id: Option<i32>,
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
            topic_id: row.get("topic_id"),
            title: row.get("title"),
            slug: row.get("slug"),
            status: row.get("status"),
            content: row.get("content"),
            excerpt: row.get("excerpt"),
            user_id: row.get("user_id"),
            comment_on: row.get("comment_on"),
            audio_url: row.get("audio_url"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, post: &NewPost) -> Result<Post, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO posts (
                topic_id,
                title,
                slug,
                status,
                content,
                excerpt, 
                user_id,
                comment_on,
                audio_url,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *";
        query(sql)
            .bind(post.topic_id)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.status)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
            .bind(&post.audio_url)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, post: &Post) -> Result<Post, Error> {
        let sql = "UPDATE posts set 
                post_id = $1,
                title = $2,
                slug = $3,
                status = $4,
                content = $5,
                excerpt = $6,
                user_id = $7,
                comment_on = $8,
                audio_url = $9,
                updated_at = $10
            WHERE
                id = $11
            RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&post.title)
            .bind(&post.slug)
            .bind(&post.status)
            .bind(&post.content)
            .bind(&post.excerpt)
            .bind(post.user_id)
            .bind(post.comment_on)
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
        let title_str = params.title.clone();
        let topic_id_str = params.topic_id.map(|v| v.to_string());
        let user_id_str = params.user_id.clone();

        let filters = vec![
            ("title", &element_type_str),
            ("topic_id", &preemer_point_str),
            ("user_id", &params.name),
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
            if col == "topic_id"  || col == "user_id" {
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
        let township_id_str = params.township_id.map(|v| v.to_string());
        let element_type_str = params.element_type_id.map(|v| v.to_string());
        let preemer_point_str = params.preemer_point_id.map(|v| v.to_string());

        let filters = vec![
            ("title", &element_type_str),
            ("topic_id", &preemer_point_str),
            ("user_id", &params.name),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM posts WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            if *col == "topic_id"  || *col == "user_id" {
                sql.push_str(&format!(" AND {} = ${}", col, param_index));
            }else{
                sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
            }
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && [
                "title",
                "topic_id",
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


    pub async fn read_all_for_topic(pool: &PgPool, topic_id: i32) -> Result<Vec<Post>, Error> {
        let sql = "SELECT * FROM posts WHERE topic_id = $1";
        query(sql)
            .bind(topic_id)
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

    pub async fn read_all_for_user_and_topic(pool: &PgPool, user_id: i32, topic_id: i32) -> Result<Vec<Post>, Error> {
        let sql = "SELECT * FROM posts WHERE user_id = $1 AND topic_id = $2";
        query(sql)
            .bind(user_id)
            .bind(topic_id)
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
