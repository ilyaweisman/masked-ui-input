import { State } from "./State";

/**
 * Discrete Finite Automaton (DFA) object.
 * Contains methods for converting a RegEx into a DFA.
 */
export class DFA {
    private states: Array<State> = [];
    private transitions: Map<string, State> = new Map();

    constructor() {
    }

    getStates(): Array<State> {
        return this.states;
    }

    setStates(states: Array<State>): void {
        this.states = states;
    }

    getTransitions(): Map<string, State> {
        return this.transitions;
    }

    setTransitions(transitions: Map<string, State>): void {
        this.transitions = transitions;
    }

    /**
     * Method to print the transitions map as a table.
     */
    printTransitionTable(): void {
        const inputCharacters: Array<String> = [...new Set([...this.transitions.keys()].map(element => element.charAt(element.length - 1)))];
        const numberOfColumns: number = inputCharacters.length;
        
        const horizontalLine = '-'.repeat(7 + 4 * numberOfColumns);
        let table: string = `       | Input \n${horizontalLine}\n State | ${inputCharacters.join(' | ')}\n${horizontalLine}\n`;
        let columnCount: number = 0;
        this.transitions.forEach((state, transitionKey) => {
            if (columnCount % numberOfColumns === 0) {
                table += `     ${transitionKey.substring(0, transitionKey.length - 1)} `;
            }
            table += `| ${state.getId()} `
            columnCount++;
            if (columnCount % numberOfColumns === 0) {
                table += `\n${horizontalLine}\n`;
            }
        });
        console.log(table);
    }
}

