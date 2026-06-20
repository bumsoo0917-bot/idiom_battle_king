import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialLimit = 30, onTimeUp = null) => {
  const [secondsLeft, setSecondsLeft] = useState(initialLimit);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            if (onTimeUpRef.current) onTimeUpRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, secondsLeft]);

  const start = () => setIsActive(true);
  const stop = () => setIsActive(false);
  const reset = (newLimit = initialLimit) => {
    clearInterval(timerRef.current);
    setSecondsLeft(newLimit);
    setIsActive(false);
  };

  return {
    secondsLeft,
    isActive,
    start,
    stop,
    reset
  };
};
