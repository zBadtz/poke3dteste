import { useEffect, useRef, useState } from "react";

export function useTypewriter(text: string, speed = 28) {
  const [shown, setShown] = useState("");
  const done = shown.length >= text.length;
  const ref = useRef(text);

  useEffect(() => {
    ref.current = text;
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { shown, done, skip: () => setShown(ref.current) };
}

export function Typewriter({ text, speed }: { text: string; speed?: number }) {
  const { shown } = useTypewriter(text, speed);
  return <span>{shown}</span>;
}
