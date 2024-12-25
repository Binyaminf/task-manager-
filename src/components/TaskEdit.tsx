import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from './TaskCard';
import { TaskForm } from './TaskForm';

interface TaskEditProps {
  tasks: Task[];
  onSave: (task: Task) => void;
}

const TaskEdit: React.FC<TaskEditProps> = ({ tasks, onSave }) => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return <div className="container mx-auto p-6">Task not found</div>;

  const handleSave = (editedTask: Partial<Task>) => {
    onSave({ ...task, ...editedTask });
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
      <TaskForm
        onSubmit={handleSave}
        onCancel={handleCancel}
        initialData={task}
      />
    </div>
  );
};

export default TaskEdit;