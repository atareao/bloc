use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewTopic{
    pub name: String,
    pub slug: String,
    pub active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Topic{
    id: i32,
    pub name: String,
    pub slug: String,
    pub active: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl Topic{
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

    pub async fn create(pool: &PgPool, topic: &NewTopic) -> Result<Topic, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO topics (name, slug, active, created_at, updated_at) VALUES ($1, $2, $3, $4, %5) RETURNING *";
        query(sql)
            .bind(&topic.name)
            .bind(&topic.slug)
            .bind(topic.active)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, topic: &Topic) -> Result<Topic, Error> {
        let sql = "UPDATE topics set name = $1, slug = $2, active = $3, updated_at = $4 WHERE id = $5 RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&topic.name)
            .bind(&topic.slug)
            .bind(topic.active)
            .bind(now)
            .bind(topic.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Topic, Error> {
        let sql = "SELECT * FROM topics WHERE id = $1";
        query(sql)
            .bind(id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_all(pool: &PgPool) -> Result<Vec<Topic>, Error> {
        let sql = "SELECT * FROM topics";
        query(sql)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, topic: &Topic) -> Result<Topic, Error> {
        let sql = "DELETE FROM topics WHERE id = $1 RETURNING *";
        query(sql)
            .bind(topic.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }
}
