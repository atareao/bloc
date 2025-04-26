import React from "react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CustomTable from "../../components/custom_table";
import { loadData } from '../../common/utils';
import { Topic } from '../../common/types';
import { STATUS } from "../../common/constants";

const ENDPOINT = 'posts';

interface State {
    columns: any[]
    isLoading: boolean
}

export default class PostsPage extends React.Component<{}, State> {

    constructor(props: {}) {
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
                    width: 150,
                    type: 'singleSelect',
                    valueOptions: topics,
                    editable: true,
                    valueGetter: (value: any) => value ? value : topics[0].value
                },
                { field: 'title', headerName: 'title', type: 'string', width: 350, editable: true },
                {
                    field: 'status',
                    headerName: 'Status',
                    width: 150,
                    type: 'singleSelect',
                    valueOptions: status,
                    editable: true,
                    valueGetter: (value: any) => value ? value : topics[0].value
                },
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
                    <h1>Loading...</h1>
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
                    <h1>Posts</h1>
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

