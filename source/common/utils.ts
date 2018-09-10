
export const getNumberFromLocalStorage = (name: string): number|undefined => {
    const value = window.localStorage.getItem(name);
    if (value)
        return parseInt(name);
    else
        return undefined;
}

export const readableTime = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('pl', {hour12: false});
};

export const readableDuration = (seconds: number): string => {
	if (seconds == 0) return "0m";

	const days = Math.floor(seconds / 28800);
	const hours = Math.floor((seconds % 28800) /3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	const format = (amount: number, postfix: string, space = '') => amount != 0 ? space + amount + postfix : '';

	return format(days, 'd') + format(hours, 'h', ' ') + format(minutes, 'm', ' ');
}


export const numberOr = (valueToCheck: any, alternative: number): number => {
    if (Number.isInteger(valueToCheck))
        return valueToCheck;
    else
        return alternative;
};

export type Lazy<T> = () => T;

export const ifElse = <T, F>(expr: boolean, t: Lazy<T>, f: Lazy<F>) =>
    expr ? t() : f();

export const orElse = <T>(optional : T|undefined, elseValue: T) => {
    if (optional)
        return optional;
    else
        return elseValue;
}

export const orElseNull = <T>(optional : T|null, elseValue: T) => {
    if (optional)
        return optional;
    else
        return elseValue;
}


Array.prototype.zip = function(array: any): any {
    return this.map( (element, index) => [element, array[index]]);
}


Object.defineProperty(Array.prototype, 'flatMap', {
    value: function(f: Function) {
        return this.reduce((ys: any, x: any) => {
            return ys.concat(f.call(this, x))
        }, [])
    },
    enumerable: false,
})
