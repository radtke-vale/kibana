# Sample Value Report — Implementation Plan

## Architecture Decision: How to render charts without Elasticsearch data

The real report renders 6 Lens embeddable visualizations (`VisualizationEmbeddable`) that query Elasticsearch. For the sample report, **create static replacements using `@elastic/charts` directly and `EuiStat`/`EuiPanel`**. This is the right approach because:

- `@elastic/charts` is what Lens renders under the hood — visual parity is high
- There's already a reusable `DonutChart` component in the codebase (`detection_engine/rule_monitoring_ui/components/donut_chart.tsx`) using the same pattern
- No Elasticsearch dependency — works with zero data
- Zero impact on existing live report code

**Components that CAN be reused directly** (they accept primitive props, no Lens/ES dependency):
- `AlertsProcessingTable` — takes numbers/strings
- `AlertProcessingKeyInsight` — takes `ValueMetrics`
- `ComparePercentage` / `ComparePercentageBadge` — takes numbers (use with `positionForLens={false}`)
- `ValueReportSettings` — takes rates

**Components that need static replacements** (internally use Lens or LLM):
- `CostSavingsMetric`, `TimeSavedMetric`, `AlertFilteringMetric`, `ThreatsDetectedMetric` — all 4 KPI cards
- `AlertProcessingDonut` — Lens donut chart
- The area chart inside `CostSavingsTrend` — Lens area chart
- `CostSavingsKeyInsight` — calls an LLM

---

## Step 0: Setup & Orientation

- [ ] **0.1** Run `yarn kbn bootstrap` to install dependencies
- [ ] **0.2** Start Kibana locally and navigate to the Value Report page to see the current empty state
- [ ] **0.3** Read these files to understand the existing structure:
  - `reports/components/ai_value/index.tsx` — main orchestrator, controls what renders based on `hasAttackDiscoveries`
  - `reports/components/ai_value/executive_summary_empty_state.tsx` — where the sample report will be placed (at the `{/* -- PLACEHOLDER --*/}` comment)
  - `reports/components/ai_value/metrics.ts` — `ValueMetrics` type definition and utility functions

---

## Step 1: Create sample data constants

- [ ] **1.1** Create file: `reports/components/ai_value/sample/sample_data.ts`
- [ ] **1.2** Define and export a `SAMPLE_METRICS` constant of type `ValueMetrics` with realistic non-zero values. Example values: `attackDiscoveryCount: 23`, `totalAlerts: 1250`, `filteredAlerts: 1150`, `filteredAlertsPerc: 92.0`, `escalatedAlertsPerc: 8.0`, `hoursSaved: 208`, `costSavings: 12500`. Pick values where the math is internally consistent (e.g. `filteredAlerts = totalAlerts - escalatedAlerts`, `costSavings = hoursSaved * analystHourlyRate`).
- [ ] **1.3** Define and export a `SAMPLE_METRICS_COMPARE` constant (previous period) with slightly lower values, so the comparison badges show a positive trend. Example: `costSavings: 10000`, `hoursSaved: 167`, `filteredAlertsPerc: 89.0`, `attackDiscoveryCount: 18`.
- [ ] **1.4** Define and export `SAMPLE_ANALYST_HOURLY_RATE` (e.g., `60`) and `SAMPLE_MINUTES_PER_ALERT` (e.g., `10`) — these are the same defaults the real report uses.
- [ ] **1.5** Define and export `SAMPLE_ATTACK_ALERT_IDS` as an empty array `[]` (needed by reusable components but irrelevant for static rendering).
- [ ] **1.6** Define and export a `SAMPLE_COST_SAVINGS_INSIGHT` string constant with realistic-looking markdown text summarizing a cost savings trend (2-3 sentences, e.g., "Cost savings have increased by 25% compared to the previous period...").
- [ ] **1.7** Define and export `SAMPLE_TREND_DATA` — an array of `{ date: number; value: number }` objects (8-12 data points) representing a cost savings trend over time. Use timestamps for x-axis and dollar values for y-axis that show a generally upward trend with natural variation.
- [ ] **1.8** Define and export `SAMPLE_DONUT_DATA` — array of `{ label: string; value: number }` for the donut slices: `[{ label: 'AI filtered', value: 1150 }, { label: 'Escalated', value: 100 }]`.
- [ ] **1.9** Define and export `SAMPLE_FROM` and `SAMPLE_TO` date strings representing a sample time range (e.g., 30 days ending today). These are used for display text like "1 Apr 2026 - 30 Apr 2026".

---

## Step 2: Create a static metric card component

The real report uses Lens `VisualizationEmbeddable` for each KPI card. You need one generic static replacement that all 4 cards can share.

- [ ] **2.1** Create file: `reports/components/ai_value/sample/sample_metric_card.tsx`
- [ ] **2.2** Create a `SampleMetricCard` component with props: `title: string`, `value: string`, `color?: string` (optional, for the cost savings green card), `icon?: string` (EUI icon type)
- [ ] **2.3** Render using `EuiPanel` + `EuiStat` (from `@elastic/eui`). The `title` prop of `EuiStat` is the big number (e.g., "$12,500"), and `description` is the label (e.g., "Cost savings"). Style the panel to match the existing card height (`min-height: 140px` for the main card, `min-height: 160px` for the 3 smaller cards)
- [ ] **2.4** For the **Cost Savings** card specifically: apply a green border (`border: 1px solid ${colors.success}`) and green text color on the value, matching the styling in `cost_savings_metric.tsx:86-96`. Use `EuiPanel` with `hasBorder` and `hasShadow={false}` to match the existing `CostSavings` component
- [ ] **2.5** For the other 3 cards (Time Saved, Filtering Rate, Threats Detected): use a plain `EuiPanel` without special border colors

---

## Step 3: Create a static donut chart component

- [ ] **3.1** Create file: `reports/components/ai_value/sample/sample_donut.tsx`
- [ ] **3.2** Reference the existing `DonutChart` pattern at `detection_engine/rule_monitoring_ui/components/donut_chart.tsx` — it shows exactly how to build a donut with `@elastic/charts` `Partition` + `PartitionLayout.sunburst`
- [ ] **3.3** Create a `SampleAlertProcessingDonut` component. Import `Chart`, `Partition`, `PartitionLayout`, `Settings`, `INPUT_KEY` from `@elastic/charts` and `useElasticChartsTheme` from `@kbn/charts-theme`
- [ ] **3.4** Render a donut chart using `SAMPLE_DONUT_DATA` with height 250px. Use `euiTheme.colors.vis.euiColorVis0` for "AI filtered" and `euiTheme.colors.vis.euiColorVis9` for "Escalated" — these are the same colors used by `AlertsProcessingTable`
- [ ] **3.5** Add a centered label showing the total count and "Total alerts processed" text (matching the real donut's center label)

---

## Step 4: Create a static area chart component

- [ ] **4.1** Create file: `reports/components/ai_value/sample/sample_area_chart.tsx`
- [ ] **4.2** Create a `SampleCostSavingsTrendChart` component. Import `Chart`, `AreaSeries`, `Axis`, `Settings` from `@elastic/charts` and `useElasticChartsTheme` from `@kbn/charts-theme`
- [ ] **4.3** Render an area chart using `SAMPLE_TREND_DATA` with height 300px (matching the real chart). Use `timeFormatter` for the x-axis and dollar formatting for the y-axis
- [ ] **4.4** Apply the same transparent background CSS hack from `cost_savings_trend.tsx:87-93` so the chart background matches the page

---

## Step 5: Create a static cost savings key insight

- [ ] **5.1** Create file: `reports/components/ai_value/sample/sample_cost_savings_key_insight.tsx`
- [ ] **5.2** Create a `SampleCostSavingsKeyInsight` component that renders the same gradient box layout as `CostSavingsKeyInsightView` in `cost_savings_key_insight.tsx:88-160` (the Elastic logo + "Key Insight" title + content)
- [ ] **5.3** Render `SAMPLE_COST_SAVINGS_INSIGHT` as the insight body text. Use `EuiText` with `size="s"` and `color="subdued"` matching the existing styling. Do NOT use the `Markdown` component — since the sample insight is controlled by you, plain `EuiText` is simpler

---

## Step 6: Assemble the SampleValueReport component

This is the main component that composes all sections to look like the full report.

- [ ] **6.1** Create file: `reports/components/ai_value/sample/index.tsx`
- [ ] **6.2** Create a `SampleValueReport` component that mirrors the layout of `AIValueMetrics` (`index.tsx`) and `ExecutiveSummary` (`executive_summary.tsx`)
- [ ] **6.3** **Title section**: Render a non-editable `EuiTitle` (size "l", heading "h1") with a hardcoded title string (e.g., the default from `SECURITY_SOLUTION_DEFAULT_VALUE_REPORT_TITLE`). Below it, render the date range subtitle using `SAMPLE_FROM` and `SAMPLE_TO` formatted the same way as `executive_summary.tsx:77-90`
- [ ] **6.4** **Executive summary text**: Render the same i18n text structure as `executive_summary.tsx:145-165`, passing sample values through the translation functions (`i18n.EXECUTIVE_SUMMARY_SUBTITLE`, `i18n.EXECUTIVE_SAVINGS_SUMMARY`, `i18n.EXECUTIVE_SUMMARY_MAIN_TEXT`, `i18n.EXECUTIVE_SUMMARY_SECONDARY_TEXT`)
- [ ] **6.5** **Cost Savings KPI card** (right side): Render `SampleMetricCard` with green styling + `ComparePercentageBadge` with `positionForLens={false}` using `SAMPLE_METRICS.costSavings` and `SAMPLE_METRICS_COMPARE.costSavings`
- [ ] **6.6** **3 bottom KPI cards** (Time Saved, Filtering Rate, Threats Detected): Render each as `SampleMetricCard` + `ComparePercentage` with `positionForLens={false}`, in a `EuiFlexGroup` row matching `executive_summary.tsx:197-241`
- [ ] **6.7** **Horizontal rule** matching the pattern in `index.tsx:128-130`
- [ ] **6.8** **Alert Processing section**: Render with the same layout as `alert_processing.tsx:39-78`:
  - Left side: `SampleAlertProcessingDonut` (from Step 3) + reuse `AlertsProcessingTable` directly, passing it sample values (`isLoading={false}`, sample counts and percentages from `SAMPLE_METRICS`)
  - Right side: reuse `AlertProcessingKeyInsight` directly, passing `isLoading={false}` and `SAMPLE_METRICS`
- [ ] **6.9** **Horizontal rule + Value Report Settings**: Reuse `ValueReportSettings` directly with `SAMPLE_MINUTES_PER_ALERT` and `SAMPLE_ANALYST_HOURLY_RATE`
- [ ] **6.10** **Cost Savings Trend section**: Render with the same layout as `cost_savings_trend.tsx:82-131`:
  - Left side: `SampleCostSavingsTrendChart` (from Step 4)
  - Right side: `SampleCostSavingsKeyInsight` (from Step 5)
- [ ] **6.11** **Horizontal rule + Value Report Settings** (second instance, matching the real report structure in `index.tsx:153-174`)
- [ ] **6.12** Apply an **opacity/muted visual treatment** to the entire sample report (e.g., `opacity: 0.6` or a light overlay) to visually distinguish it from a real report. This is optional — check with design whether needed.

---

## Step 7: Wire into ExecutiveSummaryEmptyState

- [ ] **7.1** Edit `reports/components/ai_value/executive_summary_empty_state.tsx`
- [ ] **7.2** Import the `SampleValueReport` component from `./sample`
- [ ] **7.3** Replace the placeholder comment `{/* -- PLACEHOLDER FOR THE REPORT WITH STABBED DATA--*/}` with `<SampleValueReport />`
- [ ] **7.4** Verify the empty state banner ("No attacks detected yet") still renders above the sample report

---

## Step 8: Disable the export button when showing sample data

- [ ] **8.1** Edit `reports/pages/ai_value.tsx`
- [ ] **8.2** The export button is already conditionally rendered: `...(hasAttackDiscoveries ? [exportButton] : [])` at line 139. This means it's already **hidden** when there are no attack discoveries. If the requirement is to show the button but disabled (grayed out), change this to always include the button but pass `isDisabled={!hasAttackDiscoveries}` to the `EuiButtonEmpty` components (lines 85 and 94). If hiding it entirely is acceptable, no change is needed here — confirm with the design.

---

## Step 9: Add i18n translations

- [ ] **9.1** Add any new user-facing strings to `reports/components/ai_value/translations.ts` using the `i18n.translate()` pattern. Candidates:
  - Sample report section title (if different from the real report)
  - Any labels specific to the sample state (e.g., if there's a "Sample data" badge)
- [ ] **9.2** Run `node scripts/i18n_check --fix` to validate translations

---

## Step 10: Write tests

- [ ] **10.1** Create `reports/components/ai_value/sample/index.test.tsx` — test that `SampleValueReport` renders without crashing, displays the expected sample metric values, and renders all sections (executive summary, alert processing, cost savings trend, settings)
- [ ] **10.2** Create `reports/components/ai_value/sample/sample_metric_card.test.tsx` — test that it renders the value and title correctly
- [ ] **10.3** Update `reports/components/ai_value/executive_summary_empty_state.test.tsx` (if it exists) — verify the sample report renders within the empty state
- [ ] **10.4** Run tests: `node scripts/jest x-pack/solutions/security/plugins/security_solution/public/reports/components/ai_value/sample/`

---

## Step 11: Validate

- [ ] **11.1** Run `node scripts/check_changes.ts`
- [ ] **11.2** Run type check scoped to the plugin: `node scripts/type_check --project x-pack/solutions/security/plugins/security_solution/tsconfig.json`
- [ ] **11.3** Run lint on changed files: `node scripts/eslint --fix $(git diff --name-only)`
- [ ] **11.4** Run `node scripts/i18n_check --fix`
- [ ] **11.5** Visually verify in the browser: navigate to the Value Report page with no attack discovery data. Confirm you see the "No attacks detected yet" banner followed by the full sample report with all sections populated.

---

## File summary

| File | Action |
|---|---|
| `reports/components/ai_value/sample/sample_data.ts` | **New** — sample constants |
| `reports/components/ai_value/sample/sample_metric_card.tsx` | **New** — static metric card |
| `reports/components/ai_value/sample/sample_donut.tsx` | **New** — static donut chart |
| `reports/components/ai_value/sample/sample_area_chart.tsx` | **New** — static area chart |
| `reports/components/ai_value/sample/sample_cost_savings_key_insight.tsx` | **New** — static LLM insight |
| `reports/components/ai_value/sample/index.tsx` | **New** — SampleValueReport assembler |
| `reports/components/ai_value/executive_summary_empty_state.tsx` | **Edit** — plug in SampleValueReport |
| `reports/pages/ai_value.tsx` | **Edit** — disable export button (if needed) |
| `reports/components/ai_value/translations.ts` | **Edit** — add sample-specific strings |
| Test files | **New** — unit tests for sample components |

---

## Key pitfalls to watch for

1. **`positionForLens` must be `false`** — the compare badge components have a CSS hack (`top: -55px`) to overlay on Lens metrics. Since your static cards aren't Lens, use the default `false` positioning or the badge will float above your card
2. **Import paths** — use relative imports within the `sample/` directory. When importing from the parent directory, use `../` (e.g., `import { ValueMetrics } from '../metrics'`)
3. **`@elastic/charts` theme** — always pass `useElasticChartsTheme()` as `baseTheme` to `Settings`, otherwise charts will look off in dark mode
4. **All text must use i18n** — no hardcoded English strings in JSX except in the `sample_data.ts` constants file (insight text is fine as a constant since it's sample data)
5. **File names must be `snake_case`** per the Kibana code guidelines
