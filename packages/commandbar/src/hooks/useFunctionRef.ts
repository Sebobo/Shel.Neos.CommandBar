import { useRef } from 'react';

/**
 * A custom hook that creates a ref for a function, and updates it on every render.
 * The new value is always the same function, but the function's context changes on every render.
 */
export default function useFunctionRef(fn) {
    const fnRef = useRef(fn);
    fnRef.current = fn;
    return fnRef;
}
