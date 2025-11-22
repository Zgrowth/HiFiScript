import { useEffect, useRef } from 'react';

export function useFirstUpdate(fn, inputs) {
  const countRef = useRef(0);
  useEffect(() => {
    if (!countRef.current) {
      countRef.current++;
      fn()
    }
  }, inputs);
}
