/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PassThrough } from 'stream';
import type {
  IRouter,
  CoreSetup,
  CoreStart,
  Logger,
  KibanaRequest,
  ElasticsearchClient,
} from '@kbn/core/server';
import type { SecurityPlaygroundStartPlugins } from '../types';
import {
  PROVISION_ROUTE,
  SPACE_ID,
  SPACE_NAME,
  SAMPLE_TAG,
  PINNED_RULE_IDS,
  KILL_CHAIN_PHASES,
  EVENT_INDICES,
} from '../../common/constants';
import { generateRansomwareKillChainPhases } from '../lib/scenarios/ransomware_kill_chain';

// ---------------------------------------------------------------------------
// Rule definitions — one per pinned UUID
// ---------------------------------------------------------------------------

const RANSOMWARE_RULES = [
  {
    id: PINNED_RULE_IDS.MACRO_EXEC,
    name: 'Suspicious Macro-Enabled Document Execution',
    query: 'process.parent.name: "WINWORD.EXE" and process.name: "cmd.exe"',
    severity: 'medium',
    riskScore: 55,
    index: [EVENT_INDICES.process],
    mitreTacticId: 'TA0001',
    mitreTacticName: 'Initial Access',
    mitreTechId: 'T1566.001',
    mitreTechName: 'Spearphishing Attachment',
  },
  {
    id: PINNED_RULE_IDS.C2_BEACON,
    name: 'Cobalt Strike Beacon - Periodic C2 Communication',
    query: 'process.name: "rundll32.exe" and destination.port: (443 or 8443)',
    severity: 'high',
    riskScore: 82,
    index: [EVENT_INDICES.network],
    mitreTacticId: 'TA0011',
    mitreTacticName: 'Command and Control',
    mitreTechId: 'T1071.001',
    mitreTechName: 'Web Protocols',
  },
  {
    id: PINNED_RULE_IDS.DOMAIN_ENUM,
    name: 'Enumeration of Domain Admin Group',
    query: 'process.name: "net.exe" and process.args: "Domain Admins"',
    severity: 'medium',
    riskScore: 47,
    index: [EVENT_INDICES.process],
    mitreTacticId: 'TA0007',
    mitreTacticName: 'Discovery',
    mitreTechId: 'T1069.002',
    mitreTechName: 'Domain Groups',
  },
  {
    id: PINNED_RULE_IDS.CRED_DUMP,
    name: 'Credential Dumping - LSASS Access on Domain Controller',
    query: 'process.name: "mimikatz.exe" and host.name: "SRV-DC*"',
    severity: 'critical',
    riskScore: 95,
    index: [EVENT_INDICES.process],
    mitreTacticId: 'TA0006',
    mitreTacticName: 'Credential Access',
    mitreTechId: 'T1003.001',
    mitreTechName: 'LSASS Memory',
  },
  {
    id: PINNED_RULE_IDS.MASS_ENCRYPT,
    name: 'Ransomware - Mass File Extension Modification',
    query: 'file.extension: "locked" and event.action: "modification"',
    severity: 'critical',
    riskScore: 99,
    index: [EVENT_INDICES.file],
    mitreTacticId: 'TA0040',
    mitreTacticName: 'Impact',
    mitreTechId: 'T1486',
    mitreTechName: 'Data Encrypted for Impact',
  },
  {
    id: PINNED_RULE_IDS.VSS_DELETE,
    name: 'Ransomware - Volume Shadow Copy Deletion',
    query: 'process.name: "vssadmin.exe" and process.args: "delete"',
    severity: 'critical',
    riskScore: 97,
    index: [EVENT_INDICES.process],
    mitreTacticId: 'TA0040',
    mitreTacticName: 'Impact',
    mitreTechId: 'T1490',
    mitreTechName: 'Inhibit System Recovery',
  },
  {
    id: PINNED_RULE_IDS.LATERAL_MOVE,
    name: 'Lateral Movement via PsExec to Multiple Hosts',
    query: 'process.name: "PsExec.exe"',
    severity: 'high',
    riskScore: 85,
    index: [EVENT_INDICES.process],
    mitreTacticId: 'TA0008',
    mitreTacticName: 'Lateral Movement',
    mitreTechId: 'T1570',
    mitreTechName: 'Lateral Tool Transfer',
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emit = (stream: PassThrough, obj: Record<string, unknown>) => {
  stream.write(JSON.stringify(obj) + '\n');
};

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export const registerProvisionRoutes = (
  router: IRouter,
  core: CoreSetup<SecurityPlaygroundStartPlugins>,
  logger: Logger,
  kibanaVersion: string
) => {
  // POST /internal/security_playground/provision — streams NDJSON progress
  router.post(
    {
      path: PROVISION_ROUTE,
      validate: false,
      security: {
        authz: { enabled: false, reason: 'PoC route — auth handled at the Kibana session layer' },
      },
      options: { access: 'internal' },
    },
    async (context, request, response) => {
      const stream = new PassThrough();

      // Capture the user-scoped ES client before returning the response so it
      // stays valid throughout the async provisioning (the stream keeps the
      // request alive until stream.end()). Using asCurrentUser (admin session)
      // instead of asInternalUser so we can write to Fleet-managed data streams.
      const { elasticsearch } = await context.core;
      const currentUserEsClient = elasticsearch.client.asCurrentUser;

      // Run provision asynchronously and pipe progress onto the stream.
      // Do NOT await — let the stream carry the progress.
      provisionAsync(stream, core, request, currentUserEsClient, logger, kibanaVersion).catch(
        (err: Error) => {
          logger.error(`Provision failed: ${err.message}`);
          try {
            emit(stream, { phase: 'error', status: 'error', message: err.message });
          } finally {
            stream.end();
          }
        }
      );

      return response.ok({
        body: stream,
        headers: { 'content-type': 'application/x-ndjson' },
      });
    }
  );

  // DELETE /internal/security_playground/provision — cleanup
  router.delete(
    {
      path: PROVISION_ROUTE,
      validate: false,
      security: {
        authz: { enabled: false, reason: 'PoC route — auth handled at the Kibana session layer' },
      },
      options: { access: 'internal' },
    },
    async (context, request, response) => {
      try {
        const [, plugins] = await core.getStartServices();
        const { elasticsearch } = await context.core;
        const esClient = elasticsearch.client.asCurrentUser;
        const spacesClient = plugins.spaces.spacesService.createSpacesClient(request);

        // 1. Delete the space (cascades rules + alert SOs in namespace)
        try {
          await spacesClient.delete(SPACE_ID);
        } catch (err: unknown) {
          if ((err as { output?: { statusCode?: number } }).output?.statusCode !== 404) {
            throw err;
          }
          // Space already gone — continue to clean up raw events
        }

        // 2. Delete the space-scoped raw event data streams entirely.
        // They contain only sample data by construction, so dropping the stream
        // is simpler and faster than deleteByQuery.
        for (const stream of Object.values(EVENT_INDICES)) {
          try {
            await esClient.indices.deleteDataStream({ name: stream });
          } catch {
            // 404 = stream never created or already deleted — fine
          }
        }

        // 3. Safety net: delete any orphan alert docs in the space alerts index
        // (space.delete above should have already removed this index, but belt+suspenders)
        try {
          await esClient.deleteByQuery({
            index: `.alerts-security.alerts-${SPACE_ID}`,
            query: { term: { tags: SAMPLE_TAG } },
            conflicts: 'proceed',
          });
        } catch {
          // Index already gone
        }

        // 4. Delete per-stream index templates.
        for (const streamName of Object.values(EVENT_INDICES)) {
          const shortName = streamName.replace('sample-data-', '');
          try {
            await esClient.indices.deleteIndexTemplate({
              name: `sample-data-${shortName}@template`,
            });
          } catch {
            // 404 = never created or already deleted
          }
        }

        // 5. Delete shared component templates (only after all per-stream templates removed).
        for (const ct of ['sample-data@mappings', 'sample-data@lifecycle'] as const) {
          try {
            await esClient.cluster.deleteComponentTemplate({ name: ct });
          } catch {
            // 404 = fine
          }
        }

        // Per-space ui settings (securitySolution:defaultIndex, defaultIndex) are stored
        // as a 'config' saved object namespaced to SPACE_ID. The spacesClient.delete call
        // above cascades to all saved objects in that namespace, so no explicit removal needed.

        logger.info('Security playground cleanup complete.');
        return response.ok({ body: { deleted: true } });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Playground cleanup failed: ${message}`);
        return response.customError({ statusCode: 500, body: message });
      }
    }
  );
};

// ---------------------------------------------------------------------------
// Async provisioning logic (runs after the streaming response is sent)
// ---------------------------------------------------------------------------

async function provisionAsync(
  stream: PassThrough,
  core: CoreSetup<SecurityPlaygroundStartPlugins>,
  request: KibanaRequest,
  currentUserEsClient: ElasticsearchClient,
  logger: Logger,
  kibanaVersion: string
) {
  const [coreStart, plugins] = await core.getStartServices();
  const spacesClient = plugins.spaces.spacesService.createSpacesClient(request);

  // -------------------------------------------------------------------------
  // Step 1: Create the space
  // -------------------------------------------------------------------------
  emit(stream, { phase: 'space', status: 'start' });
  try {
    await spacesClient.create({
      id: SPACE_ID,
      name: SPACE_NAME,
      color: '#D36086',
      description: 'Sample data playground — Ransomware Kill Chain demo scenario',
      disabledFeatures: [],
      // solution: 'security' requires xpack.spaces.allowSolutionVisibility: true.
      // Omitted here so the PoC works on default dev configs.
    });
  } catch (err: unknown) {
    // 409 = space already exists — allow re-provision without cleanup
    const statusCode = (err as { output?: { statusCode?: number } }).output?.statusCode;
    if (statusCode !== 409) throw err;
    logger.debug('Space already exists — continuing provision');
  }
  emit(stream, { phase: 'space', status: 'done', spaceId: SPACE_ID });

  // -------------------------------------------------------------------------
  // Pre-step A: Write per-space ui settings so the Security app's init flow does
  // not overwrite the playground data view title with the global logs-* pattern
  // on first browser visit (initialize_security_data_views merges the
  // securitySolution:defaultIndex ui setting into the data view title on every
  // cold start; scoping it here to sample-data-* prevents that collision).
  // -------------------------------------------------------------------------
  await ensurePlaygroundUiSettings(coreStart, kibanaVersion, logger);

  // -------------------------------------------------------------------------
  // Pre-step B: Ensure the alerts index template + data stream exist BEFORE rules
  // are installed. Rule installation for siem.queryRule types may trigger the
  // alerting plugin to create .alerts-security.alerts-{spaceId}. If the index
  // template is not in place first, ES uses dynamic mapping and makes
  // kibana.alert.severity a "text" field — which breaks all aggregations and
  // sorts in the alerts table. Running ensureAlertsIndex here guarantees the
  // template (cloned from default) is applied before any writes happen.
  // -------------------------------------------------------------------------
  const esClient = currentUserEsClient;
  await ensureAlertsIndex(esClient, logger);

  // -------------------------------------------------------------------------
  // Step 2: Install 7 custom detection rules with pinned UUIDs in the new space.
  //
  // Uses getRulesClientWithRequestInSpace so rules land in sample-playground, not
  // the current space. Alert "kibana.alert.rule.uuid" in the pre-fab docs matches
  // these UUIDs, making "View rule" links resolve correctly.
  // -------------------------------------------------------------------------
  emit(stream, { phase: 'rules', status: 'start' });
  const rulesClient = await plugins.alerting.getRulesClientWithRequestInSpace(request, SPACE_ID);
  let rulesInstalled = 0;
  for (const rule of RANSOMWARE_RULES) {
    try {
      await rulesClient.create({
        data: {
          alertTypeId: 'siem.queryRule',
          consumer: 'siem',
          name: rule.name,
          enabled: false,
          schedule: { interval: '5m' },
          params: {
            author: [],
            description: rule.name,
            exceptionsList: [],
            falsePositives: [],
            from: 'now-30d',
            query: rule.query,
            immutable: false,
            index: rule.index as unknown as string[],
            language: 'kuery',
            maxSignals: 100,
            outputIndex: '',
            references: [],
            riskScore: rule.riskScore,
            riskScoreMapping: [],
            ruleId: rule.id,
            severity: rule.severity,
            severityMapping: [],
            threat: [
              {
                framework: 'MITRE ATT&CK',
                tactic: {
                  id: rule.mitreTacticId,
                  name: rule.mitreTacticName,
                  reference: `https://attack.mitre.org/tactics/${rule.mitreTacticId}/`,
                },
                technique: [
                  {
                    id: rule.mitreTechId,
                    name: rule.mitreTechName,
                    reference: `https://attack.mitre.org/techniques/${rule.mitreTechId.replace(
                      '.',
                      '/'
                    )}/`,
                    subtechnique: [],
                  },
                ],
              },
            ],
            to: 'now',
            type: 'query',
            version: 1,
          },
          actions: [],
          tags: [SAMPLE_TAG],
          notifyWhen: 'onActionGroupChange' as const,
        },
        options: { id: rule.id },
      });
      rulesInstalled++;
    } catch (err: unknown) {
      // 409 = rule already exists with this ID — idempotent
      const statusCode = (err as { output?: { statusCode?: number } }).output?.statusCode;
      if (statusCode !== 409) {
        logger.warn(
          `Failed to create rule "${rule.name}": ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }
  emit(stream, { phase: 'rules', status: 'done', installed: rulesInstalled });

  // -------------------------------------------------------------------------
  // Step 3: Generate + index scenario docs, emitting progress per kill-chain phase.
  // -------------------------------------------------------------------------

  // Ensure the space-scoped raw-event data streams exist before bulk-indexing.
  await ensureEventDataStreams(esClient, logger);

  // Create the two data views the security app needs in the sample-playground space.
  // Using saved-objects API directly avoids the TLS/SAML issues of a loopback HTTP
  // fetch. The security app's browser-side init will refresh these on first load, so
  // they only need to be present with correct IDs and reasonable titles.
  await createSecurityDataViews(coreStart, logger);

  const phaseStories = Object.fromEntries(KILL_CHAIN_PHASES.map((p) => [p.phase, p.story]));

  let totalEvents = 0;
  for (const { phase, docs } of generateRansomwareKillChainPhases(SPACE_ID, 50)) {
    if (docs.length === 0) {
      emit(stream, { phase, status: 'done', story: phaseStories[phase] ?? phase, indexed: 0 });
      // Build bulk operations array for non-empty phases
    } else {
      const operations = docs.flatMap((doc) => [{ create: { _index: doc._index } }, doc._source]);
      try {
        const result = await esClient.bulk({ operations, refresh: false });

        // Surface the first per-document ES error in both logs and the stream.
        let firstErrorReason: string | undefined;
        if (result.errors) {
          const firstFail = result.items.find((item) => item.create?.error || item.index?.error);
          const errDetail = firstFail?.create?.error ?? firstFail?.index?.error;
          firstErrorReason = errDetail
            ? `${errDetail.type}: ${errDetail.reason}`
            : 'unknown bulk error';
          logger.warn(`Bulk partial errors for phase "${phase}": ${JSON.stringify(errDetail)}`);
        }

        const indexed = result.items.filter(
          (item) => item.create && item.create.status >= 200 && item.create.status < 300
        ).length;
        totalEvents += indexed;
        emit(stream, {
          phase,
          status: 'done',
          story: phaseStories[phase] ?? phase,
          indexed,
          ...(firstErrorReason ? { bulkError: firstErrorReason } : {}),
        });
      } catch (err: unknown) {
        // Non-fatal: log and continue — we want as much data as possible even if one index fails
        logger.warn(
          `Bulk index failed for phase ${phase}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        emit(stream, {
          phase,
          status: 'error',
          story: phaseStories[phase] ?? phase,
          message: err instanceof Error ? err.message : String(err),
          indexed: 0,
        });
      }
    } // end else (docs.length > 0)
  }

  const alertCount = RANSOMWARE_RULES.length;
  emit(stream, {
    phase: 'complete',
    status: 'done',
    totals: { events: totalEvents, alerts: alertCount, rules: rulesInstalled },
  });
  stream.end();
}

// ---------------------------------------------------------------------------
// Ensure the sample-data event data streams exist with correct mappings.
//
// Installs two shared component templates (idempotent upserts):
//   sample-data@mappings  — re-composes ecs@mappings so ECS dynamic templates apply
//                           (e.g. source.ip → ip, not text+keyword)
//   sample-data@lifecycle — 30-day DSL retention
//
// Each stream gets a per-stream composable index template at priority 200.
// No Fleet template covers sample-data-* so we assert ownership outright.
// ---------------------------------------------------------------------------
async function ensureEventDataStreams(
  esClient: ElasticsearchClient,
  logger: Logger
): Promise<void> {
  // Upsert shared component templates once for all three streams.
  try {
    await esClient.cluster.putComponentTemplate({
      name: 'sample-data@mappings',
      template: { mappings: {} },
      _meta: { description: 'Security playground — ECS mapping hook', managed: false },
    });
    await esClient.cluster.putComponentTemplate({
      name: 'sample-data@lifecycle',
      template: { lifecycle: { data_retention: '30d' } },
      _meta: { description: 'Security playground — 30-day retention', managed: false },
    });
  } catch (err: unknown) {
    logger.warn(
      `Could not upsert sample-data component templates: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  // Detect whether the built-in ecs@mappings component template is present.
  // It ships with Elasticsearch 8.x+ but may be absent on stripped-down dev clusters.
  let hasEcsMappings = false;
  try {
    await esClient.cluster.getComponentTemplate({ name: 'ecs@mappings' });
    hasEcsMappings = true;
  } catch {
    logger.debug(
      'ecs@mappings component template not found — ECS dynamic templates will not apply'
    );
  }
  const composedOf = hasEcsMappings
    ? ['ecs@mappings', 'sample-data@mappings', 'sample-data@lifecycle']
    : ['sample-data@mappings', 'sample-data@lifecycle'];

  for (const streamName of Object.values(EVENT_INDICES)) {
    let exists = false;
    try {
      const existing = await esClient.indices.getDataStream({ name: streamName });
      exists = existing.data_streams.length > 0;
    } catch {
      // 404 — stream doesn't exist yet
    }

    if (!exists) {
      const shortName = streamName.replace('sample-data-', ''); // process | network | file
      const templateName = `sample-data-${shortName}@template`;
      try {
        await esClient.indices.putIndexTemplate({
          name: templateName,
          index_patterns: [streamName],
          data_stream: {},
          priority: 200,
          composed_of: composedOf,
          _meta: { description: 'Security playground sample data', managed: false },
        });
        await esClient.indices.createDataStream({ name: streamName });
        logger.debug(`Created data stream ${streamName}`);
      } catch (err: unknown) {
        logger.warn(
          `Could not create data stream ${streamName}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Ensure the alerts index for the sample-playground space has correct mappings.
//
// Strategy:
//   1. Always upsert the index template (putIndexTemplate is idempotent).
//      Primary: clone .alerts-security.alerts-default-index-template.
//      Fallback: a minimal template that maps all strings as keyword via
//      dynamic_templates, preventing the text-field aggregation failures.
//   2. Always delete + recreate the data stream so mappings are always clean.
//      The DELETE route only removes docs (deleteByQuery), leaving the stream
//      with stale mappings across provisions — this avoids that entirely.
//   3. Create the public alias security.alerts-{spaceId} → data stream.
// ---------------------------------------------------------------------------
async function ensureAlertsIndex(esClient: ElasticsearchClient, logger: Logger): Promise<void> {
  const alertsIndex = `.alerts-security.alerts-${SPACE_ID}`;
  const spaceTemplateName = `.alerts-security.alerts-${SPACE_ID}-index-template`;
  const defaultTemplateName = `.alerts-security.alerts-default-index-template`;

  // Step 1 — always upsert the index template.
  // putIndexTemplate is an upsert so we never need to check existence first.
  // data_stream:{} MUST be present or createDataStream() throws "no matching
  // template with data_stream field" and we fall back to a plain index with
  // dynamic text mappings that break every aggregation.
  try {
    const defaults = await esClient.indices.getIndexTemplate({ name: defaultTemplateName });
    const src = defaults.index_templates[0]?.index_template;
    if (!src) throw new Error(`${defaultTemplateName} returned no templates`);
    await esClient.indices.putIndexTemplate({
      name: spaceTemplateName,
      index_patterns: [alertsIndex],
      composed_of: src.composed_of ?? [],
      priority: (src.priority ?? 100) + 1,
      template: src.template ?? {},
      data_stream: src.data_stream ?? {},
      _meta: { ...((src._meta as object) ?? {}), space: SPACE_ID, poc: true },
    });
    logger.debug(`Upserted ${spaceTemplateName} from ${defaultTemplateName}`);
  } catch (cloneErr: unknown) {
    // Default template unavailable (not yet created by security solution) or
    // putIndexTemplate rejected. Fall back to a minimal template that at least
    // maps all string fields as keyword so aggregations don't blow up.
    logger.warn(
      `Could not clone default alerts template, using fallback: ${
        cloneErr instanceof Error ? cloneErr.message : String(cloneErr)
      }`
    );
    try {
      await esClient.indices.putIndexTemplate({
        name: spaceTemplateName,
        index_patterns: [alertsIndex],
        data_stream: {},
        priority: 200,
        template: {
          mappings: {
            dynamic_templates: [
              {
                strings_as_keyword: {
                  match_mapping_type: 'string',
                  mapping: { type: 'keyword' },
                },
              },
            ],
          },
        },
        _meta: { space: SPACE_ID, poc: true },
      });
      logger.debug(`Created ${spaceTemplateName} with fallback keyword-mapping template`);
    } catch (fallbackErr: unknown) {
      logger.warn(
        `Could not create fallback alerts template: ${
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        }`
      );
    }
  }

  // Step 2 — always delete the existing data stream so we start with a clean slate.
  // Stale mappings from a previous provision (e.g., text fields from a run before the
  // template existed) cannot be updated in-place — only a fresh data stream picks up
  // the new template. The DELETE route only removes docs, not the stream itself.
  try {
    await esClient.indices.deleteDataStream({ name: alertsIndex });
    logger.debug(`Deleted stale alerts data stream ${alertsIndex}`);
  } catch {
    // May not exist (first provision) or may be a plain index — try that too
    try {
      await esClient.indices.delete({ index: alertsIndex });
      logger.debug(`Deleted stale alerts index ${alertsIndex}`);
    } catch {
      // Neither exists — fine
    }
  }

  // Step 3 — create the alerts data stream (picks up the template from step 1).
  try {
    await esClient.indices.createDataStream({ name: alertsIndex });
    logger.debug(`Created alerts data stream ${alertsIndex}`);
  } catch (err: unknown) {
    // If still no data_stream template matched, fall back to a plain index.
    logger.warn(
      `Could not create alerts data stream, trying plain index: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    try {
      await esClient.indices.create({ index: alertsIndex });
      logger.debug(`Created alerts index ${alertsIndex} (plain — aggregations may fail)`);
    } catch (innerErr: unknown) {
      logger.warn(
        `Could not create alerts index: ${
          innerErr instanceof Error ? innerErr.message : String(innerErr)
        }`
      );
    }
  }

  // Step 4 — create the public alias security.alerts-{spaceId} → alertsIndex.
  // The security solution's initialize flow creates the alert data view with title
  // `security.alerts-{spaceId}` (this alias). Without it hasMatchedIndices() returns
  // false and the alerts page shows "Unable to retrieve the data view".
  try {
    await esClient.indices.putAlias({
      index: alertsIndex,
      name: `security.alerts-${SPACE_ID}`,
    });
    logger.debug(`Created alias security.alerts-${SPACE_ID} → ${alertsIndex}`);
  } catch (err: unknown) {
    logger.warn(
      `Could not create alerts alias: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Write per-space ui settings for the playground space.
//
// The Security app's initialize_security_data_views flow reads
// securitySolution:defaultIndex from the per-space ui settings and merges it
// into the data view title on every cold start (if the patterns differ it
// overwrites the data view). Writing sample-data-* here prevents that from
// reverting the playground data view to the global logs-* default.
//
// The 'config' saved object type is a hidden SO type; createInternalRepository
// must be called with ['config'] so the repository is permitted to access it.
//
// kibanaVersion is the Kibana package version string (e.g. '9.0.0') — the same
// string used as the 'config' SO id by Kibana's internal ui settings service.
// ---------------------------------------------------------------------------
async function ensurePlaygroundUiSettings(
  coreStart: CoreStart,
  kibanaVersion: string,
  logger: Logger
): Promise<void> {
  try {
    const soRepo = coreStart.savedObjects.createInternalRepository(['config']);
    const settings = {
      'securitySolution:defaultIndex': ['sample-data-*'],
      defaultIndex: `security-solution-${SPACE_ID}`,
    };
    await soRepo.update('config', kibanaVersion, settings, {
      namespace: SPACE_ID,
      upsert: settings,
    });
    logger.debug(`Set per-space ui settings for ${SPACE_ID}`);
  } catch (err: unknown) {
    logger.warn(
      `Could not set playground ui settings: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Create the security solution data views in the sample-playground space.
//
// The security alert table and sourcerer both require two data views to exist
// inside the space:
//   security-solution-sample-playground       ← default patterns + alerts
//   security-solution-alert-sample-playground ← alerts only
//
// These would normally be created by the browser-side security app init on
// first visit (POST /api/security_solution/initialize). We create them here
// via the saved-objects API so the space is usable before the first visit.
// The security app's init flow will refresh/overwrite them with its own
// richer index-pattern list on first load — that is fine and expected.
//
// We deliberately avoid a loopback HTTP fetch because in serverless dev mode
// the Kibana server uses a self-signed TLS cert that Node's native fetch
// rejects, and SAML session cookies are not reliably forwarded server-side.
// ---------------------------------------------------------------------------
async function createSecurityDataViews(coreStart: CoreStart, logger: Logger): Promise<void> {
  // The alert data view title must use the public alias (security.alerts-{spaceId})
  // not the raw data stream name (.alerts-security.alerts-{spaceId}), because the
  // security app's init flow also uses this alias name. Both must agree so that
  // hasMatchedIndices() returns true (the alias is created in ensureAlertsIndex).
  const alertTitle = `security.alerts-${SPACE_ID}`;
  // Use a wildcard to cover all three sample-data-* streams in one pattern.
  // Must match what ensurePlaygroundUiSettings writes to securitySolution:defaultIndex
  // so the Security app's init flow sees no diff and does not overwrite the title.
  const defaultTitle = `sample-data-*,${alertTitle}`;

  const soRepo = coreStart.savedObjects.createInternalRepository();
  try {
    await soRepo.create(
      'index-pattern',
      {
        title: defaultTitle,
        timeFieldName: '@timestamp',
        allowNoIndex: true,
        name: 'Security solution default',
      },
      { id: `security-solution-${SPACE_ID}`, namespace: SPACE_ID, overwrite: true }
    );

    await soRepo.create(
      'index-pattern',
      {
        title: alertTitle,
        timeFieldName: '@timestamp',
        allowNoIndex: true,
        name: 'Security solution alerts',
        managed: true,
      },
      { id: `security-solution-alert-${SPACE_ID}`, namespace: SPACE_ID, overwrite: true }
    );

    logger.debug(`Created security data views for space ${SPACE_ID}`);
  } catch (err: unknown) {
    logger.warn(
      `Could not create security data views: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
