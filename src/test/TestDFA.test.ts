import { test, describe, expect } from '@jest/globals';
import { RegexToDFA } from '../RegexToDFA';
import { NodeType, SyntaxTreeNode } from '../SyntaxTreeNode';

describe('Print a Syntax Tree', () => {
    const regexToDFA: RegexToDFA = new RegexToDFA('');
    test('Null Syntax Tree', () => {
        expect(regexToDFA.regexToSyntaxTree('').getType()).toBe(NodeType.NULL);
    });
    test('Print a single character Syntax Tree', () => {
        regexToDFA.regexToSyntaxTree('a').printSyntaxTree();
    });
    test('Print a character class Syntax Tree', () => {
        regexToDFA.regexToSyntaxTree('[?]').printSyntaxTree();
    });
    test('Print a character class Syntax Tree containing an escaped character', () => {
        regexToDFA.regexToSyntaxTree('[\\a]').printSyntaxTree();
    });
    test('Print a simple OR Syntax Tree', () => {
        regexToDFA.regexToSyntaxTree('A|B').printSyntaxTree();
    });
    test('Print a simple CAT Syntax Tree', () => {
        regexToDFA.regexToSyntaxTree('ab').printSyntaxTree();
    });
    test('Print a complex Syntax Tree', () => {
        regexToDFA.regexToSyntaxTree('A(1|2|3)[Z]').printSyntaxTree();
    });
});

describe('Print a Syntax Tree with Node Properties, Calculate followpos and generate DFA', () => {
    test('Null Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
        regexToDFA.setNodeProperties(syntaxTree);
        syntaxTree.printSyntaxTree(true);

        regexToDFA.calculateFollowpos(syntaxTree);
        expect(regexToDFA.getFollowpos().size).toBe(0);

        regexToDFA.populateStatesAndTransitions(syntaxTree);
        regexToDFA.getDFA().printTransitionTable();
    });
    test('Print a single character Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('a#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
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
    test('Print a simple OR Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('A|B#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
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
    test('Print a simple CAT Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('ab#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
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
    test('Print a complex Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('A(1|2|3)[Z]#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
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
    test('Print another complex Syntax Tree', () => {
        const regexToDFA: RegexToDFA = new RegexToDFA('');
        const syntaxTree: SyntaxTreeNode = regexToDFA.regexToSyntaxTree('(a|b)*abb#')
        syntaxTree.getRight()?.setFinalLeadNode(true);
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