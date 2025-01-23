import * as React from 'react';
import { Task } from "../TaskCard";
import { TaskCard } from "../TaskCard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
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

export function TaskGrid({ 
  tasks, 
  onTaskClick, 
  onTaskDelete, 
  onDragEnd,
  selectedTasks = new Set(),
  onTaskSelect,
}: TaskGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
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

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Calculate the number of columns based on screen width
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 1;
    const width = window.innerWidth;
    if (width >= 1536) return 4; // 2xl
    if (width >= 1280) return 3; // xl
    if (width >= 768) return 2; // md
    return 1; // mobile
  };

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(tasks.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 280 : 240,
    overscan: 5,
  });

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
      >
        <div
          className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
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
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: `${(columnIndex / columnCount) * 100}%`,
                          width: `${100 / columnCount}%`,
                          transform: `translateY(${virtualRow.start}px)`,
                          padding: '0 8px',
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
}