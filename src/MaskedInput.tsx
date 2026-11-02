import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { RegexToDFAConverter } from './RegexToDFAConverter';
import { DFA } from './DFA';
import { MaskHelper } from './MaskHelper';
import { DFAHelper } from './DFAHelper';
import { MaskedInputHelper } from './MaskedInputHelper';

/**
 * The masked input component accepts four parameters:
 * - setParentValue: A function that sets the value of the parent component (optional).
 * - regex: A fixed-length regular expression that defines the valid input format.
 * - mask: The mask for the input (optional). If not provided, a default mask will be generated based on the RegEx.
 * - style: A CSSProperties object that defines the style of the input component (optional).
 */
type MaskedInputProps = {
  setParentValue?: (value: string) => void,
  regex: string,
  mask?: string,
  style?: CSSProperties
}

/**
 * A React component that renders an input field with a mask based on the provided RegEx pattern. 
 * The input value is validated against the RegEx pattern, and only valid partial strings are allowed to be entered.
 * @param param0 The properties of the MaskedInput component, including the RegEx pattern, optional mask, and optional style.
 * @returns The input component.
 */
function MaskedInput({ setParentValue, regex, mask: inputMask, style }: MaskedInputProps) {
  const [value, setValue] = useState<string>('');
  const [transparentTextValue, setTransparentTextValue] = useState('');
  const [greyTextValue, setGreyTextValue] = useState('');
  const [transparentTextDisplay, setTransparentTextDisplay] = useState('none');
  const [greyColor, setGreyColor] = useState('grey');


  const backgroundBox: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const transparentText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const greyText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);

  let dfa: DFA | null = null;
  let mask: string | undefined = undefined;
  let backspaceNoSelection: boolean = false;

  // Define functions.
  const setNewValue: (newValue: string) => void = (newValue: string) => {
    setValue(newValue);
    setParentValue?.(newValue);
    setTransparentTextValue(newValue);
    setTransparentTextDisplay(newValue === '' ? 'none' : 'inherit');
    const greyTextSubstring: string = mask?.substring(newValue.length) || '';
    setGreyTextValue(greyTextSubstring);
  }

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue: string | null | undefined = dfa?.getPartialStringIgnoreSpecialCharacters(e.target.value);
    setNewValue(newValue ?? value);
  }

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    setNewValue(DFAHelper.removeLastCharacterIfSpecial(e.target.value));
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e: React.KeyboardEvent<HTMLInputElement>) => {
    backspaceNoSelection = !MaskedInputHelper.isBackspaceInputWithSelection(e);
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If the input was a backspace with no highlights, and the character removed was a special character, then keep removing 
    // characters from that position until a non-special character is removed.
    let targetValue: string = backspaceNoSelection ? DFAHelper.handleBackspace(e.target.value, value) : e.target.value;
    // Only allow the value to be updated if the new value is a valid partial string of the DFA.
    const newValue: string | null | undefined = dfa?.getPartialStringIgnoreSpecialCharacters(targetValue);
    setNewValue(newValue ?? value);
  }

  
  try {
    dfa = RegexToDFAConverter.convertRegexToDFA(regex);
    mask = MaskHelper.getMask(dfa, inputMask);
  } catch (error) {
    console.error(error);
  }

  const backgroundBoxStyle: CSSProperties = MaskedInputHelper.backgroundBoxStyle(style, !!dfa);
  const transparentTextStyle: CSSProperties = MaskedInputHelper.transparentTextStyle(style, transparentTextDisplay);
  const greyTextStyle: CSSProperties = MaskedInputHelper.greyTextStyle(style, greyColor);

  useEffect(() => {
    if (inputRef.current) {
      const placeholderStyles: CSSStyleDeclaration = window.getComputedStyle(inputRef.current, '::placeholder');
      setGreyColor(placeholderStyles.getPropertyValue('color'));
    }
    setGreyTextValue(mask || '');
  }, []);

  return (
    <div className="wrapper">
      <input
        ref={inputRef}
        className="myInput"
        name="myInput"
        type="text"
        style={{...style, backgroundColor: 'transparent'}}
        value={dfa ? value : undefined}
        onChange={dfa ? handleChange : undefined}
        onKeyDown={dfa ? handleKeyDown : undefined}
        onFocus={dfa ? handleFocus : undefined}
        onBlur={dfa ? handleBlur : undefined}
        placeholder=""
      />
      <div className="backgroundBox" ref={backgroundBox} style={backgroundBoxStyle}>
        <input className="backgroundText" ref={transparentText} readOnly={true} style={transparentTextStyle} value={transparentTextValue}></input>
        <input className="backgroundText" ref={greyText} readOnly={true} style={greyTextStyle} value={greyTextValue}></input>
      </div>
    </div>
  )
};

export default MaskedInput;

