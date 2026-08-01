import { test, describe, expect } from '@jest/globals';
import { RegexToDFAConverter } from '../RegexToDFA';
import { DFA } from '../DFA';
import { MaskHelper } from '../MaskHelper';

describe.only('Test mask validity chacker', () => {
    const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
    const dfa: DFA = regexToDFA.convertRegexToDFA('\\d{2}/\\d{2}/\\d{4}');
    test('Valid mask for a basic date input', () => {
        const mask: string = 'DD/MM/YYYY';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(true);
    });
    test('Invalid mask for a basic date input', () => {
        const mask: string = 'DD-MM-YYYY';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(false);
    });
    test('Special character in the wrong position - basic date input', () => {
        const mask: string = 'DD/MMY/YYY';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(false);
    });
    test('Mask too short - basic date input', () => {
        const mask: string = 'DD/MM/YYY';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(false);
    });
    test('Mask too long - basic date input', () => {
        const mask: string = 'DD/MM/YYYYY';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(false);
    });
    test('Mask has special character which RegEx does not - basic date input', () => {
        const mask: string = 'DD/MM/YYY&';
        expect(MaskHelper.isMaskValid(dfa, mask)).toBe(false);
    });


    const regexToDFAConverter: RegexToDFAConverter = new RegexToDFAConverter();
    const automaton: DFA = regexToDFAConverter.convertRegexToDFA('[(][+]\\d{2}[)] \\d \\d{2} \\d{3} \\d{3}');
    test('Valid mask for a mobile phone number input', () => {
        const mask: string = '(+61) 4 12 345 678';
        expect(MaskHelper.isMaskValid(automaton, mask)).toBe(true);
    });
    test('Invalid mask for a mobile phone number input', () => {
        const mask: string = '(+61) 4 12 345?678';
        expect(MaskHelper.isMaskValid(automaton, mask)).toBe(false);
    });
});

describe('Test out generation of generic masks', () => {
    test('Generate a mask for a timestamp', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const dfa: DFA = regexToDFA.convertRegexToDFA('(([01][0-9])|(2[0-3])):[0-5][0-9]:[0-5][0-9]');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('99:99:99');
    });
    test('Generate a mask for an Australian passport number', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const dfa: DFA = regexToDFA.convertRegexToDFA('[A-Z]\\d{7}');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('A9999999');
    });
    test('Generate a mask for an international mobile phone number', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const dfa: DFA = regexToDFA.convertRegexToDFA('[(][+]\\d{2}[)] \\d \\d{2} \\d{3} \\d{3}');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('(+99) 9 99 999 999');
    });
    test('Generate a mask for a standard Victorian license plate', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const dfa: DFA = regexToDFA.convertRegexToDFA('([A-Z]{3}\\d{3})|(\\d[A-Z]{2}\\d[A-Z]{2})');
        const mask: string = MaskHelper.generateMask(dfa);
        expect(mask).toBe('XAA9XX');
    });
});