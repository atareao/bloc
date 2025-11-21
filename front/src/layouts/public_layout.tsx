import react from 'react';
import { Outlet } from 'react-router';
import { Button, Layout, theme } from 'antd';
import { useNavigate } from 'react-router';
import { LoginOutlined } from '@ant-design/icons';

import ModeSwitcher from '@/components/mode_switcher';

const { Header, Footer, Content } = Layout;

interface Props {
    token: any;
    navigate: any;
}


class InnerPublicLayout extends react.Component<Props> {

    render = () => {
        return (
            <Layout style={{
                minHeight: '100vh',
                backgroundColor: this.props.token.coloBgLayout,
                color: this.props.token.colorText,
            }}>
                <Header
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: 64,
                        paddingInline: 48,
                    }}
                >
                    <Button
                        variant="solid"
                        onClick={() => this.props.navigate('/login')}
                    >
                        <LoginOutlined />
                    </Button>
                    <ModeSwitcher />
                </Header>
                <Content style={{ padding: '24px', flex: 1 }}>
                    <Outlet />
                </Content>

                <Footer style={{ textAlign: 'center' }}>
                    ©{new Date().getFullYear()} atareao
                </Footer>
            </Layout>
        );
    }
}

export default function PublicLayout() {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    return <InnerPublicLayout navigate={navigate} token={token}/>;
}
