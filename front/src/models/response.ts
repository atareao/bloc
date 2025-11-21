export interface Pagination {
    page: number,
    limit: number,
    pages: number,
    records: number,
    prev: string,
    next: string,
}
export default interface Response<T> {
    status?: number;
    message?: string;
    data?: T;
    pagination?: Pagination;
}
