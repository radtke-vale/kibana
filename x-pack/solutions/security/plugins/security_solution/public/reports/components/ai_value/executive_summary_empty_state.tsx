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
  EuiText,
  EuiSpacer,
  EuiTitle,
  EuiIcon,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiPanel,
} from '@elastic/eui';
import analyticsSpeedAcceleration from './analytics_speed_accelation.svg';

export const ExecutiveSummaryEmptyState: React.FC<{}> = () => {
  return (
    <>
      <EuiPanel hasShadow={true} color="subdued">
        <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
          <EuiFlexItem grow={false} alignItems="center">
            <EuiSpacer size="m" />
            <EuiIcon
              type={analyticsSpeedAcceleration}
              size="original"
              title="Analytics Speed Acceleration"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={6}>
            <EuiSpacer size="s" />
            <EuiTitle size="xs">
              <p>{'No attacks detected yet'}</p>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiText size="s">
              <p>{'Get started with Attack Discovery'}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="external"
              iconSide="right"
              color="primary"
              onClick={() => {}}
            >
              {'Attack discovery'}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon iconType="cross" aria-label="Attack discovery" color="text" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      {/* TODO: Gray backgound - coming from parent container? */}
      <EuiSpacer size="l" css={{ backgroundColor: 'warning' }} />
      {/* TODO: AI generated based on existing report, not matching fully */}
      <EuiPanel hasShadow={true} color="subdued">
        {/* -- PLACEHOLDER FOR THE REPORT WITH STABBED DATA--*/}
      </EuiPanel>
    </>
  );
};
