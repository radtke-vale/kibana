/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import type { FtrProviderContext } from '../../ftr_provider_context';
import type { CasesCommon } from './common';

const replaceNewLinesWithSpace = (str: string) => str.replace(/\n/g, ' ');

const REPORTED_BY_PREFIX = 'Reported by:';

export function CasesSingleViewServiceProvider(
  { getService, getPageObject }: FtrProviderContext,
  casesCommon: CasesCommon
) {
  const common = getPageObject('common');
  const testSubjects = getService('testSubjects');
  const header = getPageObject('header');
  const find = getService('find');
  const lensPage = getPageObject('lens');
  const appMenu = getPageObject('appMenu');
  const retry = getService('retry');
  const savedObjectsFinder = getService('savedObjectsFinder');

  return {
    async deleteCase() {
      // The redesign moves the delete action to the app-header overflow menu; the legacy UI exposes it
      // through the action-bar property actions.
      if (await casesCommon.isRedesignEnabled()) {
        await appMenu.clickMenuItem('case-action-delete', { isInOverflowMenu: true });
        await testSubjects.click('confirmModalConfirmButton');
        await header.waitUntilLoadingHasFinished();
        return;
      }

      await retry.try(async () => {
        await testSubjects.click('property-actions-case-ellipses');
        await testSubjects.existOrFail('property-actions-case-trash', { timeout: 100 });
        await testSubjects.click('property-actions-case-trash');
      });
      await testSubjects.click('confirmModalConfirmButton');
      await header.waitUntilLoadingHasFinished();
    },

    /**
     * Asserts the case-view delete action is not available (used for users lacking the delete
     * privilege). The redesign always renders the app-header overflow menu (it holds "copy id"), so
     * we open it and assert the delete item is absent; the legacy UI uses the property-actions menu.
     */
    async assertDeleteCaseAbsent() {
      if (await casesCommon.isRedesignEnabled()) {
        expect(await appMenu.menuItemExists('case-action-delete')).to.be(false);
        return;
      }

      await testSubjects.click('property-actions-case-ellipses');
      await testSubjects.missingOrFail('property-actions-case-trash');
    },

    async verifyUserAction(dataTestSubj: string, contentToMatch: string) {
      const userAction = await find.byCssSelector(
        `[data-test-subj^="${dataTestSubj}"] .euiCommentEvent`
      );

      const userActionText = replaceNewLinesWithSpace(await userAction.getVisibleText());

      expect(userActionText).contain(contentToMatch);
    },

    async getCommentCount(): Promise<number> {
      const commentsContainer = await testSubjects.find('user-actions-list');
      const comments = await commentsContainer.findAllByClassName('euiComment');
      return comments.length - 1; // don't count the element for adding a new comment
    },

    async submitComment() {
      const commentCountBefore = await this.getCommentCount();
      await testSubjects.click('submit-comment');
      await retry.tryForTime(10 * 1000, async () => {
        const commentCountAfter = await this.getCommentCount();
        expect(commentCountAfter).to.eql(
          commentCountBefore + 1,
          `Number of comments should increase by 1`
        );
      });
    },

    async addComment(comment: string) {
      const addCommentElement = await find.byCssSelector(
        '[data-test-subj="add-comment"] textarea.euiMarkdownEditorTextArea'
      );

      await addCommentElement.focus();
      await addCommentElement.type(comment);

      await this.submitComment();
    },

    async addVisualizationToNewComment(visName: string) {
      // open saved object finder
      const addCommentElement = await testSubjects.find('add-comment');
      const addVisualizationButton = await addCommentElement.findByCssSelector(
        '[data-test-subj="euiMarkdownEditorToolbarButton"][aria-label="Visualization"]'
      );
      await addVisualizationButton.click();

      await this.findAndSaveVisualization(visName);

      await testSubjects.existOrFail('cases-app', { timeout: 10 * 1000 });

      await this.submitComment();
    },

    async findAndSaveVisualization(visName: string) {
      await testSubjects.existOrFail('savedObjectsFinderTable', { timeout: 10 * 1000 });

      // select visualization
      const searchTerm = visName.match(/^\[([^\]]+)\]/)?.[1] ?? visName;
      await savedObjectsFinder.filterEmbeddableNames(searchTerm);
      const itemList = await testSubjects.find('savedObjectsFinderTable');
      const itemListBody = await itemList.findByTagName('tbody');
      const rows = await itemListBody.findAllByCssSelector('tr');
      let visualizationSelected = false;
      for (const row of rows) {
        const buttons = await row.findAllByTagName('button');
        for (const button of buttons) {
          if ((await button.getVisibleText()) === visName) {
            await button.click();
            visualizationSelected = true;
            break;
          }
        }
        if (visualizationSelected) {
          break;
        }
      }
      expect(visualizationSelected).to.be(true);
      await header.waitUntilLoadingHasFinished();
      if (await casesCommon.isRedesignEnabled()) {
        return;
      }

      await lensPage.isLensPageOrFail();

      // save and return to cases app, add comment
      await lensPage.saveAndReturn();
    },

    async openVisualizationButtonTooltip() {
      const addCommentElement = await testSubjects.find('add-comment');
      const addVisualizationButton = await addCommentElement.findByCssSelector(
        '[data-test-subj="euiMarkdownEditorToolbarButton"][aria-label="Visualization"]'
      );
      await addVisualizationButton.moveMouseTo();
      await common.sleep(500); // give tooltip time to open
    },

    async assertCaseTitle(expectedTitle: string) {
      // The redesign renders the title in the app header (`appHeaderTitle`); the legacy UI uses the
      // inline editable title (`editable-title-header-value`).
      const titleSubject = (await casesCommon.isRedesignEnabled())
        ? 'appHeaderTitle'
        : 'editable-title-header-value';
      const actionTitle = await testSubjects.getVisibleText(titleSubject);
      expect(actionTitle).to.eql(
        expectedTitle,
        `Expected case title to be '${expectedTitle}' (got '${actionTitle}')`
      );
    },

    async assertCaseDescription(expectedDescription: string) {
      const desc = await find.byCssSelector(
        '[data-test-subj="description"] [data-test-subj="scrollable-markdown"]'
      );

      const actualDescription = await desc.getVisibleText();

      expect(expectedDescription).to.eql(
        actualDescription,
        `Expected case description to be '${expectedDescription}' (got '${actualDescription}')`
      );
    },

    async openAssigneesPopover() {
      const isRedesignEnabled = await casesCommon.isRedesignEnabled();
      let editButton = 'case-view-assignees-edit-button';
      if (isRedesignEnabled) {
        editButton = (await testSubjects.exists('case-view-assign-users-link'))
          ? 'case-view-assign-users-link'
          : 'case-view-assignees-add-button';
      }
      await common.clickAndValidate(editButton, 'euiSelectableList');
      await header.waitUntilLoadingHasFinished();
    },

    async closeAssigneesPopover() {
      const title = (await casesCommon.isRedesignEnabled())
        ? 'appHeaderTitle'
        : 'editable-title-header-value';
      await testSubjects.click(title);
      await header.waitUntilLoadingHasFinished();
      await testSubjects.missingOrFail('euiSelectableList');
    },

    async refresh() {
      await testSubjects.click('case-refresh');
    },

    /**
     * Returns the reporter's display name in either design. The redesign shows it as app-header
     * metadata text (`Reported by: <name>`); the legacy UI renders it in the sidebar user list.
     */
    async getReporterName(): Promise<string> {
      if (await casesCommon.isRedesignEnabled()) {
        const reportedBy = await testSubjects.getVisibleText('case-view-reported-by');
        return reportedBy.replace(REPORTED_BY_PREFIX, '').trim();
      }

      await testSubjects.existOrFail('case-view-user-list-reporter');

      const reporter = await testSubjects.findAllDescendant(
        'user-profile-username',
        await testSubjects.find('case-view-user-list-reporter')
      );

      return reporter[0].getVisibleText();
    },

    async getParticipants() {
      await testSubjects.existOrFail('case-view-user-list-participants');

      const participants = await testSubjects.findAllDescendant(
        'user-profile-username',
        await testSubjects.find('case-view-user-list-participants')
      );

      return participants;
    },
  };
}
