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
import { LiveTimeSavedMetric } from './live_time_saved_metric';
import { SampleTimeSavedMetric } from './sample_time_saved_metric';
import { LiveAlertFilteringMetric } from './live_alert_filtering_metric';
import { SampleAlertFilteringMetric } from './sample_alert_filtering_metric';
import { LiveThreatsDetectedMetric } from './live_threats_detected_metric';
import { SampleThreatsDetectedMetric } from './sample_threats_detected_metric';
import { LiveCostSavingsMetric } from './live_cost_savings_metric';
import { SampleCostSavingsMetric } from './sample_cost_savings_metric';
import { PageLoader } from '../../../common/components/page_loader';
import {
  SAMPLE_ANALYST_HOURLY_RATE,
  SAMPLE_MINUTES_PER_ALERT,
  SAMPLE_VALUE_METRICS,
  SAMPLE_VALUE_METRICS_COMPARE,
} from './sample_data';

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

  if (isLoading) {
    return <PageLoader />;
  }

  if (hasAttackDiscoveries) {
    return (
      <AIValueReportLayout
        attackAlertIds={attackAlertIds}
        analystHourlyRate={analystHourlyRate}
        minutesPerAlert={minutesPerAlert}
        hasAttackDiscoveries
        from={from}
        to={to}
        valueMetrics={valueMetrics}
        valueMetricsCompare={valueMetricsCompare}
        timeSavedMetric={
          <LiveTimeSavedMetric from={from} to={to} minutesPerAlert={minutesPerAlert} />
        }
        filteringRateMetric={
          <LiveAlertFilteringMetric
            attackAlertIds={attackAlertIds}
            from={from}
            to={to}
            totalAlerts={valueMetrics.totalAlerts}
          />
        }
        threatsDetectedMetric={<LiveThreatsDetectedMetric from={from} to={to} />}
        costSavingsMetric={
          <LiveCostSavingsMetric
            from={from}
            to={to}
            minutesPerAlert={minutesPerAlert}
            analystHourlyRate={analystHourlyRate}
          />
        }
      />
    );
  }

  return (
    <AIValueReportLayout
      attackAlertIds={[]}
      analystHourlyRate={SAMPLE_ANALYST_HOURLY_RATE}
      minutesPerAlert={SAMPLE_MINUTES_PER_ALERT}
      hasAttackDiscoveries={false}
      from={from}
      to={to}
      valueMetrics={SAMPLE_VALUE_METRICS}
      valueMetricsCompare={SAMPLE_VALUE_METRICS_COMPARE}
      timeSavedMetric={<SampleTimeSavedMetric />}
      filteringRateMetric={<SampleAlertFilteringMetric />}
      threatsDetectedMetric={<SampleThreatsDetectedMetric />}
      costSavingsMetric={<SampleCostSavingsMetric />}
    />
  );
};
