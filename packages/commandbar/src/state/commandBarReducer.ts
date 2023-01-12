enum ACTIONS {
    RESET_SEARCH,
    HIGHLIGHT_NEXT_ITEM,
    HIGHLIGHT_PREVIOUS_ITEM,
    CANCEL,
    SELECT_GROUP,
    GO_TO_PARENT_GROUP,
    UPDATE_SEARCH,
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function filterAvailableCommands(selectedGroup: CommandGroup, searchWord: string, commands: CommandList) {
    const currentCommands = selectedGroup ? selectedGroup.children : commands;
    return Object.keys(currentCommands).filter((commandName) => {
        const command = currentCommands[commandName];
        return (command as Command).canHandleQueries || command.name.toLowerCase().indexOf(searchWord) >= 0;
    });
}

const commandBarReducer = (state: CommandBarState, action: CommandBarAction): CommandBarState => {
    switch (action.type) {
        case ACTIONS.RESET_SEARCH:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                availableCommandNames: filterAvailableCommands(state.selectedGroup, '', state.commands),
            };
        case ACTIONS.HIGHLIGHT_NEXT_ITEM:
            return {
                ...state,
                expanded: true,
                highlightedItem: state.expanded
                    ? clamp(state.highlightedItem + 1, 0, state.availableCommandNames.length - 1)
                    : 0,
            };
        case ACTIONS.HIGHLIGHT_PREVIOUS_ITEM:
            return {
                ...state,
                highlightedItem: clamp(state.highlightedItem - 1, 0, state.availableCommandNames.length - 1),
            };
        case ACTIONS.CANCEL:
            // Cancel current search or traverse to parent group
            return state.searchWord
                ? {
                      ...state,
                      searchWord: '',
                      highlightedItem: 0,
                      availableCommandNames: filterAvailableCommands(state.selectedGroup, '', state.commands),
                  }
                : {
                      ...state,
                      // FIXME: Traverse to parent group if one exists
                      selectedGroup: null,
                      availableCommandNames: filterAvailableCommands(null, '', state.commands),
                  };
        case ACTIONS.GO_TO_PARENT_GROUP:
            return {
                ...state,
                // FIXME: Traverse to parent group if one exists
                selectedGroup: null,
                availableCommandNames: filterAvailableCommands(null, '', state.commands),
            };
        case ACTIONS.SELECT_GROUP:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                selectedGroup: action.command,
                availableCommandNames: filterAvailableCommands(action.command, '', state.commands),
            };
        case ACTIONS.UPDATE_SEARCH: {
            return {
                ...state,
                expanded: true,
                searchWord: action.searchWord,
                highlightedItem: 0,
                availableCommandNames: filterAvailableCommands(state.selectedGroup, action.searchWord, state.commands),
            };
        }
        default:
            throw new Error(`Invalid action ${action.type}`);
    }
};

export { commandBarReducer, ACTIONS };
