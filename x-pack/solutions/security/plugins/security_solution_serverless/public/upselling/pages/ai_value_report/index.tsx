/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { lazy, Suspense } from 'react';
import { EuiLoadingSpinner, EuiPageHeader, EuiSpacer } from '@elastic/eui';
import { AIValueReportUpgradeBanner } from './upgrade_banner';
import * as i18n from './translations';

const AIValueReportLazy = lazy(() =>
  import('@kbn/security-solution-plugin/public').then(({ AIValueReport }) => ({
    default: AIValueReport,
  }))
);

const noop = () => {};

export const AIValueReportUpsellPage: React.FC = () => (
  <div data-test-subj="aiValueUpsellPage">
    <EuiPageHeader pageTitle={i18n.AI_VALUE_DASHBOARD} />
    <EuiSpacer size="l" />
    <Suspense fallback={<EuiLoadingSpinner />}>
      <AIValueReportLazy
        from="now-30d/d"
        to="now/d"
        setHasReportData={noop}
        setIsDatePickerDisabled={noop}
        isSourcererLoading={false}
        sampleBanner={<AIValueReportUpgradeBanner />}
        forceSampleData={true}
      />
    </Suspense>
  </div>
);
