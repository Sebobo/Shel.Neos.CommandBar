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
    | { type: TRANSITION.EXECUTE_COMMAND; commandId: CommandId; argument: string }
    | { type: TRANSITION.FINISH_COMMAND }
    | { type: TRANSITION.UPDATE_RESULT; result: CommandResult }
    | { type: TRANSITION.EXPAND }
    | { type: TRANSITION.ADD_FAVOURITE; commandId: CommandId }
    | { type: TRANSITION.REMOVE_FAVOURITE; commandId: CommandId };

export type CommandBarState = MachineState & {
    expanded: boolean;
    selectedCommandGroup: CommandId;
    availableCommandIds: CommandId[];
    searchWord: string;
    highlightedItem: number;
    commands: FlatCommandList;
    activeCommandId: CommandId;
    activeCommandMessage: string;
    result: CommandResult | null;
    highlightedOption: number;
    favourites: CommandId[];
    recentlyUsed: CommandId[];
};

const MAX_RECENTLY_USED = 5;

function runAction(action: ACTION, nextState: CommandBarState, event: CommandBarEvent) {
    switch (action) {
        case ACTION.RESET_SEARCH:
            nextState.searchWord = '';
            break;
        case ACTION.RESET_HIGHLIGHT:
            nextState.highlightedItem = 0;
            break;
        case ACTION.REFRESH_COMMANDS:
            nextState.availableCommandIds = filterCommands(
                nextState.selectedCommandGroup,
                nextState.searchWord,
                nextState.commands,
                nextState.favourites
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
            nextState.searchWord = event.searchWord.toLowerCase();
            break;
        case ACTION.EXPAND:
            nextState.expanded = true;
            break;
        case ACTION.SET_ACTIVE_COMMAND:
            assert(event.type === TRANSITION.EXECUTE_COMMAND);
            nextState.activeCommandId = event.commandId;
            nextState.activeCommandMessage = event.argument;
            break;
        case ACTION.UNSET_ACTIVE_COMMAND:
            nextState.activeCommandId = null;
            nextState.activeCommandMessage = null;
            break;
        case ACTION.UPDATE_RESULT:
            assert(event.type === TRANSITION.UPDATE_RESULT);
            nextState.result = {
                ...nextState.result,
                ...event.result,
            };
            break;
        case ACTION.RESET_OPTION_HIGHLIGHT:
            nextState.highlightedOption = 0;
            break;
        case ACTION.RESET_SEARCH_OR_LEAVE_GROUP:
            if (nextState.searchWord) {
                nextState.searchWord = '';
            } else {
                nextState.selectedCommandGroup = nextState.selectedCommandGroup
                    ? nextState.commands[nextState.selectedCommandGroup].parentId
                    : null;
            }
            break;
        case ACTION.UNSET_RESULT:
            nextState.result = null;
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
            if (!nextState.favourites.includes(event.commandId)) {
                nextState.favourites.push(event.commandId);
            }
            break;
        case ACTION.REMOVE_FAVOURITE:
            assert(event.type === TRANSITION.REMOVE_FAVOURITE);
            nextState.favourites = nextState.favourites.filter((id) => id !== event.commandId);
            break;
        case ACTION.ADD_RECENTLY_USED:
            assert(event.type === TRANSITION.EXECUTE_COMMAND);
            if (nextState.recentlyUsed.includes(event.commandId)) {
                nextState.recentlyUsed = nextState.recentlyUsed.filter((id) => id !== event.commandId);
            }
            nextState.recentlyUsed.unshift(event.commandId);
            if (nextState.recentlyUsed.length > MAX_RECENTLY_USED) {
                nextState.recentlyUsed.pop();
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
