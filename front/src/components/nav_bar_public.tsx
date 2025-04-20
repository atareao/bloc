import react from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import { MdMenu } from "react-icons/md";
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import logo from '../assets/logo.svg';
import { NavLink } from "react-router";
import ModeContext from '../components/mode_context';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { IoMdLogIn } from "react-icons/io";
import i18n from 'i18next';
import { IoMdSunny, IoMdMoon } from "react-icons/io";
import { useColorScheme } from '@mui/material/styles';

interface Props {
    t: any
    navigate: any
    mode: any
    setMode: any
}

interface State {
    isDark: boolean
    anchorElNav: null | HTMLElement
    anchorElUser: null | HTMLElement
}


export class InnerPublicNavBar extends react.Component<Props, State> {

    static contextType = ModeContext;
    declare context: React.ContextType<typeof ModeContext>;
    pages = [
        {
            key: 2,
            name: this.props.t("Editor"),
            navigateTo: "/editor",
        },
        {
            key: 1,
            name: this.props.t("Our services"),
            navigateTo: "/services",
        }
    ]
    constructor(props: Props) {
        super(props);
        console.log("Constructing page");
        this.state = {
            isDark: true,
            anchorElNav: null,
            anchorElUser: null,
        }
    }
    handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ anchorElNav: event.currentTarget });
    }
    handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ anchorElUser: event.currentTarget });
    }

    handleCloseNavMenu = () => {
        this.setState({ anchorElNav: null });
    }

    handleCloseUserMenu = () => {
        this.setState({ anchorElUser: null });
    }
    /*
    componentDidMount() {
        i18n.on('languageChanged', this.onLanguageChanged)
    }

      componentWillUnmount() {
        i18n.off('languageChanged', this.onLanguageChanged)
      }
      */

    onLanguageChanged = (event: SelectChangeEvent) => {
        if (event.target.value != i18n.language) {
            console.log(`selected language: ${event.target.value}`);
            console.log(`previous language: ${i18n.language}`);
            localStorage.setItem("i18nextLng", event.target.value);
            i18n.changeLanguage(event.target.value, (err) => {
                if (err) return console.log('something went wrong loading', err);
            });
            console.log(`language: ${i18n.language}`);
            this.forceUpdate();
            console.log(`language: ${i18n.language}`);
            window.location.reload();
        }
    }

    render = () => {
        console.log(`Context is Dark: ${this.context.isDark}`);
        return (
            <>
                <AppBar
                    position="fixed"
                    sx={{
                        backgroundColor: "#a8b858",
                        marginBottom: 2,
                        zIndex: (theme) => theme.zIndex.drawer + 1
                    }}
                >
                    <Container maxWidth="xl" >
                        <Toolbar disableGutters >
                            <Avatar
                                alt="bloc"
                                src={logo}
                                sx={{ width: 32, height: 32, p: 1}} />
                            <NavLink to="/" style={{ textDecoration: 'none'}} end>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        m: 1,
                                        mr: 2,
                                        display: { xs: 'none', md: 'flex' },
                                        fontWeight: 700,
                                        letterSpacing: '.3rem',
                                        textDecoration: 'none',
                                        color: this.context.isDark?'rgba(0,0,0,0.54)':'white' 
                                    }}
                                >
                                    bloc
                                </Typography>
                            </NavLink>

                            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                                <IconButton
                                    size="large"
                                    aria-label="account of current user"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={this.handleOpenNavMenu}
                                    color="inherit"
                                >
                                    <MdMenu />
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={this.state.anchorElNav}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'left',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'left',
                                    }}
                                    open={Boolean(this.state.anchorElNav)}
                                    onClose={this.handleCloseNavMenu}
                                    sx={{ display: { xs: 'block', md: 'none' } }}
                                >
                                    {this.pages.map((page) => (
                                        <MenuItem key={page.key} onClick={this.handleCloseNavMenu}>
                                            <NavLink to={page.navigateTo} style={{ textDecoration: 'none' }} end>
                                                <Typography sx={{ textAlign: 'center', textDecoration: 'none', color: this.context.isDark?'rgba(0,0,0,0.54)':'white'  }}>{page.name}</Typography>
                                        
                                            </NavLink>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>
                            <Typography
                                variant="h5"
                                noWrap
                                component="a"
                                href="#app-bar-with-responsive-menu"
                                sx={{
                                    mr: 2,
                                    display: { xs: 'flex', md: 'none' },
                                    flexGrow: 1,
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '.3rem',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                }}
                            >
                                LOGO
                            </Typography>
                            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex', flexDirection: 'row-reverse' } }}>
                                <MenuItem>
                                    {this.context.isDark ?  <IoMdSunny color="rgba(0,0,0,0.54)"/>:""}
                                    <Switch
                                    checked={this.context.isDark}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            this.props.setMode(event.target.checked?"light":"dark");
                                            this.context.toggleMode();
                                        }}/>
                                    {this.context.isDark ?  "":<IoMdMoon color="white"/>}
                                </MenuItem>
                                <MenuItem>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={i18n.language}
                                        label="Age"
                                        onChange={this.onLanguageChanged}
                                    >
                                        <MenuItem value="en">en</MenuItem>
                                        <MenuItem value="es">es</MenuItem>
                                        <MenuItem value="ca">va</MenuItem>
                                    </Select>
                                </MenuItem>
                                <MenuItem>
                                    <IconButton onClick={() => this.props.navigate("/login")}>
                                        <IoMdLogIn />
                                    </IconButton>
                                </MenuItem>
                                {this.pages.map((page) => (
                                    <NavLink key={page.key} to={page.navigateTo} style={{ textDecoration: 'none', color: 'inherit' }} end>
                                        <Button
                                            key={page.name}
                                            onClick={this.handleCloseNavMenu}
                                            sx={{ my: 2, color: 'white', display: 'block', textDecoration: 'none' }}
                                        >
                                            <Typography sx={{ textAlign: 'center', textDecoration: 'none', color: 'inherit' }}>{page.name}</Typography>
                                        </Button>
                                    </NavLink>
                                ))}
                            </Box>
                            <Box sx={{ flexGrow: 0 }}>
                                <Menu
                                    sx={{ mt: '45px' }}
                                    id="menu-appbar"
                                    anchorEl={this.state.anchorElUser}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(this.state.anchorElUser)}
                                    onClose={this.handleCloseUserMenu}
                                >
                                </Menu>
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>
            </>
        );
    }
}

export default function PublicNavBar() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { mode, setMode } = useColorScheme();
    return <InnerPublicNavBar t={t} navigate={navigate} mode={mode} setMode={setMode}/>;
}
