'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlanDescriptionEditor from '../PlanDescriptionEditor';
import {
  updateCoversheet,
  getCoversheetAttachments,
  uploadCoversheetAttachment,
  deleteCoversheetAttachment,
} from '../../services/svpService';
import overviewStyles from '../SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.module.css';
import formStyles from '../InitiatePlanForm/InitiatePlanForm.module.css';
import styles from './SiteVisitPlanCoversheet.module.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

const ACTION_SAVE = 'save';
const ACTION_SAVE_AND_CONTINUE = 'save_and_continue';
const ACTION_MARK_COMPLETE = 'mark_complete';

// Backend returns snake_case; support both for robustness
function getPlanDescription(plan) {
  return plan?.plan_description ?? plan?.planDescription ?? '';
}

export default function SiteVisitPlanCoversheet({ plan, onSaveSuccess, readOnly = false }) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [planName, setPlanName] = useState(plan?.plan_name || '');
  const [planDescription, setPlanDescription] = useState(() => getPlanDescription(plan));
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const fileInputRef = useRef(null);
  const planNameRef = useRef(plan?.plan_name || '');
  const planDescriptionRef = useRef(getPlanDescription(plan));

  planNameRef.current = planName;
  planDescriptionRef.current = planDescription;

  // Sync form fields from plan when plan id changes or when plan data is refetched (e.g. after save), so saved name/description are shown
  useEffect(() => {
    if (!plan) return;
    const name = plan.plan_name ?? '';
    const desc = getPlanDescription(plan);
    console.log('[Coversheet] Sync from plan:', { planId: plan.id, plan_name: name, plan_description: desc?.slice(0, 80) + (desc?.length > 80 ? '...' : '') });
    setPlanName(name);
    setPlanDescription(desc);
    planNameRef.current = name;
    planDescriptionRef.current = desc;
  }, [plan?.id, plan?.plan_name, plan?.plan_description, plan?.planDescription]);

  useEffect(() => {
    getCoversheetAttachments(plan.id)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  }, [plan.id]);

  const saveCoversheet = (action) => {
    const planNameValue = (planNameRef.current ?? planName ?? '').trim();
    const planDescriptionValue = planDescriptionRef.current ?? planDescription ?? '';
    const payload = {
      planName: planNameValue,
      planDescription: planDescriptionValue,
      ...(action ? { action } : {}),
    };
    console.log('[Coversheet] Save request:', { planId: plan.id, payload: { ...payload, planDescription: payload.planDescription?.slice(0, 80) + (payload.planDescription?.length > 80 ? '...' : '') } });
    return updateCoversheet(plan.id, payload);
  };

  const handleGoAction = () => {
    if (!selectedAction) return;
    
    // Validate required fields for "Mark As Complete" action
    if (selectedAction === ACTION_MARK_COMPLETE) {
      const planNameValue = (planNameRef.current ?? planName ?? '').trim();
      if (!planNameValue) {
        setActionMessage('Plan Name is required to mark as complete.');
        setSaveStatus('error');
        setTimeout(() => {
          setActionMessage(null);
          setSaveStatus(null);
        }, 3000);
        return;
      }
    }
    
    setUploadError(null);
    setActionMessage(null);
    setSaveStatus('saving');
    saveCoversheet(selectedAction)
      .then((response) => {
        setSaveStatus('saved');
        setSelectedAction('');
        onSaveSuccess?.();
        if (response?.nextUrl) {
          router.push(response.nextUrl);
        } else {
          if (selectedAction === ACTION_MARK_COMPLETE) {
            setActionMessage('Coversheet saved and marked complete.');
            setTimeout(() => setActionMessage(null), 3000);
          }
          setTimeout(() => setSaveStatus(null), 3000);
        }
      })
      .catch(() => {
        setSaveStatus('error');
      });
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File exceeds 25 MB limit.');
      return;
    }
    if (attachments.length >= MAX_ATTACHMENTS) {
      setUploadError('Maximum 10 attachments per plan.');
      return;
    }
    setUploadError(null);
    uploadCoversheetAttachment(plan.id, file)
      .then((data) => {
        setAttachments(data.attachments || []);
      })
      .catch((err) => {
        let msg = err.message || 'Upload failed.';
        if (err.status === 404 && !msg.toLowerCase().includes('plan not found')) {
          msg += ' Ensure the backend is running and the request reaches it (check NEXT_PUBLIC_BACKEND_URL).';
        }
        setUploadError(msg);
      });
  };

  const handleRemoveAttachment = (storedName) => {
    deleteCoversheetAttachment(plan.id, storedName)
      .then(() => {
        setAttachments((prev) => prev.filter((a) => a.stored_name !== storedName));
      })
      .catch(() => {});
  };

  const planTitle = plan.plan_code
    ? `${plan.plan_code}: ${plan.plan_name || ''}`
    : `Plan ${plan.id}: ${plan.plan_name || ''}`;

  const bannerMessage = actionMessage || (saveStatus === 'saved' ? 'Saved.' : saveStatus === 'error' ? 'Failed to save.' : saveStatus === 'saving' ? 'Saving...' : null);

  return (
    <div className={overviewStyles.container}>
      {bannerMessage && (
        <div
          className={`${styles.banner} ${saveStatus === 'error' ? styles.bannerError : saveStatus === 'saving' ? styles.bannerSaving : styles.bannerSuccess}`}
          role="status"
        >
          {bannerMessage}
        </div>
      )}
      <h1 className={overviewStyles.mainTitle}>
        <i className="bi bi-file-earmark-text" aria-hidden />
        Site Visit Plan - Cover Sheet
      </h1>

      <div className={overviewStyles.collapsible}>
        <button
          type="button"
          className={overviewStyles.collapsibleHeader}
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
        >
          <span className={overviewStyles.collapsibleHeaderLeft}>
            <i
              className={`bi bi-chevron-down ${overviewStyles.collapsibleChevron} ${detailsOpen ? overviewStyles.open : ''}`}
              aria-hidden
            />
            {planTitle}
          </span>
          <span className={overviewStyles.collapsibleHeaderRight}>
            Status: {plan.status || 'In Progress'}
          </span>
        </button>
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${detailsOpen ? overviewStyles.collapsibleBodyOpen : ''}`}
          aria-hidden={!detailsOpen}
        >
          <div className={overviewStyles.collapsibleBody}>
            <div className={overviewStyles.detailRow}>
              <span className={overviewStyles.detailItem}>
                <strong>Plan For:</strong> {plan.plan_for || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Plan Period:</strong> {plan.plan_period || '—'}
              </span>
              <span className={overviewStyles.detailItem}>
                <strong>Number of Site Visits:</strong> {plan.site_visits ?? '0'}
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
            <h3 className={overviewStyles.currentDocumentsTitle}>Current Documents</h3>
            <div className={overviewStyles.detailRowSecond}>
              <a href="#view-plan">View Plan</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#program-plan">Program Plan</a>
              <span className={overviewStyles.detailRowSeparator} aria-hidden />
              <a href="#view-contributions">View Contributions</a>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Provide Information for Cover Sheet</div>
      <p className={formStyles.requiredNote}>
        Fields with <span className={formStyles.requiredStar}>★</span> are required.
      </p>

      <div className={formStyles.fieldGroup}>
        <div className={formStyles.fieldRowInline}>
          <label className={formStyles.fieldLabelInline}>
            <span className={formStyles.requiredStar}>★</span> Plan Name
          </label>
          <input
            type="text"
            className={`${formStyles.textField} ${formStyles.textFieldInline}`}
            value={planName}
            onChange={(e) => {
              if (readOnly) return;
              const v = e.target.value;
              planNameRef.current = v;
              setPlanName(v);
              console.log('[Coversheet] Plan Name changed:', v);
            }}
            readOnly={readOnly}
            aria-label="Plan Name"
          />
        </div>
      </div>

      <div className={formStyles.fieldGroup}>
        <label className={formStyles.fieldLabel}>Plan Description</label>
        <PlanDescriptionEditor
          key={`plan-desc-${plan.id}`}
          value={planDescription}
          onChange={(html) => {
            if (readOnly) return;
            planDescriptionRef.current = html;
            setPlanDescription(html);
          }}
          maxLength={500}
          placeholder="Enter plan description..."
          disabled={readOnly}
          hideTabs={readOnly}
        />
      </div>

      <div className={overviewStyles.collapsible}>
        <div className={overviewStyles.collapsibleHeader} style={{ cursor: 'default' }}>
          <span className={overviewStyles.collapsibleHeaderLeft}>
            Supporting Documents (Maximum 10)
          </span>
          {!readOnly && (
            <span className={overviewStyles.collapsibleHeaderRight}>
              <button
                type="button"
                className={styles.attachBtn}
                onClick={handleAttachFile}
                disabled={attachments.length >= MAX_ATTACHMENTS}
              >
                Attach File
              </button>
            </span>
          )}
        </div>
        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
            aria-hidden
          />
        )}
        <div
          className={`${overviewStyles.collapsibleBodyWrapper} ${overviewStyles.collapsibleBodyOpen}`}
        >
          <div className={overviewStyles.collapsibleBody}>
          {!readOnly && uploadError && (
            <p className={styles.uploadError} role="alert">
              {uploadError}
            </p>
          )}
          {loadingAttachments ? (
            <p className={styles.attachmentNote}>Loading...</p>
          ) : attachments.length === 0 ? (
            <p className={styles.attachmentNote}>No documents attached</p>
          ) : (
            <ul className={styles.attachmentList}>
              {attachments.map((a) => (
                <li key={a.stored_name} className={styles.attachmentItem}>
                  <span className={styles.attachmentName}>{a.name || a.stored_name}</span>
                  <span className={styles.attachmentSize}>
                    ({(a.size / 1024).toFixed(1)} KB)
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      className={styles.removeAttachment}
                      onClick={() => handleRemoveAttachment(a.stored_name)}
                      aria-label={`Remove ${a.name || a.stored_name}`}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>

      <div className={overviewStyles.footer}>
        <div className={overviewStyles.footerLeft}>
          <Link href={readOnly ? `/svp/status/${encodeURIComponent(plan.id)}?view=true` : `/svp/status/${encodeURIComponent(plan.id)}`}>
            Go to Status Overview
          </Link>
        </div>
        {!readOnly && (
          <div className={overviewStyles.footerRight}>
            <select
              className={styles.actionSelect}
              aria-label="Choose action"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">Choose Action</option>
              <optgroup label="- Action -">
                <option value={ACTION_SAVE}>Save</option>
                <option value={ACTION_SAVE_AND_CONTINUE}>Save and Continue</option>
                <option value={ACTION_MARK_COMPLETE}>Mark as Complete</option>
              </optgroup>
            </select>
            <button
              type="button"
              className={styles.goBtn}
              onClick={handleGoAction}
              disabled={!selectedAction}
            >
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
