'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlanDescriptionEditor from '../PlanDescriptionEditor';
import DataGrid from '../DataGrid';
import { updateBasicInfo } from '../../services/svpService';
import overviewStyles from '../SiteVisitPlanStatusOverview/SiteVisitPlanStatusOverview.module.css';
import formStyles from '../InitiatePlanForm/InitiatePlanForm.module.css';
import styles from './SiteVisitPlanBasicInfo.module.css';

const CONDUCTED_BY_OPTIONS = [
  { value: 'bureau_staff', label: 'Bureau Staff' },
  { value: 'consultant', label: 'Consultant/Expert' },
  { value: 'dfi_staff', label: 'DFI Staff' },
];

const TRAVEL_PLAN_COLUMNS = [
  { key: 'number_of_travelers', label: 'Number of travelers', sortable: true, minWidth: 120 },
  { key: 'travel_locations', label: 'Travel Locations', sortable: true, minWidth: 140 },
  { key: 'travel_dates', label: 'Travel Dates', sortable: true, minWidth: 120 },
  { key: 'travelers', label: 'Travelers', sortable: true, minWidth: 120 },
  { key: 'travel_cost', label: 'Travel Cost', sortable: true, minWidth: 100 },
  { key: 'status', label: 'Status', sortable: true, minWidth: 90 },
  { key: 'options', label: 'Options', sortable: false, minWidth: 80 },
];

export default function SiteVisitPlanBasicInfo({ planId, entityId, plan, basicInfo, options, onSaveSuccess }) {
  const [grantOpen, setGrantOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);
  const [justification, setJustification] = useState(basicInfo?.justification ?? '');
  const [saveStatus, setSaveStatus] = useState(null);

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
  const travelPlans = basicInfo?.travel_plans ?? [];

  useEffect(() => {
    setJustification(basicInfo?.justification ?? '');
  }, [basicInfo?.justification]);

  const handleSaveAction = (action) => {
    if (!planId || !entityId) return;
    setSaveStatus('saving');
    updateBasicInfo(planId, entityId, { action })
      .then(() => {
        setSaveStatus('saved');
        onSaveSuccess?.();
        setTimeout(() => setSaveStatus(null), 3000);
      })
      .catch(() => setSaveStatus('error'));
  };

  return (
    <div className={`${overviewStyles.container} ${styles.basicInfoPage}`}>
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
              >
                <option value="">Select program</option>
                {additionalProgramsOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button type="button" className={formStyles.createBtn} style={{ padding: '6px 14px' }}>
                <i className="bi bi-plus-lg" aria-hidden /> Add
              </button>
              <button type="button" className={styles.clearBtn}>
                <i className="bi bi-x-lg" aria-hidden /> Remove
              </button>
            </div>
            <div className={styles.listArea}>
              {(basicInfo?.additional_programs || []).length === 0 ? ' ' : basicInfo.additional_programs.join(', ')}
            </div>
            <p className={styles.hint}>
              (Hint: To add Additional Program(s) associated with this Organization, select Additional Program(s) from the list and click the &apos;Add&apos; button.)
            </p>
            <p className={styles.hint}>
              (Hint: To remove, select the Entity Number and click on the &apos;Remove&apos; button.)
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
                  className={styles.dateInput}
                  defaultValue={basicInfo?.start_date ?? ''}
                />
              </label>
              <label>
                End Date{' '}
                <input
                  type="date"
                  className={styles.dateInput}
                  defaultValue={basicInfo?.end_date ?? ''}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit to be conducted By
          </div>
          <div className={styles.fieldValueCol}>
            <div className={formStyles.radioRow} style={{ marginLeft: 0 }}>
              {CONDUCTED_BY_OPTIONS.map((opt) => (
                <label key={opt.value} className={formStyles.radioLabel}>
                  <input type="checkbox" name="conducted_by" value={opt.value} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit Location
          </div>
          <div className={styles.fieldValueCol}>
            <select
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
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> Site Visit Reason Type(s)
          </div>
          <div className={styles.fieldValueCol}>
            <div className={formStyles.radioRow} style={{ marginLeft: 0 }}>
              {reasonTypeOptions.map((opt) => (
                <label key={opt.value} className={formStyles.radioLabel}>
                  <input type="checkbox" name="reason_types" value={opt.value} />
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
      <div className={formStyles.fieldGroup}>
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
      <div className={formStyles.fieldGroup}>
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
      <div className={formStyles.fieldGroup}>
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
                  <input type="checkbox" name="areas_of_review" value={label} />
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
      <div className={formStyles.fieldGroup}>
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
      <div className={formStyles.fieldGroup}>
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
                <select className={formStyles.selectField} defaultValue="">
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
                  <input type="text" className={formStyles.textField} placeholder="Start Typing to Search" style={{ marginLeft: 0, flex: 1 }} />
                  <button type="button" className={styles.clearBtn}>X Clear</button>
                </div>
              </div>
            </div>
            <div className={styles.fieldRowSideBySide}>
              <div className={styles.fieldLabelCol} style={{ flex: '0 0 140px' }}>
                <span className={formStyles.requiredStar}>*</span> Select Assignee:
              </div>
              <div className={styles.fieldValueCol}>
                <div className={styles.searchRow}>
                  <input type="text" className={formStyles.textField} placeholder="Start Typing to Search" style={{ marginLeft: 0, flex: 1 }} />
                  <button type="button" className={styles.clearBtn}>X Clear</button>
                </div>
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
              (Hint: To add participant(s)/traveler(s), click on the &apos;Add&apos; button. To update participant(s)/travelers, click on the &apos;Update&apos; button. To remove, select the Participant(s)/traveler(s) and click on the &apos;Remove&apos; button.)
            </p>
          </div>
          <div className={styles.fieldValueCol}>
            <div className={styles.participantArea}>
              {(basicInfo?.participants || []).length === 0 ? ' ' : basicInfo.participants.map((p, i) => <div key={i}>{p}</div>)}
            </div>
            <div className={styles.participantButtons}>
              <button type="button">+ Add</button>
              <button type="button">Update</button>
              <button type="button">X Remove</button>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.sectionHeaderBlue}>Prioritization</div>
      <div className={formStyles.fieldGroup}>
        <div className={styles.fieldRowSideBySide}>
          <div className={styles.fieldLabelCol}>
            <span className={formStyles.requiredStar}>*</span> What is the prioritization of the site visit?
            <span className={styles.infoIcon} title="Info" style={{ marginLeft: 4 }}><i className="bi bi-info-circle" aria-hidden /></span>
          </div>
          <div className={styles.fieldValueCol}>
            <select
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
            <button type="button" className={formStyles.createBtn} style={{ padding: '6px 14px', marginBottom: 12 }}>
              <i className="bi bi-plus-lg" aria-hidden /> Add Travel Plan
            </button>
        {travelPlans.length === 0 ? (
          <div className={styles.emptyTable}>No travel plan exists</div>
        ) : (
          <div className={styles.dataGridWrap}>
            <DataGrid
              columns={TRAVEL_PLAN_COLUMNS}
              data={travelPlans}
              defaultPageSize={10}
              showFilters={false}
            />
          </div>
        )}
          </div>
        </div>
      </div>

      <div className={overviewStyles.footer}>
        <div className={overviewStyles.footerLeft}>
          <Link href={planId ? `/svp/status/${encodeURIComponent(planId)}/identified-site-visits` : '#'}>
            Go to Previous Page
          </Link>
        </div>
        <div className={overviewStyles.footerRight}>
          <button
            type="button"
            onClick={() => handleSaveAction('save')}
            disabled={saveStatus === 'saving'}
          >
            Save
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
      </div>
    </div>
  );
}
