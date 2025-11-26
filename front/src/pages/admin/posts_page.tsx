import React from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Button, Space } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined, FundProjectionScreenOutlined } from '@ant-design/icons';
import type Post from "@/models/post"; // Alias para Rule

// Importamos CustomTable y los tipos necesarios
import AdminHeaderContext from "@/components/admin_header_context";
import CustomTable from '@/components/custom_table';
import type { FieldDefinition } from '@/common/types';
import type { DialogMessages } from '@/components/dialogs/custom_dialog';

// 1. Constantes de configuración (fuera de la clase)
const ENDPOINT = "posts";

// Definición de los campos (tipados para Item, que es Rule)

// Mensajes específicos para el CustomDialog de Rules
const RULE_DIALOG_MESSAGES: DialogMessages = {
    createTitle: 'Create Post',
    readTitle: 'View Post',
    updateTitle: 'Update Post',
    deleteTitle: 'Delete Post',
    confirmDeleteMessage: (id: number | string) => `Are you sure you want to delete post "${id}"?`,
};

// 2. Definición de Props y Clase
interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
}

// La clase ya no necesita State, ya que CustomTable maneja el estado de la tabla.
export class InnerPage extends React.Component<Props, {}> {
    static contextType = AdminHeaderContext;
    declare context: React.ContextType<typeof AdminHeaderContext>;

    // 3. Método para renderizar el botón "Añadir"
    componentDidMount = async () => {
        this.context.setHeaderButtons([
            <Button
                shape="circle"
                type="primary"
                onClick={() => this.props.navigate("/admin/posts/[new-post]")} // Llama al manejador interno de CustomTable para abrir el diálogo CREATE
                icon={<PlusOutlined />}
            >
            </Button>
        ]);
    }

    // 4. Método para renderizar la columna de acciones
    private renderActionColumn = (post: Post, onDelete: (post: Post) => void) => {
        return (
            <Space size="small">
                <Button
                    shape="circle"
                    onClick={() => this.props.navigate(`/${post.slug}`)}
                    title={this.props.t('Preview')}
                >
                    <FundProjectionScreenOutlined />
                </Button>

                <Button
                    shape="circle"
                    onClick={() => this.props.navigate(`/admin/posts/${post.slug}`)}
                    title={this.props.t('Edit')}
                >
                    <EditFilled />
                </Button>
                <Button
                    shape="circle"
                    onClick={() => onDelete(post)}
                    title={this.props.t('Delete')} danger
                >
                    <DeleteFilled />
                </Button>
            </Space>
        );
    };

    // 5. El método render ahora solo devuelve el CustomTable
    render = () => {
        // La clase ya no tiene this.state, this.columns, fetchData, etc.
        // Toda la complejidad se delega a CustomTable.
        const fields: FieldDefinition<Post>[] = [
            { key: 'id', label: 'Id', type: 'number', value: 0, editable: false, fixed: 'left', width: 80 },
            { key: 'updated_at', visible: true, label: 'Updated', type: 'date', value: "", width: 150 },
            { key: 'published_at', visible: true, label: 'Published', type: 'date', value: "", width: 150 },
            { key: 'title', visible: true, label: 'Title', type: 'string', value: "", width: 150 },
            { key: 'comment_on', label: 'Comments', type: 'boolean', value: false, width: 80 },
            { key: 'private', label: 'Private', type: 'boolean', value: true, width: 80 },
        ];
        return (
            <CustomTable<Post>
                endpoint={ENDPOINT}
                fields={fields}
                dialogMessages={RULE_DIALOG_MESSAGES}
                t={this.props.t}
                hasActions={true}
                renderActionColumn={this.renderActionColumn}
            />
        );
    }
}

// 6. Componente funcional (wrapper) para conectar Hooks
export default function Page() {
    const navigate = useNavigate();
    // useTranslation debe estar en un componente funcional o en un componente de clase con un wrapper
    const { t } = useTranslation();
    return (
        <InnerPage navigate={navigate} t={t} />
    );
}
