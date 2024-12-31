import { PromptGeneratorI } from '../../src/types';

export default class MockedPromptGenerator implements PromptGeneratorI {
  private transactionResponse = 'Please categorize the following transaction:';

  generate(): string {
    console.log('Generating transaction prompt:', this.transactionResponse)
    return this.transactionResponse
  }

  generateCategoryGroupAnalysis(
    categoryGroups: any,
    transactions: any,
    confidenceThreshold: number,
    maxGroups: number,
  ): string {
    const prompt = `Analyze the following uncategorized transactions and suggest new category groups.

Current category groups:
${categoryGroups.map((g: any) => `* ${g.name}`).join('\n')}

Based on the transactions above and existing category groups, suggest up to ${maxGroups} new category groups.
Only suggest groups if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`

    console.log('Generating category group analysis prompt:', prompt)
    return prompt
  }

  generateRuleAnalysis(
    transactions: any,
    existingRules: any,
    confidenceThreshold: number,
    maxRules: number,
  ): string {
    const prompt = `Analyze the following transactions and suggest new rules for automatic categorization.

Current rules:
${existingRules.map((r: any) => `* ${r.stage}`).join('\n')}

Based on the transactions above and existing rules, suggest up to ${maxRules} new rules.
Only suggest rules if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`

    console.log('Generating rule analysis prompt:', prompt)
    return prompt
  }

  setTransactionResponse(response: string): void {
    console.log('Setting transaction response:', response)
    this.transactionResponse = response
  }

  // For debugging
  dump(): void {
    console.log('=== MockedPromptGenerator State ===')
    console.log('Transaction Response:', this.transactionResponse)
    console.log('=== End State ===');
  }
}
