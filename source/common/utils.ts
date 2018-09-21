
export const getNumberFromLocalStorage = (name: string): number|undefined => {
    const value = window.localStorage.getItem(name);
    if (value)
        return parseInt(value);
    else
        return undefined;
}

export const readableTime = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('pl-PL', {hour12: false});
};

export const readableDuration = (seconds: number): string => {
	if (seconds == 0) return "0m";
	const days = Math.floor(seconds / 28800);
	const hours = Math.floor((seconds % 28800) /3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const str = `${days != 0 ? days + 'd ' : ''}${hours != 0 ? hours + 'h ' : ''}${minutes != 0 ? minutes + 'm ' : ''}`;
    return str.trim();
};

export const numberOr = (valueToCheck: any, alternative: number): number => {
    if (Number.isInteger(valueToCheck))
        return valueToCheck;
    else
        return alternative;
};

export type Lazy<T> = () => T;

export const ifElse = <T, F>(expr: boolean, t: Lazy<T>, f: Lazy<F>) =>
    expr ? t() : f();

export const orElse = <T>(optional : T|undefined, elseF: Lazy<T>) => {
    if (optional)
        return optional;
    else
        return elseF();
}

export const zip = <A, B>(arrayA: Array<A>, arrayB: Array<B>): Array<[A, B]> => {
    return arrayA.map(
        (element: A, index: number): [A, B] => [element, arrayB[index]]
    );
};

export const flatMap = <A, B>(array: Array<A>, callback: (t: A) => Array<B>): Array<B> => {
    return array.reduce(
        (result: Array<B>, item: A) => {
            return result.concat(callback(item));
        },
        []
    );
};
