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

type Command = AbstractCommandItem & {
    action: string | (() => void);
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
