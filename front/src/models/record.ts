export default interface Record {
    id: number;
    ip_address?: string;
    protocol?: string;
    fqdn?: string;
    path?: string;
    query?: string;
    city_name?: string;
    country_name?: string;
    country_code?: string;
    rule_id?: number;
    created_at?: Date;
}
