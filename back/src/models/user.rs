use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use sqlx::{postgres::{PgPool, PgRow}, query, Row, Error};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User{
    pub id: i32,
    pub username: String,
    pub email: String,
    pub hashed_password: String,
    pub role: String,
    pub active: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,
    pub role: String,
    pub user_id: i32,
    pub iat: usize,
    pub exp: usize,
}

#[derive(Debug, Deserialize)]
pub struct UserSchema {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRegister {
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: String,
}

#[derive(Debug, Serialize)]
pub struct FilteredUser {
    pub id: i32,
    pub username: String,
    pub role: String,
    pub verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}


impl User{
    fn from_row(row: PgRow) -> Self{
        Self{
            id: row.get("id"),
            username: row.get("username"),
            email: row.get("email"),
            hashed_password: row.get("hashed_password"),
            role: row.get("role"),
            active: row.get("active"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn create(pool: &PgPool, username: &str, email: &str, password: &str, role: &str) -> Result<User, Error> {
        let hashed_password = bcrypt::hash(password, bcrypt::DEFAULT_COST).unwrap();

        let sql = "INSERT INTO users (username, email, hashed_password, role) VALUES ($1, $2, $3, $4) RETURNING *";
        query(sql)
            .bind(username)
            .bind(email)
            .bind(hashed_password)
            .bind(role)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn get_by_email(pool: &PgPool, email: &str) -> Result<User, Error>{
        let sql = "SELECT * FROM users WHERE email = $1";
        query(sql)
            .bind(email)
            .map(Self::from_row)
            .fetch_one(pool)
            .await
    }

    pub async fn read_all(pool: &PgPool) -> Result<Vec<User>, Error> {
        let sql = "SELECT * FROM users";
        query(sql)
            .map(Self::from_row)
            .fetch_all(pool)
            .await
    }

    pub async fn any_user_exists(pool: &PgPool) -> Result<bool, Error> {
        let sql = "SELECT EXISTS(SELECT 1 FROM users)";
        query(sql)
            .map(|row: PgRow| row.get::<bool, _>(0))
            .fetch_one(pool)
            .await
    }
}

