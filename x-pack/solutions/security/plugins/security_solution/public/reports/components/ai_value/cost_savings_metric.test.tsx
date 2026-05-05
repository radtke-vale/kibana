/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CostSavingsMetric } from './cost_savings_metric';
import { useAIValueExportContext } from '../../providers/ai_value/export_provider';
import { useMetricAnimation } from '../../hooks/use_metric_animation';

jest.mock('../../providers/ai_value/export_provider', () => ({
  useAIValueExportContext: jest.fn(),
}));

jest.mock('../../hooks/use_metric_animation', () => ({
  useMetricAnimation: jest.fn(),
}));

const useAIValueExportContextMock = useAIValueExportContext as jest.Mock;
const useMetricAnimationMock = useMetricAnimation as jest.Mock;

describe('CostSavingsMetric', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAIValueExportContextMock.mockReturnValue(undefined);
  });

  it('renders the metric slot inside the styled container', () => {
    render(<CostSavingsMetric metric={<div data-test-subj="custom-metric-slot" />} />);

    expect(screen.getByTestId('cost-savings-metric-container')).toBeInTheDocument();
    expect(screen.getByTestId('custom-metric-slot')).toBeInTheDocument();
  });

  it('animates the metric when not in export mode', () => {
    render(<CostSavingsMetric metric={<div />} />);
    expect(useMetricAnimationMock).toHaveBeenCalled();
  });

  describe('export mode', () => {
    beforeEach(() => {
      useAIValueExportContextMock.mockReturnValue({ isExportMode: true });
    });

    it('does not animate the component', () => {
      render(<CostSavingsMetric metric={<div />} />);
      expect(useMetricAnimationMock).not.toHaveBeenCalled();
    });
  });
});
