import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { Task } from "@/types/task";
import { TaskCard } from "../TaskCard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskGridProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onDragEnd: (event: DragEndEvent) => void;
  selectedTasks?: Set<string>;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
}

export const TaskGrid = React.memo(({ 
  tasks, 
  onTaskClick, 
  onTaskDelete, 
  onDragEnd,
  selectedTasks = new Set(),
  onTaskSelect,
}: TaskGridProps) => {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  // Optimize sensors configuration
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Memoize column count calculation with ResizeObserver
  const [columnCount, setColumnCount] = useState(1);
  
  useEffect(() => {
    const updateColumnCount = () => {
      startTransition(() => {
        const width = parentRef.current?.clientWidth ?? window.innerWidth;
        if (width >= 1536) setColumnCount(4); // 2xl
        else if (width >= 1280) setColumnCount(3); // xl
        else if (width >= 768) setColumnCount(2); // md
        else setColumnCount(1); // mobile
      });
    };

    const resizeObserver = new ResizeObserver(updateColumnCount);

    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    updateColumnCount(); // Initial calculation

    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = Math.ceil(tasks.length / columnCount);

  // Optimize virtualization configuration
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => isMobile ? 280 : 240, [isMobile]),
    overscan: 3,
    paddingStart: 16,
    paddingEnd: 16,
  });

  // Memoize task IDs
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks available
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={(event) => {
        onDragEnd(event);
        setActiveId(null);
      }}
      onDragStart={(event) => setActiveId(event.active.id.toString())}
    >
      <div 
        ref={parentRef}
        className="h-[calc(100vh-300px)] overflow-auto px-2 sm:px-4"
        style={{ 
          contain: 'strict',
          willChange: 'transform',
        }}
      >
        <div
          className="relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          <SortableContext items={taskIds} strategy={rectSortingStrategy}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * columnCount;
              return (
                <React.Fragment key={virtualRow.index}>
                  {Array.from({ length: columnCount }).map((_, columnIndex) => {
                    const taskIndex = startIndex + columnIndex;
                    const task = tasks[taskIndex];
                    if (!task) return null;

                    return (
                      <div
                        key={task.id}
                        className="absolute left-0 top-0 w-full px-2"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                          width: `${100 / columnCount}%`,
                          left: `${(columnIndex / columnCount) * 100}%`,
                          height: `${virtualRow.size}px`,
                          willChange: 'transform',
                          contain: 'content',
                        }}
                      >
                        <TaskCard
                          task={task}
                          onClick={() => onTaskClick(task)}
                          onDelete={() => onTaskDelete(task)}
                          isSelected={selectedTasks.has(task.id)}
                          onSelect={onTaskSelect ? (selected) => onTaskSelect(task.id, selected) : undefined}
                        />
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </SortableContext>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="w-full max-w-sm opacity-50">
            <TaskCard
              task={tasks.find(t => t.id === activeId)!}
              onClick={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

TaskGrid.displayName = 'TaskGrid';