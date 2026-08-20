import { useRef, useState, type CSSProperties } from 'react'
import { RegexToDFAConverter } from './RegexToDFAConverter';
import { DFA } from './DFA';
import { MaskHelper } from './MaskHelper';
import { DFAHelper } from './DFAHelper';

type MaskedInputProps = {
  regex: string,
  mask?: string,
  style?: CSSProperties
}

/**
 * A React component that renders an input field with a mask based on the provided regex pattern. 
 * The input value is validated against the regex pattern, and only valid partial strings are allowed to be entered.
 * @param param0 The properties of the MaskedInput component, including the regex pattern, optional mask, and optional style.
 * @returns The input component.
 */
function MaskedInput({ regex, mask: inputMask, style }: MaskedInputProps) {
  const [value, setValue] = useState<string>('');

  const backgroundBox = useRef<HTMLDivElement | null>(null);
  const whiteText = useRef<HTMLSpanElement | null>(null);
  const greyText = useRef<HTMLSpanElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  let greyColor: string = 'grey';
  if (inputRef.current) {
    const styles: CSSStyleDeclaration = window.getComputedStyle(inputRef.current, '::placeholder');
    greyColor = styles.getPropertyValue('color');
  }

  let backspaceNoHighlight: boolean = false;

  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  let dfa: DFA | null = null;
  let mask: string | null = null;

  // Define functions.
  const setNewValue: (newValue: string) => void = (newValue: string) => {
    setValue(newValue);
    whiteText.current!.textContent = newValue;
    greyText.current!.textContent = mask?.substring(newValue.length) || '';
  }


  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue: string | null | undefined = dfa?.getPartialStringIgnoreSpecialCharacters(e.target.value);
    if (newValue === null || newValue === undefined) {
      newValue = value;
    } 
    setNewValue(newValue);
  }

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue: string = DFAHelper.removeLastCharacterIfSpecial(e.target.value);
    setNewValue(newValue);
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (start === end) {
        backspaceNoHighlight = true;
      }
    }
  }

  // Only allow the value to be updated if the new value is a valid partial string of the DFA.
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e: React.ChangeEvent<HTMLInputElement>) => {
    let targetValue: string;
    // If the input was a backspace with no highlights, and the character removed was a special character, then keep removing 
    // characters from that position until a non-special character is removed.
    if (backspaceNoHighlight) {
      backspaceNoHighlight = false;
      targetValue = DFAHelper.handleBackspace(e.target.value, value);
    }
    else {
      targetValue = e.target.value;
    }

    let newValue: string | null | undefined = dfa?.getPartialStringIgnoreSpecialCharacters(targetValue);

    if (newValue === null || newValue === undefined) {
        newValue = value;
    } 
    setNewValue(newValue);
  }


  try {
    dfa = regexToDFA.convertRegexToDFA(regex);
    mask = MaskHelper.getMask(dfa, inputMask);
  } catch (error) {
    console.error(error);
  }


  return (
    <div className="wrapper">
      <input
        ref={inputRef}
        className="myInput"
        name="myInput"
        type="text"
        style={style}
        value={dfa ? value : undefined}
        onChange={dfa ? handleChange : undefined}
        onKeyDown={dfa ? handleKeyDown : undefined}
        onFocus={dfa ? handleFocus : undefined}
        onBlur={dfa ? handleBlur : undefined}
        placeholder=""
      />
      <div className="backgroundBox" ref={backgroundBox} style={{...style, display: dfa ? 'inline-block' : 'none'}}>
        <span ref={whiteText} style={{ color: 'transparent' }}></span>
        <span ref={greyText} style={{ color: greyColor }}>{mask}</span>
      </div>
    </div>
  )
};

export default MaskedInput;

