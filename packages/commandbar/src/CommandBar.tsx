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
};

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen, onDrag, IconComponent }) => {
    return (
        <CommandBarStateProvider commands={commands} IconComponent={IconComponent}>
            <CommandBarDialog onDrag={onDrag} open={open} toggleOpen={toggleOpen} />
        </CommandBarStateProvider>
    );
};

export default CommandBar;
