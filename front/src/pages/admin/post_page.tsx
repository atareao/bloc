import React from "react";
import { useNavigate, useLocation } from 'react-router'; // 1. Añadido useParams
import { useTranslation } from "react-i18next";
import { Button, Tooltip, Flex, Typography, Input, DatePicker, Switch, Alert, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import ModeContext from "@/components/mode_context";
import AdminHeaderContext from "@/components/admin_header_context";
import AuthContext from '@/components/auth_context';
import type Post from "@/models/post";
import { loadData, debounce, saveData, updateData } from "@/common/utils";
import TabPanel from "@/components/tab_panel";
import CustomEditor from "@/components/custom_editor"
import { BASE_URL } from '@/constants';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
    isDarkMode: boolean;
    postSlug?: string;
    isLoggedIn?: boolean;
}

interface State {
    post?: Post;
    originalContent?: string;
    showMessage: boolean;
    messageText?: string;
    messageType?: "success" | "error" | "info" | "warning";
    tabValue: number;
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
                private: false,
                content: "",
                excerpt: "",
                meta: "",
            } as Post,
            originalContent: "",
            showMessage: false,
            tabValue: 0,
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


    private getTabsItems = (): TabsProps['items'] => {
        const { t } = this.props;
        const { tabValue, post } = this.state;
        console.log("getTabsItems: ", post);
        const content = post?.content || "# Title";
        console.log("Content:", content);
        const labelWidth = 120;
        const tabEditor = (
            <CustomEditor
                content={content}
                onChange={(value) => {
                    this.setState((prevState) => ({
                        post: {
                            ...prevState.post!,
                            content: value
                        }
                    }));
                }}
            />

        );
        const tabProperties = (
            <Flex style={{ minWidth: 1100 }} gap="middle">
                <Flex vertical gap="middle">
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Id")}:</Text>
                        <Input
                            placeholder={t("Id")}
                            value={post?.id}
                            disabled={true}
                        />
                    </Flex>
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Title")}:</Text>
                        <Input
                            placeholder={t("Title")}
                            value={post?.title}
                            disabled={true}
                        />
                    </Flex>
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Slug")}:</Text>
                        <Input
                            placeholder={t("Slug")}
                            value={post?.slug}
                            disabled={true}
                        />
                    </Flex>
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Publish at")}:</Text>
                        <DatePicker
                            showTime
                            value={post?.published_at ? dayjs(post.published_at) : undefined}
                            placeholder={t("Publish at")}
                            onChange={(published_at) => {
                                this.setState((prevState) => ({
                                    post: {
                                        ...prevState.post!,
                                        published_at: published_at ? published_at.toDate() : undefined,
                                    }
                                }));
                            }}
                        />
                        <Text>{t("Comments")}:</Text>
                        <Switch
                            checked={post?.comment_on}
                            onChange={(checked) => {
                                this.setState((prevState) => ({
                                    post: {
                                        ...prevState.post!,
                                        comment_on: checked,
                                    }
                                }));
                            }}
                        />
                        <Text>{t("Private")}:</Text>
                        <Switch
                            checked={post?.private}
                            onChange={(checked) => {
                                this.setState((prevState) => ({
                                    post: {
                                        ...prevState.post!,
                                        private: checked,
                                    }
                                }));
                            }}
                        />
                    </Flex>
                </Flex>
            </Flex>

        );
        const tabMeta = (
            <Flex style={{ minWidth: 1100 }} gap="middle">
                <Flex vertical gap="middle">
                    <Flex gap="middle">
                        <Text style={{ minWidth: labelWidth }}>{t("Meta description")}:</Text>
                        <TextArea
                            rows={2}
                        />
                    </Flex>
                </Flex>
            </Flex>
        );
        return [
            {
                key: '0',
                label: t("Editor"),
                children: <TabPanel value={tabValue} index={0}>{tabEditor}</TabPanel>,
            },
            {
                key: '1',
                label: t("Properties"),
                children: <TabPanel value={tabValue} index={1}>{tabProperties}</TabPanel>,
            },
            {
                key: '2',
                label: t("Meta"),
                children: <TabPanel value={tabValue} index={2}>{tabMeta}</TabPanel>,
            }
        ]

    }

    handleTabChange = (key: string) => {
        this.setState({ tabValue: parseInt(key) });
    };

    render = () => {
        console.log("Rendering PostPage with post:", this.state.post);
        const { showMessage, messageText, messageType, post } = this.state;
        const content = post?.content || "vacío?";
        console.log("Content:", content);
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
                <Tabs
                    activeKey={String(this.state.tabValue)}
                    onChange={this.handleTabChange}
                    items={this.getTabsItems()}
                />
            </Flex>
        );
    }
}

export default function Page() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const postSlug = useLocation().pathname.split('/')[3];
    return (
        <AuthContext.Consumer>
            {({ isLoggedIn }) => {
                return <ModeContext.Consumer>
                    {({ isDarkMode }) => {
                        return (
                            <InnerPage
                                navigate={navigate}
                                t={t}
                                isDarkMode={isDarkMode}
                                isLoggedIn={isLoggedIn}
                                postSlug={postSlug === "[new-post]" ? undefined : postSlug}
                            />
                        );
                    }}
                </ModeContext.Consumer>
            }}
        </AuthContext.Consumer>
    );
}
