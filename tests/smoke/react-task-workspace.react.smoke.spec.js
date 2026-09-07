import {expect, test} from '@playwright/test'
import {startTestStack} from '../helpers/app-under-test.mjs'

let stack
test.beforeAll(async () => { stack = await startTestStack() })
test.afterAll(async () => { await stack?.stop() })
test.beforeEach(() => stack.reset())

for (const width of [1440, 390]) {
	test(`task body exposes and edits essential information at ${width}px`, async ({page}, testInfo) => {
		const errors = []
		page.on('pageerror', error => errors.push(error.message))
		await page.setViewportSize({width, height: 1000})
		await page.goto(stack.appUrl)
		await page.locator('.workspace-screen.is-active .task-row').filter({hasText: 'Prepare daily summary'}).locator('[data-action="open-task-focus"]').click()
		const body = page.locator('.workspace-screen.is-active [data-task-body]')
		await expect(body.locator('[data-detail-title]')).toHaveValue('Prepare daily summary')
		for (const section of ['assignees', 'organization', 'description', 'comments', 'attachments']) {
			await expect(body.locator(`[data-detail-section="${section}"]`)).toBeVisible()
		}
		await expect(body.getByText('Due', {exact: true})).toBeVisible()
		await expect(body.locator('[data-detail-section-toggle]')).toHaveCount(0)
		await body.getByRole('textbox', {name: 'Notes', exact: true}).fill('Notes edited in the task body')
		await body.getByRole('textbox', {name: 'Notes', exact: true}).blur()
		await expect.poll(async () => (await stack.mockApi('tasks/102')).description).toBe('Notes edited in the task body')
		await body.locator('[data-detail-comment-input]').fill('A comment from the task body')
		if (width > 1000) {
			await expect(page.locator('.shell-inspector-region [data-detail-section-toggle="planning"]')).toBeVisible()
			await expect(page.locator('.shell-inspector-region [data-detail-title]')).toHaveCount(0)
			await page.getByRole('button', {name: 'Collapse detail pane', exact: true}).click()
			await expect(page.locator('.shell')).toHaveClass(/has-collapsed-inspector/)
			await expect(body.locator('[data-detail-comment-input]')).toHaveValue('A comment from the task body')
		} else {
			await expect(page.locator('[data-detail-page]')).toHaveCount(0)
			await page.locator('.task-workspace-settings > summary').click()
			await expect(page.locator('[data-task-settings] [data-detail-section-toggle="planning"]')).toBeVisible()
		}
		await body.locator('[data-form="add-comment"] button[type="submit"]').click()
		await expect(body.locator('.detail-comment-body').filter({hasText: 'A comment from the task body'})).toBeVisible()
		await body.locator('[data-detail-label-select]').selectOption({index: 1})
		await body.locator('[data-form="add-label"] button[type="submit"]').click()
		await expect(body.locator('.label-chip')).not.toHaveCount(0)
		await body.locator('[data-detail-assignee-search]').fill('smoke')
		await body.locator('[data-task-assignee-option="1"]').click()
		await expect(body.locator('[data-task-assignee="1"]')).toBeVisible()
		await body.getByRole('button', {name: 'Clear Due date', exact: true}).click()
		await expect.poll(async () => (await stack.mockApi('tasks/102')).due_date).toBeNull()
		await body.locator('.compact-date-picker-input').fill('08/09/2026 12:00')
		await body.locator('.compact-date-picker-input').press('Enter')
		await expect.poll(async () => (await stack.mockApi('tasks/102')).due_date).toContain('2026-09-08')
		if (width > 1000) await expect(page.locator('.shell')).toHaveClass(/has-collapsed-inspector/)
		await body.locator('[data-detail-attachment-input]').setInputFiles({
			name: 'task.png', mimeType: 'image/png',
			buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1kAAAAASUVORK5CYII=', 'base64'),
		})
		await body.locator('[data-action="open-task-attachment-preview"]').click()
		await expect(page.locator('[data-detail-media-viewer]')).toBeVisible()
		await page.locator('[data-detail-media-viewer]').getByRole('button', {name: 'Close', exact: true}).click()
		await body.locator('[data-detail-title]').scrollIntoViewIfNeeded()
		await page.screenshot({path: testInfo.outputPath(`task-body-${width}.png`)})
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
		expect(errors).toEqual([])
		await page.locator('.task-focus-surface [data-action="close-focused-task"]').click()
		await expect(page.locator('[data-detail-page]')).toHaveCount(0)
		await page.locator('.workspace-screen.is-active .task-row').filter({hasText: 'Buy milk'}).locator('[data-action="open-task-focus"]').click()
		await expect(body.locator('[data-detail-title]')).toHaveValue('Buy milk')
		await expect(body.locator('[data-detail-comment-input]')).toHaveValue('')
	})
}
