import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';

/**
 * ECCD CARE - Official Philippine Government Masthead
 */
export function TopGovBanner() {
  return (
    <div className="gov-masthead">
      <div className="gov-masthead-brand">
        <span className="gov-masthead-flag" title="Republic of the Philippines">
          🇵🇭 GOVPH
        </span>
        <span>Republic of the Philippines • City Social Welfare & Development Office</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
          <ShieldCheck size={12} style={{ color: 'var(--color-accent-400)' }} />
          Official CSWDO Information System
        </span>
        <a
          href="#helpdesk"
          className="gov-masthead-link"
          onClick={(e) => {
            e.preventDefault();
            alert("CSWDO ECCD Helpdesk: (045) 961-2345 / cswdo@sanfernandocity.gov.ph");
          }}
        >
          <HelpCircle size={12} />
          <span>CSWDO Helpdesk</span>
        </a>
      </div>
    </div>
  );
}

export default TopGovBanner;
