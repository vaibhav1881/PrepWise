const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, '__tests__', 'e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.test.ts'));

for (const file of files) {
    const filePath = path.join(e2eDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('afterEach(async () => { await driver.sleep(')) {
        // We want the browser window to stay open 5s after EACH test
        // So user can screenshot
        content = content.replace(
            'beforeEach(async () => {',
            'afterEach(async () => { /* wait 5 seconds for screenshots */ await driver.sleep(5000); });\n\n    beforeEach(async () => {'
        );

        // Some tests like home.test.ts might not have beforeEach? Wait, home doesn't. 
        // Let's check if they have it, if not, append to beforeAll or afterAll.
        if (!content.includes('afterEach(async () => {')) {
            // if beforeEach wasn't there
            content = content.replace(
                'afterAll(async () => {',
                'afterEach(async () => { /* wait 5 seconds for screenshots */ await driver.sleep(5000); });\n\n    afterAll(async () => {'
            )
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
