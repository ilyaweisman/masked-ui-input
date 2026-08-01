import { test, describe, expect } from '@jest/globals';
import { RegexToDFAConverter } from '../RegexToDFA';
import { DFA } from '../DFA';
import { NodeType, SyntaxTreeNode } from '../SyntaxTreeNode';

describe('Print a syntax tree', () => {
    const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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

describe('Generate syntax tree and verify OR nodes are balanced', () => {
    test('Null syntax tree', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('()#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Leaf node', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Simplest OR node', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(A|B)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Two character on each side of OR', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(12|CD)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Multiple OR nodes', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(12|CD|EF|az)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Nested OR nodes', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|3(0|1))|NA)#')
        syntaxTree.printSyntaxTree();
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Unbalanced OR nodes', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a|bc)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced second OR node', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(ab|cd|1)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Unbalanced nested OR node', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('((0(1|2|3)|(1|2)(0|1|2|3)|(0|1))|NA)#')
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
});

describe('Print a syntax tree with Node Properties, Calculate followpos and generate DFA', () => {
    test('Null syntax tree', () => {
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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
        const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
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

describe('Feed input characters into DFA', () => {
    const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
    const dfa: DFA = regexToDFA.convertRegexToDFA('\\d{2}[a-b]');
    dfa.printTransitionTable();
    test('Blank input', () => {
        expect(dfa.isPartialStringValid('')).toBe(true);
    });
    test('Single digit', () => {
        expect(dfa.isPartialStringValid('4')).toBe(true);
    });
    test('Two more digits', () => {
        expect(dfa.isPartialStringValid('98')).toBe(true);
    });
    test('Two digits followed by a lowercase letter', () => {
        expect(dfa.isPartialStringValid('01a')).toBe(true);
    });
    test('Three digits', () => {
        expect(dfa.isPartialStringValid('012')).toBe(false);
    });
    test('A non-digit character', () => {
        expect(dfa.isPartialStringValid('a')).toBe(false);
    });
    test('Two digits followed by a special character', () => {
        expect(dfa.isPartialStringValid('63)')).toBe(false);
    });
    test('Two digits, a lowercase letter and another digit', () => {
        expect(dfa.isPartialStringValid('01a2')).toBe(false);
    });
});

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