import uFuzzy from '@leeoniya/ufuzzy';

// See https://github.com/leeoniya/uFuzzy#options
const uf = new uFuzzy({
    intraMode: 1,
    intraIns: 1,
    intraSub: 1,
    intraTrn: 1,
    intraDel: 1,
});

function sortCommands(
    a: ProcessedCommandItem,
    b: ProcessedCommandItem,
    favouriteCommands: CommandId[],
    recentCommands: CommandId[]
): number {
    // Sort by recent first
    const aIsRecent = recentCommands.includes(a.id);
    const bIsRecent = recentCommands.includes(b.id);

    if (aIsRecent && !bIsRecent) {
        return -1;
    }

    if (!aIsRecent && bIsRecent) {
        return 1;
    }

    if (aIsRecent && bIsRecent) {
        return recentCommands.indexOf(a.id) - recentCommands.indexOf(b.id);
    }

    // Sort by favourites second
    const aIsFavourite = favouriteCommands.includes(a.id);
    const bIsFavourite = favouriteCommands.includes(b.id);

    if (aIsFavourite && !bIsFavourite) {
        return -1;
    }

    if (!aIsFavourite && bIsFavourite) {
        return 1;
    }

    // Sort by name third
    return a.name.localeCompare(b.name);
}

export default function filterCommands(
    selectedCommandGroup: CommandId,
    searchWord: string,
    commands: FlatCommandList,
    favourites: CommandId[],
    recentCommands: CommandId[]
): CommandId[] {
    // If there is a search word, return all commands to allow deep search
    // If no search word is given, return all commands in the currently selected group or all recent commands if no group is selected
    let availableCommands = Object.values(commands);
    availableCommands = searchWord
        ? availableCommands
        : availableCommands.filter(
              (command) =>
                  command.parentId === selectedCommandGroup ||
                  (!selectedCommandGroup && recentCommands.includes(command.id))
          );

    // If there is no search word, return all commands in the current context with favourites first, the recent commands will only be prioritised if we are at the top level
    if (!searchWord) {
        return availableCommands
            .sort((a, b) => sortCommands(a, b, favourites, selectedCommandGroup ? [] : recentCommands))
            .map((command) => command.id);
    }

    // Create a list of all available commands with their name and description as haystack for the search
    const availableCommandNames = availableCommands.map(({ name, description }) => name + ' ' + description);
    const [indices, , order] = uf.search(availableCommandNames, searchWord.toLowerCase());
    const matchingIds = order.map((i) => availableCommands[indices[i]].id);

    // Add all commands that can handle queries to the result, the Set removes duplicates
    return [
        ...new Set([
            ...matchingIds,
            ...availableCommands.filter((command) => command.canHandleQueries).map((command) => command.id),
        ]),
    ];
}
