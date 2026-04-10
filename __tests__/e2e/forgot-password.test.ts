import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Forgot Password E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

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
        await driver.get(`${baseUrl}/forgot-password`);
    });

    it('should initially display the email request form', async () => {
        // Check if the correct header exists
        const title = await driver.wait(
            until.elementLocated(By.xpath('//h1[contains(text(), "Forgot Password")]')),
            5000
        );
        expect(await title.isDisplayed()).toBeTruthy();

        const emailInput = await driver.findElement(By.id('email'));
        expect(await emailInput.isDisplayed()).toBeTruthy();

        const submitBtn = await driver.findElement(By.xpath('//button[contains(text(), "Send Reset Code")]'));
        expect(await submitBtn.isDisplayed()).toBeTruthy();
    });

    it('should transition to reset password form when an email is submitted', async () => {
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);

        // Test with any email. The API is designed to return a success banner regardless 
        // of if the email exists in the DB to prevent user enumeration attacks.
        await emailInput.sendKeys('test_user@example.com');
        const submitBtn = await driver.findElement(By.xpath('//button[contains(text(), "Send Reset Code")]'));
        await submitBtn.click();

        // It should render a success message and then the Reset Code input
        const successBanner = await driver.wait(
            until.elementLocated(By.xpath('//div[contains(@class, "bg-green-50") and contains(@class, "text-green-600")]')),
            5000
        );
        expect(await successBanner.isDisplayed()).toBeTruthy();

        const codeInput = await driver.wait(until.elementLocated(By.id('code')), 5000);
        expect(await codeInput.isDisplayed()).toBeTruthy();
    });
});
