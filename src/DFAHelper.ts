import { DFA } from "./DFA";

/**
 * Class which provides helper methods for generating a mask based on a DFA.
 */
export class DFAHelper {

    /**
     * Finds the next acceptable characters for given states in the DFA.
     * @param dfa The DFA
     * @param stateNumbers The state number
     * @returns The acceptable characters for the given states concatenated together
     */
    static findNextAcceptableCharacters(dfa: DFA, stateNumbers: Set<number>): string {
        let acceptableCharacters: Set<string> = new Set();
        const inputCharacters: Array<string> = dfa.getInputCharacters();
        for (const stateNumber of stateNumbers) {
            for (const char of inputCharacters) {
                const transitionKey: string = stateNumber.toString() + char;
                const nextState: number = dfa.getTransitions().get(transitionKey)!.getId();
                if (!dfa.inTrapState(nextState)) {
                    acceptableCharacters.add(char);
                }
                
            }
        }
        return Array.from(acceptableCharacters).join('');
    }

    /**
     * Handles the backspace (with no highlight) input. If a special character was removed, then keep removing characters 
     * from that position until a non-special character is removed.
     * @param currentString The string after the backspace
     * @param previousString The string before the backspace
     * @returns The modified string
     */
    static handleBackspace(currentString: string, previousString: string): string {
        let backspaceIndex: number = 0;
        // Find the index of first difference between the current string and the previous string.
        // This is where the backspace input occurred.
        while (backspaceIndex < currentString.length && backspaceIndex < previousString.length && currentString.charAt(backspaceIndex) === previousString.charAt(backspaceIndex)) {
            backspaceIndex++;
        }
        if (!/^\W$/.test(previousString.charAt(backspaceIndex))) {
            return currentString;
        }
        // If the character at the backspace index is a special character, keep removing characters from that position until 
        // a non-special character is removed.
        backspaceIndex;
        let index: number = backspaceIndex - 1;
        while (index > 0 && /^\W$/.test(previousString.charAt(index - 1))) {
            index--;
        }
        return previousString.substring(0, index) + previousString.substring(backspaceIndex + 1);
    }

    /**
     * Removes the last character of the input string if it is a special character.
     * @param inputString The string to be modified
     * @returns The modified string
     */
    static removeLastCharacterIfSpecial(inputString: string): string {
        if (inputString.length === 0) {
            return inputString;
        }
        if ( /^\W$/.test(inputString.charAt(inputString.length - 1))) {
            return inputString.substring(0, inputString.length - 1);
        }
        return inputString;
    }

}