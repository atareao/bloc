use sqlx::{
    PgPool,
    Error,
    FromRow,
};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Setting {
    // La clave primaria (VARCHAR)
    pub key: String,
    // El valor, almacenado como TEXT
    pub value: String,
    // El tipo de dato, almacenado como VARCHAR(50)
    pub value_type: String, 
    // La descripción, almacenada como TEXT
    pub description: Option<String>, 
    // Usamos DateTime<Utc> para manejar las marcas de tiempo con zona horaria
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct SettingsRepository {
    db: PgPool,
}

impl Setting {

    // =================================================================
    // C: CREATE (Inserción de una nueva configuración)
    // =================================================================
    pub async fn create(pool: &PgPool, key: &str, value: &str, value_type: &str, description: Option<&str>) -> Result<Self, Error> {
        let sql = r#"
            INSERT INTO settings (key, value, value_type, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        "#;
        
        sqlx::query_as::<_, Setting>(sql)
            .bind(key)
            .bind(value)
            .bind(value_type)
            .bind(description)
            .fetch_one(pool)
            .await
    }

    // =================================================================
    // R: READ (Leer todas las configuraciones)
    // =================================================================
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        sqlx::query_as::<_, Setting>("SELECT * FROM settings ORDER BY key")
            .fetch_all(pool)
            .await
    }

    // =================================================================
    // R: READ (Leer una configuración por clave)
    // =================================================================
    pub async fn find_by_key(pool: &PgPool, key: &str) -> Result<Option<Self>, Error> {
        sqlx::query_as::<_, Setting>("SELECT * FROM settings WHERE key = $1")
            .bind(key)
            .fetch_optional(pool) // fetch_optional devuelve Option<Setting>
            .await
    }

    // =================================================================
    // U: UPDATE (Actualizar una configuración existente)
    // =================================================================
    pub async fn update(pool: &PgPool, key: &str, new_value: &str, new_value_type: &str, new_description: Option<&str>) -> Result<Self, Error> {
        let sql = r#"
            UPDATE settings
            SET value = $2, 
                value_type = $3, 
                description = $4
            WHERE key = $1
            RETURNING *
        "#;
        sqlx::query_as::<_, Setting>(sql)
            .bind(key)
            .bind(new_value)
            .bind(new_value_type)
            .bind(new_description)
            .fetch_one(pool)
            .await
    }

    // =================================================================
    // D: DELETE (Eliminar una configuración)
    // =================================================================
    pub async fn delete(pool: &PgPool, key: &str) -> Result<Self, Error> {
        let sql = r#"
        DELETE FROM settings
        WHERE key = $1
        RETURNING *
        "#;
        sqlx::query_as::<_, Setting>(sql)
            .fetch_one(pool)
            .await
    }
}
