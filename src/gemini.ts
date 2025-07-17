import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}
