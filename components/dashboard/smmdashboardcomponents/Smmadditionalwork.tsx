"use client";

import { useState } from "react";
import { AdditionalWork } from "@/types/smm/SMM";
import styles from "@/public/assets/styles/dashboard/smmdashboard/Smmadditionalwork.module.css";

interface SMMAdditionalWorkProps {
  items: AdditionalWork[];
  onStatusChange: (id: string, status: "pending" | "completed") => void;
  onAddItem: (title: string, description: string) => void;
}

export default function SMMAdditionalWork({
  items,
  onStatusChange,
  onAddItem,
}: SMMAdditionalWorkProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddItem(title.trim(), description.trim());
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  const pending = items.filter((i) => i.status !== "completed");
  const completed = items.filter((i) => i.status === "completed");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Additional Work</h2>
          <p className={styles.sub}>Extra tasks that came in mid-work, outside the regular queue</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log Work
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.field}>
            <label>What extra work came in?</label>
            <input
              className={styles.input}
              placeholder="e.g. Urgent comment management, quick caption fix…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Details (optional)</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              rows={3}
              placeholder="Any extra context…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSubmit}>
              Add Entry
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧰</div>
          <p>No additional work logged yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Pending</span>
              <div className={styles.list}>
                {pending.map((item) => (
                  <div key={item.id} className={styles.workItem}>
                    <div className={styles.workLeft}>
                      <span className={`${styles.sourceTag} ${item.loggedBy === "admin" ? styles.fromAdmin : styles.fromSelf}`}>
                        {item.loggedBy === "admin" ? "From Admin" : "Self-logged"}
                      </span>
                      <h4 className={styles.workTitle}>{item.title}</h4>
                      {item.description && <p className={styles.workDesc}>{item.description}</p>}
                      <span className={styles.workDate}>{item.date}</span>
                    </div>
                    <button className={styles.completeBtn} onClick={() => onStatusChange(item.id, "completed")}>
                      Mark Done
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Completed</span>
              <div className={styles.list}>
                {completed.map((item) => (
                  <div key={item.id} className={`${styles.workItem} ${styles.workItemDone}`}>
                    <div className={styles.workLeft}>
                      <span className={`${styles.sourceTag} ${item.loggedBy === "admin" ? styles.fromAdmin : styles.fromSelf}`}>
                        {item.loggedBy === "admin" ? "From Admin" : "Self-logged"}
                      </span>
                      <h4 className={styles.workTitle}>{item.title}</h4>
                      {item.description && <p className={styles.workDesc}>{item.description}</p>}
                      <span className={styles.workDate}>{item.date}</span>
                    </div>
                    <span className={styles.doneTag}>✓ Done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}