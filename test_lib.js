import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAxTyNhjuow54hCB-g_RAtRXZ52zybKgpU";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    console.log("Testing generation with @google/generative-ai library...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Diga 'OK' se estiver funcionando.");
        const response = await result.response;
        console.log("SUCCESS! Response:", response.text());
    } catch (e) {
        console.error("FAILED with library:", e.message);
        if (e.message.includes("403")) {
            console.log("Key is definitively leaked/blocked for generation.");
        }
    }
}

run();
