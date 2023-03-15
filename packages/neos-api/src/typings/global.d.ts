type SearchNodeResult = {
    name: string;
    nodetype: string;
    contextPath: string;
    icon: string;
    uri: string;
};

// The settings read from the `Neos.Neos.Ui.frontendConfiguration["Shel.Neos.CommandBar:CommandBar"]` configuration
type CommandBarConfig = {
    enabled: boolean;
    features: {
        searchNeosDocs: boolean;
        searchNeosPackages: boolean;
    };
    hotkeys: {
        filter: string[];
    };
};
