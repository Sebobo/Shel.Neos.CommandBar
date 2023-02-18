import React from 'react';

import { CommandBarStateProvider } from './state';
import CommandBarDialog from './components/CommandBarDialog/CommandBarDialog';

import './Variables.module.css';

type CommandBarProps = {
    commands: HierarchicalCommandList;
    open: boolean;
    toggleOpen: () => void;
    onDrag?: (state: boolean) => void;
    IconComponent: React.FC<IconProps>;
    userPreferencesService: UserPreferencesService;
};

const CommandBar: React.FC<CommandBarProps> = ({
    commands,
    open,
    toggleOpen,
    onDrag,
    IconComponent,
    userPreferencesService,
}) => {
    return (
        <CommandBarStateProvider
            commands={commands}
            IconComponent={IconComponent}
            userPreferencesService={userPreferencesService}
        >
            <CommandBarDialog onDrag={onDrag} open={open} toggleOpen={toggleOpen} />
        </CommandBarStateProvider>
    );
};

export default CommandBar;
