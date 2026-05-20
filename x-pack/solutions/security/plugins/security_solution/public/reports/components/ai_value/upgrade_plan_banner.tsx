/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { EuiIcon } from '@elastic/eui';
import { AnnouncementBanner } from '@kbn/announcement-banner';
import { AIValueReportEventTypes } from '../../../common/lib/telemetry/events/ai_value_report/types';
import type { UpsellDestination } from '../../../common/lib/telemetry/events/ai_value_report/types';
import { useKibana } from '../../../common/lib/kibana';
import analyticsSpeedAcceleration from './analytics_speed_acceleration.svg';
import * as i18n from './translations';

const PRICING_PAGE_URL = 'https://www.elastic.co/pricing/';

export const UpgradePlanBanner: React.FC = () => {
  const { cloud, telemetry } = useKibana().services;

  const { href, destination } = useMemo<{ href: string; destination: UpsellDestination }>(() => {
    if (cloud?.projectsUrl) {
      return { href: cloud.projectsUrl, destination: 'cloud_project' };
    }
    return { href: PRICING_PAGE_URL, destination: 'pricing_page' };
  }, [cloud?.projectsUrl]);

  const hasReportedView = useRef(false);
  useEffect(() => {
    if (hasReportedView.current) {
      return;
    }
    hasReportedView.current = true;
    telemetry.reportEvent(AIValueReportEventTypes.AIValueReportUpsellBannerViewed, {
      productTier: 'essentials',
    });
  }, [telemetry]);

  const handleClick = useCallback(() => {
    telemetry.reportEvent(AIValueReportEventTypes.AIValueReportUpsellCtaClicked, {
      productTier: 'essentials',
      destination,
    });
  }, [telemetry, destination]);

  return (
    <AnnouncementBanner
      data-test-subj="aiValueUpgradePlanBanner"
      title={i18n.UPGRADE_CTA_TITLE}
      headingElement="h3"
      text={i18n.UPGRADE_CTA_TEXT}
      media={<EuiIcon type={analyticsSpeedAcceleration} size="original" aria-hidden={true} />}
      actionProps={{
        primary: {
          children: i18n.UPGRADE_CTA_BUTTON,
          href,
          iconType: 'popout',
          iconSide: 'right',
          target: '_blank',
          rel: 'noopener noreferrer',
          onClick: handleClick,
          'data-test-subj': 'aiValueUpgradePlanButton',
        },
      }}
    />
  );
};
