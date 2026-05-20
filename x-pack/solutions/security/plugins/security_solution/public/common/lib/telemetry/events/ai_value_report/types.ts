/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { RootSchema } from '@kbn/core/public';

export enum AIValueReportEventTypes {
  AIValueReportExportExecution = 'AI Value Report Export Execution',
  AIValueReportExportError = 'AI Value Report Export Error',
  AIValueReportExportInsightVerified = 'AI Value Report Export Insight Regenerated',
  AIValueReportUpsellBannerViewed = 'AI Value Report Upsell Banner Viewed',
  AIValueReportUpsellCtaClicked = 'AI Value Report Upsell CTA Clicked',
}

interface ReportAIValueReportExportErrorParams {
  errorMessage: string;
  isExportMode: boolean;
}

interface ReportAIValueReportExportInsightVerifiedParams {
  shouldRegenerate: boolean;
}

export type UpsellDestination = 'cloud_project' | 'pricing_page';

interface ReportAIValueReportUpsellBannerViewedParams {
  productTier: 'essentials';
}

interface ReportAIValueReportUpsellCtaClickedParams {
  productTier: 'essentials';
  destination: UpsellDestination;
}

export interface AIValueReportTelemetryEventsMap {
  [AIValueReportEventTypes.AIValueReportExportExecution]: {};
  [AIValueReportEventTypes.AIValueReportExportError]: ReportAIValueReportExportErrorParams;
  [AIValueReportEventTypes.AIValueReportExportInsightVerified]: ReportAIValueReportExportInsightVerifiedParams;
  [AIValueReportEventTypes.AIValueReportUpsellBannerViewed]: ReportAIValueReportUpsellBannerViewedParams;
  [AIValueReportEventTypes.AIValueReportUpsellCtaClicked]: ReportAIValueReportUpsellCtaClickedParams;
}

export interface AIValueReportTelemetryEvent {
  eventType: AIValueReportEventTypes;
  schema: RootSchema<AIValueReportTelemetryEventsMap[AIValueReportEventTypes]>;
}
