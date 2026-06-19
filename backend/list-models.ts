import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const ai = new GoogleGenAI();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  const modelNames = data.models.map((m: any) => m.name);
  console.log('Available models:', modelNames.join(', '));
}
test();
