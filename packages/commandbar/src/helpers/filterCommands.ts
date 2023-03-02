import FuzzySearch from 'fuzzy-search';

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

    // If there is no search word, return all commands in the current context with favourites first
    if (!searchWord) {
        return availableCommands
            .sort((a, b) => sortCommands(a, b, favourites, recentCommands))
            .map((command) => command.id);
    }

    // TODO: Try @leeoniya/ufuzzy for fuzzy search which makes it easier to use custom sorting functions
    const searcher = new FuzzySearch(availableCommands, ['name', 'description'], {
        sort: true,
    });
    const matchingCommands = searcher.search(searchWord.toLowerCase());

    // Add all commands that can handle queries to the result, the Set removes duplicates
    return [
        ...new Set([
            ...matchingCommands.map((command) => command.id),
            ...availableCommands.filter((command) => command.canHandleQueries).map((command) => command.id),
        ]),
    ];
}
