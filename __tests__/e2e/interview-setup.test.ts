import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Interview Setup E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummySignature';
    const mockUser = JSON.stringify({
        id: 'selenium_test_user_id',
        name: 'Selenium Tester',
        email: 'tester@example.com'
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

    it('should load the Role Selection page properly', async () => {
        await driver.get(`${baseUrl}/interview/start`);

        const pageTitle = await driver.wait(
            until.elementLocated(By.xpath('//h1[contains(text(), "Select Interview Role")]')),
            10000
        );
        expect(await pageTitle.isDisplayed()).toBeTruthy();

        // Verify Create Role button is present
        const createBtn = await driver.findElement(By.xpath('//button[contains(., "Create New Role")]'));
        expect(await createBtn.isDisplayed()).toBeTruthy();
    });

    it('should toggle between My Roles and Public Roles tabs', async () => {
        await driver.get(`${baseUrl}/interview/start`);

        const myRolesTab = await driver.wait(
            until.elementLocated(By.xpath('//button[@role="tab" and contains(text(), "My Roles")]')),
            5000
        );
        const publicRolesTab = await driver.findElement(By.xpath('//button[@role="tab" and contains(text(), "Public Roles")]'));

        expect(await myRolesTab.isDisplayed()).toBeTruthy();
        expect(await publicRolesTab.isDisplayed()).toBeTruthy();

        // Click Public Roles Tab
        await publicRolesTab.click();

        // Wait for the inner tabs (Popular/Recent) to appear proving Public Tab is active
        const popularTab = await driver.wait(
            until.elementLocated(By.xpath('//button[@role="tab" and contains(text(), "Most Popular")]')),
            5000
        );
        expect(await popularTab.isDisplayed()).toBeTruthy();
    });

    it('should have a working search input field', async () => {
        await driver.get(`${baseUrl}/interview/start`);

        const searchInput = await driver.wait(
            until.elementLocated(By.css('input[placeholder="Search roles by title..."]')),
            5000
        );

        await searchInput.sendKeys('React Developer');
        const value = await searchInput.getAttribute('value');
        expect(value).toBe('React Developer');
    });
});
