'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getAvailableEntities } from '../../services/svpService';
import styles from './AddGrantsModal.module.css';

export default function AddGrantsModal({ open, onClose, onAdd, planId }) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchParams, setSearchParams] = useState({
    entity_number: '',
    entity_name: '',
    city: '',
    state: '',
  });
  const modalRef = useRef(null);

  useEffect(() => {
    if (open && planId) {
      setError(null);
      loadEntities();
    } else {
      setEntities([]);
      setSelectedIds(new Set());
      setError(null);
      setSearchParams({ entity_number: '', entity_name: '', city: '', state: '' });
    }
  }, [open, planId]);

  useEffect(() => {
    if (open && planId) {
      const timeoutId = setTimeout(() => {
        loadEntities();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, open, planId]);

  const loadEntities = async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      // Only include non-empty search params
      const filteredParams = {};
      if (searchParams.entity_number?.trim()) filteredParams.entity_number = searchParams.entity_number.trim();
      if (searchParams.entity_name?.trim()) filteredParams.entity_name = searchParams.entity_name.trim();
      if (searchParams.city?.trim()) filteredParams.city = searchParams.city.trim();
      if (searchParams.state?.trim()) filteredParams.state = searchParams.state.trim();
      
      const data = await getAvailableEntities(planId, filteredParams);
      console.log('Available entities loaded:', data?.length || 0, data);
      setEntities(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load available entities:', err);
      setEntities([]);
      
      // Set user-friendly error message
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else if (err.status === 404) {
        setError('Plan not found. Please refresh the page.');
      } else {
        setError(err.message || 'Failed to load available entities. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleSearchChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSelection = (entityId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(String(entityId))) {
      newSelected.delete(String(entityId));
    } else {
      newSelected.add(String(entityId));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(entities.map((e) => String(e.id)));
    setSelectedIds(allIds);
  };

  const handleUnselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    try {
      await onAdd(Array.from(selectedIds));
    } catch (err) {
      console.error('Failed to add entities:', err);
      if (err.isNetworkError || err.status === 0) {
        setError('Unable to connect to server. Please check if the backend server is running.');
      } else {
        setError(err.message || 'Failed to add entities. Please try again.');
      }
    }
  };

  if (!open) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef} role="dialog" aria-labelledby="add-grants-modal-title">
        <div className={styles.modalHeader}>
          <h3 id="add-grants-modal-title" className={styles.modalTitle}>Add Grants</h3>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x" aria-hidden />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.searchSection}>
            <div className={styles.searchSectionHeader}>Search Entities</div>
            <div className={styles.searchGrid}>
              <div className={styles.searchRow}>
                <label className={styles.searchLabel}>Entity Number</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchParams.entity_number}
                  onChange={(e) => handleSearchChange('entity_number', e.target.value)}
                  placeholder="Enter entity number"
                />
              </div>
              <div className={styles.searchRow}>
                <label className={styles.searchLabel}>Entity Name</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchParams.entity_name}
                  onChange={(e) => handleSearchChange('entity_name', e.target.value)}
                  placeholder="Enter entity name"
                />
              </div>
              <div className={styles.searchRow}>
                <label className={styles.searchLabel}>City</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchParams.city}
                  onChange={(e) => handleSearchChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className={styles.searchRow}>
                <label className={styles.searchLabel}>State</label>
                <select
                  className={styles.searchSelect}
                  value={searchParams.state}
                  onChange={(e) => handleSearchChange('state', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="TX">TX</option>
                  <option value="IL">IL</option>
                  <option value="CA">CA</option>
                  <option value="NY">NY</option>
                  <option value="FL">FL</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.entitiesSection}>
            <div className={styles.entitiesHeader}>
              <span>Available Entities ({entities.length})</span>
              <div className={styles.selectionControls}>
                <button type="button" className={styles.selectionBtn} onClick={handleSelectAll}>
                  Select All
                </button>
                <button type="button" className={styles.selectionBtn} onClick={handleUnselectAll} disabled={selectedIds.size === 0}>
                  Unselect All
                </button>
                <span className={styles.selectionCount}>{selectedIds.size} selected</span>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingWrap}>
                <p>Loading entities...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p className={styles.errorMessage}>{error}</p>
                <button type="button" className={styles.retryBtn} onClick={loadEntities}>
                  Retry
                </button>
              </div>
            ) : entities.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No entities found.</p>
              </div>
            ) : (
              <div className={styles.entitiesList}>
                <table className={styles.entitiesTable}>
                  <thead>
                    <tr>
                      <th className={styles.checkboxColumn}>
                        <input
                          type="checkbox"
                          checked={entities.length > 0 && selectedIds.size === entities.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSelectAll();
                            } else {
                              handleUnselectAll();
                            }
                          }}
                          aria-label="Select all"
                        />
                      </th>
                      <th>Entity Number</th>
                      <th>Entity Name</th>
                      <th>City</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.id}>
                        <td className={styles.checkboxColumn}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(String(entity.id))}
                            onChange={() => handleToggleSelection(entity.id)}
                            aria-label={`Select ${entity.entity_name}`}
                          />
                        </td>
                        <td>{entity.entity_number}</td>
                        <td>{entity.entity_name}</td>
                        <td>{entity.city}</td>
                        <td>{entity.state}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
          >
            Add Selected ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
