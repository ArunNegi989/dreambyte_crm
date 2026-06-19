import React, { useState } from 'react';
import { Task, TaskChangeRequest, DeliveryState } from '../../../types/employee/task';
import { getTimeTaken, getTotalChangeCount } from '../../../data/employee/taskTimeHelpers';
import StatusBadge from './StatusBadge';
import DeliveryToggle from './DeliveryToggle';
import styles from '../../../assets/styles/employeedashboard/TaskModal.module.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmitTask: (taskId: string, deliveryState: DeliveryState, remarks: string, startedAt: string) => void;
  onSubmitChangeResponses: (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string,
    responses: { id: string; response: string }[]
  ) => void;
}

function splitIsoToDateAndTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onSubmitTask,
  onSubmitChangeResponses,
}) => {
  const [deliveryState, setDeliveryState] = useState<DeliveryState>(task.deliveryState);
  const [remarks, setRemarks] = useState(task.remarks);

  const initialStarted = splitIsoToDateAndTime(task.startedAt);
  const [startedDate, setStartedDate] = useState(initialStarted.date);
  const [startedTime, setStartedTime] = useState(initialStarted.time);

  const [changeRemarks, setChangeRemarks] = useState<Record<string, string[]>>(
    Object.fromEntries(task.changeRequests.map((c) => [c.id, c.employeeResponse ? [c.employeeResponse] : []]))
  );

  const unresolvedChanges = task.changeRequests.filter((c) => !c.resolved);
  const totalChanges = getTotalChangeCount(task);
  const timeTaken = getTimeTaken(task);
  const isEditable = task.status === 'pending' || task.status === 'changes_requested';

  const handleAddRemarkBox = (changeId: string) => {
    setChangeRemarks((prev) => ({
      ...prev,
      [changeId]: [...(prev[changeId] || []), ''],
    }));
  };

  const handleRemarkChange = (changeId: string, index: number, value: string) => {
    setChangeRemarks((prev) => {
      const updated = [...(prev[changeId] || [])];
      updated[index] = value;
      return { ...prev, [changeId]: updated };
    });
  };

  const handleRemoveRemarkBox = (changeId: string, index: number) => {
    setChangeRemarks((prev) => {
      const updated = [...(prev[changeId] || [])];
      updated.splice(index, 1);
      return { ...prev, [changeId]: updated };
    });
  };

  const allChangesHaveRemarks = unresolvedChanges.every(
    (c) => (changeRemarks[c.id] || []).filter((r) => r.trim().length > 0).length > 0
  );
  const canSubmit =
    deliveryState === 'delivered' &&
    remarks.trim().length > 0 &&
    startedDate.trim().length > 0 &&
    startedTime.trim().length > 0;

  const handleSubmit = () => {
    if (task.status === 'changes_requested') {
      const payload = unresolvedChanges.map((c) => ({
        id: c.id,
        response: (changeRemarks[c.id] || []).filter((r) => r.trim().length > 0).join('\n'),
      }));
      onSubmitChangeResponses(task.id, deliveryState, remarks, payload);
    } else {
      // Combine the separate date + time inputs into a single ISO-ish timestamp.
      const startedAt = `${startedDate}T${startedTime}:00`;
      onSubmitTask(task.id, deliveryState, remarks, startedAt);
    }
  };

  const submitDisabled =
    !canSubmit || (task.status === 'changes_requested' && !allChangesHaveRemarks);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.brandClient}>
            <span className={styles.brand}>{task.brandName}</span>
            <span className={styles.client}>{task.clientName}</span>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <h2 className={styles.title}>{task.title}</h2>
        <p className={styles.description}>{task.description}</p>

        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Assigned</span>
            <span className={styles.metaValue}>{formatDate(task.assignedAt)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Due</span>
            <span className={styles.metaValue}>{formatDate(task.dueDate)}</span>
          </div>
          {task.submittedAt && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last submitted</span>
              <span className={styles.metaValue}>{formatDate(task.submittedAt)}</span>
            </div>
          )}
          {totalChanges > 0 && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Total changes</span>
              <span className={styles.metaValue}>{totalChanges}</span>
            </div>
          )}
          {timeTaken && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Time taken</span>
              <span className={styles.metaValue}>{timeTaken}</span>
            </div>
          )}
        </div>

        {task.status === 'changes_requested' && unresolvedChanges.length > 0 && (
          <div className={styles.changesSection}>
            <h3 className={styles.sectionHeading}>
              Requested changes
              <span className={styles.sectionCount}>{unresolvedChanges.length}</span>
            </h3>
            <p className={styles.sectionHint}>
              Add a remark for each point using the + button before resubmitting.
            </p>

            {unresolvedChanges.map((change, idx) => (
              <ChangeRequestRow
                key={change.id}
                index={idx + 1}
                change={change}
                remarkValues={changeRemarks[change.id] || []}
                onAddRemark={() => handleAddRemarkBox(change.id)}
                onRemarkChange={(i, val) => handleRemarkChange(change.id, i, val)}
                onRemoveRemark={(i) => handleRemoveRemarkBox(change.id, i)}
              />
            ))}
          </div>
        )}

        {isEditable && (
          <div className={styles.deliverySection}>
            <h3 className={styles.sectionHeading}>When did you start this task?</h3>
            <div className={styles.dateTimeRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={startedDate}
                onChange={(e) => setStartedDate(e.target.value)}
                aria-label="Start date"
              />
              <input
                type="time"
                className={styles.dateInput}
                value={startedTime}
                onChange={(e) => setStartedTime(e.target.value)}
                aria-label="Start time"
              />
            </div>

            <h3 className={styles.sectionHeading} style={{ marginTop: 16 }}>
              Delivery status
            </h3>
            <DeliveryToggle value={deliveryState} onChange={setDeliveryState} />

            <h3 className={styles.sectionHeading} style={{ marginTop: 16 }}>
              Remarks
            </h3>
            <textarea
              className={styles.remarksInput}
              placeholder="Add a note about the work completed..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />

            <button className={styles.primaryBtn} disabled={submitDisabled} onClick={handleSubmit}>
              Submit for review
            </button>
            {!canSubmit && (
              <p className={styles.submitHint}>
                Add a start date and time, mark as delivered, and add remarks to submit.
              </p>
            )}
          </div>
        )}

        {task.status === 'pending' && task.submittedAt && (
          <div className={styles.noteRow}>
            <span className={`${styles.noteDot} ${styles.dotBlue}`} />
            Submitted — waiting on admin approval
          </div>
        )}

        {task.status === 'completed' && (
          <div className={styles.noteRowDark}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Marked completed — waiting on client approval
          </div>
        )}

        {task.status === 'approved' && (
          <div className={styles.noteRowGreen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Approved by client
          </div>
        )}
      </div>
    </div>
  );
};

interface ChangeRequestRowProps {
  index: number;
  change: TaskChangeRequest;
  remarkValues: string[];
  onAddRemark: () => void;
  onRemarkChange: (index: number, value: string) => void;
  onRemoveRemark: (index: number) => void;
}

const ChangeRequestRow: React.FC<ChangeRequestRowProps> = ({
  index,
  change,
  remarkValues,
  onAddRemark,
  onRemarkChange,
  onRemoveRemark,
}) => {
  return (
    <div className={styles.changeRow}>
      <div className={styles.changeNote}>
        <span className={styles.changeIndex}>{index}</span>
        <p className={styles.changeText}>{change.adminNote}</p>
      </div>

      {remarkValues.map((value, i) => (
        <div key={i} className={styles.remarkBoxRow}>
          <textarea
            className={styles.changeInput}
            placeholder="Describe what you changed to address this..."
            value={value}
            onChange={(e) => onRemarkChange(i, e.target.value)}
            rows={2}
          />
          <button
            type="button"
            className={styles.removeRemarkBtn}
            onClick={() => onRemoveRemark(i)}
            aria-label="Remove remark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}

      <button type="button" className={styles.addRemarkBtn} onClick={onAddRemark}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add remark
      </button>
    </div>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default TaskModal;