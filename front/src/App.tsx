import React, { lazy, Suspense } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { ConfigProvider, theme } from "antd";
import '@ant-design/v5-patch-for-react-19';

import { AuthContextProvider } from "@/components/auth_context";
import ModeContext, { ModeContextProvider } from "@/components/mode_context";

const PublicLayout = lazy(() => import('@/layouts/public_layout'));
const AdminLayout = lazy(() => import('@/layouts/admin_layout'));
const HomePage = lazy(() => import('@/pages/public/home_page'));
const LoginPage = lazy(() => import('@/pages/public/login_page'));
const LogoutPage = lazy(() => import('@/pages/admin/logout_page'));
const DashboardPage = lazy(() => import('@/pages/admin/dashboard_page'));
const RulesPage = lazy(() => import('@/pages/admin/rules_page'));
const RequestsPage = lazy(() => import('@/pages/admin/requests_page'));
const ChartsPage = lazy(() => import('@/pages/admin/charts_page'));
const UsersPage = lazy(() => import('@/pages/admin/users_page'));
const PostsPage = lazy(() => import('@/pages/admin/posts_page'));
const PostPage = lazy(() => import('@/pages/admin/post_page'));
const TagsPage = lazy(() => import('@/pages/admin/tags_page'));

import '@/App.css'

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
export default class App extends React.Component {
    render = () => {
        return (
            <AuthContextProvider>
                <ModeContextProvider>
                    <ModeContext.Consumer>
                        {({ isDarkMode }) => {
                            console.log(`Rendering App with isDarkMode ${isDarkMode}`);
                            const algorithm = isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm;
                            const customTheme = {
                                algorithm: algorithm,
                                token: {
                                    colorPrimary: "#fa541c",
                                    colorInfo: "#fa541c",
                                    fontSize: 16
                                }
                            };
                            return (
                                <ConfigProvider theme={customTheme}>
                                    <BrowserRouter>
                                        <Suspense fallback={<div>Loading...</div>}>
                                            <Routes>
                                                <Route path="/" element={<PublicLayout />} >
                                                    <Route index element={<HomePage />} />
                                                    <Route path="login" element={<LoginPage />} />
                                                </Route>
                                                <Route path="/admin" element={<AdminLayout />} >
                                                    <Route index element={<DashboardPage />} />
                                                    <Route path="logout" element={<LogoutPage />} />
                                                    <Route path="dashboard" element={<DashboardPage />} />
                                                    <Route path="rules" element={<RulesPage />} />
                                                    <Route path="requests" element={<RequestsPage />} />
                                                    <Route path="charts" element={<ChartsPage />} />
                                                    <Route path="users" element={<UsersPage />} />
                                                    <Route path="tags" element={<TagsPage />} />
                                                    <Route path="posts" >
                                                        <Route index element={<PostsPage />} />
                                                        <Route path=":slug" element={<PostPage />} />
                                                    </Route>
                                                </Route>
                                            </Routes>
                                        </Suspense>
                                    </BrowserRouter>
                                </ConfigProvider>
                            );
                        }}
                    </ModeContext.Consumer>
                </ModeContextProvider>
            </AuthContextProvider>
        );
    }
}

