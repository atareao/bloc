import React from 'react';
import { useTranslation } from "react-i18next";
import { Card, Input, Button } from 'antd';

interface Props {
    t: Function;
    onSubmit: Function;
    responseMessage: string;
}

interface State {
    email: string;
    password: string;
}

class InnerSignIn extends React.Component<Props, State> {

    constructor(props: Props) {
        console.log("Constructing sign in form");
        super(props);
        this.reset();
    }

    reset = () => {
        this.state = {
            email: "",
            password: ""
        };
    }

    handleEmailChange = (e: any) => {
        console.log("Email changed");
        this.setState({ email: e.target.value });
    }

    handlePasswordChange = (e: any) => {
        console.log("Password changed");
        this.setState({ password: e.target.value });
    }

    handleSubmit = (e: any) => {
        e.preventDefault();
        console.log("Submitting sign in form");
        const userData = {
            email: this.state.email,
            password: this.state.password,
        };
        console.log(`Submitting user data: ${JSON.stringify(userData)}`);
        this.props.onSubmit(userData); // Pass user data to onSubmit function
    }
    render = () => {
        console.log("Rendering sign in form");
        const { t } = this.props;
        return (
            <Card title="Login" style={{ width: 300 }}>
                <Input
                    id="email"
                    type="email"
                    required
                    placeholder={t('Email')}
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                />
                <br />
                <br />
                <Input
                    id="password"
                    type="password"
                    required
                    placeholder={t('Password')}
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                />
                <br />
                <br />
                <Button
                    onClick={this.handleSubmit}
                >
                    {t('Sign in')}
                </Button>
            </Card>
        );
    }
}

interface SignInProps {
    onSubmit: Function;
    responseMessage: string;
}

export default function SignIn(props: SignInProps) {
    const { t } = useTranslation();
    return <InnerSignIn
        t={t}
        onSubmit={props.onSubmit}
        responseMessage={props.responseMessage}
    />;
}

