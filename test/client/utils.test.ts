import { readableDuration } from '../../source/common/utils';

test('adds 1 + 2 to equal 3', () => {
	expect(readableDuration(3600)).toBe(" 1h");
});
