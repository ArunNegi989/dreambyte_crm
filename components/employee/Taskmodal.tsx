import React, { useState } from 'react';
import { Task, TaskChangeRequest, DeliveryState } from '../../types/employee/task';
import StatusBadge from './StatusBadge';
import DeliveryToggle from './DeliveryToggle';
import styles from '../../assets/styles/employeedashboard/TaskModal.module.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSubmitTask: (taskId: string, deliveryState: DeliveryState, remarks: string) => void;
  onSubmitChangeResponses: (
    taskId: string,
    deliveryState: DeliveryState,
    remarks: string,
    responses: { id: string; response: string }[]
  ) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onSubmitTask,
  onSubmitChangeResponses,
}) => {
  const [deliveryState, setDeliveryState] = useState<DeliveryState>(task.deliveryState);
  const [remarks, setRemarks] = useState(task.remarks);
  const [changeResponses, setChangeResponses] = useState<Record<string, string>>(
    Object.fromEntries(task.changeRequests.map((c) => [c.id, c.employeeResponse || '']))
  );

  const unresolvedChanges = task.changeRequests.filter((c) => !c.resolved);
  const isEditable = task.status === 'pending' || task.status === 'changes_requested';

  const handleChangeResponseEdit = (id: string, value: string) => {
    setChangeResponses((prev) => ({ ...prev, [id]: value }));
  };

  const allResponsesFilled = unresolvedChanges.every(
    (c) => (changeResponses[c.id] || '').trim().length > 0
  );
  const canSubmit = deliveryState === 'delivered' && remarks.trim().length > 0;

  const handleSubmit = () => {
    if (task.status === 'changes_requested') {
      const payload = unresolvedChanges.map((c) => ({
        id: c.id,
        response: changeResponses[c.id] || '',
      }));
      onSubmitChangeResponses(task.id, deliveryState, remarks, payload);
    } else {
      onSubmitTask(task.id, deliveryState, remarks);
    }
  };

  const submitDisabled = !canSubmit || (task.status === 'changes_requested' && !allResponsesFilled);

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
        </div>

        {task.status === 'changes_requested' && unresolvedChanges.length > 0 && (
          <div className={styles.changesSection}>
            <h3 className={styles.sectionHeading}>
              Requested changes
              <span className={styles.sectionCount}>{unresolvedChanges.length}</span>
            </h3>
            <p className={styles.sectionHint}>
              Address each point below before resubmitting.
            </p>

            {unresolvedChanges.map((change, idx) => (
              <ChangeRequestRow
                key={change.id}
                index={idx + 1}
                change={change}
                value={changeResponses[change.id] || ''}
                onChange={(val) => handleChangeResponseEdit(change.id, val)}
              />
            ))}
          </div>
        )}

        {isEditable && (
          <div className={styles.deliverySection}>
            <h3 className={styles.sectionHeading}>Delivery status</h3>
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
                Mark as delivered and add remarks to submit.
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
            Approved and completed
          </div>
        )}
      </div>
    </div>
  );
};

interface ChangeRequestRowProps {
  index: number;
  change: TaskChangeRequest;
  value: string;
  onChange: (value: string) => void;
}

const ChangeRequestRow: React.FC<ChangeRequestRowProps> = ({ index, change, value, onChange }) => {
  return (
    <div className={styles.changeRow}>
      <div className={styles.changeNote}>
        <span className={styles.changeIndex}>{index}</span>
        <p className={styles.changeText}>{change.adminNote}</p>
      </div>
      <textarea
        className={styles.changeInput}
        placeholder="Describe what you changed to address this..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    </div>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default TaskModal;