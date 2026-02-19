import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB5RAYwr9RFiXTwVN1fjB28PqFM377yIcs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function test25() {
    console.log("Testing model: gemini-2.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`SUCCESS with 2.5: ${response.text().substring(0, 20)}...`);
    } catch (e) {
        console.log(`FAILED with 2.5: ${e.message}`);
    }
}

test25();
