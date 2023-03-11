import { fetchData } from './fetch';

const ENDPOINT_SEARCH_NEOS_PACKAGES = '/neos/service/data-source/shel-neos-commandbar-search-neos-packages';

export async function searchNeosPackages(query: string): Promise<FlatCommandList> {
    return query ? fetchData<FlatCommandList>(ENDPOINT_SEARCH_NEOS_PACKAGES, { query }) : {};
}
