import { readableDuration } from "../source/common/utils";

test('readable duration 3600s is 1h', () => {
	expect(readableDuration(3600)).toBe(" 1h");
});
