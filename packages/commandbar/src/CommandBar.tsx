import React from 'react';

import { CommandBarStateProvider } from './state';
import CommandBarDialog from './components/CommandBarDialog/CommandBarDialog';

import './Variables.module.css';

type CommandBarProps = {
    commands: HierarchicalCommandList;
    open: boolean;
    toggleOpen: () => void;
    onDrag?: (state: boolean) => void;
};

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen, onDrag }) => {
    return (
        <CommandBarStateProvider commands={commands}>
            <CommandBarDialog onDrag={onDrag} open={open} toggleOpen={toggleOpen} />
        </CommandBarStateProvider>
    );
};

export default CommandBar;
