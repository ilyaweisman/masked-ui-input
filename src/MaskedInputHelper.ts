/**
 * Class which provides helper methods for the Masked Input component.
 */
export class MaskedInputHelper {

    /**
     * Check whether the keyboard event is a backspace input in which the user has highlighted text. 
     * @param e The keyboard event
     * @returns A boolean indicating whether the keyboard event is a backspace input with selection
     */
    static isBackspaceInputWithoutSelection(e: React.KeyboardEvent<HTMLInputElement>): boolean {
      if (e.key === 'Backspace') {
        const target = e.target as HTMLInputElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        return start === end;
      }
      return false;
    }

    /**
     * Generates the style for the background box.
     * Note that this styling cannot be defined in the css, as it would get overridden by the parent input style provided by the user.
     * @param style The parent input style provided by the user
     * @param doDisplay The display style for the background box
     * @returns The style for the background box
     */
    static backgroundBoxStyle(style: React.CSSProperties | undefined, doDisplay: boolean): React.CSSProperties {
        return {
            ...style, 
            display: doDisplay ? 'flex' : 'none', 
            margin: 0, 
            width: '100%'
        };
    }

    /**
     * Generates the style for the transparent text input.
     * Note that this styling cannot be defined in the css, as it would get overridden by the parent input style provided by the user.
     * @param style The parent input style provided by the user
     * @param transparentTextWidth The width of the transparent text
     * @returns The style for the transparent text input
     */
    static transparentTextStyle(style: React.CSSProperties | undefined, transparentTextWidth: string): React.CSSProperties {
        return {
            ...style, 
            color: 'transparent', 
            borderColor: 'transparent', 
            borderLeft: 'none', 
            borderRight: 'none',
            fieldSizing: 'content',
            marginRight: 0,
            backgroundColor: 'transparent',
            width: transparentTextWidth,
            padding: 'none',
            margin: 0
        };
    }

    /**
     * Generates the style for the grey text input.
     * Note that this styling cannot be defined in the css, as it would get overridden by the parent input style provided by the user.
     * @param style The parent input style provided by the user
     * @returns The style for the grey text input
    */
    static greyTextStyle(style: React.CSSProperties | undefined): React.CSSProperties {
        return {
            ...style, 
            color: 'rgb(117, 117, 117)', 
            borderColor: 'transparent', 
            borderLeft: 'none', 
            borderRight: 'none',
            backgroundColor: 'transparent',
            padding: 'auto'
        };
    }
}