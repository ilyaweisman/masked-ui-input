import { useState, type CSSProperties, type ChangeEvent } from 'react'
import { RegexToDFA } from './RegexToDFA';
import { DFA } from './DFA';

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
function MaskedInput({ regex, mask, style }: MaskedInputProps) {
  const [value, setValue] = useState<string>('');

  const regexToDFA: RegexToDFA = new RegexToDFA();
  const dfa: DFA = regexToDFA.convertRegexToDFA(regex);

  // Only allow the value to be updated if the new value is a valid partial string of the DFA.
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (dfa.isPartialStringValid(e.target.value)) {
       setValue(e.target.value)
    } else {
      setValue(value)
    }
  }

  return (
    <input
      name="myInput"
      type="text"
      style={style}
      value={value}
      onChange={handleChange}
      placeholder="DD/MM/YYYY"
    />
  )
};

export default MaskedInput;

