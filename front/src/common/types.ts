export interface Dictionary<T> {
    [name: string]: T
}

export interface Validation {
    check: Function
    msg: string
}

export interface Item {
    value: number
    label: string
}

export interface ApiResponse<T = any> {
    status?: number
    message?: string
    data?: T | null
}

export interface Value {
    id?: number
    reference: string
    value: string
    created_at?: Date
    updated_at?: Date
}

export interface Topic {
    id?: number
    name: string
    slug: string
    active: boolean
    created_at?: Date
    updated_at?: Date
}

export interface Tag {
    id?: number
    name: string
    slug: string
    active: boolean
    created_at?: Date
    updated_at?: Date
}

export interface Post {
    id?: number
    topic_id: number
    title: string
    slug: string
    status: string
    content: string
    excerpt: string
    user_id: number
    comment_on: boolean
    enclosure?: string
    video?: string
    created_at?: Date
    updated_at?: Date
}
