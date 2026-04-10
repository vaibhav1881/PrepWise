import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Signup E2E', () => {
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
        await driver.get(`${baseUrl}/signup`);
        await driver.executeScript('window.localStorage.clear();');
    });

    it('should display the signup form correctly', async () => {
        // Wait for form to load
        await driver.wait(until.elementLocated(By.id('name')), 5000);

        const nameInput = await driver.findElement(By.id('name'));
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

        expect(await nameInput.isDisplayed()).toBeTruthy();
        expect(await emailInput.isDisplayed()).toBeTruthy();
        expect(await passwordInput.isDisplayed()).toBeTruthy();
        expect(await submitBtn.isDisplayed()).toBeTruthy();
    });

    it('should transition to the verification step if a unique email is provided', async () => {
        // We will generate a random email to bypass the "User already exists" error
        const randomEmail = `test_user_${Date.now()}@example.com`;

        await driver.wait(until.elementLocated(By.id('name')), 5000);

        // Fill the form
        await driver.findElement(By.id('name')).sendKeys('Automation Tester');
        await driver.findElement(By.id('email')).sendKeys(randomEmail);
        await driver.findElement(By.id('password')).sendKeys('SecurePassword123!');

        // Submit
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        // Verify transition to verification step
        // The h1 text changes to "Verify Email" or a div with "A verification code has been sent" appears
        const verificationNotice = await driver.wait(
            until.elementLocated(By.xpath('//div[contains(text(), "A verification code has been sent")]')),
            10000 // Awaits for API to process and email to "send"
        );

        expect(await verificationNotice.isDisplayed()).toBeTruthy();

        // Verify the code input is present
        const codeInput = await driver.findElement(By.id('code'));
        expect(await codeInput.isDisplayed()).toBeTruthy();
    });
});
