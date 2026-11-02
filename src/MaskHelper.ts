import { DFA } from "./DFA";
import { DFAHelper } from "./DFAHelper";

/**
 * Class which provides helper methods for generating a mask based on a DFA.
 */
export class MaskHelper {

    /**
     * Return the mask to be used in the Masked Input component.
     * @param dfa The DFA
     * @param inputMask The mask provided by the user
     * @returns The mask to be used
     */
    static getMask(dfa: DFA, inputMask: string | undefined) {
        let mask: string = '';
        if (inputMask) {
            if (MaskHelper.isMaskValid(dfa, inputMask)) {
                mask = inputMask;
            } else {
                console.warn('Invalid mask! The mask provided does not match with the RegEx provided. Generating a mask to use instead...');
                mask = MaskHelper.generateMask(dfa);
            }
        } else {
            mask = MaskHelper.generateMask(dfa);
        }
        return mask;
    }

    /**
     * Checks whether the mask provided matches the RegEx/DFA provided. Namely, do the special characters and their positions in the string correspond?
     * @param dfa The DFA
     * @param mask The mask provided
     * @returns Whether the mask is valid for the DFA
     */
    static isMaskValid(dfa: DFA, mask: string): boolean {
        let currentStateNumbers: Set<number> = new Set([0]);
        let acceptableCharacters: string = DFAHelper.findNextAcceptableCharacters(dfa, currentStateNumbers);
        let characterIndex: number = 0;

        while (acceptableCharacters !== '') {
            // Check that the mask is not shorter than the strings accepted by the DFA
            if (characterIndex >= mask.length) {
                return false;
            }
            // If the only acceptable character after N transitions of the DFA is a special character, compare it with the corresponding character in the mask.
            // If they do not match, return false. 
            if (acceptableCharacters.length === 1 && /^\W$/.test(acceptableCharacters.charAt(0))) {
                if (acceptableCharacters.charAt(0) !== mask.charAt(characterIndex)) {
                    return false;
                }
            } 
            // Otherwise, if the mask contains a special character at position N, but the DFA doesn't, return false.
            else if (/^\W$/.test(mask.charAt(characterIndex))) {
                return false;
            }

            const nextStateNumbers: Set<number> = new Set();
            for (const stateNumber of currentStateNumbers) {
                for (const char of acceptableCharacters) {
                    const nextStateNumber: number = dfa.getTransitions().get(`${stateNumber}${char}`)!;
                    nextStateNumbers.add(nextStateNumber);
                }
            }
            currentStateNumbers = nextStateNumbers;
            acceptableCharacters = DFAHelper.findNextAcceptableCharacters(dfa, currentStateNumbers);
            characterIndex++;
        }
        // Test whether the length of the RegEx matches the length of the mask.
        if (characterIndex !== mask.length) {
            return false;
        }

        return true;
    }


    /**
     * Generates a generic mask based on the provided fixed-length DFA.
     * @param dfa The DFA
     * @returns A generic mask (typically consists of Xs, As or 9s)
     */
    static generateMask(dfa: DFA): string {
        let mask: string = '';

        let currentStateNumbers: Set<number> = new Set([0]);
        let acceptableCharacters: string = DFAHelper.findNextAcceptableCharacters(dfa, currentStateNumbers);
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
                    const nextStateNumber: number = dfa.getTransitions().get(`${stateNumber}${char}`)!;
                    nextStateNumbers.add(nextStateNumber);
                }
            }

            currentStateNumbers = nextStateNumbers;
            acceptableCharacters = DFAHelper.findNextAcceptableCharacters(dfa, currentStateNumbers);
        }
        return mask;
    }
}