/**
 * ECCD CARE — API State Wrapper Component
 * Unifies Loading, Error, Empty, and Content presentation states
 */

import React from 'react';
import { LoadingOverlay, ErrorState, EmptyState } from './EmptyState';

export function ApiStateWrapper({
  loading,
  error,
  isEmpty,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no active records in this section at the moment.',
  emptyActionLabel,
  onEmptyAction,
  loadingText = 'Retrieving ECCD records from CSWDO central database...',
  onRetry,
  children,
}) {
  if (loading) {
    return <LoadingOverlay text={loadingText} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Data"
        message={typeof error === 'string' ? error : 'Unable to connect to the CSWDO database service.'}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        secondaryActionLabel={onRetry ? 'Refresh' : undefined}
        onSecondaryAction={onRetry}
      />
    );
  }

  return <>{children}</>;
}

export default ApiStateWrapper;
