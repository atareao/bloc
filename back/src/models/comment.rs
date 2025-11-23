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
pub struct NewComment {
    pub post_id: i32,
    pub parent_id: Option<i32>,
    pub nikename: String,
    pub content: String,
    pub approved: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Comment {
    pub id: i32,
    pub post_id: i32,
    pub parent_id: Option<i32>,
    pub nikename: String,
    pub content: String,
    pub approved: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ReadCommentParams {
    pub id: Option<String>,
    pub post_id: Option<String>,
    pub parent_id: Option<String>,
    pub nikename: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>,
    pub asc: Option<bool>,
}

impl Comment {
    pub async fn create(pool: &PgPool, comment: &mut NewComment) -> Result<Comment, Error> {
        let now = Utc::now();
        let sql = "INSERT INTO comments (
                post_id,
                parent_id,
                nikename,
                content,
                approved,
                created_at,
                updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7
            ) RETURNING *";
        query_as::<_, Comment>(sql)
            .bind(comment.post_id)
            .bind(comment.parent_id)
            .bind(&comment.nikename)
            .bind(&comment.content)
            .bind(&comment.approved)
            .bind(now)
            .bind(now)
            .fetch_one(pool)
            .await
    }

    pub async fn update(pool: &PgPool, comment: &mut Comment) -> Result<Comment, Error> {
        let sql = "UPDATE comments set 
                post_id = $1,
                parent_id = $2,
                nikename = $3,
                content = $4,
                approved = $5,
                updated_at = $6
            WHERE
                id = $7
            RETURNING *";
        let now = Utc::now();
        query_as::<_, Comment>(sql)
            .bind(comment.post_id)
            .bind(comment.parent_id)
            .bind(&comment.nikename)
            .bind(&comment.content)
            .bind(comment.approved)
            .bind(now)
            .bind(comment.id)
            .fetch_one(pool)
            .await
    }

    pub async fn read(pool: &PgPool, id: i32) -> Result<Comment, Error> {
        let sql = "SELECT * FROM comments WHERE id = $1";
        query_as::<_, Comment>(sql)
            .bind(id)
            .fetch_one(pool)
            .await
    }

    pub async fn count_paged(pool: &PgPool, params: &ReadCommentParams) -> Result<i64, Error> {
        let filters = vec![
            ("comment_id", &params.post_id),
            ("parent_id", &params.parent_id),
            ("nikename", &params.nikename)
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT COUNT(*) total FROM comments WHERE 1=1".to_string();
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
        params: &ReadCommentParams,
    ) -> Result<Vec<Comment>, Error> {
        let filters = vec![
            ("post_id", &params.post_id),
            ("parent_id", &params.parent_id),
            ("nikename", &params.nikename)
        ];
        let active_filters: Vec<(&str, String)> = filters
            .into_iter()
            .filter_map(|(col, val)| val.as_ref().map(|v| (col, v.to_string())))
            .collect();
        let mut sql = "SELECT * FROM comments WHERE 1=1".to_string();
        for (i, (col, _)) in active_filters.iter().enumerate() {
            let param_index = i + 1;
            if *col == "post_id" || *col == "parent_id"{
                sql.push_str(&format!(" AND {} = ${}", col, param_index));
            }else{
                sql.push_str(&format!(" AND {} LIKE ${}", col, param_index));
            }
        }
        let limit_index = active_filters.len() + 1;
        let offset_index = limit_index + 1;
        if let Some(sort_by) = params.sort_by.as_ref()
            && ["created_at", "nickname", "post_id", "parent_id"].contains(&sort_by.as_str())
        {
            if params.asc.unwrap_or(true) {
                sql.push_str(&format!(" ORDER BY {} ASC", sort_by));
            } else {
                sql.push_str(&format!(" ORDER BY {} DESC", sort_by));
            }
        }
        sql.push_str(&format!(" LIMIT ${} OFFSET ${}", limit_index, offset_index));
        let mut query = query_as::<_, Comment>(&sql);
        debug!("query sql: {}", sql);
        for (col, val) in &active_filters {
            if *col == "post_id" || *col == "parent_id"{
                query = query.bind(val);
            }else{
                query = query.bind(format!("%{}%", val));
            }
        }
        let limit = params.limit.unwrap_or(DEFAULT_LIMIT) as i32;
        let offset = ((params.page.unwrap_or(DEFAULT_PAGE) - 1) as i32) * limit;
        query
            .bind(limit)
            .bind(offset)
            .fetch_all(pool)
            .await
    }

    pub async fn delete(pool: &PgPool, comment_id: i32) -> Result<Comment, Error> {
        let sql = "DELETE FROM comments WHERE id = $1 RETURNING *";
        query_as::<_, Comment>(sql)
            .bind(comment_id)
            .fetch_one(pool)
            .await
    }
}
