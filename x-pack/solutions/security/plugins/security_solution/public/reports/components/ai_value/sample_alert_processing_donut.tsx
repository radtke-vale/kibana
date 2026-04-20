/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';

import { css } from '@emotion/react';
import { useEuiTheme } from '@elastic/eui';
import { Settings, Chart, Partition, PartitionLayout } from '@elastic/charts';
import { i18n as i18nLib } from '@kbn/i18n';
import { useThemes } from '../../../common/components/charts/common';
import { ChartLabel } from '../../../overview/components/detection_response/alerts_by_status/chart_label';
import * as i18n from './translations';
import { DonutChartWrapper } from '../../../common/components/charts/donutchart';

const ChartSize = 250;
interface Props {
  filteredAlerts: number;
  escalatedAlerts: number;
  totalAlerts: number;
}
export const SampleAlertProcessingDonut: React.FC<Props> = ({
  filteredAlerts,
  escalatedAlerts,
  totalAlerts,
}) => {
  const {
    euiTheme: { colors, font },
  } = useEuiTheme();
  const { baseTheme, theme } = useThemes();
  const data = [
    { key: i18n.AI_FILTERED, value: filteredAlerts },
    { key: i18n.ESCALATED, value: escalatedAlerts },
  ];
  const fillColor = useCallback(
    (dataName: string) => {
      if (dataName === i18n.AI_FILTERED) return colors.vis.euiColorVis0;
      if (dataName === i18n.ESCALATED) return colors.vis.euiColorVis9;
      return colors.textSubdued; // fallback
    },
    [colors]
  );

  const donutTheme = {
    chartMargins: { top: 0, bottom: 0, left: 0, right: 0 },
    partition: {
      idealFontSizeJump: 1.1,
      outerSizeRatio: 1,
      emptySizeRatio: 0.8,
      circlePadding: 4,
    },
  };

  return (
    <div
      className="donutChart"
      css={css`
        // hide filtering actions in the legend
        .echLegendItem__action {
          display: none;
        }
        .donutText {
          text-align: center;
          top: 44% !important;
          max-width: 100% !important;
          .donutTitleLabel {
            font-size: ${font.scale.m}em;
          }
          b {
            font-size: ${font.scale.xl}em;
          }
        }
        .euiPanel,
        .embPanel,
        .echMetric,
        .echChartBackground,
        .embPanel__hoverActions > span {
          background-color: rgb(0, 0, 0, 0) !important;
        }
        .donutChart .euiPanel {
          background-color: rgb(255, 255, 255, 0);
        }
      `}
    >
      <DonutChartWrapper
        isChartEmbeddablesEnabled={true}
        dataExists={true}
        title={
          <>
            <span className="donutTitleLabel">{i18n.TOTAL_ALERTS_PROCESSED}</span>
            <ChartLabel count={totalAlerts} />
          </>
        }
        donutTextWrapperClassName="donutText"
      >
        <Chart size={ChartSize}>
          <Settings
            theme={[donutTheme, { background: { color: 'transparent' } }, theme]}
            baseTheme={baseTheme}
            locale={i18nLib.getLocale()}
          />
          <Partition
            id="sample-donut-chart"
            data={data}
            layout={PartitionLayout.sunburst}
            valueAccessor={(d) => d.value}
            layers={[
              {
                groupByRollup: (d) => d.key,
                nodeLabel: (d) => d,
                shape: { fillColor },
              },
            ]}
          />
        </Chart>
      </DonutChartWrapper>
    </div>
  );
};
