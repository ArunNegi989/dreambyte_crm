"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Sabrands.module.css";

interface Brand {
  _id: string;
  name: string;
  industry: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: "",
  industry: "",
  status: "active" as Brand["status"],
};

export default function SABrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Brand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/brands");
      setBrands(res.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load brands";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (b: Brand) => {
    setEditTarget(b);
    setForm({ name: b.name, industry: b.industry, status: b.status });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.industry.trim()) {
      setFormError("Brand Name and Industry are required.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editTarget) {
        const res = await api.put(`/brands/${editTarget._id}`, form);
        setBrands((prev) =>
          prev.map((b) => (b._id === editTarget._id ? res.data.data : b))
        );
      } else {
        const res = await api.post("/brands", form);
        setBrands((prev) => [res.data.data, ...prev]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await api.delete(`/brands/${id}`);
      setBrands((prev) => prev.filter((b) => b._id !== id));
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete brand";
      setError(msg);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Brands</h2>
          <p className={styles.sub}>
            {loading ? "Loading..." : `${brands.length} brands registered`}
          </p>
        </div>
        <button className={styles.addBtn} onClick={openAdd} disabled={loading}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Brand
        </button>
      </div>

      {/* Global Error */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={loadBrands}>Retry</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {editTarget ? "Edit Brand" : "Add New Brand"}
            </h3>
            <button className={styles.formClose} onClick={closeForm}>✕</button>
          </div>

          {formError && <p className={styles.formError}>⚠️ {formError}</p>}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Brand Name *</label>
              <input className={styles.input} placeholder="e.g. AYM Yoga School"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Industry *</label>
              <input className={styles.input} placeholder="e.g. Health & Wellness"
                value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select className={styles.input} value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Brand["status"] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={closeForm}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
              {saving ? (editTarget ? "Saving..." : "Adding...") : (editTarget ? "Save Changes" : "Add Brand")}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading brands...</p>
        </div>
      )}

      {/* Brand Cards */}
      {!loading && (
        <div className={styles.brandGrid}>
          {brands.map((b) => (
            <div key={b._id} className={styles.brandCard}>
              <div className={styles.brandTop}>
                <div className={styles.brandLogo}>{b.name[0]}</div>
                <span className={`${styles.brandStatus} ${b.status === "active" ? styles.active : styles.inactive}`}>
                  {b.status}
                </span>
              </div>
              <div className={styles.brandName}>{b.name}</div>
              <div className={styles.brandIndustry}>{b.industry}</div>
              <div className={styles.brandMeta}>Added: {formatDate(b.createdAt)}</div>
              <div className={styles.brandActions}>
                <button className={styles.editBtn} onClick={() => openEdit(b)} disabled={deleting === b._id}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>

                {deleteConfirm === b._id ? (
                  <div className={styles.confirmDelete}>
                    <span>Sure?</span>
                    <button className={styles.confirmYes} onClick={() => handleDelete(b._id)} disabled={deleting === b._id}>
                      {deleting === b._id ? "..." : "Yes"}
                    </button>
                    <button className={styles.confirmNo} onClick={() => setDeleteConfirm(null)} disabled={deleting === b._id}>
                      No
                    </button>
                  </div>
                ) : (
                  <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(b._id)} disabled={deleting === b._id}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {brands.length === 0 && !error && (
            <div className={styles.empty}>
              <span>🏷️</span>
              <p>No brands added yet. Click "Add Brand" to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}