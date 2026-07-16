import { DFA } from "./DFA";

/**
 * Class which provides helper methods for generating a mask based on a DFA.
 */
export class MaskHelper {


    /**
     * Generates a generic mask based on the provided fixed-length DFA.
     * @param dfa The DFA
     * @returns A generic mask (typically consists of Xs, As or 9s)
     */
    public static generateMask(dfa: DFA): string {
        let mask: string = '';

        let currentStateNumbers: Set<number> = new Set([0]);
        let acceptableCharacters: string = this.findNextAcceptableCharacters(dfa, currentStateNumbers);
        // Traverse all the paths through the DFA to find the acceptable characters for each input character position.
        // Based on the acceptable characters, we can substitute an X, A, 9 or special character for each input character position.
        // Putting these together will give us a generic mask for the DFA.
        while (acceptableCharacters !== '') {
            const containsDigits: boolean = /\d/.test(acceptableCharacters);
            const containsLetters: boolean = /[A-Za-z_]/.test(acceptableCharacters);
            if (containsDigits && containsLetters) {
                mask += 'X';
            }
            else if (containsDigits) {
                mask += '9';
            }
            else if (containsLetters) {
                mask += 'A';
            }
            else { // If the acceptable characters do not include any digits or letters, it must be a single special character.
                mask += acceptableCharacters;
            }
            const nextStateNumbers: Set<number> = new Set();
            for (const stateNumber of currentStateNumbers) {
                for (const char of acceptableCharacters) {
                    const nextStateNumber: number = dfa.getTransitions().get(`${stateNumber}${char}`)!.getId();
                    nextStateNumbers.add(nextStateNumber);
                }
            }

            currentStateNumbers = nextStateNumbers;
            acceptableCharacters = this.findNextAcceptableCharacters(dfa, currentStateNumbers);
        }
        return mask;
    }

    /**
     * Finds the next acceptable characters for a given state in the DFA.
     * @param dfa The DFA
     * @param stateNumber The state number
     * @returns The acceptable characters for the given state concatenated together
     */
    private static findNextAcceptableCharacters(dfa: DFA, stateNumbers: Set<number>): string {
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

}