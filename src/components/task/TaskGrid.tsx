import { Task } from "../TaskCard";
import { TaskCard } from "../TaskCard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useState, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface TaskGridProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onDragEnd: (event: DragEndEvent) => void;
  selectedTasks?: Set<string>;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
}

const MemoizedTaskCard = memo(TaskCard);

export function TaskGrid({ 
  tasks, 
  onTaskClick, 
  onTaskDelete, 
  onDragEnd,
  selectedTasks = new Set(),
  onTaskSelect,
}: TaskGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
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

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each task card
    overscan: 5,
  });

  const virtualItems = useMemo(() => rowVirtualizer.getVirtualItems(), [rowVirtualizer]);

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
        className="h-[600px] overflow-auto"
      >
        <div
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
            {virtualItems.map((virtualRow) => {
              const task = tasks[virtualRow.index];
              return (
                <div
                  key={task.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <MemoizedTaskCard
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onDelete={() => onTaskDelete(task)}
                    isSelected={selectedTasks.has(task.id)}
                    onSelect={onTaskSelect ? (selected) => onTaskSelect(task.id, selected) : undefined}
                  />
                </div>
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