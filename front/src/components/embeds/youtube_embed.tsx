import React from 'react';

// 1. Definición de la Interfaz para las Props (Propiedades)
interface YouTubeEmbedProps {
    /** El ID del video de YouTube (e.g., 'QzS0YlQ-R1A') */
    videoId: string;
    /** Título descriptivo para el iframe. */
    title?: string;
}

// 2. Definición del Componente de Clase
// Heredamos de React.Component y pasamos la interfaz de props.
export default class YouTubeEmbed extends React.Component<YouTubeEmbedProps> {
    // Opcional: Si no usas estado ni lifecycle methods, puedes simplificar la clase,
    // pero esta es la estructura completa.

    /**
     * Método render requerido en componentes de clase.
     */
    render() {
        // Desestructuramos las props
        const { videoId, title = "Embedded YouTube video" } = this.props;

        // 3. Validación
        if (!videoId) {
            console.error("Error: YouTube videoId is missing.");
            return <p style={{ color: 'red' }}>Error: YouTube videoId is missing.</p>;
        }

        // 4. Construcción de la URL y Renderizado
        const src: string = `https://www.youtube.com/embed/${videoId}`;

        return (
            <div
                style={{
                    position: 'relative',
                    paddingBottom: '56.25%', // Relación de aspecto 16:9
                    height: 0,
                    overflow: 'hidden',
                    maxWidth: '100%',
                    background: '#000',
                }}
            >
                <iframe
                    src={src}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                    }}
                />
            </div>
        );
    }
}
