
interface Array<T> {
    zip(array: T): Array<T>;
    flatMap<E>(callback: (t: T) => Array<E>): Array<E>;
    //scan(callback: () => void, initialValue: T) : Array<T>;
}

