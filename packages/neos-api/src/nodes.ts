import { fetchData } from './fetch';

const ENDPOINT_SEARCH_NODES = 'service/data-source/shel-neos-commandbar-search-nodes';

export async function searchNodes(query: string, node: NodeContextPath): Promise<SearchNodeResult[]> {
    return query
        ? fetchData<SearchNodeResult[]>(ENDPOINT_SEARCH_NODES, {
              query,
              node,
          })
        : [];
}
