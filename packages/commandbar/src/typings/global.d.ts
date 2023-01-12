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

type CommandList = Record<name, CommandItem>;

type AbstractCommandItem = {
    name: string;
    icon?: string;
    description?: string;
};

type CommandAction = (argument?: string) => void;

type Command = AbstractCommandItem & {
    action: string | CommandAction;
    canHandleQueries?: boolean;
};

type CommandGroup = AbstractCommandItem & {
    children: CommandList;
};

type CommandItem = Command | CommandGroup;

type CommandBarState = {
    expanded: boolean;
    selectedGroup: CommandGroup;
    searchWord: string;
    highlightedItem: number;
    availableCommandNames: string[];
    commands: CommandList;
};

// FIXME: Define type safe action variants
type CommandBarAction = {
    type: ACTIONS;
    searchWord?: string;
    command?: CommandGroup;
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
