import React, { useState, useEffect } from 'react';
import { ShieldCheck, HelpCircle, Clock } from 'lucide-react';
import { formatPHTDate, formatPHTTime } from '../../utils/phTime';

/**
 * ECCD CARE - Official Philippine Government Masthead
 * Republic Act 10535 - Philippine Standard Time (PST)
 */
export function TopGovBanner() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="gov-masthead">
      <div className="gov-masthead-brand">
        <span className="gov-masthead-flag" title="Republic of the Philippines">
          🇵🇭 GOVPH
        </span>
        <span>Republic of the Philippines • City Social Welfare & Development Office</span>
        <span style={{ margin: '0 6px', opacity: 0.4 }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--color-accent-300, #38bdf8)', fontSize: '11px' }} title="Official Philippine Standard Time (PST, UTC+8)">
          <Clock size={11} />
          <span>PST: {formatPHTDate(currentTime, 'medium')} {formatPHTTime(currentTime, true)}</span>
        </span>
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
