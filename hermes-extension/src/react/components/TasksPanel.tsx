// src/react/components/TasksPanel.tsx
import React, { useState, useEffect } from 'react';

interface Task {
  text: string;
  done: boolean;
}

interface TasksPanelProps {
  onClose: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({ onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    // Load saved tasks
    const saved = localStorage.getItem('hermes_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
  }, []);

  const saveTasks = (taskList: Task[]) => {
    try {
      localStorage.setItem('hermes_tasks', JSON.stringify(taskList));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const addTask = () => {
    const text = newTaskText.trim();
    if (text) {
      const newTasks = [...tasks, { text, done: false }];
      setTasks(newTasks);
      saveTasks(newTasks);
      setNewTaskText('');
    }
  };

  const toggleTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].done = !newTasks[index].done;
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (index: number) => {
    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ width: '400px' }}>
        <h2>Hermes Tasks</h2>
        
        <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '10px' }}>
          {tasks.map((task, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(index)}
              />
              <span
                style={{
                  marginLeft: '5px',
                  textDecoration: task.done ? 'line-through' : 'none',
                  flex: 1
                }}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(index)}
                className="hermes-button"
                style={{ marginLeft: 'auto' }}
              >
                ✖
              </button>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="New task..."
            style={{ flex: 1 }}
          />
          <button
            onClick={addTask}
            className="hermes-button"
            style={{ background: 'var(--hermes-success-text)', color: 'var(--hermes-panel-bg)' }}
          >
            Add
          </button>
        </div>
        
        <div className="modal-buttons">
          <button onClick={onClose} className="hermes-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 