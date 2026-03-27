import { useEffect, useMemo, useState } from "react";

export function useCountdown(targetDate) {
  const calc = () => {
    if (!targetDate) return 0;

    const target = new Date(targetDate).getTime();
    if (Number.isNaN(target)) return 0;

    return Math.max(0, target - Date.now());
  };

  const [timeLeft, setTimeLeft] = useState(calc());

  useEffect(() => {
    setTimeLeft(calc());

    if (!targetDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calc());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return useMemo(() => {
    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return {
      timeLeft,
      formatted: `${minutes}:${seconds}`,
      isExpired: timeLeft <= 0,
    };
  }, [timeLeft]);
}
