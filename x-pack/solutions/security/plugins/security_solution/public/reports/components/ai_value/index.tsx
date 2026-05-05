/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo } from 'react';
import dateMath from '@kbn/datemath';
import {
  SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_MINUTES,
  SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_RATE,
} from '@kbn/management-settings-ids';
import { AIValueReportLayout } from './ai_value_report_layout';
import { useValueMetrics } from '../../hooks/use_value_metrics';
import { useKibana } from '../../../common/lib/kibana';
import { useAIValueExportContext } from '../../providers/ai_value/export_provider';

interface Props {
  setHasAttackDiscoveries: React.Dispatch<boolean>;
  from: string;
  to: string;
}

export const AIValueReport: React.FC<Props> = (props) => {
  const { setHasAttackDiscoveries } = props;
  const { uiSettings } = useKibana().services;
  const exportContext = useAIValueExportContext();
  const setReportInputForExportContext = exportContext?.setReportInput;

  // When exporting/scheduling, forwardedState can include relative date-math strings
  // (e.g. now-7d, now). Resolve them to a deterministic absolute range for this run.
  const forceNow = useMemo(() => new Date(), []);
  const { from, to } = useMemo(() => {
    if (exportContext?.forwardedState) {
      const { timeRange } = exportContext.forwardedState;
      const fromValue = timeRange.kind === 'absolute' ? timeRange.from : timeRange.fromStr;
      const toValue = timeRange.kind === 'absolute' ? timeRange.to : timeRange.toStr;
      return {
        from: dateMath.parse(fromValue, { forceNow })?.toISOString() ?? fromValue,
        to: dateMath.parse(toValue, { forceNow, roundUp: true })?.toISOString() ?? toValue,
      };
    }
    return {
      from: props.from,
      to: props.to,
    };
  }, [props.from, props.to, exportContext?.forwardedState, forceNow]);

  const { analystHourlyRate, minutesPerAlert } = useMemo(
    () => ({
      minutesPerAlert: uiSettings.get<number>(SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_MINUTES),
      analystHourlyRate: uiSettings.get<number>(SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_RATE),
    }),
    [uiSettings]
  );

  const { attackAlertIds, isLoading, valueMetrics, valueMetricsCompare } = useValueMetrics({
    from,
    to,
    minutesPerAlert,
    analystHourlyRate,
  });

  const hasAttackDiscoveries = useMemo(
    () => valueMetrics.attackDiscoveryCount > 0,
    [valueMetrics.attackDiscoveryCount]
  );

  useEffect(() => {
    if (isLoading || !setReportInputForExportContext) {
      return;
    }
    setReportInputForExportContext({
      attackAlertIds,
      valueMetrics,
      valueMetricsCompare,
      analystHourlyRate,
      minutesPerAlert,
    });
  }, [
    isLoading,
    attackAlertIds,
    valueMetrics,
    valueMetricsCompare,
    analystHourlyRate,
    minutesPerAlert,
    setReportInputForExportContext,
  ]);

  useEffect(() => {
    setHasAttackDiscoveries(hasAttackDiscoveries);
  }, [hasAttackDiscoveries, setHasAttackDiscoveries]);

  const layoutProps = {
    attackAlertIds,
    analystHourlyRate,
    minutesPerAlert,
    isLoading,
    hasAttackDiscoveries,
    from,
    to,
    valueMetrics,
    valueMetricsCompare,
  };

  const showSample = !isLoading && !hasAttackDiscoveries;

  if (showSample) {
    // Sample report branch: will be wired with fixture data and sample viz slots.
    // For now renders the same layout as the live branch.
    return <AIValueReportLayout {...layoutProps} />;
  }

  return <AIValueReportLayout {...layoutProps} />;
};
