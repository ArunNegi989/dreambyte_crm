"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  addSubtask as apiAddSubtask,
  toggleSubtask as apiToggleSubtask,
  removeSubtask as apiRemoveSubtask,
} from '../../app/api/employeeApi';
import { Subtask } from '../../types/employee/task';

export function useSubtasks(taskId: string, initialSubtasks: Subtask[] = []) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [error, setError] = useState<string | null>(null);

  // Only re-seed local state when we're actually looking at a DIFFERENT
  // task. `taskId` is a stable primitive (string), so this effect fires
  // once per task switch — never on every parent re-render, no matter how
  // many times the parent hands us a fresh `task.subtasks` array reference
  // with the same (or even different) content on unrelated keystrokes.
  const lastTaskId = useRef(taskId);
  useEffect(() => {
    if (lastTaskId.current !== taskId) {
      lastTaskId.current = taskId;
      setSubtasks(initialSubtasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const addSubtask = useCallback(
    async (title: string) => {
      const text = title.trim();
      if (!text) return;
      const prev = subtasks;
      setError(null);
      try {
        const updated = await apiAddSubtask(taskId, text);
        setSubtasks(updated.subtasks);
      } catch (err: any) {
        setSubtasks(prev);
        setError(err.message || 'Failed to add subtask');
      }
    },
    [taskId, subtasks]
  );

  const toggleSubtask = useCallback(
    async (subtaskId: string) => {
      const prev = subtasks;
      setSubtasks((p) =>
        p.map((s) =>
          s.id === subtaskId
            ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' }
            : s
        )
      );
      setError(null);
      try {
        const updated = await apiToggleSubtask(taskId, subtaskId);
        setSubtasks(updated.subtasks);
      } catch (err: any) {
        setSubtasks(prev);
        setError(err.message || 'Failed to update subtask');
      }
    },
    [taskId, subtasks]
  );

  const removeSubtask = useCallback(
    async (subtaskId: string) => {
      const prev = subtasks;
      setSubtasks((p) => p.filter((s) => s.id !== subtaskId));
      setError(null);
      try {
        const updated = await apiRemoveSubtask(taskId, subtaskId);
        setSubtasks(updated.subtasks);
      } catch (err: any) {
        setSubtasks(prev);
        setError(err.message || 'Failed to remove subtask');
      }
    },
    [taskId, subtasks]
  );

  return { subtasks, addSubtask, toggleSubtask, removeSubtask, error };
}