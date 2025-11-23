import React from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Button, Space } from 'antd';
import { EditFilled, DeleteFilled, PlusOutlined } from '@ant-design/icons';
import type Tag from "@/models/tag"; // Alias para Rule

// Importamos CustomTable y los tipos necesarios
import CustomTable from '@/components/custom_table';
import type { FieldDefinition } from '@/common/types';
import type { DialogMessages } from '@/components/dialogs/custom_dialog';

// 1. Constantes de configuración (fuera de la clase)
const TITLE = "Tags";
const ENDPOINT = "tags";

// Definición de los campos (tipados para Item, que es Rule)

// Mensajes específicos para el CustomDialog de Rules
const RULE_DIALOG_MESSAGES: DialogMessages = {
    createTitle: 'Create Tag',
    readTitle: 'View Tag',
    updateTitle: 'Update Tag',
    deleteTitle: 'Delete Tag',
    confirmDeleteMessage: (id: number | string) => `Are you sure you want to delete tag "${id}"?`,
};

// 2. Definición de Props y Clase
interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
}

// La clase ya no necesita State, ya que CustomTable maneja el estado de la tabla.
export class InnerPage extends React.Component<Props, {}> {

    // 3. Método para renderizar el botón "Añadir"
    private renderHeaderAction = () => {
        return (
            <Button
                type="primary"
                onClick={() => this.props.navigate("/admin/tags/[new-tag]")} // Llama al manejador interno de CustomTable para abrir el diálogo CREATE
                icon={<PlusOutlined />}
            >
                {this.props.t("Add Tag")}
            </Button>
        );
    };

    // 4. Método para renderizar la columna de acciones
    private renderActionColumn = (tag: Tag, onDelete: (tag: Tag) => void) => {
        return (
            <Space size="middle">
                <Button onClick={() => this.props.navigate(`/admin/tags/${tag.slug}`)} title={this.props.t('Edit')}>
                    <EditFilled />
                </Button>
                <Button onClick={() => onDelete(tag)} title={this.props.t('Delete')} danger>
                    <DeleteFilled />
                </Button>
            </Space>
        );
    };

    // 5. El método render ahora solo devuelve el CustomTable
    render = () => {
        // La clase ya no tiene this.state, this.columns, fetchData, etc.
        // Toda la complejidad se delega a CustomTable.
        const fields: FieldDefinition<Tag>[] = [
            { key: 'id', label: 'Id', type: 'number', value: 0, editable: false, fixed: 'left', width: 80 },
            { key: 'tag', visible: true, label: 'Tag', type: 'string', value: "", width: 150 },
            { key: 'slug', visible: true, label: 'Slug', type: 'string', value: "", width: 150 },
            { key: 'created_at', visible: true, label: 'Created at', type: 'date', value: "", width: 80 },
            { key: 'updated_at', visible: true, label: 'Created at', type: 'date', value: "", width: 80 },
        ];
        return (
            <CustomTable<Tag>
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
        <InnerPage navigate={navigate} t={t} />
    );
}
