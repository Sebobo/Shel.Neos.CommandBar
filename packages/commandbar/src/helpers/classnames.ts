export default function classnames(...args: Array<string | undefined>): string {
    return args.filter(Boolean).join(' ');
}
