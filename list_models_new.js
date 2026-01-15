import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB5RAYwr9RFiXTwVN1fjB28PqFM377yIcs";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Listing models for the new key...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Found models:");
            data.models.forEach(m => {
                console.log(`${m.name} - methods: ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
