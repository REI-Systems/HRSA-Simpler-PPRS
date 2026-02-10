'use client';

import { useState } from 'react';
import styles from './InitiatePlanForm.module.css';

export default function InitiatePlanForm({
  options = {},
  onSubmit,
  onCancel,
}) {
  const {
    bureaus = [],
    divisions = [],
    programs = [],
    teams = [],
    fiscal_years = [],
    calendar_years = [],
  } = options;

  const [formData, setFormData] = useState({
    team: '',
    planForType: 'division', // 'bureau', 'division', or 'program'
    bureau: bureaus[0] || '',
    division: '',
    program: '',
    periodType: '', // 'fiscal' or 'calendar'
    fiscalYear: '',
    calendarYear: '',
    planName: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user makes a change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePlanForTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      planForType: type,
      // Reset the corresponding dropdown when switching
      bureau: type === 'bureau' ? (bureaus[0] || '') : prev.bureau,
      division: type === 'division' ? '' : prev.division,
      program: type === 'program' ? '' : prev.program,
    }));
  };

  const handlePeriodTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      periodType: type,
      fiscalYear: type === 'fiscal' ? '' : prev.fiscalYear,
      calendarYear: type === 'calendar' ? '' : prev.calendarYear,
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Validate Plan For selection
    if (formData.planForType === 'bureau' && !formData.bureau) {
      newErrors.bureau = 'Bureau is required';
    }
    if (formData.planForType === 'division' && !formData.division) {
      newErrors.division = 'Division is required';
    }
    if (formData.planForType === 'program' && !formData.program) {
      newErrors.program = 'Program is required';
    }

    // Validate Period selection
    if (!formData.periodType) {
      newErrors.periodType = 'Please select a plan period type';
    } else if (formData.periodType === 'fiscal' && !formData.fiscalYear) {
      newErrors.fiscalYear = 'Fiscal Year is required';
    } else if (formData.periodType === 'calendar' && !formData.calendarYear) {
      newErrors.calendarYear = 'Calendar Year is required';
    }

    // Validate Plan Name
    if (!formData.planName.trim()) {
      newErrors.planName = 'Plan Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.mainTitle}>
        <i className="bi bi-card-checklist" aria-hidden />
        Site Visit Plan - Initiate
      </h2>

      <p className={styles.requiredNote}>
        Fields with <span className={styles.requiredStar}>*</span> are required
      </p>

      <form onSubmit={handleSubmit}>
        {/* Initiate In Context Of */}
        <div className={styles.sectionHeader}>
          <span className={styles.requiredStar}>*</span> Initiate In Context Of
        </div>
        <div className={`${styles.fieldRow} ${styles.fieldRowInitiate}`}>
          <select
            className={`${styles.selectField} ${styles.selectFieldInitiate}`}
            value={formData.team}
            onChange={(e) => handleChange('team', e.target.value)}
          >
            <option value="">No Team</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>

        {/* Provide Site Visit Planning Information */}
        <div className={styles.sectionHeaderBlue}>
          Provide Site Visit Planning Information
        </div>

        {/* Site Visit Plan For */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>
            <span className={styles.requiredStar}>*</span> Site Visit Plan For
          </div>

          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="planForType"
                checked={formData.planForType === 'bureau'}
                onChange={() => handlePlanForTypeChange('bureau')}
              />
              Bureau
            </label>
            <select
              className={`${styles.selectField} ${styles.inlineSelect}`}
              value={formData.bureau}
              onChange={(e) => handleChange('bureau', e.target.value)}
              disabled={formData.planForType !== 'bureau'}
            >
              {bureaus.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <span className={styles.orLabel}>(OR)</span>
          </div>

          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="planForType"
                checked={formData.planForType === 'division'}
                onChange={() => handlePlanForTypeChange('division')}
              />
              Division
            </label>
            <select
              className={`${styles.selectField} ${styles.inlineSelect} ${styles.wideSelect}`}
              value={formData.division}
              onChange={(e) => handleChange('division', e.target.value)}
              disabled={formData.planForType !== 'division'}
            >
              <option value="">Select a division</option>
              {divisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className={styles.orLabel}>(OR)</span>
          </div>
          {errors.division && <span className={styles.errorText}>{errors.division}</span>}

          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="planForType"
                checked={formData.planForType === 'program'}
                onChange={() => handlePlanForTypeChange('program')}
              />
              Program
            </label>
            <select
              className={`${styles.selectField} ${styles.inlineSelect} ${styles.wideSelect}`}
              value={formData.program}
              onChange={(e) => handleChange('program', e.target.value)}
              disabled={formData.planForType !== 'program'}
            >
              <option value="">Select a program</option>
              {programs.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {errors.program && <span className={styles.errorText}>{errors.program}</span>}
        </div>

        {/* Site Visit Plan Period */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>
            <span className={styles.requiredStar}>*</span> Site Visit Plan Period
          </div>

          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="periodType"
                checked={formData.periodType === 'fiscal'}
                onChange={() => handlePeriodTypeChange('fiscal')}
              />
              Fiscal Year
            </label>
            <select
              className={`${styles.selectField} ${styles.inlineSelect}`}
              value={formData.fiscalYear}
              onChange={(e) => handleChange('fiscalYear', e.target.value)}
              disabled={formData.periodType !== 'fiscal'}
            >
              <option value="">Select a Fiscal Year</option>
              {fiscal_years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className={styles.orLabel}>(OR)</span>
          </div>
          {errors.fiscalYear && <span className={styles.errorText}>{errors.fiscalYear}</span>}

          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="periodType"
                checked={formData.periodType === 'calendar'}
                onChange={() => handlePeriodTypeChange('calendar')}
              />
              Calendar Year
            </label>
            <select
              className={`${styles.selectField} ${styles.inlineSelect}`}
              value={formData.calendarYear}
              onChange={(e) => handleChange('calendarYear', e.target.value)}
              disabled={formData.periodType !== 'calendar'}
            >
              <option value="">Select a Calendar Year</option>
              {calendar_years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {errors.calendarYear && <span className={styles.errorText}>{errors.calendarYear}</span>}
          {errors.periodType && <span className={styles.errorText}>{errors.periodType}</span>}
        </div>

        {/* Plan Name */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldRowInline}>
            <label className={styles.fieldLabelInline}>
              <span className={styles.requiredStar}>*</span> Plan Name
            </label>
            <input
              type="text"
              className={`${styles.textField} ${styles.textFieldInline}`}
              value={formData.planName}
              onChange={(e) => handleChange('planName', e.target.value)}
            />
          </div>
          {errors.planName && <span className={styles.errorText}>{errors.planName}</span>}
        </div>

        {/* Actions */}
        <div className={styles.submitRow}>
          <div>
            {onCancel && (
              <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
          <button type="submit" className={styles.createBtn}>
            Create Plan
          </button>
        </div>
      </form>
    </div>
  );
}
