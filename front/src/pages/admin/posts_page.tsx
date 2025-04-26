import React from "react";
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MdAdd } from "react-icons/md";
import CustomTable from "../../components/custom_table";
import { loadData } from '../../common/utils';
import { Topic } from '../../common/types';
import { STATUS } from "../../common/constants";

const ENDPOINT = 'posts';

interface Props {
    t: any
    navigate:any
}
interface State {
    columns: any[]
    isLoading: boolean
}

export class InnerPostsPage extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        console.log("Constructing page");
        this.state = {
            columns: [],
            isLoading: true,
        }
    }

    loadTopics = async () => {
        console.debug("Loading auxiliary data");
        let responseJson = await loadData('topics');
        if (responseJson.status === 200) {
            const values = responseJson.data;
            const topics = values
                .map((c: Topic) => {
                    return { value: c.id, label: c.name };
                });
            return topics;
        }
        return [];
    }

    componentDidMount = async () => {
        console.log("Mounting page");
        const topics = await this.loadTopics();
        const status = STATUS.map((s) => {
            return { value: s, label: s };
        });
        console.log("Topics loaded", topics);
        this.setState({
            isLoading: false,
            columns: [
                { field: 'id', headerName: 'Id', type: 'number', width: 60, editable: false },
                {
                    field: 'topic_id',
                    headerName: 'Topic',
                    width: 250,
                    type: 'singleSelect',
                    valueOptions: topics,
                    editable: true,
                    valueGetter: (value: any) => value ? value : topics[0].value
                },
                {
                    field: 'status',
                    headerName: 'Status',
                    width: 120,
                    type: 'singleSelect',
                    valueOptions: status,
                    editable: true,
                    valueGetter: (value: any) => value ? value : topics[0].value
                },
                { field: 'title', headerName: 'Title', type: 'string', width: 350 },
            ],
        });
    }

    render = () => {
        console.log("Rendering page");
        if (this.state.isLoading) {
            return (
                <Paper sx={{
                    marginLeft: "300px",
                    width: '80vw',
                    height: '60vh',
                    p: 2
                }}>
                    <Typography variant="h4">Posts</Typography>
                </Paper>
            );
        }
        return (
            <>
                <Box style={{ height: 100 }} />
                <Paper sx={{
                    marginLeft: "300px",
                    width: '80vw',
                    height: '60vh',
                    p: 2
                }}>
                    <Stack direction="row">
                        <Typography variant="h4" sx={{ marginRight: "10px" }}>Posts</Typography>
                        <Tooltip title="Create new post">
                            <IconButton onClick={() => this.props.navigate('/admin/post')}>
                                <MdAdd size="1.3em" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <CustomTable
                        endPoint={ENDPOINT}
                        columns={this.state.columns}
                        sortBy="id"
                        newRow={{
                            id: -1,
                            title: '',
                            status: 'draft',
                        }}
                    />
                </Paper>
            </>
        );
    }
}

export default function PostsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    return <InnerPostsPage navigate={navigate} t={t} />;
}
