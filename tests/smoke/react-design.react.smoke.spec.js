import {expect, test} from '@playwright/test'
import {startTestStack} from '../helpers/app-under-test.mjs'

let stack

test.beforeAll(async () => {
	stack = await startTestStack({legacyConfigured: false})
})

test.afterAll(async () => {
	await stack?.stop()
})

test.beforeEach(() => stack.reset())

async function signIn(page) {
	await page.goto(stack.appUrl)
	await page.locator('[data-account-field="username"]').fill('smoke-user')
	await page.locator('[data-account-field="password"]').fill('smoke-password')
	await page.getByRole('button', {name: 'Connect', exact: true}).click()
	await expect(page.getByRole('heading', {name: 'Today', exact: true})).toBeVisible()
}

test('desktop starts with room for tasks and opens the inspector on selection', async ({page}, testInfo) => {
	await page.setViewportSize({width: 1440, height: 960})
	await signIn(page)
	await expect(page.locator('.shell')).toHaveClass(/has-collapsed-inspector/)
	await expect(page.getByLabel('Tareas version 2')).toBeVisible()
	await page.screenshot({path: testInfo.outputPath('desktop-dark.png')})
	await page.locator('.workspace-screen.is-active .task-row').filter({hasText: 'Buy milk'}).locator('.task-main').click()
	await expect(page.locator('.shell-inspector-region')).toHaveClass(/has-detail/)
	await expect(page.locator('.shell')).not.toHaveClass(/has-collapsed-inspector/)
	await page.getByRole('button', {name: 'Close detail', exact: true}).click()
	await page.getByRole('button', {name: 'Collapse detail pane', exact: true}).click()
	await page.reload()
	await expect(page.locator('.shell')).toHaveClass(/has-collapsed-inspector/)
})

test('login fits desktop and mobile in both themes', async ({page}, testInfo) => {
	for (const theme of ['dark', 'light']) {
		for (const width of [1440, 390]) {
			await page.setViewportSize({width, height: 900})
			await page.goto(stack.appUrl)
			await expect(page.getByRole('button', {name: 'Connect', exact: true})).toBeVisible()
			await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme)
			// Let the existing theme colour transitions finish before visual capture.
			await page.waitForTimeout(300)
			await page.getByRole('button', {name: 'Connect', exact: true}).scrollIntoViewIfNeeded()
			await expect(page.getByRole('button', {name: 'Connect', exact: true})).toBeInViewport()
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
			await page.screenshot({path: testInfo.outputPath(`login-${theme}-${width}.png`), fullPage: true})
		}
	}
})

test('mobile keeps task actions and navigation reachable', async ({page}, testInfo) => {
	await page.setViewportSize({width: 390, height: 844})
	await signIn(page)
	await expect(page.getByRole('navigation', {name: 'Primary'})).toBeInViewport()
	await page.screenshot({path: testInfo.outputPath('mobile-dark.png')})
	const row = page.locator('.workspace-screen.is-active .task-row').filter({hasText: 'Buy milk'})
	await row.locator('[data-action="toggle-done"]').click()
	await expect(row).toHaveCount(0)
	await page.getByRole('navigation', {name: 'Primary'}).getByRole('button', {name: 'Inbox', exact: true}).click()
	await expect(page.getByRole('heading', {name: 'Inbox', exact: true})).toBeVisible()
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
	await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
	await page.waitForTimeout(300)
	await page.screenshot({path: testInfo.outputPath('mobile-light.png')})
})
