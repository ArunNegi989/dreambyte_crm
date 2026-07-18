"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Task, Employee, Brand, TaskStatus, TaskFrequency } from "@/types/superadmin/superAdmin";
import { getTasksForDepartment } from "@/data/superadmin/departmentTasks";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Satasks.module.css";

interface SATasksProps {
  tasks: Task[];
  employees: Employee[];
  brands: Brand[];
  viewerRole?: "super_admin" | "admin" | "employee";
  viewerId?: string;
  onStatusChange: (id: string, status: TaskStatus, remark?: string, changedBy?: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (t: Omit<Task, "_id" | "createdAt" | "updatedAt">) => void;
  onEditTask: (t: Task) => void;
  onDeliverTask: (id: string, note: string) => void;
  onRespondChange: (taskId: string, changeId: string, response: string) => void;
}

const emptyTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  brandId: "",
  frequency: "weekly" as TaskFrequency,
  dueDate: "",
  // ── Photography-specific (only sent to backend when relevant) ──
  location: "",
  time: "",
  mediaType: "" as "" | "photo" | "video" | "both",
  totalCount: "",
};

// ── Multi-task batch-assign draft ────────────────────────────────────────
// Each drafted task in the batch: pick a Task (work type) first, which
// reveals the Brand dropdown for that task, then finish its details and
// push it into the tab strip. Repeat for as many tasks/brands as needed,
// then submit the whole batch at once for the single selected employee.
interface TaskDraft {
  id: string;
  workType: string;
  brandId: string;
  title: string;
  description: string;
  frequency: TaskFrequency;
  dueDate: string;
  location: string;
  time: string;
  mediaType: "" | "photo" | "video" | "both";
  totalCount: string;
}

const emptyDraft: Omit<TaskDraft, "id"> = {
  workType: "",
  brandId: "",
  title: "",
  description: "",
  frequency: "weekly",
  dueDate: "",
  location: "",
  time: "",
  mediaType: "",
  totalCount: "",
};

// Work types that need the Shoots-specific fields (location/time/media type)
const SHOOT_WORK_TYPES = ["Shoots"];
// Work types that need a "how many to edit" count
const EDIT_COUNT_WORK_TYPES = ["Photo Edit"];

// ── Time-taken helper ────────────────────────────────────────────────────
// THE FIX: this used to compute a raw startedAt -> deliveredAt wall-clock
// diff. That formula quietly breaks the moment a task goes through a
// reject -> Resume Task cycle: startTask() intentionally sets deliveredAt
// to null on resume (so the OLD delivered timestamp doesn't get treated as
// an "end"), which means this diff falls back to (now - startedAt) — the
// task's ORIGINAL start time, days ago — completely ignoring any time it
// spent paused while waiting on the rejection. The number balloons and
// looks like a runaway timer.
//
// The backend already tracks the correct, pause-aware total in
// timeSpentMs (accumulated on every stopTimer() call) plus whatever the
// currently-running session has added on top (currentSessionStartedAt).
// This is the exact same formula the Designer Dashboard uses
// (types/designer/Designer.ts's getTimeTakenLabel), so both sides now
// always show the identical number, in every state (running, paused on
// rejection, resumed, delivered).
const getTimeTakenLabel = (
  timeSpentMs?: number | null,
  currentSessionStartedAt?: string | null
): string => {
  let totalMs = timeSpentMs || 0;

  if (currentSessionStartedAt) {
    const elapsed = Date.now() - new Date(currentSessionStartedAt).getTime();
    if (elapsed > 0) totalMs += elapsed;
  }

  if (totalMs <= 0) return "—";

  const mins = Math.floor(totalMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

export default function SATasks({
  tasks,
  employees,
  brands,
  viewerRole = "super_admin",
  viewerId,
  onStatusChange,
  onDeleteTask,
  onAddTask,
  onEditTask,
  onDeliverTask,
  onRespondChange,
}: SATasksProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyTaskForm);
  const [workType, setWorkType] = useState(""); // separate from form.title so the dropdown stays controlled
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [empResponses, setEmpResponses] = useState<Record<string, string>>({});
  const [rejectRemark, setRejectRemark] = useState<Record<string, string>>({});
  const [remarkOpen, setRemarkOpen] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  // ── Batch-assign (multi task/brand) state — only used when adding new
  // tasks (editTarget === null). Editing a single existing task still uses
  // the plain `form` state above, untouched. ───────────────────────────────
  const [batchAssignedTo, setBatchAssignedTo] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<TaskDraft, "id">>(emptyDraft);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Deliver modal state
  const [deliverModal, setDeliverModal] = useState<Task | null>(null);
  const [deliverNote, setDeliverNote] = useState("");
  const [delivering, setDelivering] = useState(false);

  const isAdminOrSA = viewerRole === "super_admin" || viewerRole === "admin";
  const actorLabel = viewerRole === "super_admin" ? "Super Admin" : "Admin";

  // ── Assignable employees only — super_admin (khud ho ya koi doosra
  // super admin) kabhi bhi "Assign To" dropdown mein nahi aayega. Task
  // hamesha sirf actual employees ko hi assign ho sakta hai. ──────────────
  const assignableEmployees = employees.filter((e) => e.role !== "super_admin");

  // ── Department-aware "Assign To" (single-task edit form) ────────────────
  const selectedEmployeeForForm = employees.find((e) => e._id === form.assignedTo);
  const departmentTasks = getTasksForDepartment(selectedEmployeeForForm?.department);

  const isShootWork = SHOOT_WORK_TYPES.includes(workType);
  const isEditCountWork = EDIT_COUNT_WORK_TYPES.includes(workType);

  // ── Department-aware batch composer ──────────────────────────────────────
  const batchEmployee = employees.find((e) => e._id === batchAssignedTo);
  const batchDepartmentTasks = getTasksForDepartment(batchEmployee?.department);

  const visibleTasks =
    viewerRole === "employee" && viewerId
      ? tasks.filter((t) => {
          const id =
            typeof t.assignedTo === "object"
              ? (t.assignedTo as { _id: string })._id
              : t.assignedTo;
          return id === viewerId;
        })
      : tasks;

  const filteredTasks =
    filter === "all"
      ? visibleTasks
      : visibleTasks.filter((t) => t.status === filter);

  const getEmpName = (
    assignedTo: string | { _id: string; name: string } | null | undefined
  ) => {
    if (!assignedTo) return "Unassigned";
    if (typeof assignedTo === "object") return assignedTo.name ?? "Unassigned";
    return employees.find((e) => e._id === assignedTo)?.name ?? "—";
  };

  const getBrandName = (
    brandId?: string | { _id: string; name: string } | null
  ) => {
    if (!brandId) return "—";
    if (typeof brandId === "object") return brandId.name;
    return brands.find((b) => b._id === brandId)?.name ?? "—";
  };

  const getTaskId = (t: Task) => t._id;

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyTaskForm);
    setWorkType("");
    // Reset batch composer for a fresh multi-task assignment
    setBatchAssignedTo("");
    setTaskDrafts([]);
    setEditingDraftId(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };

  const openEdit = (t: Task) => {
    setEditTarget(t);
    const tAny = t as unknown as {
      taskType?: string;
      location?: string;
      time?: string;
      mediaType?: "photo" | "video" | "both" | null;
      totalCount?: number | null;
    };
    setForm({
      title: t.title,
      description: t.description,
      assignedTo:
        typeof t.assignedTo === "object"
          ? (t.assignedTo as { _id: string })._id
          : t.assignedTo,
      brandId: t.brandId
        ? typeof t.brandId === "object"
          ? (t.brandId as { _id: string })._id
          : t.brandId
        : "",
      frequency: t.frequency,
      dueDate: t.dueDate,
      location: tAny.location ?? "",
      time: tAny.time ?? "",
      mediaType: (tAny.mediaType as "" | "photo" | "video" | "both") ?? "",
      totalCount: tAny.totalCount != null ? String(tAny.totalCount) : "",
    });
    setWorkType(tAny.taskType ?? "");
    setShowForm(true);
  };

  // When the employee changes, department (and its work-type list) changes.
  // Clear the work type / title / photography fields since they belonged
  // to the previous department and would otherwise silently carry over.
  const handleAssignedToChange = (empId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedTo: empId,
      title: "",
      location: "",
      time: "",
      mediaType: "",
      totalCount: "",
    }));
    setWorkType("");
  };

  const handleWorkTypeChange = (wt: string) => {
    setWorkType(wt);
    setForm((prev) => ({
      ...prev,
      title: wt,
      // Reset photography fields when switching between work types so a
      // stale count/location from a different type can't slip through.
      location: SHOOT_WORK_TYPES.includes(wt) ? prev.location : "",
      time: SHOOT_WORK_TYPES.includes(wt) ? prev.time : "",
      mediaType: SHOOT_WORK_TYPES.includes(wt) ? prev.mediaType : "",
      totalCount: EDIT_COUNT_WORK_TYPES.includes(wt) ? prev.totalCount : "",
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.assignedTo) return;

    // Safety net: even if assignedTo somehow points to a super_admin
    // (stale state, edit of an old task, etc.), block the submit.
    const targetEmp = employees.find((e) => e._id === form.assignedTo);
    if (targetEmp?.role === "super_admin") {
      alert("Super Admin ko task assign nahi kiya ja sakta.");
      return;
    }

    const basePayload = {
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo,
      brandId: form.brandId || undefined,
      frequency: form.frequency,
      dueDate: form.dueDate,
      // ── photography extras — harmless no-ops for non-photography tasks ──
      taskType: workType || undefined,
      location: isShootWork ? form.location : undefined,
      time: isShootWork ? form.time : undefined,
      mediaType: isShootWork && form.mediaType ? form.mediaType : undefined,
      totalCount: isEditCountWork && form.totalCount ? form.totalCount : undefined,
    };

    if (editTarget) {
      onEditTask({ ...editTarget, ...basePayload } as Task);
    } else {
      onAddTask({
        ...basePayload,
        assignedBy: viewerRole === "admin" ? "admin" : "super_admin",
        status: "pending",
        deliveryStatus: "not_delivered",
        deliveryNote: "",
        deliveredAt: undefined,
        rejectRemark: "",
        changes: [],
      } as Omit<Task, "_id" | "createdAt" | "updatedAt">);
    }
    setShowForm(false);
  };

  // ── Batch composer handlers ───────────────────────────────────────────

  // Switching employee mid-batch invalidates any drafts — different
  // department means a different Task/work-type list entirely.
  const handleBatchEmployeeChange = (empId: string) => {
    setBatchAssignedTo(empId);
    setDraft(emptyDraft);
    setEditingDraftId(null);
    setTaskDrafts([]);
  };

  // Picking a Task (work type) is what reveals the Brand dropdown for it.
  const handleDraftWorkTypeChange = (wt: string) => {
    setDraft((prev) => ({
      ...prev,
      workType: wt,
      title: wt,
      brandId: "",
      location: SHOOT_WORK_TYPES.includes(wt) ? prev.location : "",
      time: SHOOT_WORK_TYPES.includes(wt) ? prev.time : "",
      mediaType: SHOOT_WORK_TYPES.includes(wt) ? prev.mediaType : "",
      totalCount: EDIT_COUNT_WORK_TYPES.includes(wt) ? prev.totalCount : "",
    }));
  };

  // Push the current draft into the tab strip (or update it if it's being
  // re-edited), then clear the composer so the next Task/Brand can be set.
  const handleSaveDraftToTabs = () => {
    if (!draft.workType || !draft.brandId) return;
    if (editingDraftId) {
      setTaskDrafts((prev) =>
        prev.map((d) => (d.id === editingDraftId ? { ...draft, id: editingDraftId } : d))
      );
    } else {
      setTaskDrafts((prev) => [...prev, { ...draft, id: `${Date.now()}-${prev.length}` }]);
    }
    setDraft(emptyDraft);
    setEditingDraftId(null);
  };

  const openDraftTab = (d: TaskDraft) => {
    setDraft({ ...d });
    setEditingDraftId(d.id);
  };

  const removeDraftTab = (id: string) => {
    setTaskDrafts((prev) => prev.filter((d) => d.id !== id));
    if (editingDraftId === id) {
      setDraft(emptyDraft);
      setEditingDraftId(null);
    }
  };

  // Final submit — creates every drafted task (each with its own
  // Task/Brand pairing) for the single selected employee in one go.
  const handleAssignBatch = () => {
    if (!batchAssignedTo) return;
    const targetEmp = employees.find((e) => e._id === batchAssignedTo);
    if (targetEmp?.role === "super_admin") {
      alert("Super Admin ko task assign nahi kiya ja sakta.");
      return;
    }

    // Include whatever's sitting in the composer if it's valid but hasn't
    // been explicitly added as a tab yet (so the user doesn't lose it).
    const pending: TaskDraft[] =
      draft.workType && draft.brandId && !editingDraftId
        ? [...taskDrafts, { ...draft, id: `pending-${Date.now()}` }]
        : taskDrafts;

    if (pending.length === 0) return;

    setSubmittingBatch(true);
    pending.forEach((d) => {
      const isShoot = SHOOT_WORK_TYPES.includes(d.workType);
      const isEditCount = EDIT_COUNT_WORK_TYPES.includes(d.workType);
      onAddTask({
        title: d.title || d.workType,
        description: d.description,
        assignedTo: batchAssignedTo,
        brandId: d.brandId || undefined,
        frequency: d.frequency,
        dueDate: d.dueDate,
        taskType: d.workType || undefined,
        location: isShoot ? d.location : undefined,
        time: isShoot ? d.time : undefined,
        mediaType: isShoot && d.mediaType ? d.mediaType : undefined,
        totalCount: isEditCount && d.totalCount ? d.totalCount : undefined,
        assignedBy: viewerRole === "admin" ? "admin" : "super_admin",
        status: "pending",
        deliveryStatus: "not_delivered",
        deliveryNote: "",
        deliveredAt: undefined,
        rejectRemark: "",
        changes: [],
      } as unknown as Omit<Task, "_id" | "createdAt" | "updatedAt">);
    });

    setSubmittingBatch(false);
    setShowForm(false);
    setTaskDrafts([]);
    setDraft(emptyDraft);
    setEditingDraftId(null);
    setBatchAssignedTo("");
  };

  const handleDeliver = async () => {
    if (!deliverModal) return;
    try {
      setDelivering(true);
      await api.post(`/tasks/${deliverModal._id}/deliver`, {
        deliveryNote: deliverNote,
      });
      onDeliverTask(deliverModal._id, deliverNote);
      setDeliverModal(null);
      setDeliverNote("");
    } catch (err) {
      console.error("Delivery failed", err);
    } finally {
      setDelivering(false);
    }
  };

  const handleStatusChange = (task: Task, tid: string, s: TaskStatus) => {
    onStatusChange(
      tid,
      s,
      s === "rejected" ? (rejectRemark[tid] ?? "") : undefined,
      s === "rejected" ? actorLabel : undefined
    );

    if (s === "rejected") {
      setRejectRemark((prev) => ({ ...prev, [tid]: "" }));
      setRemarkOpen((prev) => ({ ...prev, [tid]: true }));
    } else {
      setRejectRemark((prev) => {
        const next = { ...prev };
        delete next[tid];
        return next;
      });
      setRemarkOpen((prev) => {
        const next = { ...prev };
        delete next[tid];
        return next;
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tasks</h2>
          <p className={styles.sub}>{visibleTasks.length} total tasks</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterWrap}>
            {(
              ["all", "pending", "approved", "completed", "rejected"] as const
            ).map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${
                  filter === f ? styles.filterActive : ""
                }`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {isAdminOrSA && (
            <button className={styles.addBtn} onClick={openAdd}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Assign Task
            </button>
          )}
        </div>
      </div>

      {/* ── Assign / Edit Form ── */}
      {showForm && isAdminOrSA && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {editTarget ? "Edit Task" : "Assign Multiple Tasks"}
            </h3>
            <button
              className={styles.formClose}
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
          </div>

          {/* ═══════════════════ EDIT MODE (single existing task) ═══════════════════ */}
          {editTarget && (
            <div className={styles.formGrid}>
              {/* Assign To — first, so department/work-type can react to it.
                  Only non-super_admin employees are selectable. */}
              <div className={styles.field}>
                <label>Assign To *</label>
                <select
                  className={styles.input}
                  value={form.assignedTo}
                  onChange={(e) => handleAssignedToChange(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {assignableEmployees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} — {e.role}
                    </option>
                  ))}
                </select>
                {assignableEmployees.length === 0 && (
                  <span style={{ fontSize: 12, color: "#ef4444" }}>
                    Koi assignable employee nahi mila.
                  </span>
                )}
              </div>

              {/* Department — auto-filled, read-only */}
              {selectedEmployeeForForm && (
                <div className={styles.field}>
                  <label>Department</label>
                  <input
                    className={styles.input}
                    value={selectedEmployeeForForm.department}
                    disabled
                    readOnly
                  />
                </div>
              )}

              {/* Work Type — department-specific dropdown */}
              {selectedEmployeeForForm && departmentTasks.length > 0 && (
                <div className={styles.field}>
                  <label>Work Type *</label>
                  <select
                    className={styles.input}
                    value={workType}
                    onChange={(e) => handleWorkTypeChange(e.target.value)}
                  >
                    <option value="">Select work type</option>
                    {departmentTasks.map((wt) => (
                      <option key={wt} value={wt}>
                        {wt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Photography: Shoots-specific fields ── */}
              {isShootWork && (
                <>
                  <div className={styles.field}>
                    <label>Shoot Location</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Rishikesh Riverside Studio"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Shoot Time</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. 10:30 AM"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Media Type</label>
                    <select
                      className={styles.input}
                      value={form.mediaType}
                      onChange={(e) =>
                        setForm({ ...form, mediaType: e.target.value as "" | "photo" | "video" | "both" })
                      }
                    >
                      <option value="">Select type</option>
                      <option value="photo">Photo</option>
                      <option value="video">Video</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </>
              )}

              {/* ── Photography: Edit-count field ── */}
              {isEditCountWork && (
                <div className={styles.field}>
                  <label>Total Photos to Edit *</label>
                  <input
                    type="number"
                    min={1}
                    className={styles.input}
                    placeholder="e.g. 40"
                    value={form.totalCount}
                    onChange={(e) => setForm({ ...form, totalCount: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.field}>
                <label>Task Title *</label>
                <input
                  className={styles.input}
                  placeholder="e.g. Build Login Page"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Brand</label>
                <select
                  className={styles.input}
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                >
                  <option value="">No Brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Frequency</label>
                <select
                  className={styles.input}
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value as TaskFrequency })
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Due Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div className={`${styles.field} ${styles.fullSpan}`}>
                <label>Description {isShootWork ? "/ Notes" : ""}</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder={isShootWork ? "Any notes for the shoot…" : "Describe the task…"}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* ═══════════════════ CREATE MODE (multi task/brand batch) ═══════════════════ */}
          {!editTarget && (
            <>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Assign To *</label>
                  <select
                    className={styles.input}
                    value={batchAssignedTo}
                    onChange={(e) => handleBatchEmployeeChange(e.target.value)}
                  >
                    <option value="">Select Employee</option>
                    {assignableEmployees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} — {e.role}
                      </option>
                    ))}
                  </select>
                  {assignableEmployees.length === 0 && (
                    <span style={{ fontSize: 12, color: "#ef4444" }}>
                      Koi assignable employee nahi mila.
                    </span>
                  )}
                </div>

                {batchEmployee && (
                  <div className={styles.field}>
                    <label>Department</label>
                    <input
                      className={styles.input}
                      value={batchEmployee.department}
                      disabled
                      readOnly
                    />
                  </div>
                )}
              </div>

              {/* ── Tabs — one per drafted task, click to re-open & edit it ── */}
              {taskDrafts.length > 0 && (
                <div
                  className={styles.filterWrap}
                  style={{ marginBottom: 12, flexWrap: "wrap" }}
                >
                  {taskDrafts.map((d, idx) => (
                    <div
                      key={d.id}
                      className={`${styles.filterBtn} ${
                        editingDraftId === d.id ? styles.filterActive : ""
                      }`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                      onClick={() => openDraftTab(d)}
                    >
                      <span>
                        {idx + 1}. {d.workType || "Task"} —{" "}
                        {brands.find((b) => b._id === d.brandId)?.name ?? "Brand"}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDraftTab(d.id);
                        }}
                        style={{ color: "#ef4444", fontWeight: 700 }}
                      >
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Composer for the current task in the batch ── */}
              {batchEmployee && (
                <div className={styles.formGrid}>
                  {batchDepartmentTasks.length > 0 && (
                    <div className={styles.field}>
                      <label>Task (Work Type) *</label>
                      <select
                        className={styles.input}
                        value={draft.workType}
                        onChange={(e) => handleDraftWorkTypeChange(e.target.value)}
                      >
                        <option value="">Select task</option>
                        {batchDepartmentTasks.map((wt) => (
                          <option key={wt} value={wt}>
                            {wt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Brand dropdown only appears once a Task is picked */}
                  {draft.workType && (
                    <div className={styles.field}>
                      <label>Brand *</label>
                      <select
                        className={styles.input}
                        value={draft.brandId}
                        onChange={(e) => setDraft({ ...draft, brandId: e.target.value })}
                      >
                        <option value="">Select brand</option>
                        {brands.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {draft.workType && draft.brandId && (
                    <>
                      {/* ── Photography: Shoots-specific fields ── */}
                      {SHOOT_WORK_TYPES.includes(draft.workType) && (
                        <>
                          <div className={styles.field}>
                            <label>Shoot Location</label>
                            <input
                              className={styles.input}
                              placeholder="e.g. Rishikesh Riverside Studio"
                              value={draft.location}
                              onChange={(e) =>
                                setDraft({ ...draft, location: e.target.value })
                              }
                            />
                          </div>
                          <div className={styles.field}>
                            <label>Shoot Time</label>
                            <input
                              className={styles.input}
                              placeholder="e.g. 10:30 AM"
                              value={draft.time}
                              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                            />
                          </div>
                          <div className={styles.field}>
                            <label>Media Type</label>
                            <select
                              className={styles.input}
                              value={draft.mediaType}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  mediaType: e.target.value as "" | "photo" | "video" | "both",
                                })
                              }
                            >
                              <option value="">Select type</option>
                              <option value="photo">Photo</option>
                              <option value="video">Video</option>
                              <option value="both">Both</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* ── Photography: Edit-count field ── */}
                      {EDIT_COUNT_WORK_TYPES.includes(draft.workType) && (
                        <div className={styles.field}>
                          <label>Total Photos to Edit *</label>
                          <input
                            type="number"
                            min={1}
                            className={styles.input}
                            placeholder="e.g. 40"
                            value={draft.totalCount}
                            onChange={(e) =>
                              setDraft({ ...draft, totalCount: e.target.value })
                            }
                          />
                        </div>
                      )}

                      <div className={styles.field}>
                        <label>Frequency</label>
                        <select
                          className={styles.input}
                          value={draft.frequency}
                          onChange={(e) =>
                            setDraft({ ...draft, frequency: e.target.value as TaskFrequency })
                          }
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="one_time">One Time</option>
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label>Due Date</label>
                        <input
                          type="date"
                          className={styles.input}
                          value={draft.dueDate}
                          onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.field} ${styles.fullSpan}`}>
                        <label>
                          Description {SHOOT_WORK_TYPES.includes(draft.workType) ? "/ Notes" : ""}
                        </label>
                        <textarea
                          className={`${styles.input} ${styles.textarea}`}
                          placeholder={
                            SHOOT_WORK_TYPES.includes(draft.workType)
                              ? "Any notes for the shoot…"
                              : "Describe the task…"
                          }
                          rows={3}
                          value={draft.description}
                          onChange={(e) =>
                            setDraft({ ...draft, description: e.target.value })
                          }
                        />
                      </div>

                      <div className={styles.field}>
                        <button
                          type="button"
                          className={styles.saveBtn}
                          onClick={handleSaveDraftToTabs}
                        >
                          {editingDraftId ? "Update Task" : "+ Add Task & Continue"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            {editTarget ? (
              <button className={styles.saveBtn} onClick={handleSubmit}>
                Save Changes
              </button>
            ) : (
              <button
                className={styles.saveBtn}
                onClick={handleAssignBatch}
                disabled={
                  submittingBatch ||
                  (taskDrafts.length === 0 && !(draft.workType && draft.brandId))
                }
              >
                {submittingBatch
                  ? "Assigning..."
                  : `Assign ${
                      taskDrafts.length +
                      (draft.workType && draft.brandId && !editingDraftId ? 1 : 0)
                    } Task(s)`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Task Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Brand</th>
              {isAdminOrSA && <th>By</th>}
              <th>Freq</th>
              <th>Due</th>
              <th>Delivery</th>
              <th>Time Taken</th>
              <th>Changes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const tid = getTaskId(task);
              const isExpanded = expandedId === tid;
              const taskAny = task as unknown as {
                totalCount?: number | null;
                completedCount?: number;
                taskType?: string;
                startedAt?: string | null;
                deliveredAt?: string | null;
                timeSpentMs?: number;
                currentSessionStartedAt?: string | null;
                subtasks?: { _id: string; title: string; status: "pending" | "completed" }[];
              };
              const colSpanFull = isAdminOrSA ? 11 : 10;
              const subtaskCount = taskAny.subtasks?.length ?? 0;
              const subtaskDone = taskAny.subtasks?.filter((s) => s.status === "completed").length ?? 0;

              return (
                <>
                  <tr key={tid} className={styles.taskRow}>
                    {/* Task name */}
                    <td>
                      <div className={styles.taskCell}>
                        <span className={styles.taskName}>{task.title}</span>
                        <span className={styles.taskDesc}>
                          {task.description}
                          {taskAny.totalCount != null && (
                            <>
                              {" "}
                              &middot; {taskAny.completedCount ?? 0}/{taskAny.totalCount} edited
                            </>
                          )}
                          {subtaskCount > 0 && (
                            <>
                              {" "}
                              &middot; {subtaskDone}/{subtaskCount} subtasks
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td>
                      <div className={styles.empMini}>
                        <div className={styles.empAvatar}>
                          {getEmpName(task.assignedTo)[0] ?? "?"}
                        </div>
                        <span>{getEmpName(task.assignedTo)}</span>
                      </div>
                    </td>

                    {/* Brand */}
                    <td>
                      <span className={styles.brandPill}>
                        {getBrandName(task.brandId ?? undefined)}
                      </span>
                    </td>

                    {/* Assigned By — only for admin/SA */}
                    {isAdminOrSA && (
                      <td>
                        <span
                          className={`${styles.byPill} ${
                            task.assignedBy === "super_admin"
                              ? styles.bySA
                              : styles.byAdmin
                          }`}
                        >
                          {task.assignedBy === "super_admin"
                            ? "S.Admin"
                            : "Admin"}
                        </span>
                      </td>
                    )}

                    {/* Frequency */}
                    <td>
                      <span
                        className={`${styles.freqPill} ${
                          styles[`freq_${task.frequency}`]
                        }`}
                      >
                        {task.frequency}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td>
                      <span className={styles.dueDate}>
                        {task.dueDate || "—"}
                      </span>
                    </td>

                    {/* Delivery */}
                    <td>
                      {task.status === "rejected" ? (
                        <span className={`${styles.delivPill} ${styles.notDelivered}`}>
                          ✗ Rejected
                        </span>
                      ) : task.deliveryStatus === "delivered" ? (
                        <div className={styles.deliveredCell}>
                          <span
                            className={`${styles.delivPill} ${styles.delivered}`}
                          >
                            ✓ Delivered
                          </span>
                        </div>
                      ) : viewerRole === "employee" ? (
                        <button
                          className={styles.deliverBtn}
                          onClick={() => {
                            setDeliverModal(task);
                            setDeliverNote("");
                          }}
                        >
                          Mark Delivered
                        </button>
                      ) : (
                        <span
                          className={`${styles.delivPill} ${styles.notDelivered}`}
                        >
                          ✗ Not Delivered
                        </span>
                      )}
                    </td>

                    {/* Time Taken — pause-aware accumulated time. Reads the
                        same timeSpentMs + currentSessionStartedAt fields the
                        employee's own dashboard uses, so both sides always
                        agree, including through reject -> resume cycles
                        (see getTimeTakenLabel's comment above for why the
                        old startedAt/deliveredAt diff broke on resume). */}
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: taskAny.startedAt ? "#334155" : "#94a3b8",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          taskAny.startedAt
                            ? `Started: ${new Date(taskAny.startedAt).toLocaleString("en-IN")}`
                            : "Not started yet"
                        }
                      >
                        {getTimeTakenLabel(taskAny.timeSpentMs, taskAny.currentSessionStartedAt)}
                        {taskAny.currentSessionStartedAt && (
                          <span style={{ color: "#2563eb" }}> ●</span>
                        )}
                      </span>
                    </td>

                    {/* Changes toggle — also drives the subtasks panel below */}
                    <td>
                      <button
                        className={`${styles.changeToggle} ${
                          task.changes.length > 0 || subtaskCount > 0 ? styles.hasCh : ""
                        }`}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : tid)
                        }
                      >
                        {task.changes.length > 0 && (
                          <span className={styles.chBubble}>
                            {task.changes.length}
                          </span>
                        )}
                        ✏️ {isExpanded ? "▲" : "▼"}
                      </button>
                    </td>

                    {/* Status */}
                    <td>
                      {isAdminOrSA ? (
                        <div className={styles.statusRadios}>
                          {(
                            [
                              "pending",
                              "approved",
                              "completed",
                              "rejected",
                            ] as TaskStatus[]
                          ).map((s) => (
                            <label
                              key={s}
                              className={`${styles.sLabel} ${
                                task.status === s
                                  ? styles[`sActive_${s}`]
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`s-${tid}`}
                                value={s}
                                checked={task.status === s}
                                onChange={() => handleStatusChange(task, tid, s)}
                                className={styles.sRadio}
                              />
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.empStatusCell}>
                          <span
                            className={`${styles.sLabel} ${
                              styles[`sActive_${task.status}`]
                            }`}
                          >
                            {task.status.charAt(0).toUpperCase() +
                              task.status.slice(1)}
                          </span>
                          {task.status === "rejected" && task.rejectRemark && (
                            <div className={styles.empRejectBanner}>
                              <span className={styles.empRejectIcon}>⚠️</span>
                              <div>
                                <span className={styles.empRejectTitle}>
                                  Rejection Reason
                                </span>
                                <p className={styles.empRejectText}>
                                  {task.rejectRemark}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className={styles.actionBtns}>
                        {isAdminOrSA && (
                          <>
                            <button
                              className={styles.editBtn}
                              onClick={() => openEdit(task)}
                              title="Edit task"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {deleteConfirm === tid ? (
                              <div className={styles.confirmRow}>
                                <button
                                  className={styles.cYes}
                                  onClick={() => {
                                    onDeleteTask(tid);
                                    setDeleteConfirm(null);
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  className={styles.cNo}
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                className={styles.delBtn}
                                onClick={() => setDeleteConfirm(tid)}
                                title="Delete task"
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4h6v2" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isAdminOrSA &&
                    task.status === "rejected" &&
                    (remarkOpen[tid] || !task.rejectRemark) && (
                      <tr key={`${tid}-remark`} className={styles.remarkRow}>
                        <td colSpan={colSpanFull}>
                          <div className={styles.remarkBox}>
                            <span className={styles.remarkLabel}>
                              Reject Remark:
                            </span>
                            <input
                              className={styles.remarkInput}
                              placeholder="Enter reason for rejection…"
                              value={rejectRemark[tid] ?? ""}
                              onChange={(e) =>
                                setRejectRemark((prev) => ({
                                  ...prev,
                                  [tid]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className={styles.remarkSave}
                              onClick={() => {
                                const text = rejectRemark[tid] ?? "";
                                if (!text.trim()) return;
                                onStatusChange(tid, "rejected", text, actorLabel);
                                setRejectRemark((prev) => {
                                  const next = { ...prev };
                                  delete next[tid];
                                  return next;
                                });
                                setRemarkOpen((prev) => {
                                  const next = { ...prev };
                                  delete next[tid];
                                  return next;
                                });
                              }}
                            >
                              Save Remark
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                  {isExpanded && (
                    <tr key={`${tid}-changes`} className={styles.changeRow}>
                      <td colSpan={colSpanFull}>
                        {/* ── Subtasks — read-only view of the employee's own checklist ── */}
                        {subtaskCount > 0 && (
                          <div className={styles.changeDropdown} style={{ marginBottom: 12 }}>
                            <div className={styles.changeHeader}>
                              Subtasks — <strong>{task.title}</strong>
                              <span style={{ marginLeft: 8, fontWeight: 400, color: "#64748b" }}>
                                {subtaskDone}/{subtaskCount} completed
                              </span>
                            </div>
                            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                              {taskAny.subtasks!.map((s) => (
                                <li
                                  key={s._id}
                                  style={{
                                    fontSize: 13,
                                    lineHeight: 1.8,
                                    color: s.status === "completed" ? "#10b981" : "#334155",
                                    textDecoration: s.status === "completed" ? "line-through" : "none",
                                  }}
                                >
                                  {s.status === "completed" ? "✓" : "○"} {s.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className={styles.changeDropdown}>
                          <div className={styles.changeHeader}>
                            Change Log —{" "}
                            <strong>{task.title}</strong>
                          </div>

                          {task.changes.length === 0 ? (
                            <p className={styles.noCh}>
                              No changes recorded yet.
                            </p>
                          ) : (
                            <div className={styles.chList}>
                              {task.changes.map((ch, idx) => (
                                <div key={ch._id} className={styles.chItem}>
                                  <div className={styles.chTop}>
                                    <div className={styles.chTopLeft}>
                                      <span className={styles.chIdx}>
                                        #{idx + 1}
                                      </span>
                                      <span className={styles.chBy}>
                                        {ch.changedBy}
                                      </span>
                                      <span className={styles.chDate}>
                                        {ch.changedAt}
                                      </span>
                                    </div>
                                    {ch.resolved && (
                                      <span className={styles.chResolvedBadge}>
                                        ✓ Resolved
                                      </span>
                                    )}
                                  </div>

                                  <div className={styles.chNoteBox}>
                                    <span className={styles.chNoteLabel}>
                                      📝 {task.status === "rejected" ? "Rejection Reason" : "Note"}
                                    </span>
                                    <p className={styles.chNote}>{ch.note}</p>
                                  </div>

                                  {ch.employeeResponse && (
                                    <div className={styles.chEmpResponse}>
                                      <span className={styles.chEmpLabel}>
                                        💬 Employee Response
                                      </span>
                                      <p className={styles.chEmpText}>
                                        {ch.employeeResponse}
                                      </p>
                                    </div>
                                  )}

                                  {viewerRole === "employee" &&
                                    !ch.resolved &&
                                    !ch.employeeResponse && (
                                      <div className={styles.addCh}>
                                        <textarea
                                          className={styles.chInput}
                                          rows={2}
                                          placeholder="Write your response…"
                                          value={empResponses[ch._id] ?? ""}
                                          onChange={(e) =>
                                            setEmpResponses((p) => ({
                                              ...p,
                                              [ch._id]: e.target.value,
                                            }))
                                          }
                                        />
                                        <button
                                          className={styles.addChBtn}
                                          onClick={() => {
                                            if (empResponses[ch._id]?.trim()) {
                                              onRespondChange(
                                                tid,
                                                ch._id,
                                                empResponses[ch._id]
                                              );
                                              setEmpResponses((p) => ({
                                                ...p,
                                                [ch._id]: "",
                                              }));
                                            }
                                          }}
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={isAdminOrSA ? 11 : 10} className={styles.empty}>
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Deliver Modal (Employee) ── */}
      {deliverModal && (
        <div
          className={styles.deliverOverlay}
          onClick={() => setDeliverModal(null)}
        >
          <div
            className={styles.deliverModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.deliverClose}
              onClick={() => setDeliverModal(null)}
            >
              ✕
            </button>
            <div className={styles.deliverHeader}>
              <div className={styles.deliverIcon}>✅</div>
              <h3 className={styles.deliverTitle}>Mark Task as Delivered</h3>
              <p className={styles.deliverSub}>{deliverModal.title}</p>
            </div>
            <div className={styles.deliverField}>
              <label>Delivery Note (optional)</label>
              <textarea
                className={styles.deliverInput}
                rows={4}
                placeholder="Describe what was delivered, any links, notes…"
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
              />
            </div>
            <div className={styles.deliverActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeliverModal(null)}
              >
                Cancel
              </button>
              <button
                className={styles.deliverConfirmBtn}
                onClick={handleDeliver}
                disabled={delivering}
              >
                {delivering ? "Submitting..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}