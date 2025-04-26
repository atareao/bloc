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

interface Props {
    t: any
    mode: any
}

export class InnerSidebar extends React.Component<Props> {

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
    }

    render = () => {
        const textColor = this.props.mode === "dark"?"white":"black";
        return (
            <Drawer
                sx={{
                    width: 250,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 250,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {this.dataPages.map((page) => (
                            <ListItem key={page.name} disablePadding>
                                <Link style={{width: "100%"}} to={page.navigateTo}>
                                    <Button fullWidth sx={{color: textColor}} >
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

