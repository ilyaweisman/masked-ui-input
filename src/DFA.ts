import { State } from "./State";
import { StateAndInput } from "./StateAndInput";
import { SyntaxTreeNode } from "./SyntaxTreeNode";

/**
 * Discrete Finite Automaton (DFA) object.
 * Contains methods for converting a RegEx into a DFA.
 */
export class DFA {
    private syntaxTreeRoot: SyntaxTreeNode | null = null; // TODO: Remove this field
    private states: Array<State> = [];
    private transitions: Map<StateAndInput, State> = new Map();


    constructor(regex: string) {
    }
}

