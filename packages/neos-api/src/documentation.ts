import { fetchData } from './fetch';

const ENDPOINT_SEARCH_NEOS_DOCS = '/neos/service/data-source/shel-neos-commandbar-search-neos-docs';

export async function searchNeosDocs(query: string): Promise<FlatCommandList> {
    return query ? fetchData<FlatCommandList>(ENDPOINT_SEARCH_NEOS_DOCS, { query }) : {};
}
