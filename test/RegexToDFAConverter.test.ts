import { test, describe, expect, beforeAll, beforeEach } from '@jest/globals';
import { RegexToDFAConverter } from '../src/RegexToDFAConverter';
import { DFA } from '../src/DFA';
import { NodeType, SyntaxTreeNode } from '../src/SyntaxTreeNode';

describe('Convert a RegEx into a syntax tree', () => {
    let regexToDFA: RegexToDFAConverter;
    beforeEach(() => {
        regexToDFA = new RegexToDFAConverter();
    });
    test('Null syntax tree', () => {
        expect(regexToDFA.regexToSyntaxTree('').getType()).toBe(NodeType.NULL);
    });
    test('Print a single character syntax tree', () => {
        regexToDFA.regexToSyntaxTree('a').printSyntaxTree();
    });
    test('Print a character class syntax tree', () => {
        regexToDFA.regexToSyntaxTree('[?]').printSyntaxTree();
    });
    test('Print a character class syntax tree containing an escaped character', () => {
        regexToDFA.regexToSyntaxTree('[\\a]').printSyntaxTree();
    });
    test('Print a simple OR syntax tree', () => {
        regexToDFA.regexToSyntaxTree('A|B').printSyntaxTree();
    });
    test('Print a simple CAT syntax tree', () => {
        regexToDFA.regexToSyntaxTree('ab').printSyntaxTree();
    });
    test('Print a complex syntax tree', () => {
        regexToDFA.regexToSyntaxTree('A(1|2|3)[Z]').printSyntaxTree();
    });
});

describe('Generate syntax tree and verify OR nodes are balanced - verifyOrNodesAreBalanced()', () => {
    let regexToDFA: RegexToDFAConverter;
    beforeEach(() => {
        regexToDFA = new RegexToDFAConverter();
    });
    test('Null syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('()#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Leaf node', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Simplest OR node', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(A|B)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Two character on each side of OR', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(12|CD)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Multiple OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(12|CD|EF|az)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Nested OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|3(0|1))|NA)#')
        syntaxTree.printSyntaxTree();
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Unbalanced OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a|bc)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced second OR node', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(ab|cd|1)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced nested OR node', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|(0|1))|NA)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
});

describe('Print a syntax tree with Node Properties, Calculate followpos and generate DFA', () => {
    let regexToDFA: RegexToDFAConverter;
    beforeEach(() => {
        regexToDFA = new RegexToDFAConverter();
    });
    test('Null syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('()#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        expect(regexToDFA.getFollowpos().size).toBe(0);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print a single character syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2])]
        ]);
        expect(regexToDFA.getFollowpos()).toEqual(expectedFollowpos);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print a simple OR syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(A|B)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([3])],
            [2, new Set([3])]
        ]);
        expect(regexToDFA.getFollowpos()).toEqual(expectedFollowpos);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print a simple CAT syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(ab)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2])],
            [2, new Set([3])]
        ]);
        expect(regexToDFA.getFollowpos()).toEqual(expectedFollowpos);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print a complex syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(A(1|2|3)[Z])#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([2, 3, 4])], 
            [2, new Set([5])], 
            [3, new Set([5])], 
            [4, new Set([5])],
            [5, new Set([6])]
        ]);
        expect(regexToDFA.getFollowpos()).toEqual(expectedFollowpos);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print another complex syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('((a|b)*abb)#')
        syntaxTree.getRight()?.setFinalLeafNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        const expectedFollowpos: Map<number, Set<number>> = new Map([
            [1, new Set([1, 2, 3])], 
            [2, new Set([1, 2, 3])], 
            [3, new Set([4])], 
            [4, new Set([5])],
            [5, new Set([6])]
        ]);
        expect(regexToDFA.getFollowpos()).toEqual(expectedFollowpos);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        console.log(regexToDFA.getDFA().getStates());
        regexToDFA.getDFA().printTransitionTable();
    });
});

describe('Convert RegEx to DFA', () => {
    let regexToDFA: RegexToDFAConverter;
    beforeEach(() => {
        regexToDFA = new RegexToDFAConverter();
    });
    test('Blank RegEx', () => {
        const dfa: DFA = regexToDFA.convertRegexToDFA('');
        expect(dfa.getTransitions().size).toBe(0);
    });
    test('Single character RegEx', () => {
        const dfa: DFA = regexToDFA.convertRegexToDFA('^a$');
        dfa.printTransitionTable();
    });
    test('Complex RegEx', () => {
        const dfa: DFA = regexToDFA.convertRegexToDFA('Su|Do|Ku');
        dfa.printTransitionTable();
    });
    test('Invalid RegEx', () => {
        expect(() => {regexToDFA.convertRegexToDFA('[a-z')}).toThrow('RegEx "[a-z" is invalid.');
    });
    test('RegEx ends with |', () => {
        expect(() => {regexToDFA.convertRegexToDFA('123|')}).toThrow('RegEx must be fixed-length and therefore may not start or end with a | character.');
    });
    test('RegEx includes bad character class', () => {
        expect(() => {regexToDFA.convertRegexToDFA('\\d\\D')}).toThrow(/^RegEx contains one of the following character classes/);
    });
    test('RegEx contains a .', () => {
        expect(() => {regexToDFA.convertRegexToDFA('abc.123')}).toThrow('RegEx may not contain . outside of a character class. Any non-word characters must be singly specified.');
    });
    test('RegEx contains a bad quantifier', () => {
        expect(() => {regexToDFA.convertRegexToDFA('\\d{2}\\d?')}).toThrow(/^RegEx must be of fixed length, and so cannot contain quantifiers like/);
    });
    test('RegEx contains a range', () => {
        expect(() => {regexToDFA.convertRegexToDFA('9{1,7}')}).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x,y}.');
    });
    test('RegEx contains an empty character class', () => {
        expect(() => {regexToDFA.convertRegexToDFA('a[]1')}).toThrow('RegEx is invalid as it contains the empty character class [].');
    });
    test('RegEx contains a negated character class', () => {
        expect(() => {regexToDFA.convertRegexToDFA('[^abc]')}).toThrow(/^RegEx may not contain negated character classes/);
    });
    test('RegEx contains two or more special characters in a character class', () => {
        expect(() => {regexToDFA.convertRegexToDFA('[a*!]')}).toThrow(/^RegEx may not contain character classes that provide special characters as a choice/);
    });
    test('RegEx contains an unbalanced OR operator', () => {
        expect(() => {regexToDFA.convertRegexToDFA('ab|xyz')}).toThrow(/^RegEx contains an unbalanced OR/);
    });
    test('RegEx includes a choice in special characters', () => {
        expect(() => {regexToDFA.convertRegexToDFA('a($|%)9')}).toThrow(/^The RegEx contains a choice in which special character to input/);
    });
});

describe('Feed input characters into DFA', () => {
    let dfa: DFA;
    beforeAll(() => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        dfa = regexToDFA.convertRegexToDFA('\\d{2}[a-b]');
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