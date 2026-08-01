import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from 'react'
import { RegexToDFAConverter } from './RegexToDFA';
import { DFA } from './DFA';
import { MaskHelper } from './MaskHelper';

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

  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  const dfa: DFA = regexToDFA.convertRegexToDFA(regex);
  const mask: string = MaskHelper.getMask(dfa, inputMask);

  const whiteText = useRef<HTMLSpanElement | null>(null);
  const greyText = useRef<HTMLSpanElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  let greyColor: string = 'grey';
  if (inputRef.current) {
    const styles = window.getComputedStyle(inputRef.current, '::placeholder');
    greyColor = styles.getPropertyValue('color');
  }

  // Only allow the value to be updated if the new value is a valid partial string of the DFA.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let newValue: string;
    if (dfa.isPartialStringValid(e.target.value)) {
       setValue(e.target.value)
       newValue = e.target.value;
    } else {
      setValue(value)
      newValue = value;
    }

    whiteText.current!.textContent = newValue;
    greyText.current!.textContent = mask.substring(newValue.length);
  }

  return (
    <div className="wrapper">
      <input
        ref={inputRef}
        className="myInput"
        name="myInput"
        type="text"
        style={style}
        value={value}
        onChange={handleChange}
        placeholder=""
      />
      <div className="backgroundBox" style={style}>
        <span ref={whiteText} style={{ color: 'transparent' }}></span>
        <span ref={greyText} style={{ color: greyColor }}>{mask}</span>
      </div>
    </div>
  )
};

export default MaskedInput;

