import { useState, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

// Minimal sortable list with native drag & drop. The grip is also a keyboard handle:
// focus it and press ArrowUp / ArrowDown to move the item.

interface SortableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
  className?: string;
  itemClassName?: (item: T, index: number) => string;
  handleLabel?: string;
}

function SortableList<T>({
  items,
  getKey,
  onMove,
  renderItem,
  disabled = false,
  className,
  itemClassName,
  handleLabel = 'Arrastra para reordenar (o usa las flechas del teclado)',
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Rows only become draggable while the grip is pressed, so text inside inputs stays selectable
  const [armedIndex, setArmedIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
    setArmedIndex(null);
  };

  return (
    <ul className={className}>
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
        return (
          <li
            key={getKey(item)}
            draggable={!disabled && armedIndex === index}
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== index) onMove(dragIndex, index);
              reset();
            }}
            onDragEnd={reset}
            className={cn(
              'flex items-stretch gap-1 transition-opacity',
              isDragging && 'opacity-40',
              isOver && (dragIndex! < index ? 'border-b-2 border-blue-500' : 'border-t-2 border-blue-500'),
              itemClassName?.(item, index)
            )}
          >
            {!disabled && (
              <button
                type="button"
                className="flex-shrink-0 cursor-grab px-0.5 text-gray-300 hover:text-gray-500 focus:text-blue-600 focus:outline-none active:cursor-grabbing"
                aria-label={handleLabel}
                title={handleLabel}
                onMouseDown={() => setArmedIndex(index)}
                onMouseUp={() => dragIndex === null && setArmedIndex(null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && index > 0) {
                    e.preventDefault();
                    onMove(index, index - 1);
                  } else if (e.key === 'ArrowDown' && index < items.length - 1) {
                    e.preventDefault();
                    onMove(index, index + 1);
                  }
                }}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </li>
        );
      })}
    </ul>
  );
}

/** Returns a copy of the array with one item moved */
export const moveItem = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default SortableList;
