import { logger } from '../helpers';

export enum STATUS {
    COLLAPSED = 'collapsed',
    IDLE = 'idle',
    EXECUTING_COMMAND = 'executingCommand',
    DISPLAYING_RESULT = 'displayingResult',
}

export enum TRANSITION {
    RESET_SEARCH = 'RESET_SEARCH',
    HIGHLIGHT_NEXT_ITEM = 'HIGHLIGHT_NEXT_ITEM',
    HIGHLIGHT_PREVIOUS_ITEM = 'HIGHLIGHT_PREVIOUS_ITEM',
    CANCEL = 'CANCEL',
    SELECT_GROUP = 'SELECT_GROUP',
    GO_TO_PARENT_GROUP = 'GO_TO_PARENT_GROUP',
    UPDATE_SEARCH = 'UPDATE_SEARCH',
    UPDATE_COMMAND_QUERY = 'UPDATE_COMMAND_QUERY',
    EXECUTE_COMMAND = 'EXECUTE_COMMAND',
    FINISH_COMMAND = 'FINISH_COMMAND',
    UPDATE_RESULT = 'UPDATE_RESULT',
    EXPAND = 'EXPAND',
    ADD_FAVOURITE = 'ADD_FAVOURITE',
    REMOVE_FAVOURITE = 'REMOVE_FAVOURITE',
}

export enum ACTION {
    ADD_FAVOURITE = 'ADD_FAVOURITE',
    ADD_RECENTLY_USED = 'ADD_RECENTLY_USED',
    EXPAND = 'EXPAND',
    HIGHLIGHT_NEXT_COMMAND = 'HIGHLIGHT_NEXT_COMMAND',
    HIGHLIGHT_NEXT_OPTION = 'HIGHLIGHT_NEXT_OPTION',
    HIGHLIGHT_PREVIOUS_COMMAND = 'HIGHLIGHT_PREVIOUS_COMMAND',
    HIGHLIGHT_PREVIOUS_OPTION = 'HIGHLIGHT_PREVIOUS_OPTION',
    LEAVE_GROUP = 'LEAVE_GROUP',
    REFRESH_COMMANDS = 'REFRESH_COMMANDS',
    REMOVE_FAVOURITE = 'REMOVE_FAVOURITE',
    RESET_HIGHLIGHT = 'RESET_HIGHLIGHT',
    RESET_OPTION_HIGHLIGHT = 'RESET_OPTION_HIGHLIGHT',
    RESET_SEARCH = 'RESET_SEARCH',
    RESET_SEARCH_OR_LEAVE_GROUP = 'RESET_SEARCH_OR_LEAVE_GROUP',
    SET_ACTIVE_COMMAND = 'SET_ACTIVE_COMMAND',
    SET_COMMAND_QUERY = 'SET_COMMAND_QUERY',
    SET_GROUP = 'SET_GROUP',
    SET_SEARCH_WORD = 'SET_SEARCH_WORD',
    UNSET_ACTIVE_COMMAND = 'UNSET_ACTIVE_COMMAND',
    UNSET_RESULT = 'UNSET_RESULT',
    UPDATE_RESULT = 'UPDATE_RESULT',
}

interface MachineDefinition {
    initial: STATUS;
    states: {
        [state in STATUS]: {
            on: {
                [transition in TRANSITION]?:
                    | STATUS
                    | {
                          target: STATUS;
                          actions?: ACTION[];
                      };
            };
        };
    };
}

export const machine: MachineDefinition = {
    initial: STATUS.COLLAPSED,
    states: {
        collapsed: {
            on: {
                UPDATE_SEARCH: {
                    target: STATUS.IDLE,
                    actions: [ACTION.EXPAND, ACTION.SET_SEARCH_WORD, ACTION.REFRESH_COMMANDS],
                },
                HIGHLIGHT_NEXT_ITEM: {
                    target: STATUS.IDLE,
                    actions: [ACTION.REFRESH_COMMANDS, ACTION.EXPAND],
                },
                EXPAND: {
                    target: STATUS.IDLE,
                    actions: [ACTION.REFRESH_COMMANDS, ACTION.EXPAND],
                },
            },
        },
        idle: {
            on: {
                UPDATE_SEARCH: {
                    target: STATUS.IDLE,
                    actions: [ACTION.SET_SEARCH_WORD, ACTION.RESET_HIGHLIGHT, ACTION.REFRESH_COMMANDS],
                },
                HIGHLIGHT_NEXT_ITEM: {
                    target: STATUS.IDLE,
                    actions: [ACTION.HIGHLIGHT_NEXT_COMMAND],
                },
                HIGHLIGHT_PREVIOUS_ITEM: {
                    target: STATUS.IDLE,
                    actions: [ACTION.HIGHLIGHT_PREVIOUS_COMMAND],
                },
                CANCEL: {
                    target: STATUS.IDLE,
                    actions: [ACTION.RESET_HIGHLIGHT, ACTION.RESET_SEARCH_OR_LEAVE_GROUP, ACTION.REFRESH_COMMANDS],
                },
                EXECUTE_COMMAND: {
                    target: STATUS.EXECUTING_COMMAND,
                    actions: [ACTION.ADD_RECENTLY_USED, ACTION.SET_ACTIVE_COMMAND, ACTION.REFRESH_COMMANDS],
                },
                GO_TO_PARENT_GROUP: {
                    target: STATUS.IDLE,
                    actions: [ACTION.RESET_HIGHLIGHT, ACTION.LEAVE_GROUP, ACTION.REFRESH_COMMANDS],
                },
                SELECT_GROUP: {
                    target: STATUS.IDLE,
                    actions: [ACTION.RESET_SEARCH, ACTION.RESET_HIGHLIGHT, ACTION.SET_GROUP, ACTION.REFRESH_COMMANDS],
                },
                ADD_FAVOURITE: {
                    target: STATUS.IDLE,
                    actions: [ACTION.ADD_FAVOURITE, ACTION.REFRESH_COMMANDS],
                },
                REMOVE_FAVOURITE: {
                    target: STATUS.IDLE,
                    actions: [ACTION.REMOVE_FAVOURITE, ACTION.REFRESH_COMMANDS],
                },
            },
        },
        executingCommand: {
            on: {
                UPDATE_RESULT: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.UPDATE_RESULT],
                },
                FINISH_COMMAND: {
                    target: STATUS.IDLE,
                    actions: [ACTION.UNSET_ACTIVE_COMMAND],
                },
            },
        },
        displayingResult: {
            on: {
                UPDATE_COMMAND_QUERY: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.SET_COMMAND_QUERY],
                },
                UPDATE_RESULT: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.UPDATE_RESULT, ACTION.RESET_OPTION_HIGHLIGHT],
                },
                HIGHLIGHT_NEXT_ITEM: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.HIGHLIGHT_NEXT_OPTION],
                },
                HIGHLIGHT_PREVIOUS_ITEM: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.HIGHLIGHT_PREVIOUS_OPTION],
                },
                EXECUTE_COMMAND: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.SET_ACTIVE_COMMAND],
                },
                CANCEL: {
                    target: STATUS.IDLE,
                    actions: [ACTION.UNSET_RESULT, ACTION.UNSET_ACTIVE_COMMAND, ACTION.RESET_OPTION_HIGHLIGHT],
                },
                FINISH_COMMAND: {
                    target: STATUS.DISPLAYING_RESULT,
                    actions: [ACTION.UNSET_ACTIVE_COMMAND],
                },
            },
        },
    },
};

export interface MachineState {
    status: STATUS;
}

type MachineEvent = {
    type: TRANSITION;
    payload?: any;
};

export function transition(
    state: MachineState,
    event: MachineEvent,
    actionCallback?: (action: ACTION, nextState: MachineState, event: MachineEvent) => void
): MachineState {
    let nextStateNode = machine.states[state.status].on?.[event.type] ?? null;

    if (!nextStateNode) {
        logger.error(`No transition found for event "${event.type}" in state "${state.status}"`);
        nextStateNode = { target: state.status };
    }

    const nextState = {
        ...state,
        status: typeof nextStateNode == 'string' ? nextStateNode : nextStateNode.target,
    } as MachineState;

    if (actionCallback && typeof nextStateNode == 'object') {
        nextStateNode.actions?.forEach((action) => actionCallback(action, nextState, event));
    }

    logger.debug(`Transitioned from "${state.status}" to "${nextState.status}" with event "${event.type}"`);

    return nextState;
}
