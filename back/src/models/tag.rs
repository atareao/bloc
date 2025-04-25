use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewTag{
    pub name: String,
    pub slug: String,
    pub active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag{
    id: i32,
    pub name: String,
    pub slug: String,
    pub active: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl Tag{
    fn from_row(row: PgRow) -> Self{
        Self{
            id: row.get("id"),
            name: row.get("name"),
            slug: row.get("slug"),
            active: row.get("active"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, tag: &NewTag) -> Result<Tag, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO tags (name, slug, active, created_at, updated_at) VALUES ($1, $2, $3, $4, %5) RETURNING *";
        query(sql)
            .bind(&tag.name)
            .bind(&tag.slug)
            .bind(tag.active)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, tag: &Tag) -> Result<Tag, Error> {
        let sql = "UPDATE tags set name = $1, slug = $2, active = $3, updated_at = $4 WHERE id = $5 RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&tag.name)
            .bind(&tag.slug)
            .bind(tag.active)
            .bind(now)
            .bind(tag.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Tag, Error> {
        let sql = "SELECT * FROM tags WHERE id = $1";
        query(sql)
            .bind(id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_all(pool: &PgPool) -> Result<Vec<Tag>, Error> {
        let sql = "SELECT * FROM tags";
        query(sql)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn read_tags_for_post(pool: &PgPool, post_id: i32) -> Result<Vec<Tag>, Error> {
        let sql = "SELECT t.* FROM tags t
                JOIN post_tags pt ON t.id = pt.tag_id
                WHERE pt.post_id = $1";
        query(sql)
            .bind(post_id)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn add_tag_to_post(pool: &PgPool, post_id: i32, tag: &Tag) -> Result<Tag, Error> {
            let sql = "WITH new_relation AS 
(INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) RETURNING *)
SELECT * FROM tags t WHERE t.tag_id = $2";
        query(sql)
            .bind(post_id)
            .bind(tag.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, tag: &Tag) -> Result<Tag, Error> {
        let sql = "DELETE FROM tags WHERE id = $1 RETURNING *";
        query(sql)
            .bind(tag.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }
}
