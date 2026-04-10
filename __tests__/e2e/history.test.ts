import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise History E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_sig';
    const mockUser = JSON.stringify({
        id: 'selenium_test_user_id',
        name: 'Selenium Tester',
        email: 'tester@history.com'
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
        await driver.executeScript(`
      window.localStorage.setItem('token', arguments[0]);
      window.localStorage.setItem('user', arguments[1]);
    `, mockToken, mockUser);
    });

    it('should deny access if not authenticated', async () => {
        // Navigate and clear tokens, ensuring unauth state
        await driver.get(`${baseUrl}`);
        await driver.executeScript('window.localStorage.clear();');

        // Attempt to access history
        await driver.get(`${baseUrl}/history`);

        // Expect Router redirect to Login
        await driver.wait(until.urlContains('/login'), 5000);
        const currUrl = await driver.getCurrentUrl();
        expect(currUrl).toBe(`${baseUrl}/login`);
    });

    it('should display history correctly when properly authenticated', async () => {
        // Navigate with tokens
        await driver.get(`${baseUrl}/history`);

        // Header should load
        const historyHeader = await driver.wait(
            until.elementLocated(By.xpath('//h1[contains(text(), "Interview History")]')),
            5000
        );
        expect(await historyHeader.isDisplayed()).toBeTruthy();

        const subHeader = await driver.findElement(By.xpath('//p[contains(text(), "Review your past interviews")]'));
        expect(await subHeader.isDisplayed()).toBeTruthy();
    });

    it('should display an empty state for a brand new user', async () => {
        // Use an unmapped DB ID to ensure empty history fetch
        const uniqueUser = JSON.stringify({
            id: `empty_user_${Date.now()}`,
            name: 'Empty History Tester',
            email: 'empty@example.com'
        });

        await driver.get(baseUrl);
        await driver.executeScript(`
      window.localStorage.setItem('token', arguments[0]);
      window.localStorage.setItem('user', arguments[1]);
    `, mockToken, uniqueUser);

        await driver.get(`${baseUrl}/history`);

        // Wait until loading spinner disappears and the 'No interviews yet' text appears
        const emptyStateText = await driver.wait(
            until.elementLocated(By.xpath('//h3[contains(text(), "No interviews yet")]')),
            10000
        );
        expect(await emptyStateText.isDisplayed()).toBeTruthy();

        const emptyHintText = await driver.findElement(By.xpath('//p[contains(text(), "Start your first AI interview to see your history")]'));
        expect(await emptyHintText.isDisplayed()).toBeTruthy();

        // Verify "Start Interview" button routing
        const startBtn = await driver.findElement(By.xpath('//button[contains(., "Start Interview")]'));
        expect(await startBtn.isDisplayed()).toBeTruthy();
    });
});
