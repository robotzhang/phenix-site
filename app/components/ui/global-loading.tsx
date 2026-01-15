import { useEffect, useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import "@/lib/monkeyPatchForFetch";

interface GlobalLoadingProps {
  startValue?: number;   // 初始进度
  maxValue?: number;     // 最大递增值
  interval?: number;     // 更新间隔 ms
  finishDelay?: number;  // 完成后停留时间 ms
}

export default function GlobalLoading({
  startValue = 20,
  maxValue = 80,
  interval = 100,
  finishDelay = 200,
}: GlobalLoadingProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const startProgress = () => {
      if (!visible) {
        setVisible(true);
        setProgress(startValue);

        intervalRef.current = setInterval(() => {
          setProgress((prev) => {
            // 非线性递增：越接近 maxValue，增加越慢
            const remaining = maxValue - prev;
            if (remaining <= 0) return prev;
            const increment = Math.max(0.1, remaining * 0.1); // 每次增加剩余的 10%
            return Math.min(prev + increment, maxValue);
          });
        }, interval);
      }
    };

    const stopProgress = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100); // 立即到 100%
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, finishDelay);
    };

    const onFetchStart = () => {
      activeRequestsRef.current++;
      startProgress();
    };

    const onFetchEnd = () => {
      activeRequestsRef.current--;
      if (activeRequestsRef.current <= 0) {
        activeRequestsRef.current = 0;
        stopProgress();
      }
    };

    window.addEventListener("fetchStart", onFetchStart);
    window.addEventListener("fetchEnd", onFetchEnd);

    return () => {
      window.removeEventListener("fetchStart", onFetchStart);
      window.removeEventListener("fetchEnd", onFetchEnd);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, startValue, maxValue, interval, finishDelay]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-9999">
      <Progress
        value={progress}
        className="h-0.5 rounded-none transition-all duration-100 bg-transparent"
      />
    </div>
  );
}
