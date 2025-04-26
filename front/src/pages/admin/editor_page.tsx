import React from "react";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {
    MDXEditor,
    headingsPlugin,
    BlockTypeSelect,
    CreateLink,
    diffSourcePlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    CodeToggle,
    toolbarPlugin,
    sandpackPlugin,
    DiffSourceToggleWrapper

} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import ModeContext from '../../components/mode_context';


interface State {
    content: string
    postId: number
}


export default class EditorPage extends React.Component<{}, State> {
    static contextType = ModeContext;
    declare context: React.ContextType<typeof ModeContext>;
    constructor(props: {}) {
        super(props);
        console.log("Constructing page");
        this.state = {
            content: "## Hello world!",
            postId: -1,
        };
    }

    render = () => {
        return (
            <>
                <Box sx={{
                    height: 100,
                }} />
                <Stack 
                    sx={{width: "98vw"}}
                spacing={1} direction="row">
                    <Box sx={{
                        width: "80vw",
                        height: "80vh",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        overflowY: "scroll",
                        backgroundColor: this.context.isDark ? 'rgba(0,0,0,0.74)' : 'white'
                    }}>
                        <MDXEditor
                            className={this.context.isDark ? "dark-theme" : ""}
                            markdown={this.state.content}
                            plugins={[
                                headingsPlugin(),
                                listsPlugin(),
                                quotePlugin(),
                                thematicBreakPlugin(),
                                sandpackPlugin(),
                                markdownShortcutPlugin(),
                                diffSourcePlugin({ viewMode: 'rich-text' }),
                                toolbarPlugin({
                                    toolbarContents: () => (
                                        <DiffSourceToggleWrapper>
                                            <UndoRedo />
                                            <BoldItalicUnderlineToggles />
                                            <BlockTypeSelect />
                                            <CodeToggle />
                                            <CreateLink />
                                        </DiffSourceToggleWrapper>
                                    )
                                })
                            ]}
                        />
                    </Box>
                    <Box sx={{
                        backgroundColor: "#879BA6",
                        width: "20vw",
                        p: 2,
                    }}>
                        <Stack spacing={1}>
                            <FormControl fullWidth>
                                <InputLabel>Topic</InputLabel>
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value={10}
                                    label="Age"
                                >
                                    <MenuItem value={10}>Ten</MenuItem>
                                    <MenuItem value={20}>Twenty</MenuItem>
                                    <MenuItem value={30}>Thirty</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
                </Stack>
            </>
        );
    }
};
