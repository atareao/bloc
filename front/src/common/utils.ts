import { BASE_URL } from './constants';
import { ApiResponse } from './types';

export const loadData = async (endpoint: string) => {
    console.log("Loading data");
    try {
        const response = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        const response: ApiResponse = {status: 500, message: `Error: ${error}`}
        return response;
    }
}

export const loadKeyValue = async (reference: string) => {
    console.log("Loading key values");
    try {
        const response = await fetch(`${BASE_URL}/api/v1/values/reference/${reference}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        const response: ApiResponse = {status: 500, message: `Error: ${error}`}
        return response;
    }
}

