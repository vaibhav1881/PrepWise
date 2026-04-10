import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Bookmarks E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_sig';
    const mockUser = JSON.stringify({
        id: 'selenium_test_user_id',
        name: 'Selenium Tester',
        email: 'tester@bookmarks.com'
    });

    beforeAll(async () => {
        const options = new chrome.Options();
        // options.addArguments('--headless');
        options.addArguments('--window-size=1280,800');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    afterEach(async () => {
    try {
        // Take a screenshot automatically after each test finishes
        const testName = expect.getState().currentTestName.replace(/[^a-zA-Z0-9]/g, '_');
        const image = await driver.takeScreenshot();
        require('fs').writeFileSync(require('path').join(__dirname, 'screenshots', `${testName}.png`), image, 'base64');
    } catch (err) {
        console.error("Screenshot failed:", err);
    }
  });

    beforeEach(async () => {
        await driver.get(baseUrl);
    });

    it('should redirect unauthenticated users to login', async () => {
        await driver.executeScript('window.localStorage.clear();');
        await driver.get(`${baseUrl}/bookmarks`);

        await driver.wait(until.urlContains('/login'), 5000);
        const currUrl = await driver.getCurrentUrl();
        expect(currUrl).toContain('/login');
    });

    it('should display the bookmarks page and empty state for new users', async () => {
        // Generate a unique ID to ensure the user has no bookmarks in DB
        const emptyUser = JSON.stringify({
            id: `empty_user_${Date.now()}`,
            name: 'Empty Bookmarks Tester',
            email: 'empty@bookmarks.com'
        });

        await driver.executeScript(`
      window.localStorage.setItem('token', arguments[0]);
      window.localStorage.setItem('user', arguments[1]);
    `, mockToken, emptyUser);

        await driver.get(`${baseUrl}/bookmarks`);

        // Wait for header
        const headerTitle = await driver.wait(
            until.elementLocated(By.xpath('//h1[contains(text(), "Bookmarked Questions")]')),
            5000
        );
        expect(await headerTitle.isDisplayed()).toBeTruthy();

        // Check for empty state rendering
        const emptyStateText = await driver.wait(
            until.elementLocated(By.xpath('//h3[contains(text(), "No bookmarks yet")]')),
            10000
        );
        expect(await emptyStateText.isDisplayed()).toBeTruthy();

        const startInterviewBtn = await driver.findElement(By.xpath('//button[contains(., "Start Interview")]'));
        expect(await startInterviewBtn.isDisplayed()).toBeTruthy();
    });
});
