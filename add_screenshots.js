const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, '__tests__', 'e2e');
const screenshotsDir = path.join(e2eDir, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.test.ts'));

for (const file of files) {
    const filePath = path.join(e2eDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const oldAfterEach = "afterEach(async () => { /* wait 5 seconds for screenshots */ await driver.sleep(5000); });";

    const newAfterEach = `afterEach(async () => {
    try {
        // Take a screenshot automatically after each test finishes
        const testName = expect.getState().currentTestName.replace(/[^a-zA-Z0-9]/g, '_');
        const image = await driver.takeScreenshot();
        require('fs').writeFileSync(require('path').join(__dirname, 'e2e', 'screenshots', \`\${testName}.png\`), image, 'base64');
    } catch (err) {
        console.error("Screenshot failed:", err);
    }
  });`;

    let updated = false;

    if (content.includes(oldAfterEach)) {
        content = content.replace(oldAfterEach, newAfterEach);
        updated = true;
    } else if (!content.includes('driver.takeScreenshot()')) {
        // if for some reason the 5-sec sleep was missing
        if (content.includes('beforeEach(async () => {')) {
            content = content.replace(
                'beforeEach(async () => {',
                newAfterEach + '\n\n    beforeEach(async () => {'
            );
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Added automatic screenshot capturing to ${file}`);
    }
}
