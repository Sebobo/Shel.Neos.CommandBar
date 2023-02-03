import { logger } from '../helpers';

export type MachineStatus = 'loading' | 'idle' | 'searching' | 'executingCommand' | 'displayingResult';

export type MachineTransition =
    | 'LOADED'
    | 'UPDATED_SEARCH_WORD'
    | 'HIGHLIGHTED_NEXT_ITEM'
    | 'HIGHLIGHTED_PREVIOUS_ITEM'
    | 'CANCELED_ACTION'
    | 'RUN_COMMAND'
    | 'RECEIVED_RESULT'
    | 'EXECUTED_COMMAND'
    | 'FINISHED_COMMAND';

export type MachineAction =
    | 'RESET_SEARCH'
    | 'HIGHLIGHT_NEXT_ITEM'
    | 'HIGHLIGHT_PREVIOUS_ITEM'
    | 'CANCEL'
    | 'SELECT_GROUP'
    | 'GO_TO_PARENT_GROUP'
    | 'UPDATE_SEARCH'
    | 'RUN_COMMAND'
    | 'FINISH_COMMAND'
    | 'SHOW_RESULT';

interface MachineDefinition {
    initial: MachineStatus;
    states: {
        [state in MachineStatus]: {
            on: {
                [action in MachineTransition]?:
                    | MachineStatus
                    | {
                          target: MachineStatus;
                          actions?: MachineAction[];
                      };
            };
        };
    };
}

export const machine: MachineDefinition = {
    initial: 'loading',
    states: {
        loading: {
            on: {
                LOADED: 'idle',
            },
        },
        idle: {
            on: {
                UPDATED_SEARCH_WORD: {
                    target: 'searching',
                    actions: ['RESET_SEARCH'],
                },
                HIGHLIGHTED_NEXT_ITEM: 'idle',
                HIGHLIGHTED_PREVIOUS_ITEM: 'idle',
                CANCELED_ACTION: 'idle',
                EXECUTED_COMMAND: 'executingCommand',
            },
        },
        searching: {
            on: {
                UPDATED_SEARCH_WORD: 'searching',
                CANCELED_ACTION: 'idle',
            },
        },
        executingCommand: {
            on: {
                RECEIVED_RESULT: 'displayingResult',
                FINISHED_COMMAND: 'idle',
            },
        },
        displayingResult: {
            on: {
                RECEIVED_RESULT: 'displayingResult',
                FINISHED_COMMAND: 'idle',
                CANCELED_ACTION: 'idle',
            },
        },
    },
};

export interface MachineState {
    status: MachineStatus;
}

type MachineEvent = {
    type: MachineTransition;
};

export function transition(state: MachineState, event: MachineEvent): MachineState {
    let nextStateNode = machine.states[state.status].on?.[event.type] ?? null;

    if (!nextStateNode) {
        logger.error(`No transition found for event ${event.type} in state ${state.status}`);
        nextStateNode = { target: state.status };
    }

    const nextState = {
        ...state,
        status: typeof nextStateNode == 'string' ? nextStateNode : nextStateNode.target,
    } as MachineState;

    nextStateNode.actions?.forEach((action) => {
        switch (action.type) {
            case ACTIONS.RESET_SEARCH:
                nextState.searchWord = '';
                break;
        }
    });

    logger.debug(`Transitioned from ${state.status} to ${nextState.status} with event ${event.type}`);

    return nextState;
}
