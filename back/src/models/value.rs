use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewValue{
    pub reference: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Value{
    pub id: i32,
    pub reference: String,
    pub name: String,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl Value{
    fn from_row(row: PgRow) -> Self{
        Self{
            id: row.get("id"),
            reference: row.get("reference"),
            name: row.get("name"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, value: &NewValue) -> Result<Value, Error> {

        let sql = "INSERT INTO values (reference, name, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING *";
        let now = Utc::now();
        query(sql)
            .bind(&value.reference)
            .bind(&value.name)
            .bind(now)
            .bind(now)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, value: &Value) -> Result<Value, Error> {
        let sql = "UPDATE values set reference = $1, name = $2, updated_at = $3 WHERE id = $4 RETURNING *"; 
        let now = Utc::now();
        query(sql)
            .bind(&value.reference)
            .bind(&value.name)
            .bind(now)
            .bind(value.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Value, Error> {
        let sql = "SELECT * FROM values WHERE id = $1";
        query(sql)
            .bind(id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_by_reference(pool: &PgPool, reference: &str) -> Result<Vec<Value>, Error> {
        let sql = "SELECT * FROM values WHERE reference = $1";
        query(sql)
            .bind(reference)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }
    pub async fn read_by_name(pool: &PgPool, name: &str) -> Result<Value, Error> {
        let sql = "SELECT * FROM values WHERE name = $1";
        query(sql)
            .bind(name)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_all(pool: &PgPool) -> Result<Vec<Value>, Error> {
        let sql = "SELECT * FROM values";
        query(sql)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, id: i32) -> Result<Value, Error> {
        let sql = "DELETE FROM values WHERE id = $1 RETURNING *";
        query(sql)
            .bind(id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }
}

