import { beforeEach, describe, expect, test } from "@jest/globals";
import { RegexToDFAConverter } from "../src/RegexToDFAConverter";
import { DFA } from "../src/DFA";
import { DFAHelper } from "../src/DFAHelper";

describe('Find the next acceptable characters for a DFA', () => {
    test('Empty DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('');
        expect(dfa.getNumberOfStates()).toEqual(1);
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([0]))).toEqual('');
    });
    test('Single character DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('a');
        expect(dfa.getNumberOfStates()).toEqual(3);
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([0]))).toEqual('a');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([1, 2]))).toEqual('');
    });
    test('Simple DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('Su|Do|Ku');
        expect(dfa.getNumberOfStates()).toEqual(6);
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([0]))).toEqual('SDK');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([1]))).toEqual('u');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([2]))).toEqual('');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([3]))).toEqual('o');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([4]))).toEqual('u');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([5]))).toEqual('');
    });
    test('Complex DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
        expect(dfa.getNumberOfStates()).toEqual(15);
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([0]))).toEqual('0123');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([1]))).toEqual('123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([2]))).toEqual('0123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([3]))).toEqual('01');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([4]))).toEqual('');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([5]))).toEqual('/');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([6]))).toEqual('01');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([7]))).toEqual('123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([8]))).toEqual('012');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([9]))).toEqual('/');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([10]))).toEqual('0123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([11]))).toEqual('0123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([12]))).toEqual('0123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([13]))).toEqual('0123456789');
        expect(DFAHelper.findNextAcceptableCharacters(dfa, new Set([14]))).toEqual('');
    });
});

describe('Handle a backspace input', () => {
    test('Backspace did not do anything', () => {
        const previousString: string = 'abc';
        const currentString: string = 'abc';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('abc');
    });
    test('No special characters', () => {
        const previousString: string = 'abc';
        const currentString: string = 'ab';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('ab');
    });
    test('Special character at the end', () => {
        const previousString: string = 'abc!';
        const currentString: string = 'abc';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('ab');
    });
    test('Special character in the middle', () => {
        const previousString: string = 'abc!d';
        const currentString: string = 'abcd';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('abd');
    });
    test('Special character at the beginning', () => {
        const previousString: string = '!abc';
        const currentString: string = 'abc';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('abc');
    });
    test('Multiple special characters', () => {
        const previousString: string = 'number: (+ 61)';
        const currentString: string = 'number: ( 61)';
        expect(DFAHelper.handleBackspace(currentString, previousString)).toEqual('number 61)');
    });
});

describe('Remove the last character if it is a special character', () => {
    test('Empty string', () => {
        const inputString: string = '';
        expect(DFAHelper.removeLastCharacterIfSpecial(inputString)).toEqual('');
    });
    test('Last character is not a special character', () => {
        const inputString: string = 'abc';
        expect(DFAHelper.removeLastCharacterIfSpecial(inputString)).toEqual('abc');
    });
    test('Last character is a special character', () => {
        const inputString: string = 'abc!';
        expect(DFAHelper.removeLastCharacterIfSpecial(inputString)).toEqual('abc');
    });
});
