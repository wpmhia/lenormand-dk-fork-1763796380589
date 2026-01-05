import { useEffect, useRef } from 'react';

export function useScrollToFocus() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      input.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    input.addEventListener('focus', handleFocus);
    return () => input.removeEventListener('focus', handleFocus);
  }, []);

  return inputRef;
}
