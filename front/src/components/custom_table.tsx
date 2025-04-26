import * as React from "react";
import { MdAdd, MdDelete, MdCancel, MdEdit } from "react-icons/md";
import {
    MuiEvent,
    GridRowsProp,
    GridRowModesModel,
    DataGrid,
    GridColDef,
    GridRowId,
    GridRowModes,
    GridRowModel,
    GridPaginationModel,
    Toolbar,
    ToolbarButton,
    GridRowEditStopReasons,
    GridCellEditStopParams,
    GridActionsCellItem,
    GridCellEditStopReasons,
} from '@mui/x-data-grid';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertProps } from '@mui/material/Alert';
import { loadData } from '../common/utils';
import { BASE_URL } from '../constants';

interface Props {
    newRow: any
    endPoint: string
    columns: any[]
    sortBy?: string
}

interface State {
    rows: GridRowModel[]
    rowModesModel: GridRowModesModel
    pagination: GridPaginationModel
    isLoading: boolean
    snackbar: Pick<AlertProps, 'children' | 'severity'> | null
}

export default class CustomTable extends React.Component<Props, State> {
    columns: GridColDef<GridRowModel>[];
    columnGroupingModel: any[];

    constructor(props: Props) {
        super(props);
        console.log(`Constructing CustomTable:`, props);
        this.state = {
            rows: [],
            rowModesModel: {},
            pagination: { page: 0, pageSize: 10 },
            isLoading: true,
            snackbar: null,
        };
        this.columns = [];
        this.columnGroupingModel = [];
    }

    componentDidMount = async () => {
        console.log("Mounting page");
        await this.loadMainData();
        this.setState({ isLoading: false });
        this.columns = [
            {
                field: 'actions',
                type: 'actions',
                headerName: 'Actions',
                width: 100,
                cellClassName: 'actions',
                getActions: ({ id }) => {
                    const isInEditMode = this.state.rowModesModel[id]?.mode === GridRowModes.Edit;
                    if (isInEditMode) {
                        return [
                            <GridActionsCellItem
                                icon={<MdCancel />}
                                label="Cancel"
                                className="textPrimary"
                                onClick={() => this.handleCancelClick(id)}
                                color="inherit"
                            />,
                        ];
                    }
                    return [
                        <GridActionsCellItem
                            icon={<MdEdit />}
                            label="Edit"
                            className="textPrimary"
                            onClick={() => this.handleEditClick(id)}
                            color="inherit"
                        />,
                        <GridActionsCellItem
                            icon={<MdDelete />}
                            label="Delete"
                            onClick={() => this.handleDeleteClick(id)}
                            color="inherit"
                        />,
                    ];
                },
            },
            ...this.props.columns
        ];
    }

    render = () => {

        if (this.state.isLoading) {
            return (
                <div>Loading...</div>
            );
        }
        const sortBy = this.props.sortBy?this.props.sortBy:"name";
        return (
            <>
                <DataGrid
                    initialState={{
                        sorting: {
                            sortModel: [{ field: sortBy, sort: 'asc' }]
                        },
                    }}
                    paginationModel={this.state.pagination}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    onPaginationModelChange={(newPaginationModel) => this.setState({ pagination: newPaginationModel })}
                    rows={this.state.rows}
                    columns={this.columns}
                    columnGroupingModel={this.columnGroupingModel}
                    editMode="row"
                    rowModesModel={this.state.rowModesModel}
                    onRowModesModelChange={this.handleRowModesModelChange}
                    onRowEditStart={(params: any, event: any) => {
                        console.log("onRowEditStart");
                        console.log(params);
                        console.log(event);
                    }}
                    onRowEditStop={this.handleRowEditStop}
                    processRowUpdate={(updatedRow) => this.updateOnServer(updatedRow)}
                    onProcessRowUpdateError={this.handleProcessRowUpdateError}
                    onCellEditStop={(params: GridCellEditStopParams, event: MuiEvent) => {
                        console.log("onCellEditStop");
                        if (params.reason === GridCellEditStopReasons.cellFocusOut) {
                            console.log("preceding defaultMuiPrevented", event.defaultMuiPrevented);
                            event.defaultMuiPrevented = true;
                        }
                    }}
                    slots={{ toolbar: this.EditToolbar }}
                    slotProps={{
                        //toolbar: { setRows, this.setRowModesModel },
                    }}
                    showToolbar
                />
                {!!this.state.snackbar && (
                    <Snackbar
                        open
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        onClose={this.handleCloseSnackbar}
                        autoHideDuration={2000}
                    >
                        <Alert {...this.state.snackbar} onClose={this.handleCloseSnackbar} />
                    </Snackbar>
                )}
            </>
        );
    }

    loadMainData = async () => {
        console.log("Loading data");
        const responseJson = await loadData(this.props.endPoint);
        if (responseJson.status === 200) {
            console.log(`Data loaded: JSON: ${JSON.stringify(responseJson)}`);
            this.setState({
                rows: responseJson.data,
                pagination: { ...this.state.pagination, page: 0 },
            });
        }
    }

    EditToolbar = () => {
        const handleClick = () => {
            console.log("Adding new row");
            const id = -1;
            const row = {...this.props.newRow, isNew: true}
            //const row = { id, name: '', isNew: true };
            this.setState({
                //rows: [...this.state.rows.filter((row) => row.id !== id), row],
                rows: [...this.state.rows, row],
                rowModesModel: {
                    ...this.state.rowModesModel,
                    [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
                }
            });
        };

        return (
            <Toolbar>
                <ToolbarButton
                    color="primary"
                    onClick={handleClick}
                >
                    <MdAdd />
                </ToolbarButton>
            </Toolbar>
        );
    }

    handleSaveClick = async (id: GridRowId) => {
        console.log(`handleSaveClick: ${id}`);
        console.log(this.state.rows);
        console.log(this.state.rowModesModel[id].mode);
        if(this.state.rowModesModel[id].mode === "edit"){
            console.log("=== edit ===");
            this.setState({ rowModesModel: { ...this.state.rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } } });
            const editedRow = this.state.rows.find((row) => row.id === id);
            if (editedRow!.isNew) {
                this.setState({
                    rows: [...this.state.rows.filter((row) => row.id !== id)],
                });
            }
            console.log("=== edit ===");
            return;
        }
        const updatedRows = this.state.rows.filter((row) => row.id == id);
        console.log("Updated rows:", updatedRows);
        if(updatedRows.length  > 0) {
            const updatedRow = updatedRows[0];
            await this.updateOnServer(updatedRow);
        }
    }

    handleCancelClick = (id: GridRowId)  => {
        console.log("handleCancelClick");
        console.log(this.state.rows);
        this.setState({ rowModesModel: { ...this.state.rowModesModel, [id]: { mode: GridRowModes.View, ignoreModifications: true } } });
        const editedRow = this.state.rows.find((row) => row.id === id);
        if (editedRow!.isNew) {
            this.setState({
                rows: [...this.state.rows.filter((row) => row.id !== id)],
            });
        }
    }

    handleEditClick = (id: GridRowId)  => {
        console.log("handleEditClick", id);
        if(id !== -1){
            this.setState({ rowModesModel: { ...this.state.rowModesModel, [id]: { mode: GridRowModes.Edit } } });
        }else{
        }
    }

    handleDeleteClick = async (id: GridRowId) => {
        console.log("Deleting row:", id);
        try {
            const params = new URLSearchParams();
            params.append('id', id.toString());
            const response = await fetch(`${BASE_URL}/api/v1/${this.props.endPoint}?${params}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const responseJson = await response.json();
            console.log("Response:", JSON.stringify(responseJson));
            if (response.ok) {
                this.setState({
                    rows: [...this.state.rows.filter((row) => row.id !== id)],
                });
            } else {
                console.log("Response:", JSON.stringify(responseJson));
                this.handleSnackbar("error", JSON.stringify(responseJson.message));
            }
        } catch (error) {
            console.error('Error:', error);
            this.handleSnackbar("error", JSON.stringify(error));
        }
    }

    updateOnServer = async (updatedRow: GridRowModel) => {
        console.log("Updating row: updatedRow", updatedRow);
        if(updatedRow.name === ''){
            this.handleSnackbar("error", "Name cannot be empty");
            return;
        }
        const updatedRowId = updatedRow.id;
        let method;
        if(updatedRow.isNew === true){
            delete updatedRow['id'];
            method = 'POST';
        }else{
            method = 'PATCH';
        }
        const body = JSON.stringify(updatedRow);
        console.log("Body:", body);
        try {
            const response = await fetch(`${BASE_URL}/api/v1/${this.props.endPoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body
            });
            console.log(`Submitting: ${body}`);
            const responseJson = await response.json();
            console.log("Response:", JSON.stringify(responseJson));
            if (response.ok) {
                console.log("Response:", JSON.stringify(responseJson.data));
                this.setState({
                    rows: [...this.state.rows.filter((row) => row.id !== updatedRowId), responseJson.data],
                });
                return responseJson.data;
            } else {
                this.setState({
                    rows: this.state.rows.filter((row) => row.id !== -1),
                });
                console.log("Response:", JSON.stringify(responseJson));
                this.handleSnackbar("error", JSON.stringify(responseJson.message));
            }
        } catch (error) {
            console.error('Error:', error);
            this.handleSnackbar("error", JSON.stringify(error));
        }
    }

    handleCloseSnackbar = () => {
        console.log("handleCloseSnackbar");
        this.setState({ snackbar: null });
    }

    handleSnackbar = (severity: AlertProps['severity'], message: AlertProps['children']) => {
        console.log("handleSnackbar");
        this.setState({ snackbar: { severity: severity, children: message } });
    }

    handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        console.log("handleRowModesModelChange");
        this.setState({ rowModesModel: newRowModesModel });
    }

    handleProcessRowUpdateError = () => {
        console.log("handleProcessRowUpdateError");
        this.handleSnackbar("error", "Error updating row");
    }

    handleRowEditStop = (params: any, event: any) => {
        console.log("handleRowEditStop");
        console.log(params);
        console.log(event);
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            if(params.row.id !== -1) {
                this.setState({
                    rows: [...this.state.rows.filter((row) => row.id !== params.row.id), params.row],
                    rowModesModel: { ...this.state.rowModesModel, [params.row.id]: { mode: GridRowModes.View } } }
                );
            }else{
                this.setState({
                    rows: this.state.rows.filter((row) => row.id !== params.row.id),
                    rowModesModel: this.state.rowModesModel
                });
            }
            event.defaultMuiPrevented = true;
        }
    }

    setRows = (newRows: GridRowsProp) => {
        console.log("setRows");
        this.setState({ rows: newRows as GridRowModel[] });
    }
}

