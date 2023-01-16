declare module '*.module.css';
declare module '*.module.scss';

type I18nRegistry = {
    translate: (
        id?: string,
        fallback?: string,
        params?: Record<string, unknown> | string[],
        packageKey?: string,
        sourceName?: string
    ) => string;
};

type CRNode = {
    identifier: string;
    contextPath: string;
    name: string;
    nodeType: string;
};

type CommandBarConfig = {
    enabled: boolean;
    hotkeys: {
        filter: string[];
    };
};

type HierarchicalCommandList = Record<CommandId, CommandItem>;
type FlatCommandList = Record<CommandId, ProcessedCommandItem>;

type CommandName = string;
type CommandId = string;

type AbstractCommandItem = {
    name: CommandName;
    icon?: string;
    description?: string;
};

type CommandResult = {
    success: boolean;
    message?: string;
    // TODO: Allow json data or even html as response output
};

type AsyncCommandResult = Promise<void | CommandResult>;
type CommandGeneratorResult = AsyncGenerator<CommandResult, CommandResult, CommandResult>;
type CommandAction = (argument?: string) => AsyncCommandResult;
type CommandGeneratorAction = (argument?: string) => CommandGeneratorResult;

type Command = AbstractCommandItem & {
    action: string | CommandAction | CommandGeneratorAction;
    canHandleQueries?: boolean;
};

type CommandGroup = AbstractCommandItem & {
    subCommands: HierarchicalCommandList;
};

type CommandItem = Command | CommandGroup;
type ProcessedCommandItem = Command & {
    id: CommandId;
    parentId: CommandId | null;
    subCommandIds: CommandId[];
};

type CommandBarState = {
    expanded: boolean;
    selectedCommandGroup: CommandId;
    availableCommandIds: CommandId[];
    searchWord: string;
    highlightedItem: number;
    commands: FlatCommandList;
    runningCommandId: CommandId;
    runningCommandMessage: string;
};

// FIXME: Define type safe action variants
type CommandBarAction = {
    type: ACTIONS;
    argument?: string;
    commandId?: CommandId;
};

type NeosHotKey = {
    id: string;
    description: string;
    action: () => any;
};

type ModuleCommands = {
    sites: CommandGroup;
    modules: CommandGroup;
};

type EditPreviewMode = {
    isEditingMode: boolean;
    isPreviewMode: boolean;
    title: string;
    position: number;
    fusionRenderingPath: string;
};

type EditPreviewModes = Record<string, EditPreviewMode>;
