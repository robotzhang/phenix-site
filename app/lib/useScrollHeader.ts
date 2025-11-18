import { useEffect, useState, useRef } from "react";

/**
 * useScrollHeader
 * - scrolled: 是否滚动过 threshold
 * - hidden: 是否隐藏（向下滚动时隐藏，向上滚动时显示）
 */
export function useScrollHeader(threshold: number = 10) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const current = window.scrollY;

      // 是否滚动过阈值
      setScrolled(current > threshold);

      // 判断滚动方向
      if (Math.abs(current - lastScrollY.current) > 5) {
        setHidden(current > lastScrollY.current && current > 80); // 向下滚动并超过80px时隐藏
        lastScrollY.current = current;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { scrolled, hidden };
}
