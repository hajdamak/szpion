import {flatMap, numberOr, orElse, readableDuration, zip, ifElse} from "../source/common/utils";

test('readableDuration', () => {
	expect(readableDuration(0)).toBe("0m");
	expect(readableDuration(3600)).toBe("1h");
	expect(readableDuration(4500)).toBe("1h 15m");
	expect(readableDuration(28800)).toBe("1d");
	expect(readableDuration(28800)).toBe("1d");
	expect(readableDuration(45000)).toBe("1d 4h 30m");
	expect(readableDuration(629100)).toBe("21d 6h 45m");
});

// test('readableTime', () => {
//     expect(readableTime("2018-08-30T13:35:00.000Z")).toBe("30/08/2018, 15:35:00");
// });

test('numberOr', () => {
	expect(numberOr(9, 4)).toBe(9);
	expect(numberOr("dfsada", 7)).toBe(7);
	expect(numberOr("4", 5)).toBe(5);
});

test('ifElse', () => {
	expect(ifElse(true, () => "true", () => "false")).toBe("true");
	expect(ifElse(false, () => "true", () => "false")).toBe("false");
});

test('orElse', () => {
	expect(orElse(undefined, () => "default")).toBe("default");
	expect(orElse("test", () => "default")).toBe("test");
	expect(orElse(7, () => 8)).toBe(7);
});

test('zip', () => {
	expect(
		zip([], [])
	).toEqual(
		[]
	);
	expect(
		zip([1, 2, 3], ["A", "B", "C"])
	).toEqual(
		[[1, "A"], [2, "B"], [3, "C"]]
	);
});

test('flatMap', () => {
	expect(
		flatMap([], item => [item, `i${item}`])
	).toEqual(
		[]
	);
	expect(
		flatMap([1, 2, 3], item => [item, `i${item}`])
	).toEqual(
		[1, "i1", 2, "i2", 3, "i3"]
	);
});
