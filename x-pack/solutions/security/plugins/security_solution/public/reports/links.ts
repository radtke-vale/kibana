/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { SECURITY_UI_SHOW_PRIVILEGE } from '@kbn/security-solution-features/constants';
import { AI_VALUE_PATH, SecurityPageName } from '../../common/constants';
import { AI_VALUE_DASHBOARD } from '../app/translations';
import type { LinkItem } from '../common/links/types';

export const aiValueLinks: LinkItem = {
  id: SecurityPageName.aiValue,
  title: AI_VALUE_DASHBOARD,
  description: i18n.translate('xpack.securitySolution.appLinks.aiValueDescription', {
    defaultMessage: 'See ROI for Security AI features',
  }),
  path: AI_VALUE_PATH,
  licenseType: 'enterprise',
  // Capability gate is intentionally relaxed to `siem.show` so users on the
  // serverless Essentials tier (where neither `attackDiscovery` nor
  // `aiValueReport` PLIs are present and so the related sub-feature
  // capabilities are unregistered) can land on the page and see the upsell
  // CTA. The full SOC-management / attack-discovery gating is enforced inside
  // `pages/ai_value.tsx`.
  capabilities: [[SECURITY_UI_SHOW_PRIVILEGE]],
  globalSearchKeywords: [
    i18n.translate('xpack.securitySolution.appLinks.aiValue', {
      defaultMessage: 'AI Value',
    }),
    i18n.translate('xpack.securitySolution.appLinks.valueReport', {
      defaultMessage: 'Value report',
    }),
  ],
  globalNavPosition: 12,
  hideTimeline: true,
};
