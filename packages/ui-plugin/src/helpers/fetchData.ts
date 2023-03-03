// @ts-ignore
import { fetchWithErrorHandling } from '@neos-project/neos-ui-backend-connector';

async function fetchData<T = any>(endpoint: string, params?: Record<string, any>, method = 'GET'): Promise<T> {
    if (params && method === 'GET') {
        endpoint = Object.keys(params).reduce((url, key) => {
            return url + '&' + key + '=' + encodeURIComponent(params[key]);
        }, endpoint + '?');
    }
    return fetchWithErrorHandling
        .withCsrfToken((csrfToken) => ({
            url: endpoint,
            method,
            credentials: 'include',
            body: params && method === 'POST' ? JSON.stringify(params) : undefined,
            headers: {
                'X-Flow-Csrftoken': csrfToken,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        }))
        .then((response: Response) => {
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                return response.json();
            }
            return response.text();
        });
}

export default fetchData;
