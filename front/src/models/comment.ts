export default interface Comment {
    id?: number;
    post_id: number;
    parent_id?: number;
    nickname: string;
    content: string;
    approved?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

