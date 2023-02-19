import FuzzySearch from 'fuzzy-search';

function sortCommands(a: ProcessedCommandItem, b: ProcessedCommandItem, favourites: CommandId[]): number {
    const aIsFavourite = favourites.includes(a.id);
    const bIsFavourite = favourites.includes(b.id);

    if (aIsFavourite && !bIsFavourite) {
        return -1;
    }

    if (!aIsFavourite && bIsFavourite) {
        return 1;
    }

    return a.name.localeCompare(b.name);
}

export default function filterCommands(
    selectedCommandGroup: CommandId,
    searchWord: string,
    commands: FlatCommandList,
    favourites: CommandId[]
): CommandId[] {
    // Filter available commands for the current context
    let availableCommands = Object.values(commands);
    availableCommands = searchWord
        ? availableCommands
        : availableCommands.filter((command) => command.parentId === selectedCommandGroup);

    // If there is no search word, return all commands in the current context with favourites first
    if (!searchWord) {
        return availableCommands.sort((a, b) => sortCommands(a, b, favourites)).map((command) => command.id);
    }

    // TODO: Try @leeoniya/ufuzzy for fuzzy search which makes it easier to use custom sorting functions
    const searcher = new FuzzySearch(availableCommands, ['name', 'description'], {
        sort: true,
    });
    const matchingCommands = searcher.search(searchWord);

    // Add all commands that can handle queries to the result, the Set removes duplicates
    return [
        ...new Set([
            ...matchingCommands.map((command) => command.id),
            ...availableCommands.filter((command) => command.canHandleQueries).map((command) => command.id),
        ]),
    ];
}
