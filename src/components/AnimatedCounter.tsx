import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in ms
}

export default function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = previousValueRef.current;
    const endValue = value;
    
    if (startValue === endValue) {
      setDisplayValue(value);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      
      const current = Math.round(startValue + easedProgress * (endValue - startValue));
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    const animFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animFrameId);
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
}
