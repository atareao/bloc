export default interface Rule {
    id: number;
    weight?: number;
    allow?: boolean;
    store?: boolean;
    ip_address?: string;
    protocol?: string;
    fqdn?: string;
    path?: string;
    query?: string;
    city_name?: string;
    country_name?: string;
    country_code?: string;
    active?: number;
    created_at?: Date;
    updated_at?: Date;
}
