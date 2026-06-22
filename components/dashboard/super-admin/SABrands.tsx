"use client";

import { useState } from "react";
import { Brand } from "@/types/superadmin/superAdmin";
import styles from "@/public/assets/styles/dashboard/super-admin-dashboard/Sabrands.module.css";

interface SABrandsProps {
  brands: Brand[];
  onAdd: (b: Omit<Brand, "id" | "createdAt">) => void;
  onEdit: (b: Brand) => void;
  onDelete: (id: string) => void;
}

const emptyForm = {
  name: "", industry: "", contactEmail: "", contactPhone: "",
  website: "", status: "active" as Brand["status"],
};

export default function SABrands({ brands, onAdd, onEdit, onDelete }: SABrandsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Brand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (b: Brand) => {
    setEditTarget(b);
    setForm({ name: b.name, industry: b.industry, contactEmail: b.contactEmail, contactPhone: b.contactPhone, website: b.website ?? "", status: b.status });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.industry) return;
    if (editTarget) {
      onEdit({ ...editTarget, ...form });
    } else {
      onAdd(form);
    }
    setShowForm(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Brands</h2>
          <p className={styles.sub}>{brands.length} brands registered</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Brand
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>{editTarget ? "Edit Brand" : "Add New Brand"}</h3>
            <button className={styles.formClose} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Brand Name *</label>
              <input className={styles.input} placeholder="e.g. AYM Yoga School" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Industry *</label>
              <input className={styles.input} placeholder="e.g. Health & Wellness" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Contact Email</label>
              <input className={styles.input} type="email" placeholder="info@brand.com" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Contact Phone</label>
              <input className={styles.input} placeholder="+91 98765 00000" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Website</label>
              <input className={styles.input} placeholder="https://brand.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Brand["status"] })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSubmit}>
              {editTarget ? "Save Changes" : "Add Brand"}
            </button>
          </div>
        </div>
      )}

      {/* Brand Cards */}
      <div className={styles.brandGrid}>
        {brands.map((b) => (
          <div key={b.id} className={styles.brandCard}>
            <div className={styles.brandTop}>
              <div className={styles.brandLogo}>{b.name[0]}</div>
              <span className={`${styles.brandStatus} ${b.status === "active" ? styles.active : styles.inactive}`}>
                {b.status}
              </span>
            </div>
            <div className={styles.brandName}>{b.name}</div>
            <div className={styles.brandIndustry}>{b.industry}</div>
            <div className={styles.brandContact}>
              <span>📧 {b.contactEmail}</span>
              <span>📞 {b.contactPhone}</span>
              {b.website && <span>🌐 {b.website}</span>}
            </div>
            <div className={styles.brandMeta}>Added: {b.createdAt}</div>
            <div className={styles.brandActions}>
              <button className={styles.editBtn} onClick={() => openEdit(b)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              {deleteConfirm === b.id ? (
                <div className={styles.confirmDelete}>
                  <span>Sure?</span>
                  <button className={styles.confirmYes} onClick={() => { onDelete(b.id); setDeleteConfirm(null); }}>Yes</button>
                  <button className={styles.confirmNo} onClick={() => setDeleteConfirm(null)}>No</button>
                </div>
              ) : (
                <button className={styles.deleteBtn} onClick={() => setDeleteConfirm(b.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}

        {brands.length === 0 && (
          <div className={styles.empty}>
            <span>🏷️</span>
            <p>No brands added yet. Click "Add Brand" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}