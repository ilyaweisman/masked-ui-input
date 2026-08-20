import { expect, test, describe } from '@jest/globals';
import { RegexToDFAConverter } from '../RegexToDFAConverter';
import { DFA } from '../DFA';

describe('Realistic example of a date input', () => {
    const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
    const dfa: DFA = regexToDFA.convertRegexToDFA('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
    test('Blank input', () => {
        expect(dfa.isPartialStringValid('')).toBe(true);
    });
    test('Single digit valid', () => {
        expect(dfa.isPartialStringValid('0')).toBe(true);
    });
    test('Single digit invalid', () => {
        expect(dfa.isPartialStringValid('4')).toBe(false);
    });
    test('Two digits valid', () => {
        expect(dfa.isPartialStringValid('31')).toBe(true);
    });
    test('Two digits invalid', () => {
        expect(dfa.isPartialStringValid('98')).toBe(false);
    });
    test('Most of the input valid', () => {
        expect(dfa.isPartialStringValid('12/04/5')).toBe(true);
    });
    test('Most of the input invalid', () => {
        expect(dfa.isPartialStringValid('12/14/5')).toBe(false);
    });
    test('Whole input', () => {
        expect(dfa.isPartialStringValid('27/11/5678')).toBe(true);
    });
    test('One letter', () => {
        expect(dfa.isPartialStringValid('a')).toBe(false);
    });
    test('Three digits', () => {
        expect(dfa.isPartialStringValid('123')).toBe(false);
    });
    test('Almost the whole input, but last digit is slash', () => {
        expect(dfa.isPartialStringValid('27/11/5678/')).toBe(false);
    });
});