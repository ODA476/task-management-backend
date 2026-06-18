import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private readonly configService: ConfigService) {
    // Pull the API key from our environment variables
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    // Using the current standard Gemini 1.5 Flash model URL
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  }

  async generateTaskBreakdown(title: string, description: string): Promise<string[]> {
    // Construct a clear, strict prompt instructing the AI to output ONLY raw JSON lines
    const prompt = `You are a project management assistant. Analyze this task:
    Title: "${title}"
    Description: "${description}"
    
    Generate exactly 3 to 5 clear, concise, actionable sub-steps to complete this task. 
    Return your answer ONLY as a valid, single-line JSON array of strings. Do not include markdown blocks, code formatting, backticks, or extra text.
    Example output format: ["Sub-step 1", "Sub-step 2", "Sub-step 3"]`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Sometimes AI includes markdown code blocks like ```json ... ``` 
      // even if told not to. This regex cleans that up:
      text = text.replace(/^```json/i, '').replace(/```$/i, '').trim();

      const subSteps: string[] = JSON.parse(text);
      return subSteps;
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new InternalServerErrorException('Failed to generate AI sub-steps.');
    }
  }
}
