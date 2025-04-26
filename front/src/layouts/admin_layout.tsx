import react from 'react';
import { Navigate, Outlet } from 'react-router';
import Container from '@mui/material/Container';
import AuthContext from '../components/auth_context';
import NavBarAdmin from '../components/nav_bar_admin';
import Sidebar from '../components/sidebar';

export default class AdminLayout extends react.Component {
    static authContext = AuthContext;
    declare context: React.ContextType<typeof AuthContext>;

    comoponentDidMount = () => {
        console.log("ProtectedLayout.componentDidMount");
        const token = this.context;
        console.log(`token: ${JSON.stringify(token)}`);
    }

    render = () => {
        console.log("ProtectedLayout");
        console.log(`token: ${JSON.stringify(this.context)}`);
        if (!this.context.isLoggedIn) {
            return <Navigate to="/login" />;
        }
        return (
            <>
                <header>
                    <NavBarAdmin />
                    <Sidebar />
                </header>
                <main>
                    <Container>
                        <Outlet />
                    </Container>
                </main>
                <footer>
                </footer>
            </>
        );
    }
}
AdminLayout.contextType = AuthContext;


