import React from 'react';
import dswdLogo from '../../assets/dswd-logo.png';
import csfpLogo from '../../assets/csfp-logo.png';
import eccdCouncilLogo from '../../assets/eccd-council-logo.png';
import anacLogo from '../../assets/anac-logo.png';

/**
 * OfficialReportHeader
 * Standard Philippine LGU & National ECCD Council Report Header
 * Incorporating the 4 Official Seals:
 * - City of San Fernando, Pampanga Official Seal
 * - Department of Social Welfare and Development (DSWD)
 * - Early Childhood Care and Development (ECCD) Council
 * - ANÁC Child Early Support System
 */
export function OfficialReportHeader({
  formCode,
  formTitle,
  subtitle = 'City Social Welfare and Development Office • City of San Fernando, Pampanga',
  period,
  scopeDetails,
  generatedAt,
  legalNotice,
}) {
  return (
    <header className="official-report-letterhead" style={{ marginBottom: '1.25rem' }}>
      {/* 1. Logos & Government Office Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '14px',
          borderBottom: '3px double #7e191b',
        }}
      >
        {/* Left Logos: CSFP Official Seal & DSWD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img
            src={csfpLogo}
            alt="City of San Fernando Seal"
            style={{ width: '58px', height: '58px', objectFit: 'contain' }}
            title="City of San Fernando, Pampanga Official Seal"
          />
          <img
            src={dswdLogo}
            alt="DSWD Official Logo"
            style={{ width: '54px', height: '54px', objectFit: 'contain' }}
            title="Department of Social Welfare and Development (DSWD)"
          />
        </div>

        {/* Center Text Block: Official Republic & LGU Hierarchy */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 0.5rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
            Republic of the Philippines
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Province of Pampanga
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#7e191b', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '1px 0' }}>
            City of San Fernando
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#b91c1c' }}>
            City Social Welfare and Development Office (CSWDO)
          </div>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857', letterSpacing: '0.02em' }}>
            Early Childhood Care and Development (ECCD) Council
          </div>
        </div>

        {/* Right Logos: ECCD Council Emblem & ANAC System Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <img
            src={eccdCouncilLogo}
            alt="ECCD Council Logo"
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
            title="Early Childhood Care and Development Council"
          />
          <img
            src={anacLogo}
            alt="ANÁC System Logo"
            style={{ width: '54px', height: '54px', objectFit: 'contain' }}
            title="ANÁC Early Support & Child Protection System"
          />
        </div>
      </div>

      {/* 2. Document Title Section */}
      <div style={{ textAlign: 'center', marginTop: '14px', marginBottom: '10px' }}>
        {formCode && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#7e191b',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {formCode}
            </span>
            {period && (
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                • {period}
              </span>
            )}
          </div>
        )}

        {formTitle && (
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              margin: '2px 0 4px',
            }}
          >
            {formTitle}
          </h1>
        )}

        {subtitle && (
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {subtitle}
          </div>
        )}

        {scopeDetails && (
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '4px' }}>
            {scopeDetails}
            {generatedAt && <span> • As of: <strong>{generatedAt}</strong></span>}
          </div>
        )}
      </div>

      {/* 3. Optional Legal / Compliance Banner */}
      {legalNotice && (
        <div
          style={{
            background: '#f8fafc',
            borderLeft: '4px solid #7e191b',
            borderRight: '1px solid #e2e8f0',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#334155',
            borderRadius: '4px',
            marginBottom: '14px',
            lineHeight: 1.45,
          }}
        >
          {legalNotice}
        </div>
      )}
    </header>
  );
}

export default OfficialReportHeader;
