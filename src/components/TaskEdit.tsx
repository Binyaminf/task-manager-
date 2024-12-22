// src/components/TaskEdit.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from './TaskCard';

interface TaskEditProps {
  tasks: Task[];
  onSave: (task: Task) => void;
}

const TaskEdit: React.FC<TaskEditProps> = ({ tasks, onSave }) => {
  const { taskId } = useParams<{ taskId: string }>();
  const task = tasks.find(task => task.id === taskId);
  const [editedTask, setEditedTask] = useState<Task>({ ...task });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask({ ...editedTask, [name]: value });
  };

  const handleSave = () => {
    onSave(editedTask);
    navigate(-1); // Navigate back to the previous page
  };

  if (!task) return <div>Task not found</div>;

  return (
    <div>
      <h2>Edit Task</h2>
      <input
        type="text"
        name="summary"
        value={editedTask.summary}
        onChange={handleChange}
      />
      <textarea
        name="description"
        value={editedTask.description}
        onChange={handleChange}
      />
      {/* Add other fields as needed */}
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default TaskEdit;
