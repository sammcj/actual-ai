import { generateText, LanguageModel } from 'ai'
import { LlmModelFactoryI, LlmServiceI } from './types'

export default class LlmService implements LlmServiceI {
  private readonly model: LanguageModel

  constructor(llmModelFactory: LlmModelFactoryI) {
    this.model = llmModelFactory.create()
  }

  private extractJsonArray(text: string): string {
    // Find the first '[' and last ']' to extract just the JSON array
    const start: number = text.indexOf('[')
    const end: number = text.lastIndexOf(']') + 1

    if (start === -1 || end === 0) {
      console.error('No JSON array found in response:', text)
      return '[]'
    }

    // Extract just the array part
    const jsonPart: string = text.substring(start, end)

    try {
      // Validate it's proper JSON
      const parsed: unknown = JSON.parse(jsonPart)

      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        console.error('Parsed JSON is not an array:', parsed)
        return '[]'
      }

      // Return the validated array
      return JSON.stringify(parsed)
    } catch (e: unknown) {
      console.error('Failed to parse JSON array:', e)
      console.error('JSON content was:', jsonPart)
      return '[]'
    }
  }

  public async ask(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      prompt,
      temperature: 0.1,
      maxTokens: 2000,
    })

    // For JSON responses, extract and validate the JSON array
    if (prompt.includes('Respond in JSON format')) {
      return this.extractJsonArray(text)
    }

    // For non-JSON responses, just trim whitespace
    return text.trim()
  }
}
