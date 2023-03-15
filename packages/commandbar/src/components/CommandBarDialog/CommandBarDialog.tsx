import React, { CSSProperties, DragEventHandler, useCallback, useEffect, useRef } from 'react';
import { batch, useComputed, useSignal } from '@preact/signals';

import { CommandBarFooter, CommandBarHeader, CommandList, CommandResultsView } from '../index';
import { CommandBarExecutor, useCommandBarState } from '../../state';
import { clamp, classnames } from '../../helpers';

import * as styles from './CommandBarDialog.module.css';

interface CommandBarDialogProps {
    onDrag?: (state: boolean) => void;
    open: boolean;
    toggleOpen: () => void;
}

const CommandBarDialog: React.FC<CommandBarDialogProps> = ({ onDrag, open, toggleOpen }) => {
    const {
        state: { expanded, result },
    } = useCommandBarState();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const isDragging = useSignal(false);
    const dialogPosition = useSignal<{
        left: number;
        top: number;
    }>({
        left: window.innerWidth / 2 - 300,
        top: window.innerHeight / 2 - 20,
    });
    const dragStateOffset = useSignal<{
        offsetLeft: number;
        offsetTop: number;
    }>({
        offsetLeft: 0,
        offsetTop: 0,
    });
    const hasBeenDragged = useSignal(false);

    const dialogStyle = useComputed(() => {
        const { left, top } = dialogPosition.value;
        return (
            hasBeenDragged
                ? {
                      left: left + 'px',
                      top: top + 'px',
                      translate: 'none',
                      visibility: isDragging.value ? 'hidden' : 'visible',
                  }
                : {}
        ) as CSSProperties;
    });

    const reposition = useCallback((left: number, top: number) => {
        const dialogSize = dialogRef.current.getBoundingClientRect();
        dialogPosition.value = {
            left: clamp(left, 0, window.innerWidth - dialogSize.width),
            top: clamp(top, 0, window.innerHeight - dialogSize.height),
        };
    }, []);

    const handleDragStart: DragEventHandler<HTMLDialogElement> = useCallback(
        (e) => {
            // @ts-ignore
            if (e.target.tagName === 'INPUT') {
                return;
            }
            console.debug('dragstart');
            e.dataTransfer.setData('text/plain', 'CommandBar');
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.effectAllowed = 'move';

            batch(() => {
                dragStateOffset.value = {
                    offsetLeft: e.clientX - dialogRef.current.offsetLeft,
                    offsetTop: e.clientY - dialogRef.current.offsetTop,
                };
                hasBeenDragged.value = true;
            });

            onDrag && onDrag(true);
        },
        [dialogRef.current]
    );

    const handleDragDrop = useCallback(
        (e: DragEvent) => {
            const { clientX, clientY } = e;
            console.debug('dragdrop', clientX, clientY, dragStateOffset.value);
            batch(() => {
                isDragging.value = false;
                reposition(clientX - dragStateOffset.value.offsetLeft, clientY - dragStateOffset.value.offsetTop);
            });
            onDrag && onDrag(false);
        },
        [dialogRef.current]
    );

    const onResize = useCallback(() => reposition(dialogPosition.value.left, dialogPosition.value.top), []);

    useEffect(() => {
        if (!open) return;
        dialogRef.current.parentElement.addEventListener('drop', handleDragDrop);
        window.addEventListener('resize', onResize);
        return () => {
            dialogRef.current.parentElement.removeEventListener('drop', handleDragDrop);
            window.removeEventListener('resize', onResize);
        };
    }, [open, onResize, handleDragDrop]);

    if (!open) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className={classnames(styles.commandBar, result.value && styles.hasResults)}
            open={open}
            draggable
            onDragStart={handleDragStart}
            onDrag={() => (isDragging.value = true)}
            style={dialogStyle.value}
            data-testid="CommandBarDialog"
        >
            <CommandBarExecutor toggleOpen={toggleOpen} dialogRef={dialogRef} open={open}>
                <CommandBarHeader />
                <div
                    className={classnames(
                        styles.resultsWrap,
                        expanded.value && styles.expanded,
                        result.value && styles.split
                    )}
                >
                    {expanded.value && <CommandList />}
                    {result.value && <CommandResultsView />}
                </div>
                <CommandBarFooter />
            </CommandBarExecutor>
        </dialog>
    );
};

export default CommandBarDialog;
