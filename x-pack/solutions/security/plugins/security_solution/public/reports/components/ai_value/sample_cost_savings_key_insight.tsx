/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n as i18nLib } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  SAMPLE_FROM,
  SAMPLE_INTERVAL_HOURS,
  SAMPLE_KEY_INSIGHT_AVERAGED_COST,
  SAMPLE_KEY_INSIGHT_COST_RANGE,
  SAMPLE_KEY_INSIGHT_PROJECTED_ANNUAL_SAVINGS,
  SAMPLE_TO,
} from './sample_data';
import * as i18n from './translations';

export const SampleCostSavingsKeyInsight: React.FC = () => {
  const {
    euiTheme: { size },
  } = useEuiTheme();
  const locale = i18nLib.getLocale();
  const fromFormatted = new Date(SAMPLE_FROM).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
  });
  const toFormatted = new Date(SAMPLE_TO).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      css={css`
        background: linear-gradient(
          112deg,
          rgba(89, 159, 254, 0.08) 3.58%,
          rgba(240, 78, 152, 0.08) 98.48%
        );
        border-radius: ${size.s};
        padding: ${size.base};
        min-height: 200px;
      `}
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="logoElastic" size="m" aria-hidden={true} />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiTitle size="xs">
            <p>{i18n.KEY_INSIGHT}</p>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <EuiText size="s" color="subdued">
        <ul>
          <li>
            <FormattedMessage
              id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet1.descriptionDetail"
              defaultMessage="Between {from} and {to}, {intervalHours}-hour cost savings {averagedValue}, appearing frequently throughout the period."
              values={{
                from: fromFormatted,
                to: toFormatted,
                intervalHours: SAMPLE_INTERVAL_HOURS,
                averagedValue: (
                  <strong>
                    <FormattedMessage
                      id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet1.averagedValueLabel"
                      defaultMessage="averaged around {value}"
                      values={{ value: SAMPLE_KEY_INSIGHT_AVERAGED_COST }}
                    />
                  </strong>
                ),
              }}
            />
          </li>
          <li>
            <FormattedMessage
              id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet2.descriptionDetail"
              defaultMessage="Savings showed an {trendValue} in late March, with more {intervalRange} intervals emerging."
              values={{
                trendValue: (
                  <strong>
                    <FormattedMessage
                      id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet2.trendValueLabel"
                      defaultMessage="upward trend"
                    />
                  </strong>
                ),
                intervalRange: SAMPLE_KEY_INSIGHT_COST_RANGE,
              }}
            />
          </li>
          <li>
            <FormattedMessage
              id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet3.descriptionDetail"
              defaultMessage="At this pace, projected annual savings {exceedValue}, indicating consistent and growing ROI."
              values={{
                exceedValue: (
                  <strong>
                    <FormattedMessage
                      id="xpack.securitySolution.reports.aiValue.sampleKeyInsightBullet3.exceedValueLabel"
                      defaultMessage="exceed {value}"
                      values={{ value: SAMPLE_KEY_INSIGHT_PROJECTED_ANNUAL_SAVINGS }}
                    />
                  </strong>
                ),
              }}
            />
          </li>
        </ul>
      </EuiText>
    </div>
  );
};
