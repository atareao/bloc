import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import type { Node } from '@milkdown/prose/model';
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { defaultValueCtx } from "@milkdown/core";
import { upload, uploadConfig, type Uploader } from '@milkdown/kit/plugin/upload'
import { useEffect, useRef } from 'react';

import "@milkdown/crepe/theme/common/style.css";
import "@/components/custom_editor.css";

import { BASE_URL } from '@/constants';
import type Response from '@/models/response';

const uploadImage = async (image: File) => {
    try {
        // Llama al handler del componente padre (post_page.tsx) para subir al backend
        const formData = new FormData();
        formData.append('file', image)

        try {
            const response = await fetch(`${BASE_URL}/api/v1/uploads`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                console.error(`Error de subida: ${response.status} - ${response.statusText}`);
                throw new Error(`Error al subir imagen. Código HTTP: ${response.status}`);
            }

            console.log("Image upload response:", response);
            const json = (await response.json()) as Response<{ file_path: string }>;
            console.log("Uploaded image URL:", json.data?.file_path);
            if (json.data?.file_path) {
                // Inserta la imagen con la URL pública devuelta
                return json.data.file_path;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            // El editor debe saber que falló. Puedes devolver un string vacío o relanzar el error.
            throw new Error(`Error uploading image: ${error}`);
        }

    } catch (e) {
        console.error('Error al subir la imagen:', e);
        // Aquí podrías mostrar un Alert de Ant Design si falla
    }
}

const uploader: Uploader = async (files, schema) => {
    const images: File[] = []

    for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (!file) {
            continue
        }

        // You can handle whatever the file type you want, we handle image here.
        if (!file.type.includes('image')) {
            continue
        }

        images.push(file)
    }

    const nodes: Node[] = await Promise.all(
        images.map(async (image) => {
            try {
                const src = await uploadImage(image)
                const alt = image.name
                return schema.nodes.image.createAndFill({
                    src,
                    alt,
                }) as Node
            } catch (e) {
                console.error('Error creating image node:', e);
            }
            return null as unknown as Node // Manejo de error simple
        })
    )
    return nodes
}

interface Props {
    content: string;
    isDarkMode?: boolean;
    onChange?: (content: string) => void;
}

const CrepeEditor: React.FC<Props> = (props: Props) => {
    console.log("Contenido inicial del editor:", props.content);

    const onChangeRef = useRef(props.onChange);
    useEffect(() => {
        onChangeRef.current = props.onChange;
    }, [props.onChange]);

    useEditor((root) => {
        const crepe = new Crepe({
            root,
        });
        crepe.editor
            // 3. Usa el plugin `listener` para habilitar la escucha de eventos
            .use(listener)
            .use(upload)
            // 4. Configura el valor por defecto y añade la lógica de `onChange`
            .config((ctx) => {
                ctx.update(uploadConfig.key, (prev) => ({
                    ...prev,
                    uploader,
                }));
                // Configurar el valor por defecto (opcional, pero buena práctica)
                ctx.set(defaultValueCtx, props.content);
                // Obtener el Listener y suscribirse al evento markdownUpdated
                const listenerManager = ctx.get(listenerCtx);
                // La función markdownUpdated se dispara cada vez que cambia el contenido.
                // Recibe el contexto, el nuevo markdown y el markdown anterior.
                listenerManager.markdownUpdated((_ctx, markdown, prevMarkdown) => {
                    // Solo llamar al callback si el contenido realmente ha cambiado
                    if (markdown !== prevMarkdown) {
                        console.log("Contenido del editor cambiado:", markdown);
                        onChangeRef.current?.(markdown);
                    }
                });
            });
        return crepe;
    }, [props.content]);

    return <Milkdown />;
};

export const CustomEditor: React.FC<Props> = (props: Props) => {
    const themeClass = props.isDarkMode ? 'milkdown-theme-dark' : 'milkdown-theme-light';

    return (
        <MilkdownProvider>
            <div
                // Aplicamos la clase del tema al contenedor que envuelve a Milkdown
                className={themeClass}
            >
                <CrepeEditor
                    content={props.content}
                    onChange={props.onChange}
                />
            </div>
        </MilkdownProvider>
    );
};
