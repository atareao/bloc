import React from "react";
import { useNavigate, useLocation } from 'react-router'; // 1. Añadido useParams
import { useTranslation } from "react-i18next";
import { Button, Tooltip, Flex, Typography, Input, DatePicker, Switch, Alert } from 'antd';
import { MDXEditor } from '@mdxeditor/editor'
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    linkPlugin,
    frontmatterPlugin,
    imagePlugin,
    linkDialogPlugin,
    tablePlugin,
    markdownShortcutPlugin,
    diffSourcePlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    //directivesPlugin,
    KitchenSinkToolbar,
} from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'
import '@/pages/admin/editor.css'
import ModeContext from "@/components/mode_context";
import type Post from "@/models/post";
import { loadData, debounce } from "@/common/utils";

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
    isDarkMode: boolean;
    postSlug?: string;
}

interface State {
    post?: Post;
    originalContent?: string;
    showMessage: boolean;
    messageText?: string;
    messageType?: "success" | "error" | "info" | "warning";
}


// La clase ya no necesita State, ya que CustomTable maneja el estado de la tabla.
export class InnerPage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            post: {
                title: "",
                published_at: new Date(),
                comment_on: true,
                private: true,
                content: "",
                excerpt: "",
                meta: "",
            } as Post,
            originalContent: "",
            showMessage: false,
        }
    }

    componentDidMount = async () => {
        const response = await loadData<Post>("posts", new Map([["slug", this.props.postSlug || ""]]));
        if (response.status === 200 && response.data) {
            console.log("Post loaded:", response.data);
            this.setState({
                post: {
                    ...this.state.post,
                    ...response.data
                },
                originalContent: response.data.content
            });
        }
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
        if (!this.state.post || !this.state.post.title || this.state.post.title === "") {
            this.showMessage(this.props.t("Title is required"), "error");
            return;
        }
        if(goToList) {
            this.props.navigate("/admin/posts");
        }
    }

    // 5. El método render ahora solo devuelve el CustomTable
    render = () => {
        const { showMessage, messageText, messageType } = this.state;
        const { t, isDarkMode } = this.props;
        const labelWidth = 130;
        return (
            <Flex vertical gap="middle" style={{ maxWidth: 1050 }}>
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
                <Flex vertical gap="middle">
                    {
                        this.state.post && this.state.post.id &&
                        <Flex>
                            <Text style={{ minWidth: labelWidth }}>{t("Id")}:</Text>
                            <Input
                                placeholder={t("Id")}
                                value={this.state.post?.id}
                                disabled={true}
                            />
                        </Flex>
                    }
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Title")}:</Text>
                        <Input
                            placeholder={t("Title")}
                            value={this.state.post?.title}
                        />
                        {
                            this.state.post && this.state.post.id === undefined &&
                            <>
                                <Tooltip title={t("Save and stay here")}>
                                    <Button
                                        shape="circle"
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={() => this.onSavePost(false)}
                                    />
                                </Tooltip>
                                <Tooltip title={t("Save and go to the posts list")}>
                                    <Button
                                        shape="circle"
                                        icon={<CheckOutlined />}
                                        onClick={() => this.onSavePost(true)}
                                    />
                                </Tooltip>
                                <Tooltip title={t("Cancel and go to the posts list")}>
                                    <Button
                                        shape="circle"
                                        icon={<CloseOutlined />}
                                        onClick={() => this.props.navigate("/admin/posts")}
                                    />
                                </Tooltip>
                            </>
                        }
                    </Flex>
                    {
                        this.state.post && this.state.post.id &&
                        <Flex gap="middle">
                            <Text style={{ minWidth: labelWidth }}>{t("Slug")}:</Text>
                            <Input
                                placeholder={t("Slug")}
                                value={this.state.post?.slug}
                            />
                        </Flex>
                    }
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Publish at")}:</Text>
                        <DatePicker
                            showTime
                            placeholder={t("Publish at")}
                        />
                        <Text>{t("Comments")}:</Text>
                        <Switch checked={this.state.post?.comment_on} />
                        <Text>{t("Private")}:</Text>
                        <Switch checked={this.state.post?.private} />
                    </Flex>
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Meta description")}:</Text>
                        <TextArea
                            rows={2}
                        />
                    </Flex>

                </Flex>
                <Flex>
                    <MDXEditor
                        plugins={[
                            listsPlugin(),
                            quotePlugin(),
                            headingsPlugin(),
                            linkPlugin(),
                            linkDialogPlugin(),
                            imagePlugin(),
                            tablePlugin(),
                            thematicBreakPlugin(),
                            frontmatterPlugin(),
                            codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
                            //sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
                            codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
                            //directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
                            diffSourcePlugin({ diffMarkdown: this.state.originalContent, viewMode: 'rich-text' }),
                            markdownShortcutPlugin(),
                            toolbarPlugin({
                                toolbarClassName: 'my-toolbar',
                                toolbarContents: () => <KitchenSinkToolbar />
                            }),
                        ]}
                        className={isDarkMode ? "dark-theme dark-editor" : "white-editor"}
                        markdown={this.state.post?.content || ""}
                        onChange={(value) => {
                            this.setState((prevState) => ({
                                post: {
                                    ...prevState.post!,
                                    content: value

                                }
                            }));
                        }}

                    />
                </Flex>
            </Flex>
        );
    }
}

export default function Page() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const postSlug = useLocation().pathname.split('/')[3];
    return <ModeContext.Consumer>
        {({ isDarkMode }) => {
            return (
                <InnerPage
                    navigate={navigate}
                    t={t}
                    isDarkMode={isDarkMode}
                    postSlug={postSlug === "[new-post]" ? undefined : postSlug}
                />
            );
        }}
    </ModeContext.Consumer>
}
