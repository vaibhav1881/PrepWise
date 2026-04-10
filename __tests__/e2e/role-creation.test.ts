import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Role Creation E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_sig';
    const mockUser = JSON.stringify({
        id: 'selenium_test_user_id',
        name: 'Selenium Tester',
        email: 'tester@rolecreate.com'
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

        // Navigate to role creation page
        await driver.get(`${baseUrl}/interview/start/create`);
        await driver.wait(until.elementLocated(By.xpath('//h1[contains(text(), "Create New Interview")]')), 10000);
    });

    it('should load the manual role creation form by default', async () => {
        // Verify the Tabs exist
        const manualTab = await driver.findElement(By.xpath('//button[@role="tab" and contains(., "Role Description")]'));
        const resumeTab = await driver.findElement(By.xpath('//button[@role="tab" and contains(., "Resume Upload")]'));

        expect(await manualTab.isDisplayed()).toBeTruthy();
        expect(await resumeTab.isDisplayed()).toBeTruthy();

        // Verify manual inputs are present
        const roleTitleInput = await driver.findElement(By.css('input[placeholder="E.g., Senior Full-Stack Developer Interview"]'));
        expect(await roleTitleInput.isDisplayed()).toBeTruthy();

        // The textarea for job description
        const jobDescInput = await driver.findElement(By.css('textarea[placeholder*="E.g., Senior Full-Stack Developer with expertise in React"]'));
        expect(await jobDescInput.isDisplayed()).toBeTruthy();
    });

    it('should switch to the Resume Upload tab when clicked', async () => {
        const resumeTab = await driver.findElement(By.xpath('//button[@role="tab" and contains(., "Resume Upload")]'));
        await resumeTab.click();

        // Verify the resume upload specific inputs appear
        const fileInput = await driver.wait(
            until.elementLocated(By.css('input[type="file"]')),
            5000
        );
        // file input is visually hidden with class 'hidden', so isDisplayed() returns false natively.
        // We can just assert the element exists since elementLocated already checks existence in DOM.
        expect(fileInput).toBeDefined();

        const targetRoleInput = await driver.findElement(By.css('input[placeholder="E.g., Frontend Developer"]'));
        expect(await targetRoleInput.isDisplayed()).toBeTruthy();
    });

});
