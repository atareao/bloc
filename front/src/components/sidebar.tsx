import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { Link } from 'react-router';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@mui/material/styles';

import { styled } from '@mui/material/styles';

import { FaCaretLeft, FaCaretRight } from "react-icons/fa6";
import IconButton from '@mui/material/IconButton';

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface Props {
    t: any
    mode: any
}

interface State {
    open: boolean
}

export class InnerSidebar extends React.Component<Props, State> {

    dataPages = [
        {
            "name": this.props.t("Home"),
            "navigateTo": "/admin/",

        },
        {
            "name": this.props.t("Posts"),
            "navigateTo": "/admin/posts",
        },
    ];

    constructor(props: Props) {
        super(props);
        this.state = {
            open: true,
        };
    }

    handleDrawerClose = () => {
        const oldStatus = this.state.open;

        this.setState({
            open: !oldStatus,
        });
    }

    render = () => {
        const width = this.state.open ? 250 : 50;
        const visiblity = this.state.open ? "visible" : "hidden";
        console.log("State", this.state);
        const textColor = this.props.mode === "dark" ? "white" : "black";
        return (
            <Drawer
                sx={{
                    width: width,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: width,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar />
                <DrawerHeader>
                    <IconButton onClick={this.handleDrawerClose}>
                        {this.state.open === true ? <FaCaretLeft /> : <FaCaretRight />}
                    </IconButton>
                </DrawerHeader>
                <Box sx={{ 
                        overflow: 'auto',
                        visibility: visiblity,
                }}>
                    <List>
                        {this.dataPages.map((page) => (
                            <ListItem key={page.name} disablePadding>
                                <Link style={{ width: "100%" }} to={page.navigateTo}>
                                    <Button fullWidth sx={{ color: textColor }} >
                                        {page.name}
                                    </Button>
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            </Drawer>
        );
    }
}
export default function Sidebar() {
    const { t } = useTranslation();
    const { mode } = useColorScheme();
    return <InnerSidebar t={t} mode={mode} />;
}

