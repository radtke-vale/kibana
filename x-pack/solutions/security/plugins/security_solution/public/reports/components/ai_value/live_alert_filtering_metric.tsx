/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo } from 'react';
import { PageScope } from '../../../data_view_manager/constants';
import { useSignalIndexWithDefault } from '../../hooks/use_signal_index_with_default';
import { getExcludeAlertsFilters } from './utils';
import type { GetLensAttributes } from '../../../common/components/visualization_actions/types';
import { VisualizationContextMenuActions } from '../../../common/components/visualization_actions/types';
import { getAlertFilteringMetricLensAttributes } from '../../../common/components/visualization_actions/lens_attributes/ai/alert_filtering_metric';
import * as i18n from './translations';
import { VisualizationEmbeddable } from '../../../common/components/visualization_actions/visualization_embeddable';

interface Props {
  attackAlertIds: string[];
  from: string;
  to: string;
  totalAlerts: number;
}
const ID = 'AlertFilteringMetricQuery';

const LiveAlertFilteringMetricComponent: React.FC<Props> = ({
  attackAlertIds,
  from,
  to,
  totalAlerts,
}) => {
  const extraVisualizationOptions = useMemo(
    () => ({
      filters: getExcludeAlertsFilters(attackAlertIds),
    }),
    [attackAlertIds]
  );
  const signalIndexName = useSignalIndexWithDefault();
  const getLensAttributes = useCallback<GetLensAttributes>(
    (args) => getAlertFilteringMetricLensAttributes({ ...args, signalIndexName, totalAlerts }),
    [signalIndexName, totalAlerts]
  );
  return (
    <VisualizationEmbeddable
      data-test-subj="alert-filtering-metric"
      extraOptions={extraVisualizationOptions}
      getLensAttributes={getLensAttributes}
      timerange={{ from, to }}
      id={`${ID}-area-embeddable`}
      inspectTitle={i18n.FILTERING_RATE}
      scopeId={PageScope.alerts}
      withActions={[
        VisualizationContextMenuActions.addToExistingCase,
        VisualizationContextMenuActions.addToNewCase,
        VisualizationContextMenuActions.inspect,
      ]}
    />
  );
};

export const LiveAlertFilteringMetric = React.memo(LiveAlertFilteringMetricComponent);
