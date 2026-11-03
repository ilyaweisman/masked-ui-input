import { test, describe, expect, beforeAll, beforeEach } from '@jest/globals';
import { RegexToDFAConverter } from '../src/RegexToDFAConverter';
import { DFA } from '../src/DFA';
import { NodeType, SyntaxTreeNode } from '../src/SyntaxTreeNode';

describe('Convert a RegEx into a syntax tree', () => {
    test('Null syntax tree', () => {
        expect(RegexToDFAConverter.regexToSyntaxTree('').getType()).toBe(NodeType.NULL);
    });
    test('Print a single character syntax tree', () => {
        RegexToDFAConverter.regexToSyntaxTree('a').printSyntaxTree();
    });
    test('Print a character class syntax tree', () => {
        RegexToDFAConverter.regexToSyntaxTree('[?]').printSyntaxTree();
    });
    test('Print a character class syntax tree containing an escaped character', () => {
        RegexToDFAConverter.regexToSyntaxTree('[\\a]').printSyntaxTree();
    });
    test('Print a simple OR syntax tree', () => {
        RegexToDFAConverter.regexToSyntaxTree('A|B').printSyntaxTree();
    });
    test('Print a simple CAT syntax tree', () => {
        RegexToDFAConverter.regexToSyntaxTree('ab').printSyntaxTree();
    });
    test('Print a complex syntax tree', () => {
        RegexToDFAConverter.regexToSyntaxTree('A(1|2|3)[Z]').printSyntaxTree();
    });
});

describe('Generate syntax tree and verify OR nodes are balanced - verifyOrNodesAreBalanced()', () => {
    test('Null syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('()#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Leaf node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(a)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Simplest OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(A|B)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Two character on each side of OR', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(12|CD)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Multiple OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(12|CD|EF|az)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Nested OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|3(0|1))|NA)#')
        syntaxTree.printSyntaxTree();
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Unbalanced OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(a|bc)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced second OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(ab|cd|1)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced nested OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|(0|1))|NA)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
});

describe('Print a syntax tree with Node Properties, Calculate followpos and generate DFA', () => {
    test('Null syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('()#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        expect(followpos.size).toBe(0);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.printTransitionTable();
    });
    test('Print a single character syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(a)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2])]
        ]);
        expect(followpos).toEqual(expectedFollowpos);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.printTransitionTable();
    });
    test('Print a simple OR syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(A|B)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([3])],
            [2, new Set([3])]
        ]);
        expect(followpos).toEqual(expectedFollowpos);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.printTransitionTable();
    });
    test('Print a simple CAT syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(ab)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2])],
            [2, new Set([3])]
        ]);
        expect(followpos).toEqual(expectedFollowpos);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.printTransitionTable();
    });
    test('Print a complex syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(A(1|2|3)[Z])#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2, 3, 4])], 
            [2, new Set([5])], 
            [3, new Set([5])], 
            [4, new Set([5])],
            [5, new Set([6])]
        ]);
        expect(followpos).toEqual(expectedFollowpos);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        dfa.printTransitionTable();
    });
    test('Print another complex syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('((a|b)*abb)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        const regexCharacters: Map<string, Set<number>> = new Map<string, Set<number>>();
        RegexToDFAConverter.setNodeProperties(syntaxTree, [1], regexCharacters);
        syntaxTree.printSyntaxTree(true);

        const followpos: Map<number, Set<number>> = new Map<number, Set<number>>();
        RegexToDFAConverter.calculateFollowpos(syntaxTree, followpos);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([1, 2, 3])], 
            [2, new Set([1, 2, 3])], 
            [3, new Set([4])], 
            [4, new Set([5])],
            [5, new Set([6])]
        ]);
        expect(followpos).toEqual(expectedFollowpos);

        const dfa: DFA = new DFA();
        RegexToDFAConverter.populateStatesAndTransitions(syntaxTree, regexCharacters, followpos, dfa);
        console.log(dfa.getNumberOfStates());
        dfa.printTransitionTable();
    });
});

describe('Convert RegEx to DFA', () => {
    test('Blank RegEx', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('');
        expect(dfa.getTransitions().size).toBe(0);
    });
    test('Single character RegEx', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('^a$');
        dfa.printTransitionTable();
    });
    test('Complex RegEx', () => {
        const dfa: DFA = RegexToDFAConverter.convertRegexToDFA('Su|Do|Ku');
        dfa.printTransitionTable();
    });
    test('Invalid RegEx', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('[a-z')}).toThrow('RegEx "[a-z" is invalid.');
    });
    test('RegEx ends with |', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('123|')}).toThrow('RegEx must be fixed-length and therefore may not start or end with a | character.');
    });
    test('RegEx includes bad character class', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('\\d\\D')}).toThrow(/^RegEx contains one of the following character classes/);
    });
    test('RegEx contains a .', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('abc.123')}).toThrow('RegEx may not contain . outside of a character class. Any non-word characters must be singly specified.');
    });
    test('RegEx contains a bad quantifier', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('\\d{2}\\d?')}).toThrow(/^RegEx must be of fixed length, and so cannot contain quantifiers like/);
    });
    test('RegEx contains a range', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('9{1,7}')}).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x,y}.');
    });
    test('RegEx contains an empty character class', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('a[]1')}).toThrow('RegEx is invalid as it contains the empty character class [].');
    });
    test('RegEx contains a negated character class', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('[^abc]')}).toThrow(/^RegEx may not contain negated character classes/);
    });
    test('RegEx contains two or more special characters in a character class', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('[a*!]')}).toThrow(/^RegEx may not contain character classes that permit a choice involving special characters/);
    });
    test('RegEx contains an unbalanced OR operator', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('ab|xyz')}).toThrow(/^RegEx contains an unbalanced OR/);
    });
    test('RegEx includes a choice in special characters', () => {
        expect(() => {RegexToDFAConverter.convertRegexToDFA('a($|%)9')}).toThrow(/^The RegEx contains a choice in which special character to input/);
    });
});

describe('Feed input characters into DFA', () => {
    let dfa: DFA;
    beforeAll(() => {
        dfa = RegexToDFAConverter.convertRegexToDFA('\\d{2}[a-b]');
        dfa.printTransitionTable();
    });
    test('Blank input', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('')).toBe('');
    });
    test('Single digit', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('4')).toBe('4');
    });
    test('Two more digits', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('98')).toBe('98');
    });
    test('Two digits followed by a lowercase letter', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('01a')).toBe('01a');
    });
    test('Three digits', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('012')).toBe(null);
    });
    test('A non-digit character', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('a')).toBe(null);
    });
    test('Two digits followed by a special character', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('63)')).toBe('63');
    });
    test('Two digits, a lowercase letter and another digit', () => {
        expect(dfa.getPartialStringIgnoreSpecialCharacters('01a2')).toBe(null);
    });
});