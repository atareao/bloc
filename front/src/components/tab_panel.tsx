import React from "react";

interface Props {
    children: React.ReactNode
    value: number
    index: number
}

export default class TabPanel extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }
    render = () => {
        const { children, value, index, ...other } = this.props;

        return (
            <div
                role="tabpanel"
                style={{ display: value !== index ? 'none' : 'block' }}
                id={`tabpanel-${index}`}
                aria-labelledby={`tab-${index}`}
                {...other}
            >
                {children}
            </div>
        );
    }
}

