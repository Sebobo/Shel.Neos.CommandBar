import React, { CSSProperties, useCallback, useMemo, useRef, useState } from 'react';

import { CommandBarFooter, CommandBarHeader, CommandList, CommandResultsView } from '../index';
import { CommandBarInputProvider, useCommandBarState } from '../../state';
import { clamp } from '../../helpers';

import * as styles from './CommandBarDialog.module.css';

interface CommandBarDialogProps {
    onDrag?: (state: boolean) => void;
    open: boolean;
    toggleOpen: () => void;
}

const CommandBarDialog: React.FC<CommandBarDialogProps> = ({ onDrag, open, toggleOpen }) => {
    const {
        state: { result, expanded },
    } = useCommandBarState();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState<{
        left: string | number;
        top: string | number;
        offsetLeft: number;
        offsetTop: number;
    }>({
        left: '50%',
        top: '50%',
        offsetLeft: 0,
        offsetTop: 0,
    });

    const handleDragStart = useCallback(
        (e) => {
            if (e.target.tagName === 'INPUT') {
                return;
            }
            e.dataTransfer.setData('text/plain', 'CommandBar');
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.effectAllowed = 'move';
            setDragState({
                left: e.clientX,
                top: e.clientY,
                offsetLeft: dialogRef.current.offsetLeft - e.clientX,
                offsetTop: dialogRef.current.offsetTop - e.clientY,
            });
            onDrag && onDrag(true);
        },
        [dialogRef.current]
    );

    const handleDragEnd = useCallback(
        (e) => {
            const { clientX, clientY } = e;
            setIsDragging(false);
            setDragState((prev) => ({
                ...prev,
                left: clamp(clientX, 0, window.innerWidth - (dialogRef.current.offsetWidth / 2 + prev.offsetLeft)),
                top: clamp(clientY, 0, window.innerHeight - (dialogRef.current.offsetHeight / 2 + prev.offsetTop)),
            }));
            onDrag && onDrag(false);
        },
        [dialogRef.current]
    );

    const dialogStyle = useMemo(() => {
        const { left, top, offsetLeft, offsetTop } = dragState;
        return {
            left: typeof left == 'string' ? left : left + offsetLeft + 'px',
            top: typeof top == 'string' ? top : top + offsetTop + 'px',
            visibility: isDragging ? 'hidden' : 'visible',
        } as CSSProperties;
    }, [dragState, isDragging, dialogRef.current]);

    if (!open) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className={[styles.commandBar, result && styles.hasResults].join(' ')}
            open={open}
            draggable
            onDragStart={handleDragStart}
            onDrag={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={dialogStyle}
            data-testid="CommandBarDialog"
        >
            <CommandBarInputProvider toggleOpen={toggleOpen} dialogRef={dialogRef}>
                <CommandBarHeader />
                <div className={[styles.resultsWrap, expanded && styles.expanded, result && styles.split].join(' ')}>
                    <CommandList />
                    <CommandResultsView />
                </div>
                <CommandBarFooter />
            </CommandBarInputProvider>
        </dialog>
    );
};

export default React.memo(CommandBarDialog);
