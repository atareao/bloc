export default interface Post {
    id: number;
    title?: string;
    slug?: string;
    content: string;
    markdown: string;
    html_content?: string;
    excerpt?: string;
    html_excerpt?: string;
    meta?: string;
    clean_meta?: string;
    html_meta?: string;
    outline?: string;
    comment_on?: boolean;
    private?: boolean;
    audio_url?: string;
    published_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
