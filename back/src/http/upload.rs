use std::sync::Arc;

use axum::{
    Router, extract::Multipart, extract::State, http::StatusCode, response::IntoResponse, routing,
};
use chrono::Utc;
use tokio::fs;
use tracing::{debug, error};
use uuid::Uuid;

use crate::models::{ApiResponse, AppState};

pub fn upload_router() -> Router<Arc<AppState>> {
    Router::new().route("/", routing::post(upload_image))
}

/// Handler para el endpoint POST /uploads
async fn upload_image(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    // Iterar sobre las partes del formulario multipart
    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or_default().to_string();

        // Asumimos que la imagen viene en un campo llamado "file"
        if name != "file" {
            continue;
        }

        let file_name = field.file_name().unwrap_or_default().to_string();
        let content_type = field.content_type().unwrap_or_default().to_string();
        let data = match field.bytes().await {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Error reading file '{}': {:?}", file_name, e);
                error!("{msg}");
                return ApiResponse::new(StatusCode::INTERNAL_SERVER_ERROR, &msg, None)
                    .into_response();
            }
        };
        if data.is_empty() {
            return ApiResponse::new(StatusCode::BAD_REQUEST, "File is empty", None)
                .into_response();
        }
        let extension = get_extension_from_mime(&content_type).unwrap_or_else(|| {
            debug!(
                "Can't determine extension from MIME type '{}'",
                content_type
            );
            "dat".to_string()
        });

        // --- 2. Generar la ruta basada en fecha (YY/MM/DD) ---
        let now = Utc::now();
        let date_path = now.format("%Y/%m/%d").to_string();

        // --- 3. Generar UUID para el nombre del archivo ---
        let file_uuid = Uuid::new_v4().to_string();
        let final_filename = format!("{}.{}", file_uuid, extension);

        // --- 4. Construir la ruta completa de guardado ---
        let target_dir = state.upload_dir.join(&date_path);
        let final_path = target_dir.join(&final_filename);

        debug!("Guardando archivo en: {:?}", final_path);

        // --- 5. Crear directorios recursivamente ---
        match fs::create_dir_all(&target_dir).await {
            Ok(result) => debug!("Directorios creados: {:?}", result),
            Err(e) => {
                let msg = format!("Error creating directories '{:?}': {:?}", target_dir, e);
                error!("{msg}");
                return ApiResponse::new(StatusCode::INTERNAL_SERVER_ERROR, &msg, None)
                    .into_response();
            }
        }
        match fs::write(&final_path, &data).await {
            Ok(result) => debug!("File saved: {:?}", result),
            Err(e) => {
                let msg = format!("Error saving file '{:?}': {:?}", final_path, e);
                error!("{msg}");
                return ApiResponse::new(StatusCode::INTERNAL_SERVER_ERROR, &msg, None)
                    .into_response();
            }
        }
        let relative_path = format!("/images/{}/{}", date_path, final_filename);
        return ApiResponse::new(
            StatusCode::OK,
            "File uploaded successfully",
            Some(serde_json::json!({ "file_path": relative_path })),
        )
        .into_response();
    }
    ApiResponse::new(
        StatusCode::BAD_REQUEST,
        "Did not find 'file' field in the form",
        None,
    )
    .into_response()
}

fn get_extension_from_mime(mime_type_str: &str) -> Option<String> {
    mime2ext::mime2ext(mime_type_str)
        .map(|ext| ext.to_string())
}
