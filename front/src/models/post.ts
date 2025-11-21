export default interface Post {
    id: number;
    class: string;
    parent_id?: number;
    title?: string;
    slug?: string;
    content?: string;
    user_id?: number;
    comment_on?: boolean;
    private?: boolean;
    audio_url?: string;
    created_at?: Date;
    updated_at?: Date;
}
