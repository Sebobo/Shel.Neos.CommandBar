import FuzzySearch from 'fuzzy-search';

export default function filterCommands(
    selectedCommandGroup: CommandId,
    searchWord: string,
    commands: FlatCommandList
): CommandId[] {
    // Filter available commands for the current context
    let availableCommands = Object.values(commands);
    availableCommands = searchWord
        ? availableCommands
        : availableCommands.filter((command) => command.parentId === selectedCommandGroup);

    if (!searchWord) {
        return availableCommands.map((command) => command.id);
    }

    // TODO: Try @leeoniya/ufuzzy for fuzzy search which makes it easier to use custom sorting functions
    const searcher = new FuzzySearch(availableCommands, ['name'], {
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
