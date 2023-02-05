export default function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
    if (condition === false) throw Error(message);
}
