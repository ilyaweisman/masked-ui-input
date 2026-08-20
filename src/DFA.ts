import { DFAHelper } from "./DFAHelper";
import { MaskHelper } from "./MaskHelper";
import { State } from "./State";

/**
 * Discrete Finite Automaton (DFA) object.
 * Contains methods for converting a RegEx into a DFA.
 */
export class DFA {
    private states: Array<State>;
    private transitions: Map<string, State>;
    private inputCharacters: Array<string>;
    private trapStates: Set<number>;

    constructor() {
        this.states = [];
        this.transitions = new Map();
        this.inputCharacters = [];
        this.trapStates = new Set();
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
     * Returns a list of input characters for the DFA, as defined in the transition table.
     */
    getInputCharacters(): Array<string> {
        if (this.inputCharacters.length === 0) {
            this.inputCharacters = [...new Set([...this.transitions.keys()].map(element => element.charAt(element.length - 1)))];
        }
        return this.inputCharacters;
    }

    /**
     * Method to print the transitions map as a table.
     */
    printTransitionTable(): void {
        const inputCharacters: Array<string> = this.getInputCharacters();
        const numberOfColumns: number = inputCharacters.length;
        
        const horizontalLine: string = '-'.repeat(7 + 4 * numberOfColumns);
        let table: string = `       | Input \n${horizontalLine}\n State | ${inputCharacters.join(' | ')}\n${horizontalLine}\n`;
        let columnCount: number = 0;
        this.transitions.forEach((state, transitionKey) => {
            if (columnCount % numberOfColumns === 0) {
                const stateNumber: string = transitionKey.substring(0, transitionKey.length - 1);
                const spaces: string = ' '.repeat(Math.max(0, 6 - stateNumber.length));
                table += `${spaces}${stateNumber} `;
            }
            table += `| ${state.getId()}${(state.getId() < 10 ? ' ' : '')}`;
            columnCount++;
            if (columnCount % numberOfColumns === 0) {
                table += `\n${horizontalLine}\n`;
            }
        });
        console.log(table);
    }


    /**
	 * Determines whether or not partialString provided is either rejected by the DFA or causes the DFA to fall into a trap state.
	 * @param partialString The string of characters which is fed to the DFA.
	 * @returns Whether or not the partial string provided is not rejected by the DFA
	 */
	isPartialStringValid(partialString: string): boolean {
		// Traverse through the Deterministic Finite Automaton (DFA) using the partial string and the transition table.
        let currentStateNumber: number = 0;
		for (let i: number = 0; i < partialString.length; i++) {
			const transKey = `${currentStateNumber}${partialString.charAt(i)}`;
			// If there is no transition in the transition table which matches 
			// the next character in the partial string, then the string is not valid.
			if (!this.transitions.get(transKey)) {
				return false;
			}
			currentStateNumber = this.transitions.get(transKey)!.getId();
		}
		// If the automaton ends up in a trap state, we know that the partial string cannot be valid.
        // NOTE: Since this is a fixed length DFA, the final state can never be a trap state.
		if (this.inTrapState(currentStateNumber)) {
			return false;
		}
		return true;
	}

    /**
	 * First strips the partial string of any special characters.
     * Then determines whether the partial string is accepted by the DFA, inserting special characters into the string as necessary.
     * Returns the partial string with special characters inserted if it is accepted by the DFA, or null if it is not accepted.
	 * @param partialString The string of characters which is fed to the DFA.
	 * @returns The modified partial string or null if it is not accepted.
	 */
	getPartialStringIgnoreSpecialCharacters(partialString: string): string | null {
        const strippedPartialString: string = partialString.replace(/\W/g, '');
		// Traverse through the Deterministic Finite Automaton (DFA) using the partial string and the transition table.
        let currentStateNumber: number = 0;
        let index: number = 0;
        let nextAcceptableCharacters: string = DFAHelper.findNextAcceptableCharacters(this, new Set([currentStateNumber]));
        let resultString: string = '';
		while (index < strippedPartialString.length || /^\W$/.test(nextAcceptableCharacters)) {
            if (/^\W$/.test(nextAcceptableCharacters)) {
                const transKey = `${currentStateNumber}${nextAcceptableCharacters}`;
                currentStateNumber = this.transitions.get(transKey)!.getId();
                resultString += nextAcceptableCharacters;
            }
            else {
                const transKey = `${currentStateNumber}${strippedPartialString.charAt(index)}`;
                // If there is no transition in the transition table which matches 
                // the next character in the partial string, then the string is not valid.
                if (!this.transitions.get(transKey)) {
                    return null;
                }
                currentStateNumber = this.transitions.get(transKey)!.getId();
                resultString += strippedPartialString.charAt(index);
                index++;
            }
            nextAcceptableCharacters = DFAHelper.findNextAcceptableCharacters(this, new Set([currentStateNumber]));
		}
		// If the automaton ends up in a trap state, we know that the partial string cannot be valid.
        // NOTE: Since this is a fixed length DFA, the final state can never be a trap state.
		if (this.inTrapState(currentStateNumber)) {
			return null;
		}
		return resultString;
	}

    /**
	 * Determines whether or not a particular state of the DFA defined by stateNumber is a trap state.
	 * @param stateNumber A number which identifies a state in the DFA. 
	 * @returns Whether or not the state provided is a trap state.
	 */
	private determineWhetherTrapState(stateNumber: number): boolean {
		// Check each transition in the transition table from the state defined by stateNumber.
        const inputCharacters: Array<string> = this.getInputCharacters();
		for (const char of inputCharacters) {
			const transKey: string = `${stateNumber}${char}`;
			// If any transition leads to a state which is not the current state, the state defined by stateNumber cannot be a trap state. 
			// Note that given that we produced a minimised DFA, there can not be any trap loops in the DFA.
			if (this.transitions.get(transKey)?.getId() !== stateNumber) {
				return false;
			}
		}
		return true;
	}

    /**
     * Generates a set of trap states for the DFA after the DFA is generated.
     */
    generateSetOfTrapStates(): void {
        for (let i: number = 0; i < this.states.length; i++) {
            if (this.determineWhetherTrapState(i)) {
                this.trapStates.add(i);
            }
        }
    } 

    /**
	 * Determines whether or not a particular state of the DFA defined by stateNumber is a trap state.
	 * @param stateNumber A number which identifies a state in the DFA. 
	 * @returns Whether or not the state provided is a trap state.
	 */
    inTrapState(stateNumber: number): boolean {
        return this.trapStates.has(stateNumber);
    }


    /** 
     * Loop through all the transitions in the transition table.
     * Examine all the transitions from one state to another (non-trap) state involving a special character.
     * If there are two or more such transitions from the same state, then there is a choice in special character, which is not permissible.
     * Return the state number where this occurs.
     * Otherwise, return -1 to indicate that there is no choice in special characters.
    */
    choiceInSpecialCharacters(): number {
        let stateNumber: number = 0;
        const inputCharacters: Array<string> = this.getInputCharacters();
        let inputCharacter: string = inputCharacters[0];

        while (this.transitions.has(`${stateNumber}${inputCharacter}`)) {
            let specialCharacterCount = 0;
            for (const char of inputCharacters) {
                if (/^\W$/.test(char)) {
                    let nextStateNumber: number = this.transitions.get(`${stateNumber}${char}`)!.getId();
                    if (!this.inTrapState(nextStateNumber)) {
                        specialCharacterCount++;
                        if (specialCharacterCount === 2) {
                            return stateNumber;
                        }
                    }
                }
            }
            stateNumber++;
            inputCharacter = inputCharacters[0];
        }
        // No choice in special characters was found.
        return -1; 
    }
}

