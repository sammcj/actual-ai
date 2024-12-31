import { LlmServiceI } from '../../src/types';

export default class MockedLlmService implements LlmServiceI {
  private categoryGuess = 'idk';
  private categoryGroupResponse = '[]';
  private ruleResponse = '[]';
  private lastPrompt = '';

  async ask(prompt: string): Promise<string> {
    this.lastPrompt = prompt
    console.log('MockedLlmService received prompt:', prompt)

    // Return different responses based on the prompt content
    if (prompt.includes('Analyze the following uncategorized transactions and suggest new category groups')) {
      console.log('Detected category group analysis prompt')
      console.log('Returning category group response:', this.categoryGroupResponse)
      return Promise.resolve(this.categoryGroupResponse)
    }

    if (prompt.includes('Analyze the following transactions and suggest new rules')) {
      console.log('Detected rule analysis prompt')
      console.log('Returning rule response:', this.ruleResponse)
      return Promise.resolve(this.ruleResponse)
    }

    if (prompt.includes('Please categorize the following transaction')) {
      console.log('Detected transaction categorization prompt')
      console.log('Returning category guess:', this.categoryGuess)
      return Promise.resolve(this.categoryGuess)
    }

    console.log('No specific prompt type detected, returning category guess:', this.categoryGuess)
    return Promise.resolve(this.categoryGuess);
  }

  setGuess(guess: string): void {
    console.log('Setting category guess:', guess)
    this.categoryGuess = guess
  }

  setCategoryGroupResponse(response: string): void {
    console.log('Setting category group response:', response)
    try {
      // Validate the response is valid JSON
      const parsed = JSON.parse(response)
      if (!Array.isArray(parsed)) {
        throw new Error('Category group response must be a JSON array')
      }
      this.categoryGroupResponse = response
    } catch (error) {
      console.error('Invalid category group response:', error)
      throw error
    }
  }

  setRuleResponse(response: string): void {
    console.log('Setting rule response:', response)
    try {
      // Validate the response is valid JSON
      const parsed = JSON.parse(response)
      if (!Array.isArray(parsed)) {
        throw new Error('Rule response must be a JSON array')
      }
      this.ruleResponse = response
    } catch (error) {
      console.error('Invalid rule response:', error)
      throw error
    }
  }

  // For debugging
  getLastPrompt(): string {
    return this.lastPrompt
  }

  getLastCategoryGroupResponse(): string {
    return this.categoryGroupResponse
  }

  getLastRuleResponse(): string {
    return this.ruleResponse
  }

  dump(): void {
    console.log('=== MockedLlmService State ===')
    console.log('Category Guess:', this.categoryGuess)
    console.log('Category Group Response:', this.categoryGroupResponse)
    console.log('Rule Response:', this.ruleResponse)
    console.log('Last Prompt:', this.lastPrompt)
    console.log('=== End State ===');
  }
}
