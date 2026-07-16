import { test, describe, expect } from '@jest/globals';
import { RegexToDFA } from '../RegexToDFA';
import { DFA } from '../DFA';
import { MaskHelper } from '../MaskHelper';

describe('Test out generation of generic masks', () => {
    test('Generate a mask for a timestamp', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA();
        const dfa: DFA = regexToDFA.convertRegexToDFA('(([01][0-9])|(2[0-3])):[0-5][0-9]:[0-5][0-9]');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('99:99:99');
    });
    test('Generate a mask for an Australian passport number', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA();
        const dfa: DFA = regexToDFA.convertRegexToDFA('[A-Z]\\d{7}');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('A9999999');
    });
    test('Generate a mask for an international mobile phone number', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA();
        const dfa: DFA = regexToDFA.convertRegexToDFA('[(][+]\\d{2}[)] \\d \\d{2} \\d{3} \\d{3}');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('(+99) 9 99 999 999');
    });
    test('Generate a mask for a standard Victorian license plate', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA();
        const dfa: DFA = regexToDFA.convertRegexToDFA('([A-Z]{3}\\d{3})|(\\d[A-Z]{2}\\d[A-Z]{2})');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('XAA9XX');
    });
});