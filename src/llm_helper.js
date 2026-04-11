import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://whgjf3nuoysl5swwb6vcnhew.agents.do-ai.run/api/v1/',
  apiKey: process.env.OPENAI_API_KEY,
});
async function getBookTeaser() {
  try {
    const response = await openai.chat.completions.create({
      model: 'OpenAI GPT-oss-120b',
      messages: [
        {
          role: 'user',
          content: `Generate a teaser for the book with name: ${book.title} . 
          Return ONLY a JSON object with this structure:
          {
            "name": "string",
            "category": "string",
            "teaser": "string"
          }`,
        },
      ],
      response_format: { type: 'json_object' },
      stream: false,
    });

    //a clean object
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Failed to fetch teaser:', error);
    return null;
  }
}
const book = { title: 'Darkly Dreaming Dexter' }; // Example book, to be removed later when we fetch the book from the database
const teaserData = await getBookTeaser(book.title);

if (teaserData) {
  console.log(teaserData);
} else {
  console.log('Something went wrong.');
}
