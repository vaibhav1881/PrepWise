import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

describe('PrepWise Dashboard & Features E2E', () => {
    let driver: WebDriver;
    const baseUrl = 'http://localhost:3000';

    // Mock a JWT and user object to simulate being logged in securely
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
        // Navigate to base URL so we can inject localStorage
        await driver.get(baseUrl);

        // Inject auth tokens to bypass actual login screen
        await driver.executeScript(`
      window.localStorage.setItem('token', arguments[0]);
      window.localStorage.setItem('user', arguments[1]);
    `, mockToken, mockUser);
    });

    it('should authenticate automatically using mock tokens and load the dashboard', async () => {
        // Navigate straight to dashboard. Next.js will read injected localStorage and render dashboard
        await driver.get(`${baseUrl}/dashboard`);

        // Wait for the Dashboard title to render (React splits text nodes, so use `.` instead of `text()`)
        const welcomeHeader = await driver.wait(
            until.elementLocated(By.xpath(`//*[contains(., 'Welcome back, Selenium Tester!')]`)),
            10000
        );

        expect(await welcomeHeader.isDisplayed()).toBeTruthy();

        // Verify "Start Interview" Card exists
        const startCard = await driver.findElement(By.xpath(`//div[contains(text(), 'Start Interview')]`));
        expect(await startCard.isDisplayed()).toBeTruthy();
    });

    it('should navigate to the Interview Setup page when "Start Interview" card is clicked', async () => {
        await driver.get(`${baseUrl}/dashboard`);

        // Find the "Start Interview" card and click it 
        // It is wrapped inside a <Card> div with an onClick handler routing to '/interview/start'
        const startCard = await driver.wait(
            until.elementLocated(By.xpath(`//div[contains(text(), 'New Practice')]`)),
            10000
        );

        // Some elements are overlays, so we click the card header
        await startCard.click();

        // Verify navigation was successful
        await driver.wait(until.urlContains('/interview/start'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('/interview/start');
    });

    it('should have a working Logout button inside the dashboard', async () => {
        await driver.get(`${baseUrl}/dashboard`);

        // Find the Logout button
        const logoutBtn = await driver.wait(
            until.elementLocated(By.xpath(`//button[contains(text(), 'Logout')]`)),
            10000
        );

        // Click it
        await logoutBtn.click();

        // Wait for redirect back to login and localstorage to be cleared
        await driver.wait(until.urlContains('/login'), 5000);

        const token = await driver.executeScript("return window.localStorage.getItem('token');");
        expect(token).toBeNull(); // Should be removed!
    });
});
