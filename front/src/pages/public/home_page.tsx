import react from "react";
import Stack from "@mui/material/Stack";
import Box from '@mui/material/Box';
import { Typography } from "@mui/material";
import { useNavigate } from 'react-router';
import logo from '../../assets/logo.svg';

interface Props {
    navigate: any
}

export class HomeInnerPage extends react.Component<Props> {
    constructor(props: Props) {
        super(props);
        console.log("Constructing page");
    }

    render = () => {
        return (
            <Stack
                justifyContent="center"
                alignItems="center"
                sx={{ width: 1, height: "100vh" }}
            >
                <Box>
                <Typography
                    sx={{
                        fontSize: 120,
                        fontWeight: "bold",
                    }}
                >bloc</Typography>
                </Box>
                <Box 
                onClick={() => this.props.navigate("/services")}
                sx={{
                    backgroundImage: `url(${logo})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                    height: "350px",
                    width: "350px",
                    cursor: "pointer",
                }}/>
            </Stack>
        );
    }
};




export default function HomePage() {
    const navigate = useNavigate();
    return <HomeInnerPage navigate={navigate}/>;
}

