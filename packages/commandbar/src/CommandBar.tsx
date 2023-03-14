import React from 'react';

import { CommandBarStateProvider, IntlProvider } from './state';
import CommandBarDialog from './components/CommandBarDialog/CommandBarDialog';

import './Variables.module.css';

type CommandBarProps = {
    commands: HierarchicalCommandList;
    open: boolean;
    toggleOpen: () => void;
    onDrag?: (state: boolean) => void;
    IconComponent: React.FC<IconProps>;
    userPreferences: UserPreferencesService;
    translate: TranslateFunction;
};

const CommandBar: React.FC<CommandBarProps> = ({
    commands,
    open,
    toggleOpen,
    onDrag,
    IconComponent,
    userPreferences,
    translate,
}) => {
    return (
        <IntlProvider translate={translate}>
            <CommandBarStateProvider
                commands={commands}
                IconComponent={IconComponent}
                userPreferences={userPreferences}
            >
                <CommandBarDialog onDrag={onDrag} open={open} toggleOpen={toggleOpen} />
            </CommandBarStateProvider>
        </IntlProvider>
    );
};

export default CommandBar;
