import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { es } from "@blocknote/core/locales";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "@/components/editor/custom_editor.css";

// Uploads a file to tmpfiles.org and returns the URL to the uploaded file.
async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);

    const ret = await fetch("http://localhost:3000/api/v1/uploads", {
        method: "POST",
        body: body,
    });
    if (ret.status === 200) {
        const json = await ret.json();
        if (json.status === 200) {
            return json.data.file_path;
        }
    }
}

interface Props {
    content?: string;
    isDarkMode?: boolean;
    onChange?: (content: string, markdown: string) => void;
}


export default function CustomEditor(props: Props) {

    // Create a new editor instance
    const initialContent = props.content ? JSON.parse(props.content):null;
    console.log(initialContent);

    const editor = useCreateBlockNote({
        initialContent,
        dictionary: es,
        uploadFile,
    });

    useEditorChange((editor) => {
        // Converts the editor's contents from Block objects to Markdown and store to state.
        const blocks = editor.document;
        console.log("Changed blocks:", blocks);
        const blocksString = JSON.stringify(blocks);
        const markdown = editor.blocksToMarkdownLossy(blocks);
        props.onChange && props.onChange(blocksString, markdown);
    }, editor);

    // Render the editor
    return <BlockNoteView editor={editor} />;
}
