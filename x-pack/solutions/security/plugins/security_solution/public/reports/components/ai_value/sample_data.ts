/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ValueMetrics } from './metrics';

export const SAMPLE_VALUE_METRICS: ValueMetrics = {
  attackDiscoveryCount: 12,
  filteredAlerts: 1847,
  filteredAlertsPerc: 92.35,
  escalatedAlertsPerc: 7.65,
  hoursSaved: 166.5,
  totalAlerts: 2000,
  costSavings: 8325,
};

export const SAMPLE_VALUE_METRICS_COMPARE: ValueMetrics = {
  attackDiscoveryCount: 9,
  filteredAlerts: 1200,
  filteredAlertsPerc: 88.0,
  escalatedAlertsPerc: 12.0,
  hoursSaved: 120,
  totalAlerts: 1363,
  costSavings: 6000,
};

export const SAMPLE_MINUTES_PER_ALERT = 5;
export const SAMPLE_ANALYST_HOURLY_RATE = 50;
export const SAMPLE_FROM = '2026-03-17T00:00:00.000Z';
export const SAMPLE_TO = '2026-04-16T23:59:59.999Z';
