import { fetchData } from './fetch';

const ENDPOINT_GET_PREFERENCES = '/neos/shel-neos-commandbar/preferences/getpreferences';
const ENDPOINT_SET_FAVOURITE_COMMANDS = '/neos/shel-neos-commandbar/preferences/setfavourites';
const ENDPOINT_ADD_RECENT_COMMAND = '/neos/shel-neos-commandbar/preferences/addrecentcommand';

async function setPreference<T = any>(endpoint: string, data: any): Promise<T> {
    return fetchData<T>(endpoint, data, 'POST');
}

export async function getPreferences() {
    return fetchData<UserPreferences>(ENDPOINT_GET_PREFERENCES);
}

export async function setFavouriteCommands(commandIds: CommandId[]) {
    return setPreference<CommandId[]>(ENDPOINT_SET_FAVOURITE_COMMANDS, { commandIds: commandIds });
}

export async function addRecentCommand(commandId: CommandId) {
    // TODO: Check if sendBeacon is a better option here to reduce the impact on the user
    return setPreference<CommandId[]>(ENDPOINT_ADD_RECENT_COMMAND, { commandId: commandId });
}
