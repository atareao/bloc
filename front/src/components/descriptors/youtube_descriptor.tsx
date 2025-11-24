import type { LeafDirective } from 'mdast-util-directive'
import type { DirectiveDescriptor } from '@mdxeditor/editor'


interface YoutubeDirectiveNode extends LeafDirective {
    name: 'youtube'
    attributes: {
        width: string,
        height: string,
        title: string,
        videoId: string,
    }
}


export const YoutubeDirectiveDescriptor: DirectiveDescriptor<YoutubeDirectiveNode> = {
    name: 'youtube',
    type: 'leafDirective',
    testNode(node) {
        return node.name === 'youtube'
    },
    attributes: ['width', 'height', 'title', 'videoId'],
    hasChildren: false,
    Editor: ({ mdastNode, lexicalNode, parentEditor }) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <button
                    onClick={() => {
                        parentEditor.update(() => {
                            lexicalNode.selectNext()
                            lexicalNode.remove()
                        })
                    }}
                >
                    delete
                </button>
                <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${mdastNode.attributes.videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
            </div>
        )
    }
}
