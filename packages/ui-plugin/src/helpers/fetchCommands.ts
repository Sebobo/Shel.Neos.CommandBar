// @ts-ignore
import { fetchWithErrorHandling } from '@neos-project/neos-ui-backend-connector';

const fetchCommands = async (endPoint) => {
    return fetchWithErrorHandling
        .withCsrfToken((csrfToken) => ({
            url: endPoint,
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Flow-Csrftoken': csrfToken,
            },
        }))
        .then((response) => response && response.json());
};

export default fetchCommands;
