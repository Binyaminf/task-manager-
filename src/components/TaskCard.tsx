import { useState } from "react";

export interface Task {
  id: string;
  summary: string;
  description?: string;
  dueDate: string;
  estimatedDuration: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  category: string;
  externalLinks?: string[];
  folder_id?: string;
}

export function TaskCard({ task, onClick, onDelete }: { task: Task; onClick: () => void; onDelete: () => void; }) {
  return (
    <div className="border p-4 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold">{task.summary}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
      <div className="flex justify-between mt-4">
        <button onClick={onClick} className="text-blue-500">Edit</button>
        <button onClick={onDelete} className="text-red-500">Delete</button>
      </div>
    </div>
  );
}
