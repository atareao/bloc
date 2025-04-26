import React from "react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CustomTable from "../../components/custom_table";

const ENDPOINT = 'posts';
const COLUMNS = [
    { field: 'name', headerName: 'Name', type: 'string', width: 350, editable: true },
]

export default class PostsPage extends React.Component {

    constructor(props: {}) {
        super(props);
        console.log("Constructing page");
    }

    render = () => {
        return (
            <>
                <Box style={{ height: 100 }} />
                <Paper sx={{ width: '80vw', p: 2 }}>
                    <h1>Posts</h1>
                    <CustomTable
                        endPoint={ENDPOINT}
                        columns={COLUMNS}
                        newRow={{
                            id: -1,
                            name: "",
                        }}
                    />
                </Paper>
            </>
        );
    }
}

