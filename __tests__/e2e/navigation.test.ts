import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Navigation & Public Routes E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    beforeAll(async () => {
        const options = new chrome.Options();
        // options.addArguments('--headless'); // Uncomment for CI/CD
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
        // Start at homepage before each test
        await driver.get(baseUrl);
        await driver.wait(until.elementLocated(By.css('body')), 5000);
    });

    it('should verify homepage content for unauthenticated users', async () => {
        const heading = await driver.wait(until.elementLocated(By.xpath('//h1[contains(text(), "Welcome to")]')), 5000);
        const headingText = await heading.getText();
        expect(headingText).toContain('Welcome to');

        const subText = await driver.findElement(By.css('p')).getText();
        expect(subText).toContain('Master your interview skills');

        // Verify 'Why PrepWise?' section exists
        const whySection = await driver.findElement(By.xpath('//h2[contains(text(), "Why PrepWise?")]'));
        expect(await whySection.isDisplayed()).toBeTruthy();
    });

    it('should navigate to Login page when "Log In" button is clicked', async () => {
        // Find the Login button using its exact text inside a link
        const loginButton = await driver.wait(until.elementLocated(By.xpath('//a[@href="/login"]//button')), 5000);

        // Click it
        await loginButton.click();

        // Wait for URL to change
        await driver.wait(until.urlContains('/login'), 5000);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${baseUrl}/login`);
    });

    it('should navigate to Sign Up page when "Sign Up" button is clicked', async () => {
        const signupButton = await driver.wait(until.elementLocated(By.xpath('//a[@href="/signup"]//button')), 5000);

        await signupButton.click();

        await driver.wait(until.urlContains('/signup'), 5000);

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toBe(`${baseUrl}/signup`);
    });
});
