import react from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex, Typography } from 'antd';
import Logo from "@/assets/logo.svg";


interface Props {
    navigate: any
    t: any
}


export class HomeInnerPage extends react.Component<Props> {
    constructor(props: Props) {
        super(props);
        console.log("Constructing page");
    }

    render = () => {
        return (
            <Flex vertical justify="center" align="center" gap="middle" style={{ height: '100vh' }}>
                <Typography.Title level={1} style={{ margin: 0 }}>
                    Shuul
                </Typography.Title>
                <Typography.Title level={2} style={{ margin: 0 }}>
                    The gatekeeper of your data
                </Typography.Title>
                <Flex gap="middle" align="center" vertical>
                    <img src={Logo} alt="Logo" style={{ width: 200, marginBottom: 20 }} />
                </Flex>
            </Flex>

        );
    }
};




export default function HomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return <HomeInnerPage navigate={navigate} t={t} />;
}

