import React from "react";
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex } from "antd";
import type Post from "@/models/post";
import { loadData } from "@/common/utils";
import ModeContext from "@/components/mode_context";
import Parser from "html-react-parser";
import '@/pages/public/post_page.css';

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

export class InnerPage extends React.Component<Props, State> {

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
        const response = await loadData<Post>("posts/html", new Map([["slug", this.props.postSlug || ""]]));
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

    render = () => {
        const { post } = this.state;
        return (
            <Flex
                vertical
                justify="center"
                align="center"
                gap="middle"
                key={post?.id || "new-post"}
            >
                <Flex
                    key={post?.id || "new-post"}
                    vertical
                >
                        {Parser(post?.html || "")}
                </Flex>
            </Flex>
        );
    }
}


export default function PublicPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    console.log("Path", useLocation().pathname)
    const postSlug = useLocation().pathname.split('/')[1];
    console.log("PublicPage rendering with slug:", postSlug);
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
