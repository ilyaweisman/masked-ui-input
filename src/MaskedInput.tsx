import { useRef, useState, type CSSProperties } from 'react'
import { MaskedInputFacade, MaskedInputFacadeImpl } from './MaskedInputFacade';
import './MaskedInput.css';

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
export function MaskedInput({ setParentValue, regex, mask: inputMask, style }: MaskedInputProps) {
  const backgroundBox: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const transparentText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const greyText: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
  const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);

  const maskedInputFacade: MaskedInputFacade = new MaskedInputFacadeImpl(regex, inputMask);
  const enabled: boolean = maskedInputFacade.isEnabled();

  const [value, setValue] = useState<string>('');
  const [transparentTextValue, setTransparentTextValue] = useState('');
  const [greyTextValue, setGreyTextValue] = useState(maskedInputFacade.getGreyTextValue(0));
  const [transparentTextWidth, setTransparentTextWidth] = useState('0');

  // Define functions.
  const setNewValue: (newValue: string) => void = (newValue: string) => {
    setValue(newValue);
    setParentValue?.(newValue);
    setTransparentTextValue(newValue);
    setTransparentTextWidth(newValue === '' ? '0' : 'auto');
    setGreyTextValue(maskedInputFacade.getGreyTextValue(newValue.length));
  }

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    setNewValue(maskedInputFacade.adjustValue(e.target.value, value, false, false));
  }

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e: React.FocusEvent<HTMLInputElement>) => {
    setNewValue(maskedInputFacade.adjustValue(e.target.value, value, false, true));
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e: React.KeyboardEvent<HTMLInputElement>) => {
    maskedInputFacade.registerKeyDown(e);
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewValue(maskedInputFacade.adjustValue(e.target.value, value, true, false));
  }

  const [backgroundBoxStyle, transparentTextStyle, greyTextStyle] = maskedInputFacade.getStyles(style, transparentTextWidth);

  return (
    <div className="wrapper">
      <input
        ref={inputRef}
        className="myInput"
        name="myInput"
        type="text"
        style={{...style, backgroundColor: 'transparent'}}
        value={enabled ? value : undefined}
        onChange={enabled ? handleChange : undefined}
        onKeyDown={enabled ? handleKeyDown : undefined}
        onFocus={enabled ? handleFocus : undefined}
        onBlur={enabled ? handleBlur : undefined}
      />
      <div className="backgroundBox" ref={backgroundBox} style={backgroundBoxStyle}>
        <input id="transparentText" className="backgroundText" ref={transparentText} disabled={true} style={transparentTextStyle} value={transparentTextValue}/>
        <input id="greyText" className="backgroundText" ref={greyText} disabled={true} style={greyTextStyle} value={greyTextValue}/>
      </div>
    </div>
  )
};
