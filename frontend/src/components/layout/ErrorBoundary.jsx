import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * ECCD CARE — Resilient Section Error Boundary
 * Prevents full-application white screens when any child view encounters a runtime error.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ECCD CARE Uncaught View Exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            margin: '2rem auto',
            maxWidth: '720px',
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.25rem 0' }}>
                Section Rendering Notice
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                An unexpected display error occurred while rendering this module. The application shell and other
                modules remain secure and operational.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div
              style={{
                padding: '0.875rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                color: '#be123c',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Try Reloading Section
            </Button>
            {this.props.onNavigate && (
              <Button
                variant="outline"
                size="sm"
                icon={LayoutDashboard}
                onClick={() => {
                  this.handleReset();
                  this.props.onNavigate('dashboard');
                }}
              >
                Return to Dashboard
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
