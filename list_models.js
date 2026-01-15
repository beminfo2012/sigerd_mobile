import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAxTyNhjuow54hCB-g_RAtRXZ52zybKgpU";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    try {
        const result = await genAI.listModels();
        const geminiModels = result.models.filter(m => m.name.toLowerCase().includes("gemini"));
        console.log("LIST OF GEMINI MODELS:");
        geminiModels.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedMethods.join(", ")})`);
        });
    } catch (e) {
        console.error("LIST MODELS FAILED:", e.message);
    }
}

run();
