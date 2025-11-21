import React from 'react';
import { Navigate } from "react-router";
import { Flex } from 'antd';

import AuthContext from '@/components/auth_context';
import { BASE_URL } from '@/constants';
import { jwtDecode } from 'jwt-decode';
import Logo from "@/assets/logo.svg";
import SignIn from "@/components/signin";
import Register from "@/components/register";


interface State {
    email: string
    password: string
    responseMessage: string;
    redirect: boolean;
    redirectToAdmin: boolean;
    usersExist: boolean;
    redirectToLogin: boolean;
}
interface UserData {
    email: string;
    password: string;
}

export default class LoginPage extends React.Component<{}, State> {

    static contextType = AuthContext;
    declare context: React.ContextType<typeof AuthContext>;

    constructor(props: {}) {
        console.log("Constructing login page");
        super(props);
        this.state = {
            email: "",
            password: "",
            responseMessage: "",
            redirect: false,
            redirectToAdmin: false,
            usersExist: false,
            redirectToLogin: false,
        };
    }

    handleSubmit = (userData: UserData) => {
        console.log("Submitting user data:", userData);
        this.setState({ email: userData.email, password: userData.password });
        this.login(userData.email, userData.password);
    };

    handleRegisterSubmit = (userData: UserData) => {
        console.log("Submitting user data:", userData);
        this.setState({ email: userData.email, password: userData.password });
        this.register(userData.email, userData.password);
    };

    setToken = (token: string) => {
        localStorage.setItem('token', token);
    }

    getToken = () => {
        return localStorage.getItem('token');
    }

    existsUsers = async () => {
        console.log("Checking if users exist");
        try {
            console.log("Chaecking users at:", `${BASE_URL}/api/v1/users/any`);
            const response = await fetch(`${BASE_URL}/api/v1/users/any`, {
                method: 'GET',
                });
            const responseJson = await response.json();
            if (response.ok){
                console.log("Users exist:", responseJson);
                this.setState({usersExist: responseJson.data.any_user_exists});
            }
        }catch (error) {
            console.error('Error:', error);
        }
    }

    componentDidMount = async () => {
        console.log("Mounting login page");
        await this.existsUsers();
    }

    register = async (email: string, password: string) => {
        console.log("Registering user");
        try {
            console.log(`${BASE_URL}/api/v1/auth/register`);
            const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email.split('@')[0],
                    email: email,
                    password: password,
                    role: "admin",
                }),
            });
            const responseJson = await response.json();
            console.log("Response JSON:", responseJson);
        }catch (error) {
            console.error('Error:', error);
        }

    }


    login = async (email: string, password: string) => {
        console.log("Logging in user");
        try {
            console.log(`${BASE_URL}/api/v1/auth/login`);
            const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });
            const responseJson = await response.json();
            if (response.ok) {
                this.setToken(responseJson.data.token);
                //const expirationTime = new Date(new Date().getTime() + 3600 * 1000);
                const value = this.context;
                console.log("================");
                console.log(`Value1: ${value}`);
                console.log("----------------");
                const decoded = jwtDecode(responseJson.data.token);
                console.log("Decoded:", JSON.stringify(decoded));
                console.log("----------------");
                this.context.login(responseJson.data.token);
                console.log("================");
                //LoginPage.authContext.login(responseJson.data.token);
                this.setState({
                    responseMessage: responseJson.message,
                    redirect: true,
                    redirectToAdmin: decoded.role === "admin",
                });
            } else {
                console.error('Login failed:', responseJson);
                this.setState({
                    responseMessage: responseJson.message,
                });
            }
        } catch (error) {
            console.error('Error:', error);
            this.setState({
                responseMessage: "Error logging in user",
            });
        }
    }


    render = () => {
        console.log("Rendering login page");
        console.log(`Users exist: ${this.state.usersExist}`);
        if(this.state.usersExist === false) {
            return (
                <Flex justify="center" align="center">
                    <Flex gap="middle" align="center" vertical>
                        <img src={Logo} alt="Logo" style={{ width: 200, marginBottom: 20 }} />
                        <Register
                            onSubmit={this.handleRegisterSubmit}
                            responseMessage={this.state.responseMessage}
                        />
                    </Flex>
                </Flex>
            );
        }
        if (this.context.isLoggedIn) {
            console.log(`Role: ${this.context.role}`);
            if (this.context.role === "admin") {
                return (
                    <Navigate to="/admin/" />
                );
            }
            return (
                <Navigate to="/" />
            );
        } else {
            return (
                <Flex justify="center" align="center">
                    <Flex gap="middle" align="center" vertical>
                        <img src={Logo} alt="Logo" style={{ width: 200, marginBottom: 20 }} />
                        <SignIn
                            onSubmit={this.handleSubmit}
                            responseMessage={this.state.responseMessage}
                        />
                    </Flex>
                </Flex>
            );
        }
    }
}

