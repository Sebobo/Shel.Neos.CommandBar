import FuzzySearch from 'fuzzy-search';
import { clamp } from '../helpers';
import { MachineState, transition } from './commandBarMachine';

// Dispatch-able actions for the command bar reducer
type CommandBarAction =
    | { type: ACTIONS.RESET_SEARCH }
    | { type: ACTIONS.HIGHLIGHT_NEXT_ITEM }
    | { type: ACTIONS.HIGHLIGHT_PREVIOUS_ITEM }
    | { type: ACTIONS.CANCEL }
    | { type: ACTIONS.SELECT_GROUP; commandId: string }
    | { type: ACTIONS.GO_TO_PARENT_GROUP }
    | { type: ACTIONS.UPDATE_SEARCH; searchWord: string }
    | { type: ACTIONS.RUN_COMMAND; commandId: CommandId; argument: string }
    | { type: ACTIONS.FINISH_COMMAND }
    | { type: ACTIONS.SHOW_RESULT; result: CommandResult };

type CommandBarState = MachineState & {
    expanded: boolean;
    selectedCommandGroup: CommandId;
    availableCommandIds: CommandId[];
    searchWord: string;
    highlightedItem: number;
    commands: FlatCommandList;
    runningCommandId: CommandId;
    runningCommandMessage: string;
    result: CommandResult | null;
    highlightedResultItem: number;
};

function filterAvailableCommands(
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

const commandBarReducer = (state: CommandBarState, action: CommandBarAction): CommandBarState => {
    // The parent command group of the currently selected command group which is used in several actions
    const parentCommandGroup = state.selectedCommandGroup ? state.commands[state.selectedCommandGroup].parentId : null;

    const newState = transition(state, action);

    switch (action.type) {
        case ACTIONS.RESET_SEARCH:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                availableCommandIds: filterAvailableCommands(state.selectedCommandGroup, '', state.commands),
                result: null,
            };
        case ACTIONS.HIGHLIGHT_NEXT_ITEM:
            if (state.result) {
                return {
                    ...state,
                    highlightedResultItem: clamp(
                        state.highlightedResultItem + 1,
                        0,
                        Object.keys(state.result.options).length - 1
                    ),
                };
            }
            return {
                ...state,
                expanded: true,
                highlightedItem: state.expanded
                    ? clamp(state.highlightedItem + 1, 0, state.availableCommandIds.length - 1)
                    : 0,
            };
        case ACTIONS.HIGHLIGHT_PREVIOUS_ITEM:
            if (state.result) {
                return {
                    ...state,
                    highlightedResultItem: clamp(
                        state.highlightedResultItem - 1,
                        0,
                        Object.keys(state.result.options).length - 1
                    ),
                };
            }
            return {
                ...state,
                highlightedItem: clamp(state.highlightedItem - 1, 0, state.availableCommandIds.length - 1),
            };
        case ACTIONS.CANCEL:
            // Either leave the result view, cancel current search,  or traverse to parent group
            return state.result
                ? {
                      ...state,
                      result: null,
                      highlightedResultItem: 0,
                  }
                : state.searchWord
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
                result: null,
            };
        case ACTIONS.SELECT_GROUP:
            return {
                ...state,
                searchWord: '',
                highlightedItem: 0,
                selectedCommandGroup: action.commandId,
                availableCommandIds: filterAvailableCommands(action.commandId, '', state.commands),
                result: null,
            };
        case ACTIONS.UPDATE_SEARCH: {
            return {
                ...state,
                expanded: true,
                searchWord: action.searchWord,
                highlightedItem: 0,
                availableCommandIds: filterAvailableCommands(
                    state.selectedCommandGroup,
                    action.searchWord,
                    state.commands
                ),
            };
        }
        case ACTIONS.RUN_COMMAND: {
            return {
                ...state,
                runningCommandId: action.commandId,
                runningCommandMessage: action.argument,
            };
        }
        case ACTIONS.FINISH_COMMAND: {
            return {
                ...state,
                runningCommandId: null,
                runningCommandMessage: null,
            };
        }
        case ACTIONS.SHOW_RESULT: {
            return {
                ...state,
                result: {
                    ...action.result,
                },
                highlightedResultItem: 0,
            };
        }
    }
    throw new Error(`Invalid action ${JSON.stringify(action)}`);
};

export { commandBarReducer, ACTIONS };
