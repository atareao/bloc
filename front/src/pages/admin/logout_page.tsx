import React from 'react';
import { Navigate } from 'react-router';

import AuthContext from '@/components/auth_context';

export default class LogoutPage extends React.Component {

    render = () => {
        return (
            <AuthContext.Consumer>
                {({ logout }) => {
                    logout();
                    return <Navigate to="/" />
                }}
            </AuthContext.Consumer>
        );
    }
}



