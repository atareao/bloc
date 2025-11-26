import React from "react";
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex, Tooltip, Button, } from "antd";
import type Post from "@/models/post";
import { loadData } from "@/common/utils";
import ModeContext from "@/components/mode_context";
import EditOutlined from '@ant-design/icons/EditOutlined';
import Parser from "html-react-parser";
import '@/pages/public/post_page.css';
import AdminHeaderContext from "@/components/admin_header_context";
import AuthContext from '@/components/auth_context';

interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
    isDarkMode: boolean;
    postSlug?: string;
    isLoggedIn: boolean;
}

interface State {
    post?: Post;
    originalContent?: string;
    showMessage: boolean;
    messageText?: string;
    messageType?: "success" | "error" | "info" | "warning";
}

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
        }
    }

    componentDidMount = async () => {
        console.log("PostPage mounted with slug:", this.props.postSlug);
        const response = await loadData<Post>("posts/html", new Map([["slug", this.props.postSlug || ""]]));
        if (response.status === 200 && response.data) {
            console.log("Post loaded:", response.data);
            this.setState({
                post: {
                    ...this.state.post,
                    ...response.data
                },
                originalContent: response.data.content
            })
            const buttons = this.props.isLoggedIn ? [
                <Tooltip title={this.props.t("Edit post")} key="edit-post">
                    <Button
                        shape="circle"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => { }}
                    />
                </Tooltip>,
            ] : [];
            console.log("Is logged in:", this.props.isLoggedIn, "Setting header buttons:", buttons);
            console.log("Buttons set:", buttons);
            this.context.setHeaderButtons(buttons);

        }
    }
    componentWillUnmount = () => {
        // Clear buttons from the header when component unmounts
        this.context.setHeaderButtons([]);
    }

    render = () => {
        const { post } = this.state;
        return (
            <div
                className="post-container"
            >
            <Flex
                vertical
                justify="center"
                align="center"
                gap="middle"
                key={post?.id || "new-post"}
                className="post"
            >
                <Flex
                    key={post?.id || "new-post"}
                    vertical
                >
                    {Parser(post?.html_content || "")}
                </Flex>
            </Flex>
            </div>
        );
    }
}


export default function PublicPostPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    console.log("Path", useLocation().pathname)
    const postSlug = useLocation().pathname.split('/')[1];
    console.log("PublicPage rendering with slug:", postSlug);
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
