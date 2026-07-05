import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';

@Injectable()
export class AiService {
  private groq: Groq;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in environment variables');
    }

    this.groq = new Groq({
      apiKey: apiKey,
    });
  }

  async generateTaskBreakdown(title: string, description: string): Promise<string[]> {
    const prompt = `You are a project management assistant. Analyze this task:
              Title: "${title}"
              Description: "${description || 'No additional description.'}"
              
              Generate exactly 3 to 5 clear, concise, actionable sub-steps.
              
              Return your answer as a valid JSON. 
              You MUST respond with a JSON array of strings only. 
              Example: ["Sub-step one", "Sub-step two", "Sub-step three"]
              
              Do not wrap it in any object, do not add keys like "subtasks" or "steps". Just the pure array.`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a strict JSON responder. Always respond with valid JSON only. Never add explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      });

      let content = completion.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('Empty response from Groq');
      }

      content = content
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      let parsed: any;

      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        console.error('JSON Parse Error:', content);
        throw new Error('AI returned invalid JSON');
      }

      let subSteps: string[];

      if (Array.isArray(parsed)) {
        subSteps = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const values = Object.values(parsed);
        subSteps = values.find((v: any) => Array.isArray(v)) || [];
      } else {
        subSteps = [];
      }

      if (!Array.isArray(subSteps) || subSteps.length === 0) {
        console.error('AI response was not array:', parsed);
        throw new Error('AI did not return a valid array of sub-steps');
      }

      return subSteps.map(step => String(step).trim()).filter(step => step.length > 0);
    } catch (error) {
      console.error('Groq AI Generation Error:', error);
      throw new InternalServerErrorException('Failed to generate AI sub-steps. Please try again.');
    }
  }
}
