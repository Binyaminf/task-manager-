import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from './TaskCard';

interface TaskEditProps {
  tasks: Task[];
  onSave: (task: Task) => void;
}

const TaskEdit: React.FC<TaskEditProps> = ({ tasks, onSave }) => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const task = tasks.find(task => task.id === taskId);
  const [editedTask, setEditedTask] = useState<Task>(task || {
    id: '',
    summary: '',
    description: '',
    dueDate: '',
    estimatedDuration: '',
    priority: 'Medium',
    status: 'To Do',
    category: '',
  } as Task);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask({ ...editedTask, [name]: value });
  };

  const handleSave = () => {
    onSave(editedTask);
    navigate(-1);
  };

  if (!task) return <div>Task not found</div>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Summary</label>
          <input
            type="text"
            name="summary"
            value={editedTask.summary}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={editedTask.description}
            onChange={handleChange}
            className="w-full p-2 border rounded h-32"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEdit;