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

