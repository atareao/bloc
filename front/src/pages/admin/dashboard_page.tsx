import react from "react";
import { useNavigate } from 'react-router';
import { useTranslation } from "react-i18next";
import { Flex, Typography, Avatar, Card } from 'antd';

import { loadData } from "@/common/utils";
import Logo from "@/assets/logo.svg";

const TITLE = "Bloc ()"

interface Props {
    navigate: any
    t: any
}

interface State {
    loading: boolean;
    total_rules: number,
    total_active_rules: number,
    total_requests: number,
    total_filtered_requests: number,
}


export class InnerPage extends react.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            loading: true,
            total_rules: 0,
            total_active_rules: 0,
            total_requests: 0,
            total_filtered_requests: 0,
        }
    }
    componentDidMount = async () => {

        const total_rules = await loadData("rules/info", new Map([["option", "total"]]))
        const total_active_rules = await loadData("rules/info", new Map([["option", "active"]]))
        const total_requests = await loadData("requests/info", new Map([["option", "total"]]))
        const total_filtered_requests = await loadData("requests/info", new Map([["option", "filtered"]]))
        console.log("Totals loaded:", total_rules, total_active_rules, total_requests, total_filtered_requests);
        this.setState({
            loading: false,
            total_rules: total_rules.status === 200 ? total_rules.data as number : 0,
            total_active_rules: total_active_rules.status === 200 ? total_active_rules.data as number : 0,
            total_requests: total_requests.status === 200 ? total_requests.data as number : 0,
            total_filtered_requests: total_filtered_requests.status === 200 ? total_filtered_requests.data as number : 0,
        });

    }

    render = () => {
        return (
            <Flex vertical justify="center" align="center" gap="middle" style={{ height: '100vh' }}>
                <Card loading={this.state.loading} style={{ minWidth: 600 }}>
                    <Card.Meta
                        avatar={<Avatar src={Logo} />}
                        title={<Typography.Title level={3} style={{ margin: 0 }}>{TITLE}</Typography.Title>}
                        description={
                            <>
                                <Typography.Title
                                    level={4}
                                    style={{ margin: 5, cursor: "pointer" }}
                                    onClick={() => this.props.navigate("/admin/rules")}
                                >
                                    {`${this.props.t("Total of rules")}: ${this.state.total_rules}`}
                                </Typography.Title>
                                <Typography.Title
                                    level={4}
                                    style={{ margin: 5, cursor: "pointer" }}
                                    onClick={() => this.props.navigate("/admin/rules")}
                                >
                                    {`${this.props.t("Total of active rules")}: ${this.state.total_active_rules}`}
                                </Typography.Title>
                                <Typography.Title
                                    level={4}
                                    style={{ margin: 5, cursor: "pointer" }}
                                    onClick={() => this.props.navigate("/admin/records")}
                                >
                                    {`${this.props.t("Total of requests")}: ${this.state.total_requests}`}
                                </Typography.Title>
                                <Typography.Title
                                    level={4}
                                    style={{ margin: 5, cursor: "pointer" }}
                                    onClick={() => this.props.navigate("/admin/records")}
                                >
                                    {`${this.props.t("Total of filtered requests")}: ${this.state.total_filtered_requests}`}
                                </Typography.Title>
                            </>
                        }
                    />
                </Card>
            </Flex >

        );
    }
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return <InnerPage navigate={navigate} t={t} />;
}
