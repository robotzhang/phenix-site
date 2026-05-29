import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

import { Progress } from "@/components/ui/progress";

interface GlobalLoadingProps {
  startValue?: number;
  maxValue?: number;
  interval?: number;
  finishDelay?: number;
}

export function GlobalLoading({
  startValue = 20,
  maxValue = 80,
  interval = 100,
  finishDelay = 200,
}: GlobalLoadingProps) {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = navigation.state !== "idle";

  useEffect(() => {
    if (isLoading) {
      if (!visible) {
        setVisible(true);
        setProgress(startValue);

        intervalRef.current = setInterval(() => {
          setProgress((current) => {
            const remaining = maxValue - current;

            if (remaining <= 0) return current;

            return Math.min(current + Math.max(0.1, remaining * 0.1), maxValue);
          });
        }, interval);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (visible) {
        setProgress(100);
        finishTimerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, finishDelay);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
    };
  }, [finishDelay, interval, isLoading, maxValue, startValue, visible]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-9999 w-full">
      <Progress
        value={progress}
        className="h-0.5 rounded-none bg-transparent transition-all duration-100"
      />
    </div>
  );
}
