import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Measures its box before mounting Recharts so ResponsiveContainer never sees -1×-1.
 * @param {{ className?: string; children: import('react').ReactElement }} props
 */
export function ChartContainer({ className = 'h-72 w-full min-w-0', children }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {size ? (
        <ResponsiveContainer width={size.width} height={size.height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
