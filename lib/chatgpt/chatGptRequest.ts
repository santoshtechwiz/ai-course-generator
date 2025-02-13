
import Ajv from 'ajv';
import openai from './openaiUtils';



const ajv = new Ajv();

interface OutputFormat {
  summary: string;
}

const outputSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' }
  },
  required: ['summary'],
  
};

export async function chatGptRequest(
  system_prompt: string,
  user_prompt: string,
  output_format: OutputFormat,
  model: string = 'gpt-3.5-turbo-1106'
): Promise<OutputFormat> {
  const validate = ajv.compile(outputSchema);

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: system_prompt },
      { role: 'user', content: user_prompt },
      { role: 'user', content: `Please provide the output in the following JSON format: ${JSON.stringify(output_format)}` }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const result = response.choices[0].message?.content;
  if (!result) {
    throw new Error('No content in the response');
  }

  const parsed_result = JSON.parse(result) as OutputFormat;

  if (!validate(parsed_result)) {
    throw new Error(`Invalid output format: ${ajv.errorsText(validate.errors)}`);
  }

  return parsed_result;
}

