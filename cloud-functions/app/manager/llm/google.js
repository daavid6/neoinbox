import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { environment } from '../../private/enviroment.js';

const genAI = new GoogleGenerativeAI(environment.generativeAIApiKey);
export const summaryModel = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash-lite',
	systemInstruction:
		'You are a professional email management assistant. Your task is to create concise summaries of HTML-formatted emails, reducing content by 50-70% while preserving crucial details such as names, dates, action items, and key information. Maintain the original tone, formality, and context. Format your summary as clean HTML without excessive spacing or line breaks. Focus only on summarization while ensuring no important information is lost. You must remove the markdown code block delimiters of starting and ending triple backticks from the input text.',
});

/**
 * Dates model
 */

const datesSchema = {
	description: 'Comprehensive list of meetings and events extracted from email content',
	type: SchemaType.ARRAY,
	items: {
		type: SchemaType.OBJECT,
		properties: {
			title: {
				type: SchemaType.STRING,
				description:
					'A great descriptive english title for the event (e.g., "Project Review", "Team Standup", "Movile World Congress").',
				nullable: false,
			},
			start: {
				type: SchemaType.STRING,
				description:
					'ISO 8601 formatted start time in UTC (YYYY-MM-DDThh:mm:ssZ). Must be chronologically before end time.',
				nullable: false,
				pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
			},
			end: {
				type: SchemaType.STRING,
				description:
					'ISO 8601 formatted end time in UTC (YYYY-MM-DDThh:mm:ssZ). Must be chronologically after start time.',
				nullable: true,
				pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
			},
			wasEndEstimated: {
				type: SchemaType.BOOLEAN,
				description:
					'Indicates whether the end time was estimated based on the duration or explicitly mentioned.',
				nullable: false,
			},
		},
		required: ['title', 'start', 'end', 'wasEndEstimated'],
	},
};

export const datesModel = genAI.getGenerativeModel({
	model: 'gemini-2.0-flash',
	generationConfig: {
		responseMimeType: 'application/json',
		responseSchema: datesSchema,
		temperature: 0.2, // Lower temperature for more consistent outputs
		topK: 40, // Add parameter to focus on most likely tokens
		topP: 0.95, // Add nucleus sampling
		maxOutputTokens: 1024, // Limit output size
	},
	systemInstruction: `You are an expert calendar scheduling assistant specialized in extracting meeting information from emails.

TASK:
Extract all meetings, appointments, and events with their start and end times from provided emails.

TIMEZONE HANDLING:
- All times in emails are in Madrid timezone (UTC+1 / and UTC+2 after 30 of march)
- ALWAYS convert extracted times to UTC (ISO-8601 format with 'Z' suffix)
- Account for daylight saving time automatically

FORMAT REQUIREMENTS:
- Return valid JSON array of meeting objects
- Each meeting must have a 'title' field with a descriptive name
- Each meeting must have 'start' field in ISO-8601 format (YYYY-MM-DDThh:mm:ssZ)
- Include a consistent 'end' field that make sense when duration is specified.
- There must be at least 10 minutes between start and end times.
- Ensure end time is ALWAYS later than start time
- Include a 'wasEndEstimated' field to indicate if end time is an infered estimation or if it was explicitly mentioned
- Do not create placeholder meetings if no meeting information exists

EXTRACTION RULES:
1. Extract ONLY meetings explicitly mentioned in the email
2. Infer current date ${Date.now().toString()} if not specified
3. For relative references (e.g., "tomorrow", "next week"), calculate correct date
4. For recurring meetings, return only the next occurrence
5. For ambiguous times (e.g., "afternoon"), use reasonable estimates (2pm-5pm)

EXAMPLES:
- Input: "Let's meet tomorrow at 3pm for one hour" (If today is Friday 2025-03-07)
  Output: [{"title": "Meeting", "start":"2025-03-08T14:00:00Z","end":"2025-03-08T15:00:00Z", "wasEndEstimated": false}]

- Input: "Weekly meeting every Monday at 10am Madrid time" (If today is Friday 2025-03-07)
  Output: [{"title": "Weekly meeting", "start":"2025-03-10T09:00:00Z","end":"2025-03-10T10:00:00Z", "wasEndEstimated": true}]

- Input: "Conference from April 5-7, 9am to 6pm each day"
  Output: [
    {"title": "Conference", "start":"2025-04-05T07:00:00Z","end":"2025-04-05T16:00:00Z", "wasEndEstimated": false},
    {"title": "Conference", "start":"2025-04-06T07:00:00Z","end":"2025-04-06T16:00:00Z", "wasEndEstimated": false},
    {"title": "Conference", "start":"2025-04-07T07:00:00Z","end":"2025-04-07T16:00:00Z", "wasEndEstimated": false},
  ]

- Input: "Tomorrow at first hour we have a meeting"
  Output: [{"title": "Morning meeting", "start":"2025-03-08T08:00:00Z","end":"2025-03-08T09:00:00Z", "wasEndEstimated": true}]


- Input: "Remember going in in 2 days we have the Google Next Conference, see you there at 12:00"
  Output: [{"title": "Google Next Conference", "start":"2025-03-09T11:00:00Z","end":"2025-03-09T13:00:00Z", "wasEndEstimated": true}]


  `,

});

export function clearMarkdownHtml(text) {
	return text.replace(/```html\n/g, '').replace(/<\/html>\n```/g, '</html>');
}
