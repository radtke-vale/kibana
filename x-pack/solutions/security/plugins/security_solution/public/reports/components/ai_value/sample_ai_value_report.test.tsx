/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { SampleAIValueReport } from './sample_ai_value_report';
import { SampleAttackDiscoveryCta } from './sample_attack_discovery_cta';
import { SampleExecutiveSummary } from './sample_executive_summary';
import { SampleAlertProcessing } from './sample_alert_processing';
import { SampleCostSavingsTrend } from './sample_cost_savings_trend';
import { ValueReportSettings } from './value_report_settings';
import { SAMPLE_ANALYST_HOURLY_RATE, SAMPLE_MINUTES_PER_ALERT } from './sample_data';

jest.mock('./sample_attack_discovery_cta', () => ({
  SampleAttackDiscoveryCta: jest.fn(() => <div data-test-subj="mockAttackDiscoveryCta" />),
}));
jest.mock('./sample_executive_summary', () => ({
  SampleExecutiveSummary: jest.fn(() => <div data-test-subj="mockExecutiveSummary" />),
}));
jest.mock('./sample_alert_processing', () => ({
  SampleAlertProcessing: jest.fn(() => <div data-test-subj="mockAlertProcessing" />),
}));
jest.mock('./sample_cost_savings_trend', () => ({
  SampleCostSavingsTrend: jest.fn(() => <div data-test-subj="mockCostSavingsTrend" />),
}));
jest.mock('./value_report_settings', () => ({
  ValueReportSettings: jest.fn(() => <div data-test-subj="mockValueReportSettings" />),
}));

const mockSampleAttackDiscoveryCta = SampleAttackDiscoveryCta as jest.MockedFunction<
  typeof SampleAttackDiscoveryCta
>;
const mockSampleExecutiveSummary = SampleExecutiveSummary as jest.MockedFunction<
  typeof SampleExecutiveSummary
>;
const mockSampleAlertProcessing = SampleAlertProcessing as jest.MockedFunction<
  typeof SampleAlertProcessing
>;
const mockSampleCostSavingsTrend = SampleCostSavingsTrend as jest.MockedFunction<
  typeof SampleCostSavingsTrend
>;
const mockValueReportSettings = ValueReportSettings as jest.MockedFunction<
  typeof ValueReportSettings
>;

describe('SampleAIValueReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SampleAttackDiscoveryCta', () => {
    render(<SampleAIValueReport />);
    expect(screen.getByTestId('mockAttackDiscoveryCta')).toBeInTheDocument();
  });

  it('renders SampleExecutiveSummary', () => {
    render(<SampleAIValueReport />);
    expect(screen.getByTestId('mockExecutiveSummary')).toBeInTheDocument();
  });

  it('renders SampleAlertProcessing', () => {
    render(<SampleAIValueReport />);
    expect(screen.getByTestId('mockAlertProcessing')).toBeInTheDocument();
  });

  it('renders SampleCostSavingsTrend', () => {
    render(<SampleAIValueReport />);
    expect(screen.getByTestId('mockCostSavingsTrend')).toBeInTheDocument();
  });

  it('renders ValueReportSettings', () => {
    render(<SampleAIValueReport />);
    expect(screen.getByTestId('mockValueReportSettings')).toBeInTheDocument();
  });

  it('passes sample analyst hourly rate to ValueReportSettings', () => {
    render(<SampleAIValueReport />);
    expect(mockValueReportSettings).toHaveBeenCalledWith(
      expect.objectContaining({ analystHourlyRate: SAMPLE_ANALYST_HOURLY_RATE }),
      {}
    );
  });

  it('passes sample minutes per alert to ValueReportSettings', () => {
    render(<SampleAIValueReport />);
    expect(mockValueReportSettings).toHaveBeenCalledWith(
      expect.objectContaining({ minutesPerAlert: SAMPLE_MINUTES_PER_ALERT }),
      {}
    );
  });

  it('renders each child exactly once', () => {
    render(<SampleAIValueReport />);
    expect(mockSampleAttackDiscoveryCta).toHaveBeenCalledTimes(1);
    expect(mockSampleExecutiveSummary).toHaveBeenCalledTimes(1);
    expect(mockSampleAlertProcessing).toHaveBeenCalledTimes(1);
    expect(mockSampleCostSavingsTrend).toHaveBeenCalledTimes(1);
    expect(mockValueReportSettings).toHaveBeenCalledTimes(1);
  });
});
