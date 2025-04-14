import React from "react";
import Box from '@mui/material/Box';
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
    content: string;
}


export default class EditorPage extends React.Component<{}, State> {
    static contextType = ModeContext;
    declare context: React.ContextType<typeof ModeContext>;
    constructor(props: {}) {
        super(props);
        console.log("Constructing page");
        this.state = {
            content: "## Hello world!",
        };
    }

    render = () => {
        return (
            <>
                <Box sx={{
                    height: 100,
                }} />
                <Box sx={{
                    width: 1,
                    height: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    overflowY: "scroll",
                    backgroundColor: this.context.isDark ? 'rgba(0,0,0,0.74)' : 'white'
                }}>
                    <MDXEditor
                        className={this.context.isDark ? "dark-theme" : ""}
                        markdown="Esto es una prueba **funciona**"
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
            </>
        );
    }
};
