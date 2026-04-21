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

const SAMPLE_TREND_START_TIMESTAMP = new Date(SAMPLE_FROM).getTime();
export const SAMPLE_INTERVAL_HOURS = 12;
const TWELVE_HOURS_MS = SAMPLE_INTERVAL_HOURS * 60 * 60 * 1000;

const SAMPLE_TREND_COST_SAVINGS = [
  401, 485, 559, 491, 456, 510, 471, 488, 369, 315, 210, 200, 271, 367, 375, 331, 397, 469, 600,
  600, 486, 405, 370, 344, 377, 281, 231, 121, 244, 370, 473, 464, 503, 455, 521, 541, 503, 415,
  327, 236, 307, 278, 280, 277, 320, 397, 496, 563, 586, 530, 468, 450, 445, 400, 318, 205, 148,
  290, 371, 403, 425, 412,
] as const;

export const SAMPLE_TREND_DATA = SAMPLE_TREND_COST_SAVINGS.map((costSavings, index) => ({
  timestamp: SAMPLE_TREND_START_TIMESTAMP + index * TWELVE_HOURS_MS,
  costSavings,
}));

// Key insight descriptive values — derived from SAMPLE_TREND_COST_SAVINGS above.
// Update these if the trend data changes.
export const SAMPLE_KEY_INSIGHT_AVERAGED_COST = '$400';
export const SAMPLE_KEY_INSIGHT_COST_RANGE = '$450\u2013$600';
export const SAMPLE_KEY_INSIGHT_PROJECTED_ANNUAL_SAVINGS = '$200K';
