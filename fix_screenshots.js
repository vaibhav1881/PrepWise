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

    // We are going to fix the bad path.
    // Previous string had: join(__dirname, 'e2e', 'screenshots', \`\${testName}.png\`)
    // Current directory is __tests__/e2e

    if (content.includes("require('path').join(__dirname, 'e2e', 'screenshots'")) {
        content = content.replace(
            "require('path').join(__dirname, 'e2e', 'screenshots', `${testName}.png`)",
            "require('path').join(__dirname, 'screenshots', `${testName}.png`)"
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed screenshot path in ${file}`);
    }
}
