import React from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Modal, Typography, Flex, Input, InputNumber, Switch, Select, Alert } from "antd";

const { Text } = Typography;


type WithOptionalId<T> = T & { id?: number };

import { BASE_URL } from '@/constants';
import type { DialogMode, FieldDefinition } from '@/common/types';
import { DialogModes } from '@/common/types';
import { getNestedValue, debounce } from "@/common/utils";

// Interfaces de State y Props, ahora genéricas en T
interface State<T> {
    data?: WithOptionalId<T>, // Renombrado de 'rule' a 'data'
    showMessage?: boolean
    messageText?: string
    messageType?: 'success' | 'error' | 'info' | 'warning'
}

interface Props<T> {
    endpoint: string;
    dialogMessages?: DialogMessages;
    data?: WithOptionalId<T>, // Renombrado de 'rule' a 'data'
    fields: FieldDefinition<T>[]; // Se añaden los campos como prop
    dialogMode?: DialogMode;
    // La función onClose ahora devuelve un tipo T
    onClose: (data?: WithOptionalId<T>) => void;
    navigate: any;
    t: any;
}

// El componente de clase se hace genérico: InnerDialog<T>
class InnerDialog<T> extends React.Component<Props<T>, State<T>> {

    hideMessage: () => void;

    constructor(props: Props<T>) {
        super(props);

        // Inicialización del estado con 'data' (antes 'rule')
        console.log(props.data);
        this.state = {
            data: this.props.data !== undefined ? this.props.data : this.props.fields.reduce((acc: any, field: any) => {
                acc[field.key] = field.value;
                return acc
            }, {} as WithOptionalId<T>),
        }
        this.hideMessage = debounce(() => {
            this.setState({ showMessage: false });
        }, 3000);
    }

    // Los 'fields' ya no son una propiedad de clase fija, sino que se acceden desde this.props.fields
    // Se han eliminado los 'fields' estáticos de la clase.

    getValue = (key: keyof T & string) => {
        if (this.state.data) {
            return this.state.data[key];
        }
        // Si no hay datos, buscar el valor inicial en las props.fields
        return this.props.fields.find(field => field.key === key)?.value;
    }

    fetchData = async () => {
        let method;
        let url;
        let string_body;
        let queryString = "";
        const basePath = `${BASE_URL}/api/v1/${this.props.endpoint}`;
        const searchParams = new URLSearchParams();

        const dataWithId = this.state.data as WithOptionalId<T>; // Para facilitar el acceso al id

        if (this.props.dialogMode === DialogModes.DELETE) {
            method = 'DELETE';
            if (dataWithId?.id !== undefined) {
                searchParams.append('id', String(dataWithId.id));
                queryString = searchParams.toString();
            }
            string_body = null;
        } else if (this.props.dialogMode === DialogModes.UPDATE) {
            method = 'PATCH';
            string_body = JSON.stringify(this.state.data);
        } else if (this.props.dialogMode === DialogModes.CREATE) {
            method = 'POST';
            const body = this.props.fields.reduce((acc: any, field: FieldDefinition<T>) => {
                acc[field.key] = getNestedValue(dataWithId, field.key as string);
                return acc;
            }, {})
            string_body = JSON.stringify(body);
        } else if (this.props.dialogMode === DialogModes.READ) {
            method = 'GET';
            if (dataWithId?.id !== undefined) {
                searchParams.append('id', String(dataWithId.id));
                queryString = searchParams.toString();
            }
            string_body = null;
        } else {
            return null;
        }

        // Manejo de URL: se usa '?' solo si queryString existe para evitar dobles '?'
        url = `${basePath}${queryString.trim() !== "" ? `?${queryString}` : ''}`;

        console.log("Request URL:", url);
        console.log("Body:", string_body);
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: string_body,
            })
            console.log("====================");
            console.log("Response Status:", response.status);
            console.log("====================");
            if (!response.ok || response.status > 299) {
                // ... (lógica de manejo de errores, sin cambios)
                let errorBody: { message?: string } = {};
                try {
                    errorBody = await response.json();
                } catch (e) { }
                console.log(JSON.stringify(errorBody));
                return {
                    status: response.status,
                    message: errorBody.message || `Error HTTP: ${response.status} - ${response.statusText}`
                };
            }
            const content = await response.json();
            console.log("Fetch successful:", content);
            // Pasar el objeto completo (content.data) al onClose
            this.props.onClose(content.data as WithOptionalId<T>);
        } catch (error) {
            // ... (lógica de manejo de errores de red, sin cambios)
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Network Error or Fetch Failure:', msg, error);

            return {
                status: 500,
                message: `Network or Unknown Error: ${msg}`
            };
        }
    }

    componentDidUpdate(prevProps: Props<T>) {
        if (prevProps.dialogMode !== this.props.dialogMode ||
            (this.props.dialogMode !== DialogModes.CREATE &&
                prevProps.data?.id !== this.props.data?.id)) { // Renombrado de 'rule' a 'data'
            if (this.props.data && this.props.dialogMode !== DialogModes.CREATE) {
                this.setState({
                    data: { // Renombrado de 'rule' a 'data'
                        ...prevProps.data,
                        ...this.props.data
                    },
                });
            }
        }
    }

    handleClose = async (ok: boolean) => {
        console.log("Handling close, ok =", ok);
        if (ok) {
            if (this.state.data === undefined) {
                const requiredFields = this.props.fields.filter(field => field.required).map(field => field.label).join(", ");
                this.showMessage(`Los siguientes campos son obligatorios: ${requiredFields}`, "error");
                return;
            }
            for (const field of this.props.fields) {
                console.log(field);
                console.log(getNestedValue(this.state.data, field.key as string));
                if (field.required) {
                    if (getNestedValue(this.state.data, field.key as string) === undefined || getNestedValue(this.state.data, field.key as string) === null || getNestedValue(this.state.data, field.key as string) === '') {
                        this.showMessage(`El campo ${field.label} es obligatorio`, "error");
                        return;
                    }
                }
            }
            const response = await this.fetchData();
            console.log(response);
            this.showMessage(response?.message || "Operación realizada con éxito", response && response.status && response.status >= 200 && response.status < 300 ? "success" : "error");
        }else{
            this.props.onClose(undefined); // Renombrado de 'rule' a 'data'
        }
    }

    // La clave ahora está tipada como keyof T & string
    onChange = (key: keyof T & string, value: any) => {
        this.setState((prevState) => ({
            data: { // Renombrado de 'rule' a 'data'
                ...prevState.data,
                [key]: value,
            } as WithOptionalId<T>,
        })
        );
    }

    showMessage = (text: string, type: 'success' | 'error' | 'info' | 'warning') => {
        this.setState({
            showMessage: true,
            messageText: text,
            messageType: type
        });
        this.hideMessage();
    }

    render = () => {
        const { showMessage, messageText, messageType } = this.state;
        const dialogMode = this.props.dialogMode;
        // Obtener la clave 'id' de forma segura para usar en el mensaje de borrado.
        const data_id = this.state.data ? (this.state.data as any).id : undefined;
        const disabled = dialogMode === DialogModes.READ;
        let title = "";
        let message = "";
        if (dialogMode === DialogModes.CREATE) {
            title = this.props.t(this.props.dialogMessages?.createTitle); // Título genérico
        } else if (dialogMode === DialogModes.UPDATE) {
            title = this.props.t(this.props.dialogMessages?.updateTitle); // Título genérico
        } else if (dialogMode === DialogModes.READ) {
            title = this.props.t(this.props.dialogMessages?.readTitle); // Título genérico
        } else if (dialogMode === DialogModes.DELETE) {
            title = this.props.t(this.props.dialogMessages?.deleteTitle); // Título genérico
            message = this.props.t(this.props.dialogMessages?.confirmDeleteMessage(data_id)); // Mensaje genérico
        }
        return (
            <>
                {/* Alerta de campos obligatorios */}
                {(dialogMode === DialogModes.DELETE) &&
                    <Modal
                        title={title}
                        open={this.props.dialogMode !== undefined}
                        onOk={async () => {
                            await this.handleClose(true);
                        }}
                        onCancel={async () => {
                            await this.handleClose(false);
                        }}
                        okText={this.props.t('Ok')}
                        cancelText={this.props.t('Cancel')}
                    >
                        {showMessage && (
                            <Alert
                                message={messageText}
                                type={messageType}
                                showIcon
                                closable
                                onClose={() => this.setState({ showMessage: false })}
                                style={{ margin: 16 }}
                            />
                        )}
                        <Text>{message}</Text>
                    </Modal>
                }
                {(dialogMode === DialogModes.CREATE || dialogMode === DialogModes.UPDATE) &&
                    <Modal
                        title={title}
                        open={this.props.dialogMode !== undefined}
                        onOk={async () => {
                            await this.handleClose(true);
                        }}
                        onCancel={async () => {
                            await this.handleClose(false);
                        }}
                        okText={this.props.t('Ok')}
                        cancelText={this.props.t('Cancel')}
                    >
                        {showMessage && (
                            <Alert
                                message={messageText}
                                type={messageType}
                                showIcon
                                closable
                                onClose={() => this.setState({ showMessage: false })}
                                style={{ margin: 16 }}
                            />
                        )}
                        <Flex vertical gap="small">
                            {/* Uso de this.props.fields */}
                            {this.props.fields && this.props.fields.map((field) => (
                                // Casting de field.key a keyof T & string es seguro aquí
                                    field.visible === true &&
                                        <Flex key={field.key}>
                                            <Text style={{ width: 200 }}>{field.label}</Text>
                                            {field.type === 'boolean' && field.visible == true &&
                                                <Switch
                                                    // Se requiere casting a los tipos específicos
                                                    defaultChecked={this.getValue(field.key as keyof T & string) as boolean}
                                                    onChange={(checked) => this.onChange(field.key as keyof T & string, checked)}
                                                    disabled={disabled}
                                                />
                                            }
                                            {field.type === 'string' && field.visible == true &&
                                                <Input
                                                    style={{ width: '100%' }}
                                                    defaultValue={this.getValue(field.key as keyof T & string) as string}
                                                    placeholder={field.label}
                                                    onChange={(e) => this.onChange(field.key as keyof T & string, e.target.value)}
                                                    disabled={disabled || field.editable === false}
                                                />
                                            }
                                            {field.type === 'number' && field.visible == true &&
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    defaultValue={this.getValue(field.key as keyof T & string) as number}
                                                    placeholder={field.label}
                                                    onChange={(value) => this.onChange(field.key as keyof T & string, value)}
                                                    disabled={disabled || field.editable === false}
                                                />
                                            }
                                            {field.type === 'select' && field.visible == true &&
                                                <Select
                                                    style={{ width: '100%' }}
                                                    defaultValue={this.getValue(field.key as keyof T & string) as any}
                                                    onChange={(value) => this.onChange(field.key as keyof T & string, value)}
                                                    disabled={disabled}
                                                    options={field.options}
                                                />
                                            }
                                        </Flex>
                            ))}
                        </Flex>
                    </Modal>
                }
            </>
        );
    }
}

export interface DialogMessages {
    createTitle: string;
    readTitle: string;
    updateTitle: string;
    deleteTitle: string;
    confirmDeleteMessage: (id: number | string) => string;
}

// Interfaz para el componente funcional que se exporta, ahora genérica en T
export interface DialogProps<T> {
    endpoint: string;
    dialogMessages?: DialogMessages;
    data?: WithOptionalId<T>,
    fields: FieldDefinition<T>[];
    dialogMode?: DialogMode;
    onClose: (data?: WithOptionalId<T>) => void; // Tipo T
}

export default function CustomDialog<T>(props: DialogProps<T>) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return <InnerDialog<T>
        endpoint={props.endpoint}
        dialogMessages={props.dialogMessages}
        data={props.data}
        fields={props.fields}
        dialogMode={props.dialogMode}
        onClose={props.onClose}
        navigate={navigate}
        t={t}
    />;
}
