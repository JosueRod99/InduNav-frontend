import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Tab bar that scrolls sideways when the tabs do not fit, with a fade and an arrow on the side that has more

const ScrollTabs = ({ label, children }: { label: string; children: ReactNode }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const el = barRef.current;
    if (!el) return;
    setMore({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="relative border-b border-gray-200">
      <div ref={barRef} onScroll={measure} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="-mb-px flex gap-1" aria-label={label}>
          {children}
        </nav>
      </div>
      {(['left', 'right'] as const).map(
        (side) =>
          more[side] && (
            <div
              key={side}
              className={`pointer-events-none absolute inset-y-0 flex items-center ${side === 'left' ? 'left-0 bg-gradient-to-r pr-6' : 'right-0 justify-end bg-gradient-to-l pl-6'} from-gray-50 via-gray-50/90 to-transparent`}
            >
              <button
                type="button"
                onClick={() => barRef.current?.scrollBy({ left: (side === 'left' ? -1 : 1) * 240, behavior: 'smooth' })}
                className="pointer-events-auto rounded-full border border-gray-200 bg-white p-1 text-gray-600 shadow-sm hover:text-gray-900"
                aria-label={side === 'left' ? 'Ver secciones anteriores' : 'Ver más secciones'}
              >
                {side === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          )
      )}
    </div>
  );
};

export default ScrollTabs;
