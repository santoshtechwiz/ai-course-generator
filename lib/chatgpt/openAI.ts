import { OpenAI } from "openai";
import https from "https";


const agent = new https.Agent({  
  rejectUnauthorized: false
});
 const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
  dangerouslyAllowBrowser: true
});

export default openai;

