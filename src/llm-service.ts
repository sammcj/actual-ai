import { generateText, LanguageModel } from 'ai';
import { LlmModelFactoryI, LlmServiceI } from './types';

export default class LlmService implements LlmServiceI {
  private readonly model: LanguageModel;

  constructor(
    llmModelFactory: LlmModelFactoryI,
  ) {
    this.model = llmModelFactory.create();
  }

  public async ask(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      prompt,
      temperature: 0.1,
      maxTokens: 1000, // Increased to allow for proper JSON responses
    });

    // Only trim whitespace but preserve quotes and structure
    return text.trim();
  }
}
