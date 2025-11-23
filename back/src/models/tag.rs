use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{
    Error, FromRow, Row,
    postgres::{PgPool, PgRow},
    query_as,
    query,
};
use tracing::debug;

use crate::constants::{DEFAULT_LIMIT, DEFAULT_PAGE};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewTag {
    pub tag: String,
    pub slug: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Tag {
    pub id: i32,
    pub tag: String,
    pub slug: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadTagParams {
    pub id: Option<String>,
    pub post_id: Option<i32>,
    pub tag: Option<String>,
    pub slug: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
}

impl Tag {
    pub async fn create(pool: &PgPool, tag: &mut NewTag) -> Result<Tag, Error> {
        let now = Utc::now();
        if tag.slug.is_none() {
            tag.slug = Some(slug::slugify(&tag.tag));
        }
        let sql = "INSERT INTO tags (
                tag,
                slug,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4
            ) RETURNING *";
        query_as::<_, Tag>(sql)
            .bind(&tag.tag)
            .bind(&tag.slug)
            .bind(now)
            .bind(now)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, tag: &mut Tag) -> Result<Tag, Error> {
        if tag.slug.is_none() {
            tag.slug = Some(slug::slugify(&tag.tag));
        }
        let sql = "UPDATE tags set 
                tag = $1,
                slug = $2,
                updated_at = $6
            WHERE
                id = $7
            RETURNING *";
        let now = Utc::now();
        query_as::<_, Tag>(sql)
            .bind(&tag.tag)
            .bind(&tag.slug)
            .bind(now)
            .bind(tag.id)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Tag, Error> {
        let sql = "SELECT * FROM tags WHERE id = $1";
        query_as::<_, Tag>(sql)
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn read_tags_for_post(pool: &PgPool, post_id: i32) -> Result<Tag, Error> {
        let sql = "SELECT t.* FROM tags t
            INNER JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = $1";
        query_as::<_, Tag>(sql)
            .bind(post_id)
            .fetch_one(pool)
            .await
    }


    pub async fn count_paged(pool: &PgPool, params: &ReadTagParams) -> Result<i64, Error> {
        let filters = vec![
            ("tag", &params.tag),
            ("slug", &params.slug),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT COUNT(*) total FROM tags WHERE 1=1".to_string();
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

    pub async fn read_paged(
        pool: &PgPool,
        params: &ReadTagParams,
    ) -> Result<Vec<Tag>, Error> {
        let filters = vec![
            ("tag", &params.tag),
            ("slug", &params.slug),
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM tags WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && ["tag", "slug", "created_at"].contains(&sort_by.as_str())
        {
            if params.asc.unwrap_or(true) {
                sql.push_str(&format!(" ORDER BY {} ASC", sort_by));
            } else {
                sql.push_str(&format!(" ORDER BY {} DESC", sort_by));
            }
        }
        sql.push_str(&format!(" LIMIT ${} OFFSET ${}", limit_index, offset_index));
        let mut query = query_as::<_, Tag>(&sql);
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

    pub async fn delete(pool: &PgPool, tag_id: i32) -> Result<Tag, Error> {
        let sql = "DELETE FROM tags WHERE id = $1 RETURNING *";
        query_as::<_, Tag>(sql)
            .bind(tag_id)
            .fetch_one(pool)
            .await
    }
}

