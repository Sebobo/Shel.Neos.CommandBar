const logger = {
    ok: (message: string, ...args: any[]) => console.log(`%c${message}`, 'color: green', ...args),
    error: (message: string, ...args: any[]) => console.log(`%c${message}`, 'color: red', ...args),
    warn: (message: string, ...args: any[]) => console.warn(`%c${message}`, 'color: orange', ...args),
    debug:
        // @ts-ignore
        process.env.NODE_ENV === 'production'
            ? () => null
            : (message: string, ...args: any[]) => console.debug(`%c${message}`, 'color: blue', ...args),
};

export default logger;
