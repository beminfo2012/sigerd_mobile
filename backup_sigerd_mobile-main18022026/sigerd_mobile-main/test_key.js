import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = "AIzaSyCnZ2EF0kCs17H0tFyOGxCZbhoBA2cX_7M";

console.log(`Testing key: ${API_KEY.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Respond with only the word 'OK' if you can read this.");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();
