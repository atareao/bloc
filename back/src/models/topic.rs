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

#[derive(Debug, Deserialize)]
pub struct ReadTopicParams {
    pub id: Option<i32>,
    pub name: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
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

    pub async fn count_paged(pool: &PgPool, params: &ReadTopicParams) -> Result<i64, Error> {
        let title_str = params.title.clone();
        let topic_id_str = params.topic_id.map(|v| v.to_string());
        let user_id_str = params.user_id.clone();

        let filters = vec![
            ("name", &element_type_str),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT COUNT(*) total FROM topics WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
        }
        let mut query = query(&sql);
        for (col, val) in active_filters {
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

    pub async fn read_paged(pool: &PgPool, params: &ReadTopicParams) -> Result<Vec<Topic>, Error> {
        let name_str = params.name.clone();
        let filters = vec![
            ("name", &name_str),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM topics WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && [
                "name",
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
            query = query.bind(format!("%{}%", val));
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

    pub async fn delete(pool: &PgPool, topic: &Topic) -> Result<Topic, Error> {
        let sql = "DELETE FROM topics WHERE id = $1 RETURNING *";
        query(sql)
            .bind(topic.id)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }
}
