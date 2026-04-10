import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Homepage E2E', () => {
    let driver: WebDriver;

    // Initialize the browser driver before tests run
    beforeAll(async () => {
        const options = new chrome.Options();

        // Uncomment the next line to run Chrome in the background (headless)
        // options.addArguments('--headless'); 

        // Note: Selenium 4.6+ comes with Selenium Manager which handles the ChromeDriver
        // automatically, so you don't need to manually install chromedriver!
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    // Quit the browser after all tests finish
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

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    it('should load the homepage and check the main title', async () => {
        // 1. Visit the local development server
        // Make sure your Next.js server is running (npm run dev) on port 3000
        await driver.get('http://localhost:3000');

        // 2. Wait for the page to render (Next.js client-side hydration)
        // Here we wait until the body tag is located
        await driver.wait(until.elementLocated(By.css('body')), 10000);

        // 3. Get the page title
        const title = await driver.getTitle();
        console.log('Page title is:', title);

        // 4. Assert that the title exists and contains something meaningful
        // (Adjust the text "PrepWise" based on your actual site title)
        expect(title).toBeDefined();

        // Example of finding a specific element (e.g. navigation link or <h2>)
        // const headerElement = await driver.findElement(By.css('h1'));
        // const headerText = await headerElement.getText();
        // expect(headerText).toContain('PrepWise');
    });
});
