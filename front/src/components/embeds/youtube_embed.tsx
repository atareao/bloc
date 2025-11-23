import type { LeafDirective } from 'mdast-util-directive'
import {
    Button,
    DialogButton,
    usePublisher,
    insertDirective$,
} from '@mdxeditor/editor';

export const YouTubeButton = () => {
  const insertDirective = usePublisher(insertDirective$)

  return (
        <>
    <Button
    />
    <DialogButton
      tooltipTitle="Insert Youtube video"
      submitButtonTitle="Insert video"
      dialogInputPlaceholder="Paste the youtube video URL"
      buttonContent="YT"
      onSubmit={(url) => {
        const videoId = new URL(url).searchParams.get('v')
        if (videoId) {
          insertDirective({
            name: 'youtube',
            type: 'leafDirective',

            attributes: {id: videoId },
            children: []
          } as LeafDirective)
        } else {
          alert('Invalid YouTube URL')
        }
      }}
    />
</>
  )
}

