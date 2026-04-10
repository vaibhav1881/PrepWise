import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Interview Session & Layout E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_sig';
    const mockUser = JSON.stringify({
        id: 'selenium_test_user_id',
        name: 'Selenium Tester',
        email: 'tester@interview.com'
    });

    beforeAll(async () => {
        const options = new chrome.Options();
        // options.addArguments('--headless');
        options.addArguments('--window-size=1280,800');

        // Auto-grant microphone permissions so the page doesn't block the test
        options.setUserPreferences({
            'profile.default_content_setting_values.media_stream_mic': 1
        });

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

    it('should redirect or show error for an invalid/fake interview ID', async () => {
        // Navigate straight to a completely bogus 24-character mongodb hex ID that doesn't exist
        const fakeMongodId = '507f1f77bcf86cd799439011';
        await driver.get(`${baseUrl}/interview/${fakeMongodId}`);

        // The page initially shows "Loading interview...", but it vanishes too quickly 
        // leading to a StaleElementReferenceError if we try to await its display state.

        // Eventually, it loads the layout but throws a red alert box: "Interview not found" 
        const errorAlert = await driver.wait(
            until.elementLocated(By.xpath('//*[contains(text(), "Interview not found") or contains(text(), "Failed to load interview")]')),
            10000
        );

        expect(await errorAlert.isDisplayed()).toBeTruthy();
    });
});
