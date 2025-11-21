import React from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Button, Space } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined } from '@ant-design/icons';
import type Post from "@/models/post"; // Alias para Rule

// Importamos CustomTable y los tipos necesarios
import AuthContext from '@/components/auth_context';
import CustomTable from '@/components/custom_table';
import type { FieldDefinition } from '@/common/types';
import type { DialogMessages } from '@/components/dialogs/custom_dialog';

// 1. Constantes de configuración (fuera de la clase)
const TITLE = "Topics";
const ENDPOINT = "posts";

// Definición de los campos (tipados para Item, que es Rule)

// Mensajes específicos para el CustomDialog de Rules
const RULE_DIALOG_MESSAGES: DialogMessages = {
    createTitle: 'Create Topic',
    readTitle: 'View Topic',
    updateTitle: 'Update Topic',
    deleteTitle: 'Delete Topic',
    confirmDeleteMessage: (id: number | string) => `Are you sure you want to delete topic "${id}"?`,
};

// 2. Definición de Props y Clase
interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    user_id: number;
    t: (key: string) => string; // Propiedad de useTranslation
}

// La clase ya no necesita State, ya que CustomTable maneja el estado de la tabla.
export class InnerPage extends React.Component<Props, {}> {

    // 3. Método para renderizar el botón "Añadir"
    private renderHeaderAction = (onCreate: () => void) => {
        return (
            <Button
                type="primary"
                onClick={onCreate} // Llama al manejador interno de CustomTable para abrir el diálogo CREATE
                icon={<PlusOutlined />}
            >
                {this.props.t("Add Topic")}
            </Button>
        );
    };

    // 4. Método para renderizar la columna de acciones
    private renderActionColumn = (item: Post, onEdit: (item: Post) => void, onDelete: (post: Post) => void) => {
        return (
            <Space size="middle">
                <Button onClick={() => onEdit(item)} title={this.props.t('Edit')}>
                    <EditFilled />
                </Button>
                <Button onClick={() => onDelete(item)} title={this.props.t('Delete')} danger>
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
            { key: 'user_id', label: 'User', type: 'string', value: this.props.user_id, editable: false, width: 100 },
            { key: 'class', label: 'Class', type: 'string', value: "page", width: 100, editable: false },
            { key: 'comment_on', label: 'Comments', type: 'boolean', value: false, width: 80 },
            { key: 'private', label: 'Private', type: 'boolean', value: true, width: 80 },
            { key: 'title', visible: true, label: 'Title', type: 'string', value: "", width: 150 },
        ];
        return (
            <CustomTable<Post>
                title={TITLE}
                endpoint={ENDPOINT}
                fields={fields}
                dialogMessages={RULE_DIALOG_MESSAGES}
                t={this.props.t}
                hasActions={true}
                renderHeaderAction={this.renderHeaderAction}
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
        <AuthContext.Consumer>
            {({ user_id }) => {
                console.log(`Rendering Topics Page for user_id: ${user_id}`);
                return (
                    <InnerPage navigate={navigate} user_id={user_id} t={t} />
                );
            }}
        </AuthContext.Consumer>
    );
}
