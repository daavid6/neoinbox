import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../private/enviroment.js';

const genAI = new GoogleGenerativeAI(environment.generativeAIApiKey);
export const summaryModel = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash-lite',
	systemInstruction:
		'You are a professional email management assistant. Your task is to create concise summaries of HTML-formatted emails, reducing content by 50-70% while preserving crucial details such as names, dates, action items, and key information. Maintain the original tone, formality, and context. Format your summary as clean HTML without excessive spacing or line breaks. Focus only on summarization while ensuring no important information is lost. You must remove the markdown code block delimiters of starting and ending triple backticks from the input text.',
});

/**
 *
 * @param {string} text
 * @returns
 */
export function clearMarkdown(text) {
	return text.replace(/```html\n/g, '').replace(/<\/html>\n```/g, '</html>');
}
