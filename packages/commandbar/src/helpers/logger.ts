const PREFIX = '%c[COMMANDBAR]';

const logger = {
    ok: (message: string, ...args: any[]) => console.log(PREFIX, 'color: green', message, ...args),
    error: (message: string, ...args: any[]) => console.log(PREFIX, 'color: red', message, ...args),
    warn: (message: string, ...args: any[]) => console.warn(PREFIX, 'color: orange', message, ...args),
    debug:
        // @ts-ignore
        process.env.NODE_ENV === 'production'
            ? () => null
            : (message: string, ...args: any[]) => console.debug(PREFIX, 'color: lightblue', message, ...args),
};

export default logger;
