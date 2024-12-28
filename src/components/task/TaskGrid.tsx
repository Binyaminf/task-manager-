import { Task } from "../TaskCard";
import { TaskCard } from "../TaskCard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";

interface TaskGridProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function TaskGrid({ tasks, onTaskClick, onTaskDelete, onDragEnd }: TaskGridProps) {
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

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={(event) => {
        onDragEnd(event);
        setActiveId(null);
      }}
      onDragStart={(event) => setActiveId(event.active.id.toString())}
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task)}
            />
          ))}
        </SortableContext>
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