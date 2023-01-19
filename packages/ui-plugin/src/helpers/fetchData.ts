// @ts-ignore
import { fetchWithErrorHandling } from '@neos-project/neos-ui-backend-connector';

const fetchData = async (endpoint: string, params?: Record<string, any>) => {
    if (params) {
        endpoint = Object.keys(params).reduce((url, key) => {
            return url + '&' + key + '=' + encodeURIComponent(params[key]);
        }, endpoint + '?');
    }
    return fetchWithErrorHandling
        .withCsrfToken((csrfToken) => ({
            url: endpoint,
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Flow-Csrftoken': csrfToken,
            },
        }))
        .then((response) => response && response.json());
};

export default fetchData;