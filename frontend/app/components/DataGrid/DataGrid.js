'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import styles from './DataGrid.module.css';

const PAGE_SIZES = [15, 20, 50, 100];

/** Treat null, undefined, empty string, or whitespace-only as empty for sorting. */
function isEmptySortValue(val) {
  if (val == null) return true;
  const s = String(val).trim();
  return s === '';
}

/** Compare two row values for a column; returns -1, 0, or 1. Blanks sort first in asc, last in desc. */
function compareCells(key, direction, a, b) {
  const va = a[key];
  const vb = b[key];
  const aEmpty = isEmptySortValue(va);
  const bEmpty = isEmptySortValue(vb);
  const mult = direction === 'asc' ? 1 : -1;

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return -1 * mult;  /* blank first in asc, last in desc */
  if (bEmpty) return 1 * mult;

  const sa = String(va).trim().toLowerCase();
  const sb = String(vb).trim().toLowerCase();
  const na = Number(va);
  const nb = Number(vb);

  if (!Number.isNaN(na) && !Number.isNaN(nb)) return mult * (na - nb);
  return mult * sa.localeCompare(sb, undefined, { numeric: true });
}

function getPageNumberItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: 'page', value: i + 1 }));
  }
  const pages = new Set([1, totalPages]);
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p > prev + 1) result.push({ type: 'ellipsis' });
    result.push({ type: 'page', value: p });
    prev = p;
  }
  return result;
}

export default function DataGrid({
  columns = [],
  data = [],
  pageSizes = PAGE_SIZES,
  defaultPageSize = 15,
  actions = [],
  actionButtonLabel = 'Edit Plan',
  primaryActionIcon = null,
  onRowAction = null,
  filterBanner = null,
  onClearFilters = null,
  showFilters = true,
  centerAlignColumns = [],
  enableSelection = false,
  selectedRows = new Set(),
  onSelectionChange = null,
  onSelectAll = null,
  onViewSelected = null,
  selectionCountLabel = null,
  filterRowAction = null,
  getActionDisabled = null,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filters, setFilters] = useState({});
  /** Multi-column sort: array of { key, direction } in order of selection */
  const [sortOrder, setSortOrder] = useState([]);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [gridAnimating, setGridAnimating] = useState(false);

  const actionMenuRef = useRef(null);
  const actionButtonRef = useRef(null);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      for (const col of columns) {
        const filterValue = filters[col.key];
        if (filterValue && filterValue.trim()) {
          const cellValue = String(row[col.key] || '').toLowerCase();
          if (col.filterType === 'select') {
            if (filterValue !== 'All' && cellValue !== filterValue.toLowerCase()) {
              return false;
            }
          } else {
            if (!cellValue.includes(filterValue.trim().toLowerCase())) {
              return false;
            }
          }
        }
      }
      return true;
    });
  }, [data, columns, filters]);

  // Multi-column sort: apply sort levels in order
  const sortedData = useMemo(() => {
    if (sortOrder.length === 0) return filteredData;
    return [...filteredData].sort((a, b) => {
      for (const { key, direction } of sortOrder) {
        const cmp = compareCells(key, direction, a, b);
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
  }, [filteredData, sortOrder]);

  // Animate on filter or sort change
  useEffect(() => {
    setGridAnimating(true);
    const t = setTimeout(() => setGridAnimating(false), 320);
    return () => clearTimeout(t);
  }, [filteredData, sortOrder]);

  // Pagination (based on sorted data)
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageNumberItems = useMemo(() => getPageNumberItems(page, totalPages), [page, totalPages]);
  const dataToShow = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );

  // Reset page when filters or sort change
  useEffect(() => {
    setPage(1);
  }, [filters, sortOrder]);

  const handleSort = (colKey) => {
    setSortOrder((prev) => {
      const idx = prev.findIndex((s) => s.key === colKey);
      if (idx === -1) {
        return [...prev, { key: colKey, direction: 'asc' }];
      }
      const current = prev[idx];
      if (current.direction === 'asc') {
        const next = [...prev];
        next[idx] = { key: colKey, direction: 'desc' };
        return next;
      }
      return prev.filter((s) => s.key !== colKey);
    });
  };

  const handleClearSort = () => {
    setSortOrder([]);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  // Dropdown positioning
  useEffect(() => {
    if (!openActionMenuId) return;
    const btn = actionButtonRef.current;
    if (!btn) return;
    const updatePos = () => {
      const rect = btn.getBoundingClientRect();
      const leftOffset = 24;
      setDropdownPosition({ top: rect.bottom + 4, left: rect.left - leftOffset });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [openActionMenuId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openActionMenuId) return;
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target) &&
          actionButtonRef.current && !actionButtonRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenuId]);

  const handleActionClick = (action, row) => {
    setOpenActionMenuId(null);
    if (getActionDisabled && getActionDisabled(action, row)) return;
    if (onRowAction) {
      onRowAction(action, row);
    }
  };

  const isActionDisabled = (action, row) => getActionDisabled && getActionDisabled(action, row);

  /** For a row, primary action if enabled; otherwise first enabled action (e.g. "View Plan" when "Edit Plan" is disabled). */
  const getEffectivePrimaryAction = (row) => {
    const actionItems = actionCategories.filter((item) => item.type === 'action');
    if (primaryActionItem && !isActionDisabled(primaryActionItem, row)) return primaryActionItem;
    return actionItems.find((item) => !isActionDisabled(item, row)) || primaryActionItem;
  };

  const renderPagination = (position = 'top') => (
    <div className={`${styles.pager} ${position === 'top' ? styles.pagerTop : ''}`}>
      <div className={styles.pagerNav}>
        <button type="button" className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">«</button>
        <button type="button" className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">◄</button>
        <div className={styles.pagerNumbers}>
          {pageNumberItems.map((item, idx) =>
            item.type === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className={styles.pagerEllipsis} aria-hidden>…</span>
            ) : (
              <button
                key={item.value}
                type="button"
                className={item.value === page ? styles.currentPage : styles.pagerPageBtn}
                onClick={() => setPage(item.value)}
                aria-label={`Page ${item.value}`}
                aria-current={item.value === page ? 'page' : undefined}
              >
                {item.value}
              </button>
            )
          )}
        </div>
        <button type="button" className={styles.pagerBtn} disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page">►</button>
        <button type="button" className={styles.pagerBtn} disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">»</button>
      </div>
      <div className={styles.pagerRight}>
        <div className={styles.pageSizeWrap}>
          <label>Page size:</label>
          <select value={pageSize} onChange={handlePageSizeChange}>
            {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <button type="button" className={styles.goBtn}>Go</button>
        </div>
        <span className={styles.pagerInfo}><strong>{totalItems}</strong> items in <strong>{totalPages}</strong> page(s)</span>
      </div>
    </div>
  );

  // Group actions by category
  const actionCategories = useMemo(() => {
    const categories = [];
    let currentCategory = null;
    for (const action of actions) {
      if (action.category && action.category !== currentCategory) {
        currentCategory = action.category;
        categories.push({ type: 'header', label: action.category });
      }
      categories.push({ type: 'action', ...action });
      if (action.separator) {
        categories.push({ type: 'separator' });
      }
    }
    return categories;
  }, [actions]);

  // First action is the primary (e.g. "Edit Plan") - clicking the main label runs this
  const primaryActionItem = useMemo(
    () => actionCategories.find((item) => item.type === 'action'),
    [actionCategories]
  );

  const sortOrderEntry = (colKey) => sortOrder.find((s) => s.key === colKey);

  // Selection logic
  const selectedRowsSet = useMemo(() => {
    if (!enableSelection) return new Set();
    return selectedRows instanceof Set ? selectedRows : new Set(selectedRows || []);
  }, [enableSelection, selectedRows]);

  const isRowSelected = (rowId) => selectedRowsSet.has(String(rowId));
  const isAllOnPageSelected = useMemo(() => {
    if (!enableSelection || dataToShow.length === 0) return false;
    return dataToShow.every((row) => isRowSelected(row.id));
  }, [enableSelection, dataToShow, selectedRowsSet]);

  const isSomeOnPageSelected = useMemo(() => {
    if (!enableSelection) return false;
    return dataToShow.some((row) => isRowSelected(row.id));
  }, [enableSelection, dataToShow, selectedRowsSet]);

  const handleRowSelection = (rowId, checked) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedRowsSet);
    if (checked) {
      newSelected.add(String(rowId));
    } else {
      newSelected.delete(String(rowId));
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAllThisPage = () => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedRowsSet);
    dataToShow.forEach((row) => {
      newSelected.add(String(row.id));
    });
    onSelectionChange(newSelected);
  };

  const handleUnselectAllThisPage = () => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedRowsSet);
    dataToShow.forEach((row) => {
      newSelected.delete(String(row.id));
    });
    onSelectionChange(newSelected);
  };

  const handleSelectAllAcrossPages = () => {
    if (!onSelectAll) return;
    onSelectAll('select');
  };

  const handleUnselectAllAcrossPages = () => {
    if (!onSelectAll) return;
    onSelectAll('unselect');
  };

  const selectedCount = selectedRowsSet.size;

  const renderSelectionControls = () => {
    if (!enableSelection) return null;
    return (
      <div className={styles.selectionControls}>
        <div className={styles.selectionControlsLeft}>
          <span className={styles.selectionLabel}>This page:</span>
          <button
            type="button"
            className={styles.selectionBtn}
            onClick={handleSelectAllThisPage}
            disabled={isAllOnPageSelected}
          >
            Select all
          </button>
          <button
            type="button"
            className={styles.selectionBtn}
            onClick={handleUnselectAllThisPage}
            disabled={!isSomeOnPageSelected}
          >
            Unselect all
          </button>
          <span className={styles.selectionCount}>
            {selectedCount} {selectionCountLabel || 'Items'} Selected
            {onViewSelected && selectedCount > 0 && (
              <button
                type="button"
                className={styles.viewSelectedLink}
                onClick={() => onViewSelected(Array.from(selectedRowsSet))}
              >
                {' '}(View <i className="bi bi-box-arrow-up-right" aria-hidden />)
              </button>
            )}
          </span>
        </div>
        <div className={styles.selectionControlsRight}>
          <span className={styles.selectionLabel}>Across pages:</span>
          <button
            type="button"
            className={styles.selectionBtn}
            onClick={handleSelectAllAcrossPages}
          >
            Select all
          </button>
          <button
            type="button"
            className={styles.selectionBtn}
            onClick={handleUnselectAllAcrossPages}
            disabled={selectedCount === 0}
          >
            Unselect all
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {filterBanner && (
        <div className={styles.filterBanner}>
          <i className="bi bi-funnel-fill" aria-hidden />
          <span>{filterBanner}</span>
          {onClearFilters && (
            <button type="button" className={styles.filterBannerClear} onClick={onClearFilters}>
              <i className="bi bi-x" aria-hidden /> Clear Filters
            </button>
          )}
        </div>
      )}

      {sortOrder.length > 0 && (
        <div className={styles.sortBanner}>
          <i className="bi bi-sort-down" aria-hidden />
          <span className={styles.sortBannerLabel}>Sort by:</span>
          <ol className={styles.sortBannerList} aria-label="Sort order">
            {sortOrder.map((s, i) => {
              const col = columns.find((c) => c.key === s.key);
              const label = col?.label ?? s.key;
              return (
                <li key={s.key} className={styles.sortBannerItem}>
                  <span className={styles.sortBannerOrder}>{i + 1}.</span>
                  <span>{label}</span>
                  <span className={styles.sortBannerArrow} aria-hidden>
                    {s.direction === 'asc' ? (
                      <i className="bi bi-arrow-up" aria-hidden />
                    ) : (
                      <i className="bi bi-arrow-down" aria-hidden />
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <button type="button" className={styles.sortBannerClear} onClick={handleClearSort} aria-label="Clear all sorting">
            <i className="bi bi-x" aria-hidden /> Clear sort
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <div className={styles.controlsStrip}>
          {renderPagination('top')}
          {renderSelectionControls()}
        </div>
        <div className={styles.scrollableTableWrap}>
          <table className={styles.table}>
          <thead>
            <tr>
              {enableSelection && (
                <th className={styles.selectionHeader}>
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectAllThisPage();
                      } else {
                        handleUnselectAllThisPage();
                      }
                    }}
                    aria-label="Select / Unselect all on this page"
                    title="Select / Unselect all on this page"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const sortable = col.sortable !== false;
                const entry = sortOrderEntry(col.key);
                const sortIndex = entry ? sortOrder.findIndex((s) => s.key === col.key) + 1 : null;
                const thStyle = col.minWidth != null ? { minWidth: typeof col.minWidth === 'number' ? `${col.minWidth}px` : col.minWidth } : undefined;
                return (
                  <th key={col.key} className={centerAlignColumns.includes(idx) ? styles.tableCellCenter : undefined} style={thStyle}>
                    {sortable ? (
                      <button
                        type="button"
                        className={styles.sortHeaderBtn}
                        onClick={() => handleSort(col.key)}
                        aria-sort={entry ? (entry.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                        aria-label={entry ? `${col.label}, ${entry.direction === 'asc' ? 'ascending' : 'descending'}, sort priority ${sortIndex}. Click to change.` : `${col.label}. Click to add sort.`}
                      >
                        <span className={styles.sortHeaderLabel}>{col.label}</span>
                        {entry ? (
                          <span className={styles.sortArrow} aria-hidden>
                            {sortIndex != null && <span className={styles.sortPriority}>{sortIndex}</span>}
                            {entry.direction === 'asc' ? (
                              <i className="bi bi-arrow-up" aria-hidden />
                            ) : (
                              <i className="bi bi-arrow-down" aria-hidden />
                            )}
                          </span>
                        ) : (
                          <span className={styles.sortArrowPlaceholder} aria-hidden>
                            <i className="bi bi-arrow-down-up" aria-hidden />
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className={styles.sortHeaderLabel}>{col.label}</span>
                    )}
                  </th>
                );
              })}
              {actions.length > 0 && <th>Options</th>}
            </tr>
            {showFilters && (
              <tr className={styles.filterRow}>
                {enableSelection && <td />}
                {columns.map((col) => {
                  const tdStyle = col.minWidth != null ? { minWidth: typeof col.minWidth === 'number' ? `${col.minWidth}px` : col.minWidth } : undefined;
                  return (
                    <td key={col.key} style={tdStyle}>
                      {col.filterable !== false && (
                        col.filterType === 'select' && col.filterOptions ? (
                          <select
                            className={styles.filterSelect}
                            value={filters[col.key] || 'All'}
                            onChange={(e) => handleFilterChange(col.key, e.target.value)}
                            aria-label={`Filter ${col.label}`}
                          >
                            {col.filterOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className={styles.filterInput}
                            placeholder=""
                            value={filters[col.key] || ''}
                            onChange={(e) => handleFilterChange(col.key, e.target.value)}
                            aria-label={`Filter ${col.label}`}
                          />
                        )
                      )}
                    </td>
                  );
                })}
                {actions.length > 0 && <td />}
              </tr>
            )}
          </thead>
          <tbody className={gridAnimating ? styles.gridBodyAnimate : ''}>
            {dataToShow.map((row) => (
              <tr key={row.id} className={styles.dataRow}>
                {enableSelection && (
                  <td className={styles.selectionCell}>
                    <input
                      type="checkbox"
                      checked={isRowSelected(row.id)}
                      onChange={(e) => handleRowSelection(row.id, e.target.checked)}
                      aria-label={`Select ${row.entity_name || row.id}`}
                    />
                  </td>
                )}
                {columns.map((col, idx) => {
                  const tdStyle = col.minWidth != null ? { minWidth: typeof col.minWidth === 'number' ? `${col.minWidth}px` : col.minWidth } : undefined;
                  return (
                  <td key={col.key} className={centerAlignColumns.includes(idx) ? styles.tableCellCenter : undefined} style={tdStyle}>
                    {row[col.key]}
                  </td>
                  );
                })}
                {actions.length > 0 && (
                  <td className={styles.actionCell}>
                    <div
                      className={styles.actionCellInner}
                      ref={openActionMenuId === row.id ? actionButtonRef : null}
                    >
                      {(() => {
                        const effectivePrimary = getEffectivePrimaryAction(row);
                        const primaryDisabled = effectivePrimary && isActionDisabled(effectivePrimary, row);
                        const label = typeof actionButtonLabel === 'function' ? actionButtonLabel(row) : (effectivePrimary?.label ?? actionButtonLabel);
                        const icon = (typeof primaryActionIcon === 'function' ? primaryActionIcon(row) : primaryActionIcon) ?? effectivePrimary?.iconLeft ?? 'bi-pencil-square';
                        return (
                      <button
                        type="button"
                        className={styles.editPlanBtn}
                        disabled={primaryDisabled}
                        onClick={() => {
                          if (effectivePrimary && onRowAction && !primaryDisabled) {
                            handleActionClick(effectivePrimary, row);
                          }
                        }}
                        aria-label={label}
                        title={primaryDisabled ? 'Not available for completed plans' : undefined}
                      >
                        <i className={`bi ${icon}`} aria-hidden />
                        <span className={styles.editPlanBtnLabel}>{label}</span>
                      </button>
                        );
                      })()}
                      <button
                        type="button"
                        className={styles.actionDropdownTrigger}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(openActionMenuId === row.id ? null : row.id);
                        }}
                        aria-expanded={openActionMenuId === row.id}
                        aria-haspopup="menu"
                        aria-label="More options"
                      >
                        <i className="bi bi-chevron-down" aria-hidden />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className={styles.controlsStrip}>
          {renderSelectionControls()}
          {renderPagination('bottom')}
        </div>
      </div>

      {openActionMenuId && typeof document !== 'undefined' && createPortal(
        (() => {
          const row = dataToShow.find((r) => r.id === openActionMenuId);
          const filteredCategories = filterRowAction && row
            ? actionCategories.filter((item) => {
                if (item.type !== 'action') return true;
                return filterRowAction(item, row) !== false;
              })
            : actionCategories;
          return (
            <div
              ref={actionMenuRef}
              className={styles.actionMenuDropdown}
              style={{ position: 'fixed', top: dropdownPosition.top, left: dropdownPosition.left }}
              role="menu"
            >
              {filteredCategories.map((item, idx) => {
                if (item.type === 'header') {
                  return <div key={`header-${idx}`} className={styles.actionMenuHeader}>{item.label}</div>;
                }
                if (item.type === 'separator') {
                  return <div key={`sep-${idx}`} className={styles.actionMenuSeparator} />;
                }
                const disabled = isActionDisabled(item, row);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.actionMenuItem}
                    role="menuitem"
                    disabled={disabled}
                    onClick={() => !disabled && handleActionClick(item, row)}
                    title={disabled ? 'Not available for completed plans' : undefined}
                  >
                    {item.iconLeft && <i className={`bi ${item.iconLeft} ${styles.actionMenuIconLeft}`} aria-hidden />}
                    {item.label}
                    {item.iconRight && <i className={`bi ${item.iconRight} ${styles.actionMenuIconRight}`} aria-hidden />}
                  </button>
                );
              })}
            </div>
          );
        })(),
        document.body
      )}
    </>
  );
}
