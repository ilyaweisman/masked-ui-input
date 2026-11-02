import { beforeEach, describe, expect, test } from "@jest/globals";
import { RegexToDFAConverter } from "../src/RegexToDFAConverter";
import { RegexSimplifier } from "../src/RegexSimplifier";
import { SyntaxTreeNode } from "../src/SyntaxTreeNode";

describe('Check the balance of syntax trees', () => {
    test('Empty syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Single character syntax tree', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('a');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Simple OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('a|b');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Extended OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('a|b|c|d|e');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Unbalanced OR node', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('a|bc');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Nested OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(0(1|2)|(a|b)c)');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
    test('Unbalanced nested OR nodes', () => {
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree('(0(1|2)|(ab|cd)e)');
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(false);
    });
    test('Complex syntax tree', () => {
        const regex: string = RegexSimplifier.simplifyRegex('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$');
        const syntaxTree: SyntaxTreeNode = RegexToDFAConverter.regexToSyntaxTree(regex);
        expect(syntaxTree.verifyOrNodesAreBalanced()).toBe(true);
    });
});