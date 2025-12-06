import react from 'react';
import { useNavigate, Navigate, Outlet } from 'react-router';
import { Button, Layout, Menu, theme, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
    HomeOutlined,
    LogoutOutlined,
    UserOutlined,
} from '@ant-design/icons';

import ModeSwitcher from '@/components/mode_switcher';
import AuthContext from '@/components/auth_context';
import AdminHeaderContext from '@/components/admin_header_context';
import { VERSION } from '@/constants';

const ROLE = "admin";
const TITLE = `Bloc (${VERSION})`
const { Header, Content, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

export type CustomMenuItem = MenuItem & {
    navigateTo?: string; // Propiedad añadida para la navegación
    children?: CustomMenuItem[]; // Aseguramos que los hijos también sean CustomMenuItem
};

const MENU_ITEMS: CustomMenuItem[] = [
    {
        key: 'sub1',
        label: 'Dashboard',
        icon: <HomeOutlined />,
        navigateTo: '/admin/dashboard',
    },
    {
        key: 'sub2',
        label: 'Templates',
        icon: <HomeOutlined />,
        children: [
            {
                key: 'sub2-1',
                label: 'Blog',
                icon: <HomeOutlined />,
                navigateTo: '/admin/templates/blog',
            },
            {
                key: 'sub2-2',
                label: 'Post',
                icon: <HomeOutlined />,
                navigateTo: '/admin/templates/post',
            },
            {
                key: 'sub2-3',
                label: 'About',
                icon: <HomeOutlined />,
                navigateTo: '/admin/templates/about',
            }
        ]
    },
    {
        key: 'sub3',
        label: 'Posts',
        icon: <HomeOutlined />,
        children: [
            {
                key: 'sub3-1',
                label: 'Posts',
                icon: <HomeOutlined />,
                navigateTo: '/admin/posts',
            },
            {
                key: 'sub3-2',
                label: 'Tags',
                icon: <HomeOutlined />,
                navigateTo: '/admin/tags',
            }
        ]
    },
    {
        key: 'sub4',
        label: 'Configuration',
        icon: <HomeOutlined />,
        children: [
            {
                key: 'sub4-1',
                label: 'Users',
                icon: <UserOutlined />,
                navigateTo: '/admin/users',
            },
            {
                key: 'sub4-2',
                label: 'Tags',
                icon: <HomeOutlined />,
                navigateTo: '/admin/tags',
            }
        ]
    },


];

interface Props {
    token: any;
    navigate: any;
    currentPath: string; // <--- NUEVA PROP: La ruta actual
}
interface State {
    collapsed: boolean;
    headerButtons: React.ReactNode[];
    openKeys: string[];
    selectedKeys: string[];
}

class InnerAdminLayout extends react.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        const { selectedKeys, openKeys } = this.getMenuKeys(props.currentPath);
        this.state = {
            collapsed: false,
            headerButtons: [],
            selectedKeys: selectedKeys,
            openKeys: openKeys,
        }
    }
    setHeaderButtons = (buttons: React.ReactNode[]) => {
        this.setState({ headerButtons: buttons });
    }
    setCollapsed = (collapsed: boolean) => {
        this.setState({ collapsed });
    }

    findMenuItemByKey = (
        menuItems: CustomMenuItem[],
        key: string
    ): CustomMenuItem | null => {
        for (const item of menuItems) {
            for (const child of item.children || []) {
                if (child.key === key) {
                    return child;
                }
            }
        }
        return null;
    }

    getMenuKeys = (path: string) => {
        const currentPath = path.split('?')[0];

        let bestMatch = {
            selectedKey: null as string | null,
            openKeys: [] as string[],
            matchLength: 0
        };

        // CORRECCIÓN CLAVE: Acceder a la constante 'items' directamente, 
        // asumiendo que está definida en el mismo archivo (scope global).
        const menuItems = MENU_ITEMS as CustomMenuItem[]; // <-- ¡Cambiado de (this.props as any).items!

        // Función recursiva para buscar
        const findMatch = (menuItems: CustomMenuItem[], parentKeys: string[] = []) => {
            // El error desaparece porque menuItems ahora está definido
            for (const item of menuItems) {
                if (item.navigateTo) {
                    if (currentPath.startsWith(item.navigateTo)) {
                        const currentMatchLength = item.navigateTo.length;

                        if (currentMatchLength > bestMatch.matchLength) {
                            bestMatch = {
                                selectedKey: item.key as string,
                                openKeys: parentKeys,
                                matchLength: currentMatchLength,
                            };
                        }
                    }
                }

                if (item.children) {
                    const nestedParentKeys = [...parentKeys, item.key as string];
                    // Asegúrate de castear item.children si TypeScript lo requiere
                    findMatch(item.children as CustomMenuItem[], nestedParentKeys);
                }
            }
        };

        findMatch(menuItems); // Ahora findMatch se llama con el array correcto.

        return {
            selectedKeys: bestMatch.selectedKey ? [bestMatch.selectedKey] : [],
            openKeys: bestMatch.openKeys,
        };
    }

    render = () => {
        console.log("AdminLayout");
        console.log(window.location.pathname);
        return (
            <AdminHeaderContext.Provider value={{ headerButtons: this.state.headerButtons, setHeaderButtons: this.setHeaderButtons }}>
                <Layout style={{ minHeight: '100vh' }}>
                    <Sider collapsible collapsed={this.state.collapsed} onCollapse={(value) => this.setCollapsed(value)}>
                        <div className="demo-logo-vertical" />
                        <Menu
                            theme="dark"
                            defaultSelectedKeys={['1']}
                            selectedKeys={this.state.selectedKeys}
                            mode="inline"
                            items={MENU_ITEMS}
                            onClick={({ key }) => {
                                // Al hacer clic, navega y actualiza el estado local de selección
                                console.log("Selected key: ", key);
                                const selectedItem = this.findMenuItemByKey(MENU_ITEMS, key);
                                console.log("Selected Item: ", selectedItem);
                                this.setState({ selectedKeys: [key] });
                                if (selectedItem && selectedItem.navigateTo) {
                                    this.props.navigate(selectedItem.navigateTo); // Asumiendo que key es la ruta de navegación
                                }
                            }}
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
                        <Content>
                            <div
                                style={{
                                    padding: 0,
                                    minHeight: 360,
                                }}
                            >
                                <Outlet />
                            </div>
                        </Content>
                        <Footer style={{ textAlign: 'center' }}>
                            ©{new Date().getFullYear()} {TITLE}
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
                    <InnerAdminLayout
                        navigate={navigate}
                        token={token}
                        currentPath={location.pathname}
                    />
                );
            }}
        </AuthContext.Consumer>
    );
}
