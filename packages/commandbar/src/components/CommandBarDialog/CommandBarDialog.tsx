import React, { CSSProperties, useCallback, useEffect, useRef } from 'react';
import { batch, signal, useComputed } from '@preact/signals';

import { CommandBarFooter, CommandBarHeader, CommandList, CommandResultsView } from '../index';
import { CommandBarInputProvider, useCommandBarState } from '../../state';
import { clamp } from '../../helpers';

import * as styles from './CommandBarDialog.module.css';

interface CommandBarDialogProps {
    onDrag?: (state: boolean) => void;
    open: boolean;
    toggleOpen: () => void;
}

const isDragging = signal(false);
const dragState = signal<{
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

const CommandBarDialog: React.FC<CommandBarDialogProps> = ({ onDrag, open, toggleOpen }) => {
    const {
        state: { expanded, result },
    } = useCommandBarState();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const dialogStyle = useComputed(() => {
        const { left, top, offsetLeft, offsetTop } = dragState.value;
        return {
            left: typeof left == 'string' ? left : left + offsetLeft + 'px',
            top: typeof top == 'string' ? top : top + offsetTop + 'px',
            visibility: isDragging.value ? 'hidden' : 'visible',
        } as CSSProperties;
    });

    const reposition = useCallback((left: number | string, top: number | string) => {
        if (typeof left == 'string' || typeof top == 'string') return;
        dragState.value = {
            ...dragState.value,
            left: clamp(
                left,
                dialogRef.current.offsetWidth / 2 - dragState.value.offsetLeft,
                window.innerWidth - (dialogRef.current.offsetWidth / 2 + dragState.value.offsetLeft)
            ),
            top: clamp(
                top,
                dialogRef.current.offsetHeight / 2 - dragState.value.offsetTop,
                window.innerHeight - (dialogRef.current.offsetHeight / 2 + dragState.value.offsetTop)
            ),
        };
    }, []);

    const handleDragStart = useCallback(
        (e) => {
            if (e.target.tagName === 'INPUT') {
                return;
            }
            e.dataTransfer.setData('text/plain', 'CommandBar');
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.effectAllowed = 'move';
            dragState.value = {
                left: e.clientX,
                top: e.clientY,
                offsetLeft: dialogRef.current.offsetLeft - e.clientX,
                offsetTop: dialogRef.current.offsetTop - e.clientY,
            };
            onDrag && onDrag(true);
        },
        [dialogRef.current]
    );

    const handleDragEnd = useCallback(
        (e) => {
            const { clientX, clientY } = e;
            batch(() => {
                isDragging.value = false;
                reposition(clientX, clientY);
            });
            onDrag && onDrag(false);
        },
        [dialogRef.current]
    );

    const onResize = useCallback(() => reposition(dragState.value.left, dragState.value.top), []);

    useEffect(() => {
        if (!open) return;
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className={[styles.commandBar, result.value && styles.hasResults].join(' ')}
            open={open}
            draggable
            onDragStart={handleDragStart}
            onDrag={() => (isDragging.value = true)}
            onDragEnd={handleDragEnd}
            style={dialogStyle.value}
            data-testid="CommandBarDialog"
        >
            <CommandBarInputProvider toggleOpen={toggleOpen} dialogRef={dialogRef} open={open}>
                <CommandBarHeader />
                <div
                    className={[
                        styles.resultsWrap,
                        expanded.value && styles.expanded,
                        result.value && styles.split,
                    ].join(' ')}
                >
                    <CommandList />
                    <CommandResultsView />
                </div>
                <CommandBarFooter />
            </CommandBarInputProvider>
        </dialog>
    );
};

export default CommandBarDialog;
