import { useState } from 'react';
import MaskedInput from './MaskedInput'

/**
 * The main application component.
 * @returns A masked input component. 
 */
export default function App() {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 3. The value is immediately available in your state variable
    console.log("Submitted Value:", inputValue);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'block'}}>
      <MaskedInput setParentValue={setInputValue} regex={'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\\d{4}$'} mask={'DD/MM/YYYY'} style={{ fontSize: '2rem' }} />
      <div>
        <button type="submit">Submit</button>
      </div>
    </form>
  )
}