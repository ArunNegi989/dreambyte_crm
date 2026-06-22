"use client";

import React from 'react';
import { Task } from '../../../../types/employee/task';
import styles from '../../../../assets/styles/employeedashboard/Taskhistoryfilters.module.css';

export type StatusFilter = 'all' | Task['status'];
export type DeliveryFilter = 'all' | 'delivered' | 'not_delivered';
export type ChangesFilter = 'all' | 'has_changes' | 'no_changes';
export type SortOption = 'due_desc' | 'due_asc' | 'time_desc' | 'time_asc';

interface TaskHistoryFiltersProps {
  brands: string[];
  brand: string;
  onBrandChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  delivery: DeliveryFilter;
  onDeliveryChange: (value: DeliveryFilter) => void;
  changes: ChangesFilter;
  onChangesChange: (value: ChangesFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
];

const DELIVERY_OPTIONS: { value: DeliveryFilter; label: string }[] = [
  { value: 'all', label: 'All deliveries' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'not_delivered', label: 'Not delivered' },
];

const CHANGES_OPTIONS: { value: ChangesFilter; label: string }[] = [
  { value: 'all', label: 'All tasks' },
  { value: 'has_changes', label: 'Has change requests' },
  { value: 'no_changes', label: 'No change requests' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'due_desc', label: 'Due date (newest)' },
  { value: 'due_asc', label: 'Due date (oldest)' },
  { value: 'time_desc', label: 'Time taken (high to low)' },
  { value: 'time_asc', label: 'Time taken (low to high)' },
];

const TaskHistoryFilters: React.FC<TaskHistoryFiltersProps> = ({
  brands,
  brand,
  onBrandChange,
  status,
  onStatusChange,
  delivery,
  onDeliveryChange,
  changes,
  onChangesChange,
  sort,
  onSortChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  search,
  onSearchChange,
  onClearAll,
  hasActiveFilters,
}) => {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.searchField}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by task title..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks by title"
          />
        </div>

        <select
          className={styles.select}
          value={brand}
          onChange={(e) => onBrandChange(e.target.value)}
          aria-label="Filter by brand"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={delivery}
          onChange={(e) => onDeliveryChange(e.target.value as DeliveryFilter)}
          aria-label="Filter by delivery state"
        >
          {DELIVERY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={changes}
          onChange={(e) => onChangesChange(e.target.value as ChangesFilter)}
          aria-label="Filter by change requests"
        >
          {CHANGES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <div className={styles.dateRange}>
          <label className={styles.dateLabel}>
            From
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              aria-label="Due date from"
            />
          </label>
          <label className={styles.dateLabel}>
            To
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              aria-label="Due date to"
            />
          </label>
        </div>

        <select
          className={styles.select}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          aria-label="Sort tasks"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button type="button" className={styles.clearBtn} onClick={onClearAll}>
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskHistoryFilters;