'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './SearchModal.module.css';

export interface SearchModalField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox-group' | 'static';
  options?: Array<{ value?: string; label?: string } | string>;
  value?: string;
  filterable?: boolean;
}

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearch?: (values: Record<string, unknown>) => void;
  onReset?: () => void;
  onSaveParameters?: (values: Record<string, unknown>) => void;
  title?: string;
  sectionTitle?: string;
  fields?: SearchModalField[];
  initialValues?: Record<string, unknown>;
  showDisplayOptions?: boolean;
  showSortMethod?: boolean;
  showSaveParameters?: boolean;
}

export default function SearchModal({
  open,
  onClose,
  onSearch,
  onReset,
  onSaveParameters,
  title = 'Search Filters:',
  sectionTitle = 'Basic Search Parameters',
  fields = [],
  initialValues = {},
  showDisplayOptions = true,
  showSortMethod = true,
  showSaveParameters = true,
}: SearchModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const toggleCheckbox = (fieldKey: string, option: string) => {
    setValues((prev) => {
      const arr = (prev[fieldKey] as string[] | undefined) || [];
      const isAll = option === 'All';

      if (isAll) {
        return { ...prev, [fieldKey]: ['All'] };
      }
      if (arr.includes(option)) {
        const next = arr.filter((v) => v !== option);
        return { ...prev, [fieldKey]: next.length ? next : ['All'] };
      }
      const withoutAll = arr.filter((v) => v !== 'All');
      return { ...prev, [fieldKey]: [...withoutAll, option] };
    });
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(values);
    }
    onClose();
  };

  const handleReset = () => {
    setValues(initialValues);
    if (onReset) {
      onReset();
    }
  };

  const renderField = (field: SearchModalField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            className={styles.searchInput}
            value={(values[field.key] as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            className={styles.searchSelect}
            value={(values[field.key] as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          >
            {(field.options || []).map((opt) => {
              const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
              return (
                <option key={o.value || o.label || ''} value={o.value ?? o.label ?? ''}>
                  {o.label ?? o.value ?? ''}
                </option>
              );
            })}
          </select>
        );

      case 'checkbox-group':
        return (
          <div className={styles.searchCheckboxGroup}>
            {field.filterable && (
              <input
                type="text"
                className={styles.searchFilterInput}
                placeholder="Type here to filter"
              />
            )}
            <div className={styles.searchCheckboxList}>
              {(field.options || []).map((opt) => {
                const optionLabel = typeof opt === 'string' ? opt : (opt.label ?? opt.value ?? '');
                return (
                  <label key={optionLabel} className={styles.searchCheckboxItem}>
                    <input
                      type="checkbox"
                      checked={((values[field.key] as string[]) || []).includes(optionLabel)}
                      onChange={() => toggleCheckbox(field.key, optionLabel)}
                    />
                    {optionLabel}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'static':
        return <span className={styles.searchValue}>{(values[field.key] as string) || field.value}</span>;

      default:
        return null;
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.searchModalOverlay}>
      <div className={styles.searchModal} ref={modalRef} role="dialog" aria-labelledby="search-modal-title">
        <div className={styles.searchModalHeader}>
          <h3 id="search-modal-title" className={styles.searchModalTitle}>{title}</h3>
          <button
            type="button"
            className={styles.searchModalClose}
            onClick={onClose}
            aria-label="Close search filters"
          >
            <i className="bi bi-x" aria-hidden />
          </button>
        </div>

        <div className={styles.searchModalBody}>
          <div className={styles.searchSection}>
            <div className={styles.searchSectionHeader}>{sectionTitle}</div>
            <div className={styles.searchGrid}>
              {fields.map((field) => (
                <div key={field.key} className={styles.searchRow}>
                  <label className={styles.searchLabel}>{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          {showDisplayOptions && (
            <div className={styles.searchSection}>
              <button
                type="button"
                className={styles.searchSectionToggle}
                onClick={() => setDisplayOptionsOpen((o) => !o)}
                aria-expanded={displayOptionsOpen}
              >
                <i className={`bi ${displayOptionsOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'}`} aria-hidden />
                Display Options
              </button>
              {displayOptionsOpen && (
                <div className={styles.displayOptionsContent}>
                  <p>Additional display options would go here.</p>
                </div>
              )}
            </div>
          )}

          {showSortMethod && (
            <div className={styles.searchSortRow}>
              <span className={styles.searchSortLabel}>Sort Method (</span>
              <button
                type="button"
                className={`${styles.searchSortBtn} ${values.sortMethod === 'Grid' ? styles.searchSortActive : ''}`}
                onClick={() => handleFieldChange('sortMethod', 'Grid')}
              >
                Grid
              </button>
              <span className={styles.searchSortSep}>|</span>
              <button
                type="button"
                className={`${styles.searchSortBtn} ${values.sortMethod === 'Custom' ? styles.searchSortActive : ''}`}
                onClick={() => handleFieldChange('sortMethod', 'Custom')}
              >
                Custom
              </button>
              <span className={styles.searchSortLabel}>)</span>
            </div>
          )}
        </div>

        <div className={styles.searchModalFooter}>
          <div className={styles.searchNameRow}>
            {showSaveParameters && (
              <>
                <label className={styles.searchNameLabel}>Search Name:</label>
                <input
                  type="text"
                  className={styles.searchNameInput}
                  value={(values.searchName as string) || ''}
                  onChange={(e) => handleFieldChange('searchName', e.target.value)}
                />
              </>
            )}
            <button type="button" className={styles.resetBtn} onClick={handleReset}>Reset</button>
            {showSaveParameters && (
              <button
                type="button"
                className={styles.saveParamsBtn}
                onClick={() => onSaveParameters?.(values)}
              >
                Save Parameters
              </button>
            )}
            <button type="button" className={styles.searchBtn} onClick={handleSearch}>Search</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
