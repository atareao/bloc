import react from 'react';
import { useNavigate, Navigate, Outlet } from 'react-router';
import { Button, Layout, Menu, theme, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
    HomeOutlined,
    OrderedListOutlined,
    MenuUnfoldOutlined,
    PieChartOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';

import ModeSwitcher from '@/components/mode_switcher';
import AuthContext from '@/components/auth_context';
import AdminHeaderContext from '@/components/admin_header_context';

const ROLE = "admin";
const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    navigateTo?: string,
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        navigateTo,
    } as MenuItem;
}

const navigations: { [key: string]: string } = {
    1: "/admin/dashboard",
    2: "/admin/topics",
    3: "/admin/requests",
    4: "/admin/charts",
    5: "/admin/users",
    6: "/admin/posts",
    7: "/admin/post",
    8: "/admin/tags",
}

const items: MenuItem[] = [
    getItem('Dashboard', '1', <HomeOutlined />),
    getItem('Topics', '2', <OrderedListOutlined />),
    getItem('Requests', '3', <MenuUnfoldOutlined />),
    getItem('Charts', '4', <PieChartOutlined />),
    getItem('Users', '5', <UserOutlined />),
    getItem('Posts', '6', <UserOutlined />),
    getItem('Post', '7', <UserOutlined />),
    getItem('Tags', '8', <UserOutlined />),
];


interface Props {
    token: any;
    navigate: any;
}
interface State {
    collapsed: boolean;
    headerButtons: React.ReactNode[];
}

class InnerAdminLayout extends react.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            collapsed: false,
            headerButtons: [],
        }
    }
    setHeaderButtons = (buttons: React.ReactNode[]) => {
        this.setState({ headerButtons: buttons });
    }
    setCollapsed = (collapsed: boolean) => {
        this.setState({ collapsed });
    }

    handleMenuClick = (e: any) => {
        console.log(e)
        this.props.navigate(navigations[e.key]);
    }

    render = () => {
        console.log("AdminLayout");
        console.log(window.location.pathname);
        const selectedKey = Object.keys(navigations).find(key => navigations[key] === window.location.pathname) || '1';
        return (
            <AdminHeaderContext.Provider value={{ headerButtons: this.state.headerButtons, setHeaderButtons: this.setHeaderButtons }}>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider collapsible collapsed={this.state.collapsed} onCollapse={(value) => this.setCollapsed(value)}>
                        <div className="demo-logo-vertical" />
                        <Menu
                            theme="dark"
                            defaultSelectedKeys={['1']}
                            selectedKeys={[selectedKey]}
                            mode="inline"
                            items={items}
                            onClick={(e) => { this.handleMenuClick(e) }}
                        />
                    </Sider>
                    <Layout>
                        <Header
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                height: 64,
                                paddingInline: 48,
                            }}
                        >
                                                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                                                                    <Space>
                                                                        {this.state.headerButtons}
                                                                    </Space>
                                                                </div>                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Button
                                    variant="solid"
                                    onClick={() => this.props.navigate('/admin/logout')}
                                >
                                    <LogoutOutlined />
                                </Button>
                                <ModeSwitcher />
                            </div>                        </Header>
                        <Content style={{
                            margin: '0 auto'
                        }}>
                            <div
                                style={{
                                    padding: 24,
                                    minHeight: 360,
                                }}
                            >
                                <Outlet />
                            </div>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>
                            ©{new Date().getFullYear()} Bloc
                        </Footer>
                    </Layout>
                </Layout>
            </AdminHeaderContext.Provider>
        );
    }
}


export default function AdminLayout() {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    return (
        <AuthContext.Consumer>
            {({ isLoggedIn, role }) => {
                if (isLoggedIn === false || role !== ROLE) {
                    return <Navigate to="/login" />;
                }
                return (
                    <InnerAdminLayout navigate={navigate} token={token} />
                );
            }}
        </AuthContext.Consumer>
    );
}
