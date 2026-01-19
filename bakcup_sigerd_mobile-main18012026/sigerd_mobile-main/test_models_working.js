import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAOj89xVrlwTMfCyNHMJnE9tJbk2eH6Fsc";
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
    "models/gemini-pro",
    "models/gemini-1.5-pro",
    "models/gemini-1.5-flash"
];

async function testModels() {
    console.log("Testing available models...\n");

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName} works!`);
            console.log(`   Response: ${response.text().substring(0, 50)}...\n`);
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
}

testModels();
