/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimeSavedMetric } from './time_saved_metric';

jest.mock('../../providers/ai_value/export_provider', () => ({
  useAIValueExportContext: jest.fn(() => undefined),
}));

describe('TimeSavedMetric', () => {
  it('renders the metric slot inside the styled container', () => {
    render(<TimeSavedMetric metric={<div data-test-subj="custom-metric-slot" />} />);

    expect(screen.getByTestId('time-saved-metric-container')).toBeInTheDocument();
    expect(screen.getByTestId('custom-metric-slot')).toBeInTheDocument();
  });
});
