import React from "react";
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex, Card, Pagination, Row, Col, Typography, Empty } from "antd";
import { FileTextOutlined } from '@ant-design/icons';
import type Post from "@/models/post";
import { loadData } from "@/common/utils";
import ModeContext from "@/components/mode_context";
import Parser from "html-react-parser";

const CARDS_PER_ROW = 3;

const { Text } = Typography;

interface Props {
    navigate: any; // Propiedad de useNavigate (aunque no se usa aquí)
    t: (key: string) => string; // Propiedad de useTranslation
    currentPath: string;
    isDarkMode: boolean;
    page?: number;
    limit?: number;
}

interface State {
    page: number;
    limit: number;
    pages: number;
    records: number;
    posts: Post[];
}

export class InnerPage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            page: props.page || 1,
            limit: props.limit || 9,
            pages: 0,
            records: 0,
            posts: [],
        }
    }

    componentDidMount = async () => {
        console.log("Posts for page: ", this.state.page);
        const response = await loadData<Post[]>(
            "posts/html",
            new Map([
                ["page", this.state.page],
                ["limit", this.state.limit],
            ]));
        if (response.status === 200 && response.data) {
            console.log("Post loaded:", response.data);
            this.setState({
                posts: {
                    ...response.data
                },
                page: response.pagination?.page || this.state.page,
                limit: response.pagination?.limit || this.state.limit,
                pages: response.pagination?.pages || this.state.pages,
                records: response.pagination?.records || this.state.records,
            }, this.render);
        }
    }

    // Asume que Post, Row, Col, Card, Text, FileTextOutlined y CARDS_PER_ROW están definidos/importados

    renderRows = () => {
        const posts: Post[] = Object.values(this.state.posts);
        const numRows = Math.ceil(posts.length / CARDS_PER_ROW);

        // 2. Crea un array ficticio del tamaño de 'numRows' e itera sobre él con map.
        return Array.from({ length: numRows }).map((_, rowIndex) => {
            // Calcula el índice de inicio de esta fila
            const startIndex = rowIndex * CARDS_PER_ROW;

            // Extrae los 3 posts para esta fila usando slice
            const rowCards = posts.slice(startIndex, startIndex + CARDS_PER_ROW);

            // Cada fila es un componente <Row>
            return (
                <Row key={`row-${startIndex}`} gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    {rowCards.map((post) => (
                        // Cada tarjeta es un componente <Col> que ocupa 8 de 24 unidades
                        // Col span={8} => 24 / 3 = 8. (3 tarjetas por fila)
                        <Col
                            key={post.id}
                            // En XS y SM (móviles/tabletas pequeñas), ocupa 24 (ancho total)
                            xs={24}
                            sm={24}
                            // A partir de MD (tabletas grandes/desktops) o superior, ocupa 8 (1/3 del ancho)
                            md={24 / CARDS_PER_ROW} // md={8}
                            lg={24 / CARDS_PER_ROW} // lg={8}
                            xl={24 / CARDS_PER_ROW} // xl={8}
                            style={{ display: 'flex' }}
                        >
                            <Card
                                title={<Text ellipsis>{post.title}</Text>}
                                extra={<FileTextOutlined style={{ fontSize: '18px' }} />}
                                style={{ width: '100%', cursor: 'pointer' }}
                                hoverable
                                onClick={() => this.props.navigate(`/${post.slug || ""}`)}
                            // Opcional: onClick={() => handleDocumentClick(doc.id)}
                            >
                                <p>
                                    {post.html_meta
                                        ? Parser(
                                            post.html_meta.length > 150
                                                ? post.html_meta.substring(0, 150) + '...'
                                                : post.html_meta
                                        )
                                        : ""
                                    }
                                </p>
                            </Card>
                        </Col>
                    ))}
                    {/* Opcional: Añadir columnas vacías si la última fila está incompleta */}
                    {rowCards.length < CARDS_PER_ROW && [...Array(CARDS_PER_ROW - rowCards.length)].map((_, index) => (
                        <Col key={`empty-${startIndex + index}`} span={24 / CARDS_PER_ROW} />
                    ))}
                </Row>
            );
        });
    };

    setCurrentPage = (page: number) => {
        // this.setState({ page: page });
        console.log("Navigating to page:", page, "Base path:", this.props.currentPath);
        this.props.navigate(`${this.props.currentPath}?page=${page}`);
        this.setState({ page: page }, this.componentDidMount);

    }

    render = () => {
        const { t } = this.props;
        const { page, limit, records, posts } = this.state;
        console.log("Rendering posts", posts)
        if (posts.length === 0) {
            return <Empty description={t("No posts available")} />;
        }
        return (
            <Flex
                vertical
                justify="center"
                align="center"
                gap="middle"
            >
                <Flex key="posts-list" vertical gap="large" style={{ width: '100%' }}>
                    {this.renderRows()}
                </Flex>
                <Flex
                    key="pagination"
                    align="center"
                    justify="center"
                    style={{
                        marginTop: 16,
                        lineHeight: '32px',
                    }}
                >
                    <Pagination
                        current={page}
                        pageSize={limit}
                        total={records}
                        onChange={(page) => this.setCurrentPage(page)}
                        showSizeChanger={false} // Para mantener fijo el tamaño de 12 por página
                        showTotal={(total, range) => t(`Mostrando ${range[0]}-${range[1]} de ${total} documentos`)}
                    />
                </Flex>
            </Flex>
        );
    }
}


export default function PublicPostsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const pathname = useLocation().pathname;
    const searchParams = new URLSearchParams(location.search);
    const pageSegment = searchParams.get('page');
    const initialPage = parseInt(pageSegment || '1') || 1; 
    console.log("Path", pathname, "Initial Page:", initialPage);
    return <ModeContext.Consumer>
        {({ isDarkMode }) => {
            return (
                <InnerPage
                    navigate={navigate}
                    t={t}
                    isDarkMode={isDarkMode}
                    page={initialPage}
                    limit={9}
                    currentPath={pathname}
                />
            );
        }}
    </ModeContext.Consumer>
}
