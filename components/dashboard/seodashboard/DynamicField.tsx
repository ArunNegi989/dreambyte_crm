import React from 'react';
import { FieldDef } from './taskFieldConfig';
import styles from '../../../assets/styles/seodashboard/TaskModal.module.css';

interface DynamicFieldProps {
  field: FieldDef;
  value: any;
  onChange: (value: any) => void;
}

// Renders one field of whatever type the category config asks for (text,
// number, url, textarea, select, multiselect) — keeps TaskModal from having
// a bespoke form per category.
export default function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className={styles.textarea}
        placeholder={field.placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select className={styles.select} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Select…
        </option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'multiselect') {
    const selected: string[] = Array.isArray(value) ? value : [];
    const toggle = (optValue: string) => {
      if (selected.includes(optValue)) {
        onChange(selected.filter((v) => v !== optValue));
      } else {
        onChange([...selected, optValue]);
      }
    };
    return (
      <div className={styles.multiselect}>
        {field.options?.map((opt) => (
          <label key={opt.value} className={styles.checkboxPill}>
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        className={styles.input}
        placeholder={field.placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    );
  }

  // text / url
  return (
    <input
      type={field.type === 'url' ? 'url' : 'text'}
      className={styles.input}
      placeholder={field.placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
