import { assert, clamp, filterCommands } from '../helpers';
import { ACTION, MachineState, TRANSITION, transition } from './commandBarMachine';

export type CommandBarEvent =
    | { type: TRANSITION.RESET_SEARCH }
    | { type: TRANSITION.HIGHLIGHT_NEXT_ITEM }
    | { type: TRANSITION.HIGHLIGHT_PREVIOUS_ITEM }
    | { type: TRANSITION.CANCEL }
    | { type: TRANSITION.SELECT_GROUP; commandId: string }
    | { type: TRANSITION.GO_TO_PARENT_GROUP }
    | { type: TRANSITION.UPDATE_SEARCH; searchWord: string }
    | { type: TRANSITION.UPDATE_COMMAND_QUERY; commandQuery: string }
    | { type: TRANSITION.EXECUTE_COMMAND; commandId: CommandId; message: string }
    | { type: TRANSITION.FINISH_COMMAND }
    | { type: TRANSITION.UPDATE_RESULT; result: CommandResult }
    | { type: TRANSITION.EXPAND }
    | { type: TRANSITION.ADD_FAVOURITE; commandId: CommandId }
    | { type: TRANSITION.REMOVE_FAVOURITE; commandId: CommandId };

export type CommandBarState = MachineState & {
    activeCommandId: CommandId;
    activeCommandMessage: string;
    availableCommandIds: CommandId[];
    commandQuery: string;
    commands: FlatCommandList;
    expanded: boolean;
    favouriteCommands: CommandId[];
    highlightedItem: number;
    highlightedOption: number;
    recentCommands: CommandId[];
    result: CommandResult | null;
    resultCommandId: CommandId;
    searchWord: string;
    selectedCommandGroup: CommandId;
    showBranding: boolean;
};

const MAX_RECENTLY_USED = 5;

function runAction(action: ACTION, nextState: CommandBarState, event: CommandBarEvent) {
    switch (action) {
        case ACTION.RESET_SEARCH:
            nextState.searchWord = '';
            nextState.commandQuery = '';
            break;
        case ACTION.RESET_HIGHLIGHT:
            nextState.highlightedItem = 0;
            break;
        case ACTION.REFRESH_COMMANDS:
            nextState.availableCommandIds = filterCommands(
                nextState.selectedCommandGroup,
                nextState.searchWord,
                nextState.commands,
                nextState.favouriteCommands,
                nextState.recentCommands
            );
            break;
        case ACTION.HIGHLIGHT_NEXT_COMMAND:
            nextState.highlightedItem = clamp(
                nextState.highlightedItem + 1,
                0,
                nextState.availableCommandIds.length - 1
            );
            break;
        case ACTION.HIGHLIGHT_PREVIOUS_COMMAND:
            nextState.highlightedItem = clamp(
                nextState.highlightedItem - 1,
                0,
                nextState.availableCommandIds.length - 1
            );
            break;
        case ACTION.HIGHLIGHT_NEXT_OPTION:
            nextState.highlightedOption = clamp(
                nextState.highlightedOption + 1,
                0,
                Object.keys(nextState.result.options).length - 1
            );
            break;
        case ACTION.HIGHLIGHT_PREVIOUS_OPTION:
            nextState.highlightedOption = clamp(
                nextState.highlightedOption - 1,
                0,
                Object.keys(nextState.result.options).length - 1
            );
            break;
        case ACTION.SET_SEARCH_WORD:
            assert(event.type === TRANSITION.UPDATE_SEARCH);
            nextState.searchWord = event.searchWord;
            break;
        case ACTION.SET_COMMAND_QUERY:
            assert(event.type === TRANSITION.UPDATE_COMMAND_QUERY);
            nextState.commandQuery = event.commandQuery;
            break;
        case ACTION.EXPAND:
            nextState.expanded = true;
            break;
        case ACTION.SET_ACTIVE_COMMAND:
            assert(event.type === TRANSITION.EXECUTE_COMMAND);
            nextState.activeCommandId = event.commandId;
            nextState.activeCommandMessage = event.message;
            break;
        case ACTION.UNSET_ACTIVE_COMMAND:
            nextState.activeCommandId = null;
            nextState.activeCommandMessage = null;
            break;
        case ACTION.UPDATE_RESULT:
            assert(event.type === TRANSITION.UPDATE_RESULT);
            assert(typeof event.result.success === 'boolean');
            nextState.result = {
                options: {},
                message: 'Command executed',
                view: null,
                success: false,
                ...event.result,
            };
            nextState.resultCommandId = nextState.activeCommandId;
            break;
        case ACTION.RESET_OPTION_HIGHLIGHT:
            nextState.highlightedOption = 0;
            break;
        case ACTION.RESET_SEARCH_OR_LEAVE_GROUP:
            if (nextState.commandQuery) {
                nextState.commandQuery = '';
            } else if (nextState.searchWord) {
                nextState.searchWord = '';
            } else {
                nextState.selectedCommandGroup = nextState.selectedCommandGroup
                    ? nextState.commands[nextState.selectedCommandGroup].parentId
                    : null;
            }
            break;
        case ACTION.UNSET_RESULT:
            nextState.result = null;
            nextState.resultCommandId = null;
            break;
        case ACTION.LEAVE_GROUP:
            nextState.selectedCommandGroup = nextState.selectedCommandGroup
                ? nextState.commands[nextState.selectedCommandGroup].parentId
                : null;
            break;
        case ACTION.SET_GROUP:
            assert(event.type === TRANSITION.SELECT_GROUP);
            nextState.selectedCommandGroup = event.commandId;
            break;
        case ACTION.ADD_FAVOURITE:
            assert(event.type === TRANSITION.ADD_FAVOURITE);
            if (!nextState.favouriteCommands.includes(event.commandId)) {
                nextState.favouriteCommands.push(event.commandId);
            }
            break;
        case ACTION.REMOVE_FAVOURITE:
            assert(event.type === TRANSITION.REMOVE_FAVOURITE);
            nextState.favouriteCommands = nextState.favouriteCommands.filter((id) => id !== event.commandId);
            break;
        case ACTION.ADD_RECENTLY_USED:
            assert(event.type === TRANSITION.EXECUTE_COMMAND);
            // Only add to recently used if the command has an action
            if (!nextState.commands[event.commandId].action) {
                break;
            }
            if (nextState.recentCommands.includes(event.commandId)) {
                nextState.recentCommands = nextState.recentCommands.filter((id) => id !== event.commandId);
            }
            nextState.recentCommands.unshift(event.commandId);
            if (nextState.recentCommands.length > MAX_RECENTLY_USED) {
                nextState.recentCommands.pop();
            }
            break;
        default:
            throw Error(`Action ${action} not implemented`);
    }
}

const commandBarReducer = (state: CommandBarState, event: CommandBarEvent): CommandBarState => {
    return transition(state, event, runAction) as CommandBarState;
};

export { commandBarReducer };
