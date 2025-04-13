import react from 'react';
import { Outlet } from 'react-router';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import background from '../assets/background.jpg';


export default class AuthLayout extends react.Component {
    render = () => {
        return (
            <Box
                sx={{
                    backgroundImage: `url(${background})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    height: "100vh",
                    width: "100vw",
                }}>
                <Box
                    sx={{
                        backgroundColor: "#065ea655",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        height: "100vh",
                        width: "100vw",
                    }}>
                    <header>
                    </header>
                    <main>
                        <Container>
                            <Outlet />
                        </Container>
                    </main>
                    <footer>
                    </footer>
                </Box>
            </Box>
        );
    }
}

