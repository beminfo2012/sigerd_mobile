import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB5RAYwr9RFiXTwVN1fjB28PqFM377yIcs";
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.0-pro"
];

async function testModels() {
    for (const modelName of modelsToTest) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}: ${response.text().substring(0, 20)}...`);
            process.exit(0); // Exit on first success
        } catch (e) {
            console.log(`FAILED with ${modelName}: ${e.message}`);
        }
    }
}

testModels();
