import React, { useContext } from "react";
import { useNavigate } from 'react-router'; // 1. Añadido useParams
import { useTranslation } from "react-i18next";
import { Button, Tooltip, Flex, Alert } from 'antd';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import ModeContext from "@/components/mode_context";
import AdminHeaderContext from "@/components/admin_header_context";
import AuthContext from '@/components/auth_context';
import { debounce } from "@/common/utils";

import CodeMirror from "@uiw/react-codemirror";
import { jinja } from '@codemirror/lang-jinja';


interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
    isDarkMode: boolean;
    isLoggedIn?: boolean;
}

interface State {
    code?: string;
    originalCode?: string;
    showMessage: boolean;
    messageText?: string;
    messageType?: "success" | "error" | "info" | "warning";
}


// La clase ya no necesita State, ya que CustomTable maneja el estado de la tabla.
export class InnerPage extends React.Component<Props, State> {
    static contextType = AdminHeaderContext;
    declare context: React.ContextType<typeof AdminHeaderContext>;

    constructor(props: Props) {
        super(props);
        this.state = {
            code: "",
            originalCode: "",
            showMessage: false
        }
    }

    componentDidMount = async () => {
        // Add buttons to the header
        this.context.setHeaderButtons([
            <Tooltip title={this.props.t("Save and stay here")} key="save-stay">
                <Button
                    shape="circle"
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => this.onSavePost(false)}
                />
            </Tooltip>,
            <Tooltip title={this.props.t("Save and go to the posts list")} key="save-list">
                <Button
                    shape="circle"
                    icon={<CheckOutlined />}
                    onClick={() => this.onSavePost(true)}
                />
            </Tooltip>,
            <Tooltip title={this.props.t("Cancel and go to the posts list")} key="cancel-list">
                <Button
                    shape="circle"
                    icon={<CloseOutlined />}
                    onClick={() => this.props.navigate("/admin/posts")}
                />
            </Tooltip>
        ]);
    }

    componentWillUnmount = () => {
        // Clear buttons from the header when component unmounts
        this.context.setHeaderButtons([]);
    }

    showMessage = (text: string, type: 'success' | 'error' | 'info' | 'warning') => {
        this.setState({
            showMessage: true,
            messageText: text,
            messageType: type
        });
        this.hideMessage();
    }

    hideMessage = debounce(() => {
        this.setState({ showMessage: false });
    }, 3000);

    onSavePost = async (goToList: boolean) => {
        if (!this.state.code || this.state.code === "") {
            this.showMessage(this.props.t("Content can not be empty"), "error");
            return;
        }
        /*
        if (this.state.currentPost.id) {
            // update existing post
            response = await updateData<Post>(`posts`, this.state.currentPost);
        } else {
            // create new post
            response = await saveData<Post>("posts", this.state.currentPost);
        }

        if ((response.status === 200 || response.status === 201) && response.data) {
            this.showMessage(this.props.t("Post saved successfully"), "success");
            this.setState({
                currentPost: {
                    ...this.state.currentPost,
                    ...response.data
                }
            });
            if (goToList) {
                this.props.navigate("/admin/posts");
            } else {
                this.props.navigate(`/admin/posts/${response.data.slug}`);
            }
        } else {
            this.showMessage(this.props.t("Error saving post"), "error");
        }
        */

        if (goToList) {
            this.props.navigate("/admin/posts");
        }
    }


    render = () => {
        const { showMessage, messageText, messageType, code } = this.state;
        console.log("Code:", code);
        return (
            <Flex
                vertical
                gap="middle"
                style={{ width: "100%", height: "100%", flex: 1 }}
            >
                {showMessage &&
                    <Alert
                        message={messageText}
                        type={messageType}
                        showIcon
                        closable
                        onClose={() => this.setState({ showMessage: false })}
                        style={{ margin: 16 }}
                    />
                }
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        padding: 20,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative"
                    }}
                >
                    <CodeMirror
                        //value={this.state.code || "Hola esto es una prueba de mierda"}
                        value={"Hola esto es una prueba de mierda"}
                        onChange={(newCode: string) => this.setState({ code: newCode })}
                        //theme={this.props.isDarkMode ? "vs-dark" : "vs-light"}
                        extensions={[jinja()]}
                        theme={this.props.isDarkMode ? "dark" : "light"}
                        height="100%"
                        minHeight="100%"
                        className="full-height-codemirror"
                    />
                </div>
            </Flex>
        );
    }
}

export default function BlogTemplatePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isLoggedIn } = useContext(AuthContext);
    const { isDarkMode } = useContext(ModeContext);
    return (
        <InnerPage
            navigate={navigate}
            t={t}
            isDarkMode={isDarkMode}
            isLoggedIn={isLoggedIn}
        />
    );
}

