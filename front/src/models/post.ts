export default interface Post {
    id: number;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    meta?: string;
    comment_on?: boolean;
    private?: boolean;
    audio_url?: string;
    published_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
