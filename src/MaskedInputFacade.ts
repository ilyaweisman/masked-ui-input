import { DFA } from "./DFA";
import { DFAHelper } from "./DFAHelper";
import { MaskedInputHelper } from "./MaskedInputHelper";
import { MaskHelper } from "./MaskHelper";
import { RegexToDFAConverter } from "./RegexToDFAConverter";

export interface MaskedInputFacade {
    adjustValue(value: string, initialValue: string, isChange: boolean, isBlur: boolean): string;
    registerKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void;
    getStyles(style: React.CSSProperties | undefined, transparentTextWidth: string): React.CSSProperties[];
    getGreyTextValue(valueLength: number): string;
    isEnabled(): boolean;
}

export class MaskedInputFacadeImpl implements MaskedInputFacade {
    private dfa?: DFA;
    private mask?: string;
    private backspaceNoSelection: boolean = false;

    constructor(regex: string, inputMask: string | undefined) {
        try {
            this.dfa = RegexToDFAConverter.convertRegexToDFA(regex);
            this.mask = MaskHelper.getMask(this.dfa, inputMask);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Adjust the input value when the input is focused, blurred or changed.
     * @param value The value to adjust
     * @param initialValue The initial value prior to the change
     * @param isChange Whether it is an onChange event
     * @param isBlur Whether it is an onBlur event
     * @returns The adjusted value
     */
    adjustValue(value: string, initialValue: string, isChange: boolean, isBlur: boolean): string {
        if (isBlur) return DFAHelper.removeLastCharactersIfSpecial(value);
        let targetValue: string = value;
        if (isChange) {
            // If the input was a backspace with no highlights, and the character removed was a special character, then keep removing 
            // characters from that position until a non-special character is removed.
            targetValue = this.backspaceNoSelection ? DFAHelper.handleBackspace(value, initialValue) : value;
        }
        // Only allow the value to be updated if the new value is a valid partial string of the DFA.
        const newValue: string | null | undefined = this.dfa?.getPartialStringIgnoreSpecialCharacters(targetValue);
        return newValue ?? initialValue;
    }

    /**
     * Registers a key down event, and determines whether the input was a backspace with no selection.
     * @param e The key down event
     */
    registerKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        this.backspaceNoSelection = MaskedInputHelper.isBackspaceInputWithoutSelection(e);
    }

    /**
     * Returns the styles for the background box, transparent text input, and grey text input.
     * @param style The parent input style provided by the user
     * @param transparentTextWidth The width of the transparent text
     * @returns The styles as an array
     */
    getStyles(style: React.CSSProperties | undefined, transparentTextWidth: string): React.CSSProperties[] {
        const backgroundBoxStyle: React.CSSProperties = MaskedInputHelper.backgroundBoxStyle(style, !!this.dfa);
        const transparentTextStyle: React.CSSProperties = MaskedInputHelper.transparentTextStyle(style, transparentTextWidth);
        const greyTextStyle: React.CSSProperties = MaskedInputHelper.greyTextStyle(style);
        return [backgroundBoxStyle, transparentTextStyle, greyTextStyle];
    }

    /**
     * Returns the value for the grey text input based on the current input value length.
     * @param valueLength The length of the current input value
     * @returns The grey text value
     */
    getGreyTextValue(valueLength: number): string {
        return this.mask?.substring(valueLength) || '';
    }

    /**
     * Whether the masked input is enabled, or whether we treat it as a 
     * normal input component (i.e. the RegEx is invalid).
     * @returns Whether the DFA has been successfully generated
     */
    isEnabled(): boolean {
        return !!this.dfa;
    }
}