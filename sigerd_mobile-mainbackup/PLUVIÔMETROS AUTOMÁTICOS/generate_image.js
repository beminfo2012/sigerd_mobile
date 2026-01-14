
// generate_image.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        console.log("Reading data...");
        const dataPath = path.join(__dirname, 'rain_data.json');
        if (!fs.existsSync(dataPath)) {
            throw new Error("rain_data.json not found. Run fetch_data.js first.");
        }
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        console.log("Launching browser...");
        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();

        // Set viewport to Stories resolution
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

        console.log("Loading template...");
        const templatePath = path.join(__dirname, 'template.html');
        const content = fs.readFileSync(templatePath, 'utf8');

        // We can load the file via 'file://' URL or setContent.
        // setContent is safer for relative paths if we handle styles correctly,
        // but let's try opening the file directly to resolve relative paths if any (none currently).
        await page.setContent(content);

        // Inject data
        console.log("Injecting data...");
        await page.evaluate((weatherData) => {
            window.renderData(weatherData);
        }, data);

        // Wait for a moment to ensure rendering matches styles (Google Fonts might take a split second)
        // We can wait for fonts or just a small timeout.
        await page.waitForNetworkIdle();
        // Or explicit wait
        await new Promise(r => setTimeout(r, 1000));

        console.log("Taking screenshot...");
        await page.screenshot({
            path: 'pluviometros_art.png',
            fullPage: true
        });
        console.log("Image saved to pluviometros_art.png");

        await browser.close();

    } catch (e) {
        console.error("Error generating image:", e);
    }
}

run();
