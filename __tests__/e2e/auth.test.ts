import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Authentication E2E', () => {
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
        // Clear localStorage before each test to ensure unauthenticated state
        await driver.get(baseUrl);
        await driver.executeScript('window.localStorage.clear();');
    });

    it('should redirect unauthenticated users away from protected routes (/dashboard)', async () => {
        // Attempt to access dashboard directly
        await driver.get(`${baseUrl}/dashboard`);

        // Wait for the redirect to happen (which is driven by useEffect in the component)
        await driver.wait(until.urlContains('/login'), 5000, 'Did not redirect to login page');

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${baseUrl}/login`);
    });

    it('should display validation error on failed login attempt', async () => {
        await driver.get(`${baseUrl}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 5000);

        // Find input fields
        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));

        // Type fake credentials
        await emailInput.sendKeys('invalid_test_user@example.com');
        await passwordInput.sendKeys('WrongPassword123!');

        // Find and click the submit button
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        // Wait for error message to appear
        // The error div has classes like "bg-red-50 text-red-600"
        const errorElement = await driver.wait(
            until.elementLocated(By.xpath('//div[contains(@class, "bg-red-50")]')),
            5000
        );

        const errorMessage = await errorElement.getText();

        // Check that an error was displayed 
        // Usually it says "Invalid credentials" or "User not found" depending on API response
        expect(errorMessage.length).toBeGreaterThan(0);
    });


    it('should display validation error for invalid email format', async () => {
        await driver.get(`${baseUrl}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 5000);

        const emailInput = await driver.findElement(By.id('email'));
        const passwordInput = await driver.findElement(By.id('password'));

        await emailInput.sendKeys('notanemail');
        await passwordInput.sendKeys('Password123!');

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        const errorElement = await driver.wait(
            until.elementLocated(By.xpath('//div[contains(@class, "bg-red-50") and contains(text(), "Please enter a valid email address.")]')),
            5000
        );

        const errorMessage = await errorElement.getText();
        expect(errorMessage).toContain('Please enter a valid email address.');
    });
});
