import { fetchData } from './fetch';

const ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';

export async function getCommands() {
    return fetchData<HierarchicalCommandList>(ENDPOINT_COMMANDS);
}
