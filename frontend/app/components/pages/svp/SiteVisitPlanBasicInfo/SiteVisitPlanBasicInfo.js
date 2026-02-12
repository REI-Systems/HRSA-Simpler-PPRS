'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlanDescriptionEditor from '../PlanDescriptionEditor';
import { updateBasicInfo } from '../../../../services/svpService';
import overviewStyles from '../SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.module.css';
import formStyles from '../InitiatePlanForm/InitiatePlanForm.module.css';
import styles from './SiteVisitPlanBasicInfo.module.css';

function getCheckedValues(form, name) {
  if (!form) return [];
  const nodes = form.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(nodes).map((el) => el.value);
}

const CONDUCTED_BY_OPTIONS = [
  { value: 'bureau_staff', label: 'Bureau Staff' },
  { value: 'consultant', label: 'Consultant/Expert' },
  { value: 'dfi_staff', label: 'DFI Staff' },
];

const EMPTY_TRAVEL_PLAN = () => ({
  number_of_travelers: '',
  travel_locations: '',
  travel_dates: '',
  travelers: '',
  travel_cost: '',
  status: '',
});

/** Validate required fields for Mark as Complete. Returns { valid: boolean, errors: string[], failedFields: string[] }. */
function validateForMarkComplete(payload) {
  const errors = [];
  const failedFields = [];
  if (!Array.isArray(payload.conducted_by) || payload.conducted_by.length === 0) {
    errors.push('Site Visit to be conducted By is required (select at least one).');
    failedFields.push('conducted_by');
  }
  const location = (payload.location ?? '').toString().trim();
  if (!location) {
    errors.push('Site Visit Location is required.');
    failedFields.push('location');
  }
  if (!Array.isArray(payload.reason_types) || payload.reason_types.length === 0) {
    errors.push('Site Visit Reason Type(s) is required (select at least one).');
    failedFields.push('reason_types');
  }
  const justification = (payload.justification ?? '').toString().trim();
  if (!justification) {
    errors.push('Justification for the site visit is required.');
    failedFields.push('justification');
  }
  const siteVisitTypePrimary = (payload.site_visit_type_primary ?? '').toString().trim();
  if (!siteVisitTypePrimary) {
    errors.push('Type(s) of Site Visit — Primary is required.');
    failedFields.push('site_visit_type_primary');
  }
  if (!Array.isArray(payload.areas_of_review) || payload.areas_of_review.length === 0) {
    errors.push('Area(s) of Review is required (select at least one).');
    failedFields.push('areas_of_review');
  }
  const defaultAssignee = (payload.default_assignee ?? '').toString().trim();
  if (!defaultAssignee) {
    errors.push('Default Assignee for the site visit is required.');
    failedFields.push('default_assignee');
  }
  const prioritization = (payload.prioritization ?? '').toString().trim();
  if (!prioritization) {
    errors.push('Prioritization of the site visit is required.');
    failedFields.push('prioritization');
  }
  const optRole = (payload.optional_assignee_role ?? '').toString().trim();
  const optAssignee = (payload.optional_assignee_assignee ?? '').toString().trim();
  if (optRole || optAssignee) {
    if (!optRole) {
      errors.push('If specifying an Optional Assignee, Select a Role is required.');
      failedFields.push('optional_assignee_role');
    }
    if (!optAssignee) {
      errors.push('If specifying an Optional Assignee, Select Assignee is required.');
      failedFields.push('optional_assignee_assignee');
    }
  }
  return { valid: errors.length === 0, errors, failedFields };
}

export default function SiteVisitPlanBasicInfo({ planId, entityId, plan, basicInfo, options, onSaveSuccess, viewMode = false }) {
  const router = useRouter();
  const formRef = useRef(null);
  const participantInputRef = useRef(null);
  const [grantOpen, setGrantOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [justification, setJustification] = useState(basicInfo?.justification ?? '');
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState(null);
  const [failedValidationFields, setFailedValidationFields] = useState(new Set());
  const [addProgramValue, setAddProgramValue] = useState('');
  const [additionalPrograms, setAdditionalPrograms] = useState(() => Array.isArray(basicInfo?.additional_programs) ? [...basicInfo.additional_programs] : []);
  const [participants, setParticipants] = useState(() => Array.isArray(basicInfo?.participants) ? [...basicInfo.participants] : []);
  const [travelPlans, setTravelPlans] = useState(() => {
    const list = basicInfo?.travel_plans ?? [];
    return Array.isArray(list) ? list.map((row) => ({
      id: row.id,
      number_of_travelers: row.number_of_travelers ?? '',
      travel_locations: row.travel_locations ?? '',
      travel_dates: row.travel_dates ?? '',
      travelers: row.travelers ?? '',
      travel_cost: row.travel_cost ?? '',
      status: row.status ?? '',
    })) : [];
  });

  const trackingNumber = basicInfo?.tracking_number ?? '';
  const grantLabel = basicInfo?.grant_label ?? '';
  const siteVisitInitiatedFor = basicInfo?.site_visit_initiated_for ?? '';
  const additionalProgramsOptions = options?.additional_programs ?? [];
  const locationOptions = options?.site_visit_locations ?? [];
  const reasonTypeOptions = options?.reason_types ?? [];
  const primaryTypeOptions = options?.site_visit_types_primary ?? [];
  const secondaryTypeOptions = options?.site_visit_types_secondary ?? [];
  const areasOfReviewOptions = options?.areas_of_review ?? [];
  const rolesOptions = options?.roles ?? [];
  const prioritizationOptions = options?.prioritization ?? [];
  const assigneesOptions = options?.assignees ?? [];

  useEffect(() => {
    setJustification(basicInfo?.justification ?? '');
  }, [basicInfo?.justification]);

  useEffect(() => {
    if (saveErrorMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [saveErrorMessage]);

  const buildPayloadFromForm = useCallback((action) => {
    const form = formRef.current;
    const payload = { action };
    if (!form) return payload;
    const get = (name) => (form.elements[name] ? form.elements[name].value : form.querySelector(`[name="${name}"]`)?.value);
    payload.start_date = get('start_date') || null;
    payload.end_date = get('end_date') || null;
    payload.conducted_by = getCheckedValues(form, 'conducted_by');
    payload.location = get('location') || null;
    payload.location_other = get('location_other') || null;
    payload.reason_types = getCheckedValues(form, 'reason_types');
    payload.reason_other = get('reason_other') || null;
    payload.justification = justification || null;
    payload.site_visit_type_primary = get('site_visit_type_primary') || null;
    payload.site_visit_type_primary_other = get('site_visit_type_primary_other') || null;
    payload.site_visit_type_secondary = get('site_visit_type_secondary') || null;
    payload.site_visit_type_secondary_other = get('site_visit_type_secondary_other') || null;
    payload.areas_of_review = getCheckedValues(form, 'areas_of_review');
    payload.areas_of_review_other = get('areas_of_review_other') || null;
    payload.default_assignee = basicInfo?.default_assignee ?? null;
    payload.optional_assignee_role = get('optional_assignee_role') || null;
    payload.optional_assignee_team = get('optional_assignee_team') || null;
    payload.optional_assignee_assignee = get('optional_assignee_assignee') || null;
    payload.participants = participants;
    payload.prioritization = get('prioritization') || null;
    payload.additional_programs = additionalPrograms;
    payload.tracking_number = basicInfo?.tracking_number ?? null;
    payload.travel_plans = travelPlans.map((row) => ({
      number_of_travelers: row.number_of_travelers ?? '',
      travel_locations: row.travel_locations ?? '',
      travel_dates: row.travel_dates ?? '',
      travelers: row.travelers ?? '',
      travel_cost: row.travel_cost ?? '',
      status: row.status ?? '',
    }));
    return payload;
  }, [justification, basicInfo?.default_assignee, basicInfo?.tracking_number, additionalPrograms, participants, travelPlans]);

  const handleSaveAction = (action) => {
    setSaveErrorMessage(null);
    setFailedValidationFields(new Set());
    const planIdStr = planId != null ? String(planId).trim() : '';
    const entityIdStr = entityId != null ? String(entityId).trim() : '';
    if (!planIdStr || !entityIdStr || planIdStr === 'undefined' || entityIdStr === 'undefined') {
      setSaveErrorMessage('Plan or entity is missing. Please open this page from Identified Site Visits via "Edit Basic Information".');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
      return;
    }
    const payload = buildPayloadFromForm(action);
    if (action === 'mark_complete') {
      const { valid, errors, failedFields } = validateForMarkComplete(payload);
      if (!valid) {
        setSaveErrorMessage(errors.length === 1 ? errors[0] : 'Please complete all required fields: ' + errors.join(' '));
        setFailedValidationFields(new Set(failedFields || []));
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 8000);
        return;
      }
    }
    setSaveStatus('saving');
    updateBasicInfo(planIdStr, entityIdStr, payload)
      .then((updated) => {
        setSaveStatus('saved');
        setSaveErrorMessage(null);
        setFailedValidationFields(new Set());
        onSaveSuccess?.();
        if (updated?.justification !== undefined) setJustification(updated.justification ?? '');
        setTimeout(() => setSaveStatus(null), 3000);
        if (action === 'save_and_continue' && planIdStr) {
          router.push(`/svp/status/${encodeURIComponent(planIdStr)}/identified-site-visits`);
        }
      })
      .catch((err) => {
        setSaveStatus('error');
        const msg = err?.message || 'Save failed. Try again.';
        const detail = err?.detail ? ` (${err.detail})` : '';
        setSaveErrorMessage(msg + detail);
      });
  };

  return (
    <div className={`${overviewStyles.container} ${styles.basicInfoPage}`}>
      {saveErrorMessage && (
        <div className={styles.errorBanner} role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden />
          <span className={styles.errorBannerText}>{saveErrorMessage}</span>
          <button
            type="button"
            className={styles.errorBannerDismiss}
            onClick={() => { setSaveErrorMessage(null); setFailedValidationFields(new Set()); }}
            aria-label="Dismiss error"
          >
            <i className="bi bi-x-lg" aria-hidden />
          </button>
        </div>
      )}
      <div className={styles.headerRow}>
        <h1 className={overviewStyles.mainTitle}>
          <i className="bi bi-info-circle" aria-hidden />
          Basic Information
        </h1>
        <span className={styles.trackingNumber}>
          Planned Site Visit Tracking #: {trackingNumber}
        </span>
      </div>

      <div className={overviewStyles.collapsible}>
        <button
          type="button"
          className={overviewStyles.collapsibleHeader}
          onClick={() => setGrantOpen(!grantOpen)}
          aria-expanded={grantOpen}
        >
          <span className={overviewStyles.collapsibleHeaderLeft}>
            <i
              className={`bi bi-chevron-down ${overviewStyles.collapsibleChevron} ${grantOpen ? overviewStyles.open : ''}`}
              aria-hidden
            />
            {grantLabel}
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${grantOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!grantOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <div className={overviewStyles.detailRow}>
              <span className={overviewStyles.detailItem}>
                <strong>Entity:</strong> {basicInfo?.entity?.entity_name ?? '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Entity Number:</strong> {basicInfo?.entity?.entity_number ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={overviewStyles.collapsible}>
        <button
          type="button"
          className={overviewStyles.collapsibleHeader}
          onClick={() => setResourcesOpen(!resourcesOpen)}
          aria-expanded={resourcesOpen}
        >
          <span className={overviewStyles.collapsibleHeaderLeft}>
            <i className="bi bi-box-arrow-up-right" aria-hidden />
            Resources
            <i
              className={`bi bi-chevron-down ${overviewStyles.collapsibleChevron} ${resourcesOpen ? overviewStyles.open : ''}`}
              aria-hidden
            />
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${resourcesOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!resourcesOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <h3 className={overviewStyles.currentDocumentsTitle}>Current Document</h3>
            <div className={overviewStyles.detailRowSecond}>
              <a href="#current-document">Current Document</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#grant">Grant</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#institution">Institution</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#program">Program</a>
            </div>
            <p style={{ marginTop: 8 }}>
              <a href="#printable-plan-record">Printable Plan Record</a>
            </p>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>
        Provide Site Visit Basic Information
      </div>
      <p className={formStyles.requiredNote}>
        Fields with <span className={formStyles.requiredStar}>*</span> are required
      </p>

      <form ref={formRef} id="basic-info-form" onSubmit={(e) => { e.preventDefault(); }}>
      <fieldset disabled={viewMode} style={{ border: 'none', margin: 0, padding: 0 }}>
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>Site Visit Initiated for</div>
          <div className={styles.fieldValueCol}>
            <input
              type="text"
              className={formStyles.textField}
              value={siteVisitInitiatedFor}
              readOnly
              style={{ marginLeft: 0, background: '#f5f5f5', width: '100%', maxWidth: '100%' }}
            />
          </div>
        </div>
      </div>

      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            Identify any additional program(s) participating in this site visit
            <p className={styles.hint} style={{ marginTop: 4, fontWeight: 'normal' }}>(Answering this question is optional)</p>
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.addRemoveRow}>
              <select
                className={`${formStyles.selectField} ${styles.selectOne}`}
                aria-label="Additional Program(s)"
                value={addProgramValue}
                onChange={(e) => setAddProgramValue(e.target.value)}
              >
                <option value="">Select program</option>
                {additionalProgramsOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                className={formStyles.createBtn}
                style={{ padding: '6px 14px' }}
                onClick={() => {
                  const value = addProgramValue?.trim();
                  if (!value) return;
                  setAdditionalPrograms((prev) => (prev.includes(value) ? prev : [...prev, value]));
                  setAddProgramValue('');
                }}
              >
                <i className="bi bi-plus-lg" aria-hidden /> Add
              </button>
            </div>
            <div className={styles.chipList}>
              {additionalPrograms.length === 0 ? (
                <span className={styles.chipListEmpty}>None added</span>
              ) : (
                additionalPrograms.map((value) => {
                  const label = additionalProgramsOptions.find((o) => o.value === value)?.label ?? value;
                  return (
                    <span key={value} className={styles.chip}>
                      {label}
                      <button
                        type="button"
                        className={styles.chipRemove}
                        onClick={() => setAdditionalPrograms((prev) => prev.filter((v) => v !== value))}
                        aria-label={`Remove ${label}`}
                      >
                        <i className="bi bi-x-lg" aria-hidden />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            <p className={styles.hint}>
              Select a program from the list and click Add. Click × on a chip to remove.
            </p>
          </div>
        </div>
      </div>

      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>What are the planned date(s) for the site visit?</div>
          <div className={styles.fieldValueCol}>
            <div className={styles.addRemoveRow}>
              <label>
                Start Date{' '}
                <input
                  type="date"
                  name="start_date"
                  className={styles.dateInput}
                  defaultValue={basicInfo?.start_date ?? ''}
                />
              </label>
              <label>
                End Date{' '}
                <input
                  type="date"
                  name="end_date"
                  className={styles.dateInput}
                  defaultValue={basicInfo?.end_date ?? ''}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('conducted_by') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit to be conducted By
          </div>
          <div className={styles.fieldValueCol}>
            <div className={formStyles.radioRow} style={{ marginLeft: 0 }}>
              {CONDUCTED_BY_OPTIONS.map((opt) => (
                <label key={opt.value} className={formStyles.radioLabel}>
                  <input
                    type="checkbox"
                    name="conducted_by"
                    value={opt.value}
                    defaultChecked={basicInfo?.conducted_by?.includes(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('location') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit Location
          </div>
          <div className={styles.fieldValueCol}>
            <select
              name="location"
              className={`${formStyles.selectField} ${styles.selectOne}`}
              defaultValue={basicInfo?.location ?? ''}
              aria-label="Site Visit Location"
            >
              <option value="">Select One</option>
              {locationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className={styles.otherSpecify}>
              <div className={styles.fieldRowSideBySide}>
                <div className={styles.fieldLabelCol} style={{ flex: '0 0 180px' }}>If &apos;Other&apos;, please specify</div>
                <div className={styles.fieldValueCol}>
                  <input
                    type="text"
                    name="location_other"
                    className={formStyles.textField}
                    placeholder="Provide the title of the 'Other' Location."
                    defaultValue={basicInfo?.location_other ?? ''}
                    style={{ marginLeft: 0, width: '100%', maxWidth: 400 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Site Visit Reason Type(s)</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('reason_types') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit Reason Type(s)
          </div>
          <div className={styles.fieldValueCol}>
            <div className={formStyles.radioRow} style={{ marginLeft: 0 }}>
              {reasonTypeOptions.map((opt) => (
                <label key={opt.value} className={formStyles.radioLabel}>
                  <input
                    type="checkbox"
                    name="reason_types"
                    value={opt.value}
                    defaultChecked={basicInfo?.reason_types?.includes(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className={styles.otherSpecify}>
              <div className={styles.fieldRowSideBySide}>
                <div className={styles.fieldLabelCol} style={{ flex: '0 0 180px' }}>If &apos;Other&apos;, please specify</div>
                <div className={styles.fieldValueCol}>
                  <input
                    type="text"
                    name="reason_other"
                    className={formStyles.textField}
                    placeholder="Provide the 'Other' Reason Type"
                    defaultValue={basicInfo?.reason_other ?? ''}
                    style={{ marginLeft: 0, width: '100%', maxWidth: 400 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Justification for the site visit</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('justification') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> What is the justification for the site visit?
          </div>
          <div className={styles.fieldValueCol}>
            <PlanDescriptionEditor
              value={justification}
              onChange={setJustification}
              maxLength={5000}
              placeholder=""
            />
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Type(s) of Site Visit</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('site_visit_type_primary') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Type(s) of Site Visit
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.addRemoveRow}>
              <div className={styles.fieldRowSideBySide}>
                <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>Primary (Required)</div>
                <div className={styles.fieldValueCol}>
                  <select
                    name="site_visit_type_primary"
                    className={`${formStyles.selectField} ${styles.selectOne}`}
                    defaultValue={basicInfo?.site_visit_type_primary ?? ''}
                  >
                    <option value="">Select One</option>
                    {primaryTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className={styles.otherSpecify}>
                    <input
                      type="text"
                      name="site_visit_type_primary_other"
                      className={formStyles.textField}
                      placeholder="Provide the 'Other' Primary Site Visit Type"
                      defaultValue={basicInfo?.site_visit_type_primary_other ?? ''}
                      style={{ marginLeft: 0, width: '100%', maxWidth: 400 }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.fieldRowSideBySide}>
                <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>Secondary (Optional)</div>
                <div className={styles.fieldValueCol}>
                  <select
                    name="site_visit_type_secondary"
                    className={`${formStyles.selectField} ${styles.selectOne}`}
                    defaultValue={basicInfo?.site_visit_type_secondary ?? ''}
                  >
                    <option value="">Select One</option>
                    {secondaryTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className={styles.otherSpecify}>
                    <input
                      type="text"
                      name="site_visit_type_secondary_other"
                      className={formStyles.textField}
                      placeholder="Provide the 'Other' Secondary Site Visit Type"
                      defaultValue={basicInfo?.site_visit_type_secondary_other ?? ''}
                      style={{ marginLeft: 0, width: '100%', maxWidth: 400 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Area(s) of Review</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('areas_of_review') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Area(s) of Review
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}>
              <i className="bi bi-info-circle" aria-hidden />
            </span>
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.checkboxList}>
              {(Array.isArray(areasOfReviewOptions) ? areasOfReviewOptions : []).map((label, idx) => (
                <label key={idx} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    name="areas_of_review"
                    value={label}
                    defaultChecked={basicInfo?.areas_of_review?.includes(label)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className={styles.otherSpecify}>
              <div className={styles.fieldRowSideBySide}>
                <div className={styles.fieldLabelCol} style={{ flex: '0 0 180px' }}>If &apos;Other&apos;, please specify</div>
                <div className={styles.fieldValueCol}>
                  <input
                    type="text"
                    name="areas_of_review_other"
                    className={formStyles.textField}
                    placeholder="Provide the title of the 'Other' Area of Review."
                    defaultValue={basicInfo?.areas_of_review_other ?? ''}
                    style={{ marginLeft: 0, width: '100%', maxWidth: 400 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Site Visit Follow-up</div>
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            Site Visit Follow-up
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
          </div>
          <div className={styles.fieldValueCol}>
            <p style={{ margin: '0 0 4px' }}>
              If this site visit is a follow up to a previously conducted site visit, click the Identify Site Visit button to link the previous site visit.
            </p>
            <p className={styles.hint}>(No more than one site visit can be linked)</p>
            <button type="button" className={formStyles.createBtn} style={{ marginTop: 8 }}>
              Identify Site Visit
            </button>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Default Assignee</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('default_assignee') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Default Assignee for the site visit
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
            <p className={styles.hint} style={{ marginTop: 4, fontWeight: 'normal' }}>(Bureau Staff Only)</p>
          </div>
          <div className={styles.fieldValueCol}>
            <span>{basicInfo?.default_assignee ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Optional Assignee</div>
      <div className={`${formStyles.fieldGroup} ${(failedValidationFields.has('optional_assignee_role') || failedValidationFields.has('optional_assignee_assignee')) ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            Optional Assignee for the site visit
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.fieldRowSideBySide}>
              <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>
                <span className={formStyles.requiredStar}>*</span> Select a Role:
              </div>
              <div className={styles.fieldValueCol}>
                <select name="optional_assignee_role" className={formStyles.selectField} defaultValue={basicInfo?.optional_assignee_role ?? ''}>
                  <option value="">Select Role</option>
                  {rolesOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRowSideBySide}>
              <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>Select Team (Optional):</div>
              <div className={styles.fieldValueCol}>
                <div className={styles.searchRow}>
                  <input name="optional_assignee_team" type="text" className={formStyles.textField} placeholder="Start Typing to Search" defaultValue={basicInfo?.optional_assignee_team ?? ''} style={{ marginLeft: 0, flex: 1 }} />
                  <button type="button" className={styles.clearBtn}>X Clear</button>
                </div>
              </div>
            </div>
            <div className={styles.fieldRowSideBySide}>
              <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>
                <span className={formStyles.requiredStar}>*</span> Select Assignee:
              </div>
              <div className={styles.fieldValueCol}>
                <select
                  name="optional_assignee_assignee"
                  className={`${formStyles.selectField} ${styles.selectOne}`}
                  defaultValue={basicInfo?.optional_assignee_assignee ?? ''}
                  aria-label="Select Assignee"
                >
                  <option value="">Select One</option>
                  {(basicInfo?.optional_assignee_assignee && !assigneesOptions.some((o) => o.value === basicInfo.optional_assignee_assignee)) && (
                    <option value={basicInfo.optional_assignee_assignee}>{basicInfo.optional_assignee_assignee}</option>
                  )}
                  {assigneesOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Participant(s)/Traveler(s)</div>
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            Participant(s)/Traveler(s)
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
            <p className={styles.hint} style={{ marginTop: 4, fontWeight: 'normal' }}>(HRSA Staff Only)</p>
            <p className={styles.hint} style={{ fontWeight: 'normal' }}>
              Enter a name and click Add. Click × next to a name to remove.
            </p>
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.addRemoveRow}>
              <input
                ref={participantInputRef}
                type="text"
                className={formStyles.textField}
                placeholder="Participant or traveler name"
                style={{ marginLeft: 0, flex: 1, maxWidth: 320 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (participantInputRef.current?.value ?? '').trim();
                    if (v) {
                      setParticipants((prev) => [...prev, v]);
                      if (participantInputRef.current) participantInputRef.current.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                className={formStyles.createBtn}
                style={{ padding: '6px 14px' }}
                onClick={() => {
                  const v = (participantInputRef.current?.value ?? '').trim();
                  if (!v) return;
                  setParticipants((prev) => [...prev, v]);
                  if (participantInputRef.current) participantInputRef.current.value = '';
                }}
              >
                <i className="bi bi-plus-lg" aria-hidden /> Add
              </button>
            </div>
            <div className={styles.participantArea}>
              {participants.length === 0 ? (
                <span className={styles.chipListEmpty}>None added</span>
              ) : (
                participants.map((name, i) => (
                  <div key={i} className={styles.participantRow}>
                    <span>{name}</span>
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => setParticipants((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove ${name}`}
                    >
                      <i className="bi bi-x-lg" aria-hidden />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Prioritization</div>
      <div className={`${formStyles.fieldGroup} ${failedValidationFields.has('prioritization') ? styles.fieldGroupError : ''}`}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> What is the prioritization of the site visit?
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
          </div>
          <div className={styles.fieldValueCol}>
            <select
              name="prioritization"
              className={`${formStyles.selectField} ${styles.selectOne}`}
              defaultValue={basicInfo?.prioritization ?? 'Medium'}
            >
              {prioritizationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Travel Plan</div>
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            Travel Plan
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
          </div>
          <div className={styles.fieldValueCol}>
            <button
              type="button"
              className={formStyles.createBtn}
              style={{ padding: '6px 14px', marginBottom: 12 }}
              onClick={() => setTravelPlans((prev) => [...prev, { ...EMPTY_TRAVEL_PLAN(), id: `new-${Date.now()}` }])}
            >
              <i className="bi bi-plus-lg" aria-hidden /> Add Travel Plan
            </button>
            {travelPlans.length === 0 ? (
              <div className={styles.emptyTable}>No travel plan. Click Add Travel Plan to add one.</div>
            ) : (
              <div className={styles.dataGridWrap}>
                <table className={styles.travelPlanTable}>
                  <thead>
                    <tr>
                      <th>Number of travelers</th>
                      <th>Travel Locations</th>
                      <th>Travel Dates</th>
                      <th>Travelers</th>
                      <th>Travel Cost</th>
                      <th>Status</th>
                      <th>Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travelPlans.map((row, idx) => (
                      <tr key={row.id ?? idx}>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.number_of_travelers}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, number_of_travelers: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.travel_locations}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, travel_locations: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.travel_dates}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, travel_dates: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.travelers}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, travelers: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.travel_cost}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, travel_cost: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={styles.travelPlanInput}
                            value={row.status}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTravelPlans((prev) => prev.map((r, i) => (i === idx ? { ...r, status: v } : r)));
                            }}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.clearBtn}
                            onClick={() => setTravelPlans((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="Delete row"
                          >
                            <i className="bi bi-trash" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      </fieldset>
      </form>

      <div className={overviewStyles.footer}>
        <div className={overviewStyles.footerLeft}>
          <Link href={planId ? `/svp/status/${encodeURIComponent(planId)}/identified-site-visits${viewMode ? '?view=true' : ''}` : '#'}>
            Go to Previous Page
          </Link>
        </div>
        {!viewMode && (
          <div className={overviewStyles.footerRight}>
            {saveStatus === 'saved' && <span className={styles.saveStatusOk}>Saved.</span>}
            <button
              type="button"
              onClick={() => handleSaveAction('save')}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveAction('save_and_continue')}
              disabled={saveStatus === 'saving'}
            >
              Save and Continue
            </button>
            <button
              type="button"
              onClick={() => handleSaveAction('mark_complete')}
              disabled={saveStatus === 'saving'}
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
