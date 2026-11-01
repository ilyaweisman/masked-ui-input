import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
  const [transparentTextValue, setTransparentTextValue] = useState('');
  const [greyTextValue, setGreyTextValue] = useState('');
  const [transparentTextDisplay, setTransparentTextDisplay] = useState('none');


  const backgroundBox: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const transparentText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const greyText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);

  let backspaceNoHighlight: boolean = false;

  let dfa: DFA | null = null;
  let mask: string | undefined = undefined;

  let greyColor: React.RefObject<string> = useRef('grey');

  // Define functions.
  const setNewValue: (newValue: string) => void = (newValue: string) => {
    setValue(newValue);
    setTransparentTextValue(newValue);
    setTransparentTextDisplay(newValue === '' ? 'none' : 'inherit');
    const greyTextSubstring: string = mask?.substring(newValue.length) || '';
    setGreyTextValue(greyTextSubstring);
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


  useEffect(() => {
    if (inputRef.current) {
      const placeholderStyles: CSSStyleDeclaration = window.getComputedStyle(inputRef.current, '::placeholder');
      greyColor.current = placeholderStyles.getPropertyValue('color');
    }

    setGreyTextValue(mask || '');
  }, []);


  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  try {
    dfa = regexToDFA.convertRegexToDFA(regex);
    mask = MaskHelper.getMask(dfa, inputMask);
  } catch (error) {
    console.error(error);
  }


  const transparentTextStyle: CSSProperties = 
  {
    ...style, 
    color: 'transparent', 
    borderColor: 'transparent', 
    display: transparentTextDisplay, 
    borderLeft: 'none', 
    borderRight: 'none',
    fieldSizing: 'content',
    marginRight: 0,
    backgroundColor: 'transparent',
    width: 'auto',
    padding: 'auto',
    margin: 0
  };

  const greyTextStyle: CSSProperties = 
  {
    ...style, 
    color: greyColor.current, 
    borderColor: 'transparent', 
    borderLeft: 'none', 
    borderRight: 'none',
    backgroundColor: 'transparent',
    padding: 'auto'
  };

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
      <div className="backgroundBox" ref={backgroundBox} style={{...style, display: !dfa ? 'none' : 'inline-flex', margin: 0, width: '100%'}}>
        <input className="backgroundText" ref={transparentText} readOnly={true} style={transparentTextStyle} value={transparentTextValue}></input>
        <input className="backgroundText" ref={greyText} readOnly={true} style={greyTextStyle} value={greyTextValue}></input>
      </div>
    </div>
  )
};

export default MaskedInput;

