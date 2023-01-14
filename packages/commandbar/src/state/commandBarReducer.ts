enum ACTIONS {
    RESET_SEARCH,
    HIGHLIGHT_NEXT_ITEM,
    HIGHLIGHT_PREVIOUS_ITEM,
    CANCEL,
    SELECT_GROUP,
    GO_TO_PARENT_GROUP,
    UPDATE_SEARCH,
    RUNNING_COMMAND,
    FINISHED_COMMAND,
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function filterAvailableCommands(selectedCommandGroup: CommandId, searchWord: string, commands: FlatCommandList) {
    const currentCommandIds = selectedCommandGroup
        ? commands[selectedCommandGroup].subCommandIds
        : Object.keys(commands).filter((commandId) => !commands[commandId].parentId);
    return currentCommandIds.filter((commandName) => {
        const command = commands[commandName];
        return (command as Command).canHandleQueries || command.name.toLowerCase().indexOf(searchWord) >= 0;
    });
}

const commandBarReducer = (state: CommandBarState, action: CommandBarAction): CommandBarState => {
    // The parent command group of the currently selected command group which is used in several actions
    const parentCommandGroup = state.selectedCommandGroup ? state.commands[state.selectedCommandGroup].parentId : null;

    switch (action.type) {
        case ACTIONS.RESET_SEARCH:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                availableCommandIds: filterAvailableCommands(state.selectedCommandGroup, '', state.commands),
            };
        case ACTIONS.HIGHLIGHT_NEXT_ITEM:
            return {
                ...state,
                expanded: true,
                highlightedItem: state.expanded
                    ? clamp(state.highlightedItem + 1, 0, state.availableCommandIds.length - 1)
                    : 0,
            };
        case ACTIONS.HIGHLIGHT_PREVIOUS_ITEM:
            return {
                ...state,
                highlightedItem: clamp(state.highlightedItem - 1, 0, state.availableCommandIds.length - 1),
            };
        case ACTIONS.CANCEL:
            // Either cancel current search or traverse to parent group
            return state.searchWord
                ? {
                      ...state,
                      searchWord: '',
                      highlightedItem: 0,
                      availableCommandIds: filterAvailableCommands(state.selectedCommandGroup, '', state.commands),
                  }
                : {
                      ...state,
                      selectedCommandGroup: parentCommandGroup,
                      availableCommandIds: filterAvailableCommands(parentCommandGroup, '', state.commands),
                  };
        case ACTIONS.GO_TO_PARENT_GROUP:
            return {
                ...state,
                highlightedItem: 0,
                selectedCommandGroup: null,
                availableCommandIds: filterAvailableCommands(parentCommandGroup, '', state.commands),
            };
        case ACTIONS.SELECT_GROUP:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                selectedCommandGroup: action.commandId,
                availableCommandIds: filterAvailableCommands(action.commandId, '', state.commands),
            };
        case ACTIONS.UPDATE_SEARCH: {
            return {
                ...state,
                expanded: true,
                searchWord: action.argument,
                highlightedItem: 0,
                availableCommandIds: filterAvailableCommands(
                    state.selectedCommandGroup,
                    action.argument,
                    state.commands
                ),
            };
        }
        case ACTIONS.RUNNING_COMMAND: {
            return {
                ...state,
                runningCommandId: action.commandId,
                runningCommandMessage: action.argument,
            };
        }
        case ACTIONS.FINISHED_COMMAND: {
            return {
                ...state,
                runningCommandId: null,
                runningCommandMessage: null,
            };
        }
        default:
            throw new Error(`Invalid action ${action.type}`);
    }
};

export { commandBarReducer, ACTIONS };
