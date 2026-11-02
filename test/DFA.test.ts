import { expect, test, describe, beforeEach } from '@jest/globals';
import { RegexToDFAConverter } from '../src/RegexToDFAConverter';
import { DFA } from '../src/DFA';
import { SyntaxTreeNode } from '../src/SyntaxTreeNode';
import { RegexSimplifier } from '../src/RegexSimplifier';

describe('Partial string validation', () => {
    // Realistic example of a date input.
    const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
    test('Blank input', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('')).toBe('');
    });
    test('Single digit valid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('0')).toBe('0');
    });
    test('Single digit invalid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('4')).toBe(null);
    });
    test('Two digits valid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('31')).toBe('31/');
    });
    test('Two digits invalid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('98')).toBe(null);
    });
    test('Most of the input valid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('12/04/5')).toBe('12/04/5');
    });
    test('Most of the input invalid', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('12/14/5')).toBe(null);
    });
    test('Whole input', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('27/11/5678')).toBe('27/11/5678');
    });
    test('One letter', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('a')).toBe(null);
    });
    test('Three digits', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('123')).toBe(null);
    });
    test('Almost the whole input, but last digit is slash', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('27/11/5678/')).toBe('27/11/5678');
    });

    // Realistic example of an international mobile phone number input.
    const mobileDfa: DFA = RegexToDFAConverter.convertRegexToDFA('[(][+]\\d{2}[)] \\d \\d{2} \\d{3} \\d{3}');
    test('Insert special characters', () => {
        expect(mobileDfa.getPartialStringIgnoreSpecialCharacters('61412345678')).toBe('(+61) 4 12 345 678');
    });
    test('Ignore special characters', () => {
        expect(mobileDfa.getPartialStringIgnoreSpecialCharacters('%61#41,.23   45/67+8')).toBe('(+61) 4 12 345 678');
    });
    test('Invalid character', () => {
        expect(mobileDfa.getPartialStringIgnoreSpecialCharacters('61#41^23456a78')).toBe(null);
    });
});

describe('Find trap states', () => {
    test('Empty DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('');
        expect(dfa.getTrapState()).toBe(0);
    });
    test('Single character DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('a');
        expect(dfa.getTrapState()).toBe(2);
    });
    test('Simple DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('Su|Do|Ku');
        dfa.findTrapState();
        expect(dfa.getTrapState()).toBe(2);
    });
    test('Complex DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
        dfa.findTrapState();
        expect(dfa.getTrapState()).toBe(4);
    });
});

describe('Choice in special characters', () => {
    test('Empty DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('');
        expect(dfa.choiceInSpecialCharacters()).toBe(false);
    });
    test('Single character DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('a');
        expect(dfa.choiceInSpecialCharacters()).toBe(false);
    });
    test('Simple DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('Su|Do|Ku');
        expect(dfa.choiceInSpecialCharacters()).toBe(false);
    });
    test('Complex DFA', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
        expect(dfa.choiceInSpecialCharacters()).toBe(false);
    });
    test('DFA with choice in special characters', () => {
        const regex: string = RegexSimplifier.simplifyRegex('He said ("|\')Hi!("|\')');
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree(`(${regex})#`);
        syntaxTree.getRight()?.setFinalLeafNode(true);

        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        
        // Build the DFA.
        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.findTrapState();
        dfa.printTransitionTable();
        expect(dfa.choiceInSpecialCharacters()).toBe(true);
    });
    // TODO: Fix this!
    test('DFA with choice involving a special character', () => {
        const regex: string = RegexSimplifier.simplifyRegex('&&&|AND');
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree(`(${regex})#`);
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        
        // Build the DFA.
        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.findTrapState();
        dfa.printTransitionTable();
        expect(dfa.choiceInSpecialCharacters()).toBe(true);
    });
});
