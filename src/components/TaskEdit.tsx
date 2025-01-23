import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from "@/types/task";
import { TaskForm } from './TaskForm';
import { useState } from 'react';

interface TaskEditProps {
  tasks: Task[];
  onSave: (task: Task) => void;
}

const TaskEdit: React.FC<TaskEditProps> = ({ tasks, onSave }) => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const task = tasks.find(t => t.id === taskId);
  const [isOpen, setIsOpen] = useState(true);
  
  if (!task) return <div className="container mx-auto p-6">Task not found</div>;

  const handleSave = (editedTask: Partial<Task>) => {
    onSave({ ...task, ...editedTask });
    navigate(-1);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
      <TaskForm
        open={isOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSave}
        initialData={task}
      />
    </div>
  );
};

export default TaskEdit;