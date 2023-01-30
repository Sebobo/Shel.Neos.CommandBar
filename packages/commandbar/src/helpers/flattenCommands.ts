/**
 * This method converts the hierarchical command list into a flat list of commands which is more convenient
 * for internal processing, whereas the hierarchical command list is more convenient for the user.
 */
export default function flattenCommands(
    commands: HierarchicalCommandList,
    parentId: CommandId = null
): FlatCommandList {
    return Object.keys(commands).reduce((commandList, commandId) => {
        const { icon, description, name, subCommands, action, canHandleQueries } = commands[commandId] as Command &
            CommandGroup;

        // Create an uniquely identifiable command id for the flat command list
        const absoluteCommandId = parentId ? `${parentId}.${commandId}` : commandId;

        // Create list of available subcommand names
        const subCommandIds = subCommands
            ? Object.keys(subCommands).map((subCommandId) => `${absoluteCommandId}.${subCommandId}`)
            : [];

        // Insert the processed command into the flat command list
        commandList[absoluteCommandId] = {
            id: absoluteCommandId,
            name,
            icon,
            description,
            action,
            canHandleQueries,
            subCommandIds,
            parentId,
        };

        // Insert subcommands into the list
        if (subCommandIds.length > 0) {
            return {
                ...commandList,
                ...flattenCommands(subCommands, absoluteCommandId),
            };
        }
        return commandList;
    }, {} as FlatCommandList);
}
