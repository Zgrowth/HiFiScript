import { useState, useEffect, useRef } from 'react';

export function useStateWithClosure(initialValue) {
  const [state, setState] = useState(initialValue);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = (newState) => {
    if (typeof newState === 'function') {
      setState((prevState) => {
        const updatedState = newState(prevState);
        stateRef.current = updatedState;
        return updatedState;
      });
    } else {
      setState(newState);
      stateRef.current = newState;
    }
  };

  const getState = () => {
    return stateRef.current;
  }

  return [state, updateState, getState];
}
