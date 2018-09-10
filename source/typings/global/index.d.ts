
//declare module 'node-fetch';

interface Array<T> {
    zip<D>(array: Array<D>): Array<[T, D]>;
    flatMap<E>(callback: (t: T) => Array<E>): Array<E>;
    //scan(callback: () => void, initialValue: T) : Array<T>;
}

