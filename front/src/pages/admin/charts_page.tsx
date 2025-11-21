import react from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex, Typography } from 'antd';
const { Text } = Typography;

interface Props {
    navigate: any
    t: any
}

export class InnerPage extends react.Component<Props> {

    render = () => {
        return (
            <Flex justify="center" align="center" >
                <Text>Charts</Text>
            </Flex>

        );
    }
};

export default function ChartsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return <InnerPage navigate={navigate} t={t} />;
}

