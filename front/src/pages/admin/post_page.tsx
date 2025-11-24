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
    directivesPlugin,
    KitchenSinkToolbar,
} from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'
import '@/pages/admin/editor.css'
import ModeContext from "@/components/mode_context";
import AdminHeaderContext from "@/components/admin_header_context";
import type Post from "@/models/post";
import { loadData, debounce, saveData, updateData } from "@/common/utils";
import { YoutubeDirectiveDescriptor } from '@/components/descriptors/youtube_descriptor';
import { YouTubeButton } from '@/components/embeds/youtube_embed'

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
    static contextType = AdminHeaderContext;
    declare context: React.ContextType<typeof AdminHeaderContext>;

    constructor(props: Props) {
        super(props);
        this.state = {
            post: {
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
        console.log("PostPage mounted with slug:", this.props.postSlug);
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
        if (!this.state.post || !this.state.post.content || this.state.post.content === "") {
            this.showMessage(this.props.t("Content can not be empty"), "error");
            return;
        }
        if (!this.state.post.content.startsWith("# ")) {
            this.showMessage(this.props.t("Content must starts with title '# '"), "error");
            return;
        }
        let response;
        if (this.state.post.id) {
            // update existing post
            response = await updateData<Post>(`posts`, this.state.post);
        } else {
            // create new post
            response = await saveData<Post>("posts", this.state.post);
        }

        if (response.status === 200 && response.data) {
            this.showMessage(this.props.t("Post saved successfully"), "success");
            this.setState({
                post: {
                    ...this.state.post,
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

        if (goToList) {
            this.props.navigate("/admin/posts");
        }
    }
    render = () => {
        console.log("Rendering PostPage with post:", this.state.post);
        const { showMessage, messageText, messageType, post, originalContent } = this.state;
        const content = post?.content || "vacío?";
        const labelWidth = 120;
        console.log("Content:", content);
        const { t, isDarkMode } = this.props;
        console.log("MDXEditor markdown prop:", this.state.post?.content || "");
        return (
            <Flex
                vertical
                justify="center"
                align="center"
                gap="middle" style={{ maxWidth: 1050 }}
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
                    <Flex vertical gap="middle">
                        {
                            post && post.id &&
                            <Flex gap="middle">
                                <Text style={{ minWidth: labelWidth }}>{t("Id")}:</Text>
                                <Input
                                    placeholder={t("Id")}
                                    value={post?.id}
                                    disabled={true}
                                />
                            </Flex>
                        }
                        {
                            post && post.title &&
                            <Flex gap="middle">
                                <Text style={{ minWidth: labelWidth }}>{t("Title")}:</Text>
                                <Input
                                    placeholder={t("Title")}
                                    value={post?.title}
                                    disabled={true}
                                />
                            </Flex>
                        }
                        {
                            post && post.id &&
                            <Flex gap="middle">
                                <Text style={{ minWidth: labelWidth }}>{t("Slug")}:</Text>
                                <Input
                                    placeholder={t("Slug")}
                                    value={post?.slug}
                                    disabled={true}
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
                            <Switch checked={post?.comment_on} />
                            <Text>{t("Private")}:</Text>
                            <Switch checked={post?.private} />
                        </Flex>
                        <Flex gap="middle">
                            <Text style={{ minWidth: labelWidth }}>{t("Meta description")}:</Text>
                            <TextArea
                                rows={2}
                            />
                        </Flex>

                    </Flex>
                    <Flex
                    >
                    <div className="overflow-y-auto">

                        <MDXEditor
                            key={post?.id || "new-post"}
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
                                directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor] }),
                                diffSourcePlugin({ diffMarkdown: originalContent, viewMode: 'rich-text' }),
                                markdownShortcutPlugin(),
                                toolbarPlugin({
                                    toolbarClassName: 'my-toolbar',
                                    toolbarContents: () => [<KitchenSinkToolbar />, <YouTubeButton />]
                                }),
                            ]}
                            className={isDarkMode ? "dark-theme dark-editor" : "white-editor"}
                            markdown={content}
                            onChange={(value) => {
                                this.setState((prevState) => ({
                                    post: {
                                        ...prevState.post!,
                                        content: value
                                    }
                                }));
                            }}
                            overlayContainer={null}
                        /></div>
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
