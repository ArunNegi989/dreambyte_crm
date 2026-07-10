import React, { useState } from 'react';
import { Task, TaskChangeRequest, DeliveryState } from '../../../types/employee/task';
import { getTimeTaken, getTotalChangeCount } from '../../../data/employee/taskTimeHelpers';
import StatusBadge from './StatusBadge';
import DeliveryToggle from './DeliveryToggle';
import SubtaskManager from '../../../app/dashboard/employeedashboard/SubtaskManager';
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
  return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) };
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSubmitTask, onSubmitChangeResponses }) => {
  if (!task || typeof task !== 'object') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <p style={{ color: '#a32d2d' }}>This task could not be loaded. Please close and try again.</p>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
    );
  }

  const history: TaskChangeRequest[] = Array.isArray(task.changeRequests) ? task.changeRequests : [];
  const unresolved = history.filter((c) => !c.resolved);
  const resolved = history.filter((c) => c.resolved);
  const hasUnresolved = unresolved.length > 0;

  // Fresh-submission fields are only relevant when there's no open change
  // request — once something is unresolved, the modal switches entirely
  // into "reply to admin notes" mode and these are never shown/used.
  const [deliveryState, setDeliveryState] = useState<DeliveryState>(task.deliveryState ?? 'not_delivered');
  const [remarks, setRemarks] = useState(task.remarks ?? '');
  const initialStarted = splitIsoToDateAndTime(task.startedAt ?? null);
  const [startedDate, setStartedDate] = useState(initialStarted.date);
  const [startedTime, setStartedTime] = useState(initialStarted.time);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string[]>>(
    Object.fromEntries(unresolved.map((c) => [c.id, ['']]))
  );

  const totalChanges = getTotalChangeCount(task);
  const timeTaken = getTimeTaken(task);

  const FINAL_STATUSES = ['completed', 'approved'];
  const isEditable = !FINAL_STATUSES.includes(task.status);
  // Fresh-submission form (delivery/remarks/start time) only renders when
  // the task is editable AND there is nothing currently unresolved.
  const showFreshSubmissionForm = isEditable && !hasUnresolved;

  const handleAddReplyBox = (id: string) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: [...(prev[id] || []), ''] }));
  };
  const handleReplyChange = (id: string, index: number, value: string) => {
    setReplyDrafts((prev) => {
      const updated = [...(prev[id] || [])];
      updated[index] = value;
      return { ...prev, [id]: updated };
    });
  };
  const handleRemoveReplyBox = (id: string, index: number) => {
    setReplyDrafts((prev) => {
      const updated = [...(prev[id] || [])];
      updated.splice(index, 1);
      return { ...prev, [id]: updated };
    });
  };

  const allUnresolvedHaveReplies = unresolved.every(
    (c) => (replyDrafts[c.id] || []).filter((r) => r.trim().length > 0).length > 0
  );

  // Submit conditions differ by mode: fresh submission needs the full form
  // filled in; replying to changes only needs every open note answered.
  const canSubmitFresh =
    deliveryState === 'delivered' &&
    remarks.trim().length > 0 &&
    startedDate.trim().length > 0 &&
    startedTime.trim().length > 0;

  const submitDisabled = hasUnresolved ? !allUnresolvedHaveReplies : !canSubmitFresh;

  const handleSubmit = () => {
    if (hasUnresolved) {
      const payload = unresolved.map((c) => ({
        id: c.id,
        response: (replyDrafts[c.id] || []).filter((r) => r.trim().length > 0).join('\n'),
      }));
      // No remarks/delivery/start time are sent on this path — those fields
      // don't exist in this flow at all.
      onSubmitChangeResponses(task.id, task.deliveryState, '', payload);
    } else {
      onSubmitTask(task.id, deliveryState, remarks, `${startedDate}T${startedTime}:00`);
    }
  };

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
            <span className={styles.brand}>{task.brandName || '—'}</span>
            <span className={styles.client}>{task.clientName || '—'}</span>
          </div>
          <StatusBadge status={task.status} />
        </div>

        <h2 className={styles.title}>{task.title || 'Untitled task'}</h2>
        <p className={styles.description}>{task.description || 'No description provided.'}</p>

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

        <div style={{ marginTop: 16 }}>
        <SubtaskManager key={task.id} taskId={task.id} subtasks={task.subtasks} variant="full" />        </div>

        {history.length > 0 && (
          <div className={styles.changesSection}>
            <h3 className={styles.sectionHeading}>
              Change history
              <span className={styles.sectionCount}>{history.length}</span>
            </h3>
            {hasUnresolved && (
              <p className={styles.sectionHint}>
                Reply to each open note below, then submit. Resolved notes are shown for reference.
              </p>
            )}

            {resolved.map((change, idx) => (
              <ResolvedChangeRow key={change.id} index={idx + 1} change={change} />
            ))}

            {unresolved.map((change, idx) => (
              <OpenChangeRow
                key={change.id}
                index={resolved.length + idx + 1}
                change={change}
                replyValues={replyDrafts[change.id] || []}
                onAddReply={() => handleAddReplyBox(change.id)}
                onReplyChange={(i, val) => handleReplyChange(change.id, i, val)}
                onRemoveReply={(i) => handleRemoveReplyBox(change.id, i)}
              />
            ))}

            {hasUnresolved && (
              <button className={styles.primaryBtn} disabled={submitDisabled} onClick={handleSubmit}>
                Submit changes
              </button>
            )}
            {hasUnresolved && !allUnresolvedHaveReplies && (
              <p className={styles.submitHint}>Reply to every open note to submit.</p>
            )}
          </div>
        )}

        {showFreshSubmissionForm && (
          <div className={styles.deliverySection}>
            <h3 className={styles.sectionHeading}>When did you start this task?</h3>
            <div className={styles.dateTimeRow}>
              <input type="date" className={styles.dateInput} value={startedDate}
                onChange={(e) => setStartedDate(e.target.value)} aria-label="Start date" />
              <input type="time" className={styles.dateInput} value={startedTime}
                onChange={(e) => setStartedTime(e.target.value)} aria-label="Start time" />
            </div>

            <h3 className={styles.sectionHeading} style={{ marginTop: 16 }}>Delivery status</h3>
            <DeliveryToggle value={deliveryState} onChange={setDeliveryState} />

            <h3 className={styles.sectionHeading} style={{ marginTop: 16 }}>Remarks</h3>
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
            {!canSubmitFresh && (
              <p className={styles.submitHint}>
                Add a start date and time, mark as delivered, and add remarks to submit.
              </p>
            )}
          </div>
        )}

        {!isEditable && task.status === 'completed' && (
          <div className={styles.noteRowDark}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 13l4 4L19 7" /></svg>
            Marked completed — waiting on client approval
          </div>
        )}
        {!isEditable && task.status === 'approved' && (
          <div className={styles.noteRowGreen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 13l4 4L19 7" /></svg>
            Approved by client
          </div>
        )}
      </div>
    </div>
  );
};

const ResolvedChangeRow: React.FC<{ index: number; change: TaskChangeRequest }> = ({ index, change }) => {
  return (
    <div className={`${styles.changeRow} ${styles.changeRowResolved}`}>
      <div className={styles.changeNote}>
        <span className={`${styles.changeIndex} ${styles.changeIndexResolved}`}>{index}</span>
        <p className={styles.changeText}>{change.adminNote || 'No message provided.'}</p>
      </div>
      {change.employeeResponse ? (
        <div className={styles.resolvedReply}>
          <span className={styles.resolvedReplyLabel}>Your reply</span>
          <p className={styles.resolvedReplyText}>{change.employeeResponse}</p>
        </div>
      ) : (
        <p className={styles.resolvedReplyEmpty}>Marked resolved without a written reply.</p>
      )}
    </div>
  );
};

interface OpenChangeRowProps {
  index: number;
  change: TaskChangeRequest;
  replyValues: string[];
  onAddReply: () => void;
  onReplyChange: (index: number, value: string) => void;
  onRemoveReply: (index: number) => void;
}

const OpenChangeRow: React.FC<OpenChangeRowProps> = ({ index, change, replyValues, onAddReply, onReplyChange, onRemoveReply }) => {
  return (
    <div className={styles.changeRow}>
      <div className={styles.changeNote}>
        <span className={styles.changeIndex}>{index}</span>
        <p className={styles.changeText}>{change.adminNote || 'No message provided.'}</p>
      </div>

      {replyValues.map((value, i) => (
        <div key={i} className={styles.remarkBoxRow}>
          <textarea
            className={styles.changeInput}
            placeholder="Describe what you changed to address this..."
            value={value}
            onChange={(e) => onReplyChange(i, e.target.value)}
            rows={2}
          />
          <button type="button" className={styles.removeRemarkBtn} onClick={() => onRemoveReply(i)} aria-label="Remove remark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      ))}

      <button type="button" className={styles.addRemarkBtn} onClick={onAddReply}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M12 5v14M5 12h14" /></svg>
        Add remark
      </button>
    </div>
  );
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default TaskModal;