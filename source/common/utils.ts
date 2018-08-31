
export const readableDuration = (seconds) => {
	if (!Number.isInteger(seconds)) {
		console.log("Invalid parameter provided to readableDuration function.");
		return "0m"
	}
	if (seconds == 0) return "0m";

	const days = Math.floor(seconds / 28800);
	const hours = Math.floor((seconds % 28800) /3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	const format = (amount, postfix, space = '') => amount != 0 ? space + amount + postfix : '';

	return format(days, 'd') + format(hours, 'h', ' ') + format(minutes, 'm', ' ');
}


export const numberOr = (valueToCheck, alternative) => {
    if (Number.isInteger(valueToCheck))
        return valueToCheck;
    else
        return alternative;
};
