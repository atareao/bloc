import { useTranslation } from "react-i18next";
import CustomTable from '@/components/custom_table'; 
import type { FieldDefinition } from '@/common/types'; 
import type Item from "@/models/record"; 

const TITLE = "Requests";
const ENDPOINT = "requests";

// Definición de las columnas/campos para la tabla de Records
const RecordsFields: FieldDefinition<Item>[] = [
    { key: 'created_at', label: 'Created at', type: 'date'}, 
    { key: 'ip_address', label: 'IP Address', type: 'string', filterKey: 'ip_address' },
    { key: 'protocol', label: 'Protocol', type: 'string', filterKey: 'protocol' },
    { key: 'fqdn', label: 'FQDN', type: 'string', filterKey: 'fqdn' },
    { key: 'path', label: 'Path', type: 'string', filterKey: 'path' },
    { key: 'query', label: 'Query', type: 'string', filterKey: 'query' },
    { key: 'city_name', label: 'City Name', type: 'string', filterKey: 'city_name' },
    { key: 'country_name', label: 'Country Name', type: 'string', filterKey: 'country_name' },
    { key: 'country_code', label: 'Country Code', type: 'string', filterKey: 'country_code' },
    { key: 'rule_id', label: 'Rule Id', type: 'number', filterKey: 'rule_id', fixed: 'right' }
];


export default function Page() {
    const { t } = useTranslation();
    // No necesitamos 'navigate' si no se usa

    // Adaptamos las etiquetas para usar la función 't'
    const translatedFields: FieldDefinition<Item>[] = RecordsFields.map(field => ({
        ...field,
        label: t(field.label),
    }));

    return (
        // Usamos el CustomTable con el tipo Item para la inferencia de TypeScript
        <CustomTable<Item>
            title={TITLE}
            endpoint={ENDPOINT}
            fields={translatedFields}
            t={t}
        />
    );
}
