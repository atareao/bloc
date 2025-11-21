import { BASE_URL } from '@/constants';
import type Response from '@/models/response';


export const loadData = async <T>(
    endpoint: string,
    params?: Map<string, string | number | boolean | (string | number | boolean)>
): Promise<Response<T>> => {
    console.log("Loading data");

    const basePath = `${BASE_URL}/api/v1/${endpoint}`;
    const searchParams = new URLSearchParams();
    if (params) {
        console.log("Params", params);
        // Añadir parámetros de consulta de forma segura
        params.forEach((value, key) => {
            console.log(`Param: ${key} = ${value}`);
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    // Manejar arrays, si es necesario (ej. para filtros múltiples)
                    value.forEach(item => searchParams.append(key, String(item)));
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });
    }
    const queryString = searchParams.toString();
    const url = `${basePath}${queryString ? `?${queryString}` : ''}`;

    console.log("Fetching URL:", url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            // El Content-Type es típicamente innecesario para un GET sin cuerpo,
            // pero lo dejo si es una convención de tu API.
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 2. Manejar respuestas no-OK (ej: 404, 500)
        if (!response.ok) {
            let errorBody: { message?: string } = {};
            try {
                // Intentar leer el cuerpo del error si está en formato JSON
                errorBody = await response.json();
            } catch (e) {
                // Si falla al parsear, ignorar y usar un mensaje por defecto
            }

            return {
                status: response.status,
                message: errorBody.message || `Error HTTP: ${response.status} - ${response.statusText}`
            };
        }

        // 3. Manejar respuestas OK (2xx)
        // La respuesta de la API es un JSON que mapea a T.
        return await response.json();

    } catch (error) {
        // 4. Manejar errores de red o de la función fetch (ej: CORS, sin conexión)
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Network Error or Fetch Failure:', msg, error);

        return {
            status: 500,
            message: `Network or Unknown Error: ${msg}`
        };
    }
};

export const mapsEqual = (map1: Map<string, string>, map2: Map<string, string>): boolean => {
    // 1. Si el tamaño es diferente, son distintos.
    if (map1.size !== map2.size) {
        return false;
    }

    // 2. Itera sobre el primer mapa y compara los valores en el segundo.
    for (const [key, val] of map1.entries()) {
        // Si la clave no existe o el valor es diferente, son distintos.
        if (val !== map2.get(key)) {
            return false;
        }
    }

    // 3. Si la iteración termina, son iguales.
    return true;
};

export const toCapital = (s: string): string => {
    return s.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
}


export const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Obtiene un valor anidado de un objeto de forma segura (ej: 'value.name_es')
 * Esto resuelve el error TS2536.
 */
export const getNestedValue = (obj: any, path: string): any => {
    // Si el objeto es nulo o indefinido, o la ruta no es válida, devolvemos undefined
    if (!obj || !path) {
        return undefined;
    }

    const pathParts = path.split('.');
    let current = obj;

    for (const part of pathParts) {
        // Navegamos al siguiente nivel, asegurando que el objeto actual no sea nulo
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            // Si el camino se rompe (ej: 'value' es null o 'name_es' no existe en 'value')
            return undefined;
        }
    }
    return current;
};
