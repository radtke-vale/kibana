/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradePlanBanner } from './upgrade_plan_banner';
import { useKibana } from '../../../common/lib/kibana';
import { AIValueReportEventTypes } from '../../../common/lib/telemetry/events/ai_value_report/types';

jest.mock('../../../common/lib/kibana', () => ({
  useKibana: jest.fn(),
}));

const mockUseKibana = useKibana as jest.Mock;

const buildServices = ({
  projectsUrl,
  reportEvent = jest.fn(),
}: {
  projectsUrl?: string;
  reportEvent?: jest.Mock;
} = {}) => ({
  services: {
    cloud: projectsUrl ? { projectsUrl } : undefined,
    telemetry: { reportEvent },
  },
});

describe('UpgradePlanBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the upgrade title, body text and CTA button', () => {
    mockUseKibana.mockReturnValue(buildServices({ projectsUrl: 'https://cloud.example/projects' }));

    render(<UpgradePlanBanner />);

    expect(screen.getByTestId('aiValueUpgradePlanBanner')).toBeInTheDocument();
    expect(screen.getByText('Value Reports is available on the Complete plan')).toBeInTheDocument();
    expect(
      screen.getByText(
        'See how much time and money AI triage save your team, analyst hours reclaimed, costs reduced and real threats surfaced. Available on the Complete plan.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('aiValueUpgradePlanButton')).toBeInTheDocument();
  });

  it('uses cloud.projectsUrl when available and opens in a new tab', () => {
    mockUseKibana.mockReturnValue(buildServices({ projectsUrl: 'https://cloud.example/projects' }));

    render(<UpgradePlanBanner />);

    const button = screen.getByTestId('aiValueUpgradePlanButton');
    expect(button).toHaveAttribute('href', 'https://cloud.example/projects');
    expect(button).toHaveAttribute('target', '_blank');
    expect(button).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('falls back to the public pricing page when cloud.projectsUrl is unavailable', () => {
    mockUseKibana.mockReturnValue(buildServices({ projectsUrl: undefined }));

    render(<UpgradePlanBanner />);

    expect(screen.getByTestId('aiValueUpgradePlanButton')).toHaveAttribute(
      'href',
      'https://www.elastic.co/pricing/'
    );
  });

  it('reports a banner-viewed telemetry event once on mount', () => {
    const reportEvent = jest.fn();
    mockUseKibana.mockReturnValue(
      buildServices({ projectsUrl: 'https://cloud.example/projects', reportEvent })
    );

    const { rerender } = render(<UpgradePlanBanner />);
    rerender(<UpgradePlanBanner />);

    const viewedCalls = reportEvent.mock.calls.filter(
      ([eventType]) => eventType === AIValueReportEventTypes.AIValueReportUpsellBannerViewed
    );
    expect(viewedCalls).toHaveLength(1);
    expect(viewedCalls[0][1]).toEqual({ productTier: 'essentials' });
  });

  it('reports a CTA-clicked telemetry event with cloud_project destination', () => {
    const reportEvent = jest.fn();
    mockUseKibana.mockReturnValue(
      buildServices({ projectsUrl: 'https://cloud.example/projects', reportEvent })
    );

    render(<UpgradePlanBanner />);
    fireEvent.click(screen.getByTestId('aiValueUpgradePlanButton'));

    expect(reportEvent).toHaveBeenCalledWith(
      AIValueReportEventTypes.AIValueReportUpsellCtaClicked,
      { productTier: 'essentials', destination: 'cloud_project' }
    );
  });

  it('reports the pricing_page destination when no cloud URL is available', () => {
    const reportEvent = jest.fn();
    mockUseKibana.mockReturnValue(buildServices({ projectsUrl: undefined, reportEvent }));

    render(<UpgradePlanBanner />);
    fireEvent.click(screen.getByTestId('aiValueUpgradePlanButton'));

    expect(reportEvent).toHaveBeenCalledWith(
      AIValueReportEventTypes.AIValueReportUpsellCtaClicked,
      { productTier: 'essentials', destination: 'pricing_page' }
    );
  });
});
