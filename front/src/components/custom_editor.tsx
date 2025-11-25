import React, { Component, createRef } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown'; // Extensión clave para Markdown
import Image from '@tiptap/extension-image'; // Para manejar imágenes
import Placeholder from '@tiptap/extension-placeholder';
import { Flex, Button, Tooltip } from 'antd';
import {
    BoldOutlined, ItalicOutlined, StrikethroughOutlined, CodeOutlined,
    LinkOutlined, UnorderedListOutlined,
    OrderedListOutlined, CodeSandboxOutlined, RollbackOutlined,
    RedoOutlined, PictureOutlined
} from '@ant-design/icons';
import type Response from '@/models/response';
import { BASE_URL } from '@/constants';


// --- TIPADO ---

export type ImageUploadHandler = (file: File) => Promise<string>;

interface Props {
    content: string; // Contenido inicial en Markdown
    onChange?: (markdown: string) => void;
    imageUploadHandler?: ImageUploadHandler; // El handler que sube al backend
}

interface State {
    isEditorReady: boolean;
}


// --- CLASE COMPONENTE ---

export default class MarkdownEditor extends Component<Props, State> {

    // Almacena la instancia del editor Tiptap
    private editor: Editor | null = null;

    // Referencia para el input de archivo oculto
    private fileInputRef = createRef<HTMLInputElement>();

    constructor(props: Props) {
        super(props);
        this.state = {
            isEditorReady: false,
        };
    }

    componentDidUpdate = (prevProps: Props) => {
        if (prevProps.content !== this.props.content) {
            if (this.editor && !this.editor.isDestroyed) {
                const newContent = this.props.content || ''; // Aseguramos un string vacío
                const currentEditorContent = this.editor.getMarkdown();
                if (newContent !== currentEditorContent) {
                    this.editor.commands.setContent(
                        newContent,
                        {
                            contentType: 'markdown',
                        }
                    );
                }
            }
        }
    }

    componentDidMount = () => {
        console.log(this.props);
        this.editor = new Editor({
            // 1. Extensiones de Tiptap
            extensions: [
                StarterKit.configure({
                    // StarterKit incluye todos los elementos básicos de Markdown, excepto código de bloque (lo manejaremos con el plugin Markdown)
                    link: {
                        autolink: false,
                        defaultProtocol: 'https',
                        protocols: ['https'],
                        isAllowedUri: (url, ctx) => {
                            try {
                                // construct URL
                                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)

                                // use default validation
                                if (!ctx.defaultValidate(parsedUrl.href)) {
                                    return false
                                }

                                // disallowed protocols
                                const disallowedProtocols = ['ftp', 'file', 'mailto']
                                const protocol = parsedUrl.protocol.replace(':', '')

                                if (disallowedProtocols.includes(protocol)) {
                                    return false
                                }

                                // only allow protocols specified in ctx.protocols
                                const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))

                                if (!allowedProtocols.includes(protocol)) {
                                    return false
                                }

                                // disallowed domains
                                const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
                                const domain = parsedUrl.hostname

                                if (disallowedDomains.includes(domain)) {
                                    return false
                                }

                                // all checks have passed
                                return true
                            } catch {
                                return false
                            }
                        },
                        shouldAutoLink: url => {
                            try {
                                // construct URL
                                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)

                                // only auto-link if the domain is not in the disallowed list
                                const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
                                const domain = parsedUrl.hostname

                                return !disallowedDomains.includes(domain)
                            } catch {
                                return false
                            }
                        },
                    },
                }),
                Markdown,
                Placeholder.configure({
                    placeholder: 'Escribe tu contenido aquí...',
                }),
                // Extensión de imagen. Tiptap usará Base64 por defecto, a menos que uses el botón.
                Image.configure({
                    inline: true,
                    allowBase64: true,
                }),
            ],
            // 2. Contenido inicial
            content: this.props.content,
            contentType: 'markdown',

            // 3. Manejo de actualizaciones
            onUpdate: ({ editor }) => {
                console.log("Update");
                // Convierte el contenido interno a Markdown y lo pasa al padre (post_page.tsx)
                this.props.onChange?.(editor.getMarkdown());
            },

            // 4. Forzar re-render para actualizar el estado activo de los botones de la barra
            onTransaction: () => {
                this.forceUpdate();
            },
        });
        this.setState({ isEditorReady: true });
    }

    // Limpieza: Destruye la instancia del editor cuando el componente se desmonta
    componentWillUnmount = () => {
        this.editor?.destroy();
    }

    // Método para manejar la subida de archivos (llamado por el botón)
    private handleImageUpload = async (image: File) => {
        if (!this.editor) return;

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
                const json = (await response.json()) as Response<{file_path: string}>; 
                console.log("Uploaded image URL:", json.data?.file_path);
                if (json.data?.file_path) {
                    // Inserta la imagen con la URL pública devuelta
                    this.editor.chain().focus().setImage({ src: json.data.file_path }).run();
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


    // Maneja el evento change del input de archivo oculto
    private handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            this.handleImageUpload(e.target.files[0]);
            // Resetea el input para permitir subir el mismo archivo de nuevo
            e.target.value = '';
        }
    }

    // Renderiza la barra de herramientas de Ant Design
    private renderToolbar = () => {
        const editor = this.editor;
        if (!editor) return null;

        return (
            <Flex gap="small" wrap="wrap" style={{ border: '1px solid #303030', borderRadius: 8, padding: 8, marginBottom: 8 }}>

                {/* FORMATO BÁSICO */}
                <Tooltip title="Bold (**texto**)">
                    <Button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} icon={<BoldOutlined />} type={editor.isActive('bold') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Italic (*texto*)">
                    <Button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} icon={<ItalicOutlined />} type={editor.isActive('italic') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Strikethrough (~~texto~~)">
                    <Button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} icon={<StrikethroughOutlined />} type={editor.isActive('strike') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Code (`código`)">
                    <Button onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} icon={<CodeOutlined />} type={editor.isActive('code') ? 'primary' : 'default'} />
                </Tooltip>

                <div style={{ width: '1px', background: '#e8e8e8' }} />

                {/* BLOQUES Y LISTAS */}
                <Tooltip title="Heading 1 (# Titulo)">
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Heading 2 (## Titulo)">
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Heading 3 (### Titulo)">
                    <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Bullet List (- Item)">
                    <Button onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<UnorderedListOutlined />} type={editor.isActive('bulletList') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Ordered List (1. Item)">
                    <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<OrderedListOutlined />} type={editor.isActive('orderedList') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Blockquote (> Cita)">
                    <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} type={editor.isActive('blockquote') ? 'primary' : 'default'} />
                </Tooltip>
                <Tooltip title="Code Block (```)">
                    <Button onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<CodeSandboxOutlined />} type={editor.isActive('codeBlock') ? 'primary' : 'default'} />
                </Tooltip>

                <div style={{ width: '1px', background: '#e8e8e8' }} />

                {/* ENLACES E IMÁGENES */}
                <Tooltip title="Link ([texto](url))">
                    <Button
                        onClick={() => {
                            const previousUrl = editor.getAttributes('link').href;
                            const url = window.prompt('URL', previousUrl);

                            if (url === null) return;

                            if (url === '') {
                                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                                return;
                            }
                            console.log('URL del enlace:', url);
                            const newUrl = "https://atareao.es";
                            editor.chain().focus().extendMarkRange('link').setLink({ href: newUrl }).run();
                        }}
                        icon={<LinkOutlined />}
                        type={editor.isActive('link') ? 'primary' : 'default'}
                    />
                </Tooltip>

                {/* BOTÓN DE IMAGEN (Dispara el input oculto) */}
                <Tooltip title="Insertar Imagen">
                    <Button
                        icon={<PictureOutlined />}
                        onClick={() => this.fileInputRef.current?.click()}
                    />
                </Tooltip>

                <div style={{ width: '1px', background: '#e8e8e8' }} />

                {/* UNDO / REDO */}
                <Tooltip title="Deshacer (Ctrl+Z)">
                    <Button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={<RollbackOutlined />} />
                </Tooltip>
                <Tooltip title="Rehacer (Ctrl+Y)">
                    <Button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={<RedoOutlined />} />
                </Tooltip>
            </Flex>
        );
    }

    // Método de render principal
    render = () => {
        const { isEditorReady } = this.state;

        return (
            <div style={{ padding: '0px', borderColor: '#e8e8e8' }}>
                {this.renderToolbar()}
                {/* Input de archivo oculto para la subida */}
                <input
                    type="file"
                    ref={this.fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={this.handleFileChange}
                />
                {/* Renderiza el contenido del editor con la instancia de Tiptap */}
                {isEditorReady && this.editor ? (
                    <EditorContent editor={this.editor} style={{
                        minHeight: '300px',
                        border: '1px solid #303030', //#e8e8e8
                        borderRadius: 8,
                    }} />
                ) : (
                    <div style={{ padding: '16px', minHeight: '300px', textAlign: 'center' }}>
                        Cargando editor...
                    </div>
                )}
            </div>
        );
    }
}
