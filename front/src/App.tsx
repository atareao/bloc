import react from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import PublicLayout from "./layouts/public_layout";
import AuthLayout from "./layouts/auth_layout";
import AdminLayout from "./layouts/admin_layout";
import LoginPage from "./pages/public/login_page";
import HomePage from "./pages/public/home_page";
import LogoutPage from "./pages/admin/logout_page";
import EditorPage from "./pages/admin/editor_page";
import PostsPage from "./pages/admin/posts_page";

import { AuthContextProvider } from "./components/auth_context";
import "./App.css";
import ModeContext, { ModeContextProvider } from "./components/mode_context";

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        load: 'languageOnly',
        lng: localStorage.getItem("i18nextLng") || "es",
        fallbackLng: "en",
        debug: true,
        interpolation: {
            escapeValue: false,
        }
    });
const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

export default class App extends react.Component {
    static contextType = ModeContext;
    declare context: React.ContextType<typeof ModeContext>;
    state = {
        darkMode: true,
    }

    render = () => {
        return (
            <AuthContextProvider>
                <ModeContextProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<PublicLayout />} >
                                    <Route index element={<HomePage />} />
                                </Route>
                                <Route path="/admin" element={<AdminLayout />} >
                                    <Route path="logout" element={<LogoutPage />} />
                                    <Route path="editor" element={<EditorPage />} />
                                    <Route path="posts" element={<PostsPage />} />
                                </Route>
                                <Route path="/" element={<AuthLayout />} >
                                    <Route path="login" element={<LoginPage />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </ThemeProvider>
                </ModeContextProvider>
            </AuthContextProvider>
        );
    }
}

