import React from 'react';

export interface ModeContextInterface {
    isDark: boolean
    toggleMode: Function
}

const ModeContext = React.createContext<ModeContextInterface>({
    isDark: true,
    toggleMode: Function,
});


interface Props {
    children: React.ReactNode
}

interface State {
    isDark: boolean
}

export class ModeContextProvider extends React.Component<Props, State> {

    constructor(props: any) {
        console.log("Constructing AuthContextProvider");
        super(props);
        this.state = {
            isDark: this.retrieveMode()
        }
    }

    retrieveMode = () => {
        console.log("Retrieving mode");
        let mode = localStorage.getItem("mode");
        if (mode === undefined || mode === null) {
            return true;
        }
        return "dark" === mode;
    }

    toggleMode = () => {
        console.log("Toggling mode");
        const isDark = !this.state.isDark;
        this.setState({ isDark: isDark });
        localStorage.setItem("mode", isDark ? "dark" : "light");
    }

    render() {
        console.log(`Rendering ModeContextProvider ${this.state.isDark}`);
        return (
            <ModeContext.Provider value={{
                isDark: this.state.isDark,
                toggleMode: this.toggleMode,
            }}>
                {this.props.children}
            </ModeContext.Provider>
        )
    }
}
export default ModeContext;

