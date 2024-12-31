import suppressConsoleLogsAsync from './utils';
import {
  ActualApiServiceI, LlmServiceI, PromptGeneratorI, TransactionServiceI,
} from './types';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models'
import { APICategoryGroupEntity } from '@actual-app/api/@types/loot-core/server/api-models'
import {
  createAiCategoryGroups,
  aiCategoryGroupConfidence,
  maxAiCategoryGroups,
  createAiRules,
  aiRuleConfidence,
  maxAiRules,
} from './config';

const NOTES_NOT_GUESSED = 'actual-ai could not guess this category';
const NOTES_GUESSED = 'actual-ai guessed this category';

class TransactionService implements TransactionServiceI {
  private readonly actualAiService: ActualApiServiceI;
  private readonly llmService: LlmServiceI;
  private readonly promptGenerator: PromptGeneratorI;
  private readonly syncAccountsBeforeClassify: boolean;

  constructor(
    actualApiClient: ActualApiServiceI,
    llmService: LlmServiceI,
    promptGenerator: PromptGeneratorI,
    syncAccountsBeforeClassify: boolean,
  ) {
    this.actualAiService = actualApiClient;
    this.llmService = llmService;
    this.promptGenerator = promptGenerator;
    this.syncAccountsBeforeClassify = syncAccountsBeforeClassify;

    // Log config values
    console.log('TransactionService initialized with config:', {
      createAiCategoryGroups,
      aiCategoryGroupConfidence,
      maxAiCategoryGroups,
      createAiRules,
      aiRuleConfidence,
      maxAiRules,
    });
  }

  static findUUIDInString(str: string): string | null {
    const regex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;
    const matchResult = str.match(regex);
    return matchResult ? matchResult[0] : null;
  }

  async syncAccounts(): Promise<void> {
    console.log('Syncing bank accounts');
    try {
      await suppressConsoleLogsAsync(async () => this.actualAiService.runBankSync());
      console.log('Bank accounts synced');
    } catch (error) {
      console.error('Error syncing bank accounts:', error);
    }
  }

  private async analyzeAndCreateCategoryGroups(
    uncategorizedTransactions: TransactionEntity[],
    existingGroups: APICategoryGroupEntity[],
  ): Promise<void> {
    console.log('analyzeAndCreateCategoryGroups called with config:', {
      createAiCategoryGroups,
      aiCategoryGroupConfidence,
      maxAiCategoryGroups,
    })

    if (!createAiCategoryGroups) {
      console.log('Category group creation is disabled')
      return
    }

    if (uncategorizedTransactions.length === 0) {
      console.log('No uncategorized transactions to analyze')
      return
    }

    console.log('Analyzing transactions for potential new category groups...')
    console.log(`Confidence threshold: ${aiCategoryGroupConfidence}`)
    console.log(`Max groups: ${maxAiCategoryGroups}`)
    console.log('Existing groups:', existingGroups)
    console.log('Uncategorized transactions:', uncategorizedTransactions)

    const prompt = this.promptGenerator.generateCategoryGroupAnalysis(
      existingGroups,
      uncategorizedTransactions,
      aiCategoryGroupConfidence,
      maxAiCategoryGroups,
    )

    console.log('Generated category group prompt:', prompt)
    const suggestion = await this.llmService.ask(prompt)
    console.log('Received category group suggestion:', suggestion)

    try {
      const suggestedGroups = JSON.parse(suggestion)

      if (!Array.isArray(suggestedGroups)) {
        console.warn('Invalid response format from LLM for category groups')
        return
      }

      console.log(`Processing ${suggestedGroups.length} suggested groups`)
      for (const group of suggestedGroups) {
        if (
          typeof group === 'object' &&
          group !== null &&
          typeof group.name === 'string' &&
          typeof group.confidence === 'number' &&
          group.confidence >= aiCategoryGroupConfidence
        ) {
          const groupName = `ai-${group.name}`
          console.log(`Creating new category group: ${groupName} (confidence: ${group.confidence})`)
          await this.actualAiService.createCategoryGroup(groupName)
        } else {
          console.log('Skipping group due to invalid format or low confidence:', group)
        }
      }
    } catch (error) {
      console.error('Error processing LLM suggestions for category groups:', error)
    }
  }

  private async analyzeAndCreateRules(
    uncategorizedTransactions: TransactionEntity[],
  ): Promise<void> {
    console.log('analyzeAndCreateRules called with config:', {
      createAiRules,
      aiRuleConfidence,
      maxAiRules,
    })

    if (!createAiRules) {
      console.log('Rule creation is disabled')
      return
    }

    if (uncategorizedTransactions.length === 0) {
      console.log('No uncategorized transactions to analyze')
      return
    }

    console.log('Analyzing transactions for potential new rules...')
    console.log(`Confidence threshold: ${aiRuleConfidence}`)
    console.log(`Max rules: ${maxAiRules}`)
    console.log('Uncategorized transactions:', uncategorizedTransactions)

    const existingRules = await this.actualAiService.getRules()
    console.log('Existing rules:', existingRules)

    const prompt = this.promptGenerator.generateRuleAnalysis(
      uncategorizedTransactions,
      existingRules,
      aiRuleConfidence,
      maxAiRules,
    )

    console.log('Generated rule prompt:', prompt)
    const suggestion = await this.llmService.ask(prompt)
    console.log('Received rule suggestion:', suggestion)

    try {
      const suggestedRules = JSON.parse(suggestion)

      if (!Array.isArray(suggestedRules)) {
        console.warn('Invalid response format from LLM for rules')
        return
      }

      console.log(`Processing ${suggestedRules.length} suggested rules`)
      for (const rule of suggestedRules) {
        if (
          typeof rule === 'object' &&
          rule !== null &&
          typeof rule.confidence === 'number' &&
          rule.confidence >= aiRuleConfidence &&
          rule.stage &&
          Array.isArray(rule.conditions) &&
          Array.isArray(rule.actions)
        ) {
          console.log(`Creating new rule with confidence: ${rule.confidence}`)
          console.log(`Conditions: ${JSON.stringify(rule.conditions)}`)
          console.log(`Actions: ${JSON.stringify(rule.actions)}`)

          await this.actualAiService.createRule({
            stage: rule.stage,
            conditionsOp: rule.conditionsOp || 'and',
            conditions: rule.conditions,
            actions: rule.actions,
          })
        } else {
          console.log('Skipping rule due to invalid format or low confidence:', rule)
        }
      }
    } catch (error) {
      console.error('Error processing LLM suggestions for rules:', error)
    }
  }

  async processTransactions(): Promise<void> {
    console.log('processTransactions called');

    if (this.syncAccountsBeforeClassify) {
      await this.syncAccounts();
    }

    const categoryGroups = await this.actualAiService.getCategoryGroups();
    const categories = await this.actualAiService.getCategories();
    const payees = await this.actualAiService.getPayees();
    const uncategorizedTransactions = await this.actualAiService.getUncategorizedTransactions()

    console.log(`Found ${uncategorizedTransactions.length} uncategorized transactions`)
    console.log('Initial category groups:', categoryGroups)

    // First, analyze and create any new category groups if enabled
    await this.analyzeAndCreateCategoryGroups(uncategorizedTransactions, categoryGroups)

    // Then, analyze and create any new rules if enabled
    await this.analyzeAndCreateRules(uncategorizedTransactions)

    // Refresh category groups in case new ones were created
    const updatedCategoryGroups = await this.actualAiService.getCategoryGroups()
    console.log('Updated category groups:', updatedCategoryGroups)

    // Now process individual transactions
    const transactionsToProcess = uncategorizedTransactions.filter(
      transaction => !transaction.notes || !transaction.notes.includes(NOTES_NOT_GUESSED)
    );

    console.log(`Processing ${transactionsToProcess.length} transactions`)
    for (let i = 0; i < transactionsToProcess.length; i++) {
      const transaction = transactionsToProcess[i]
      console.log(`${i + 1}/${transactionsToProcess.length} Processing transaction ${transaction.imported_payee} / ${transaction.notes} / ${transaction.amount}`)

      const prompt = this.promptGenerator.generate(updatedCategoryGroups, transaction, payees);
      const guess = await this.llmService.ask(prompt);
      const guessUUID = TransactionService.findUUIDInString(guess);
      const guessCategory = categories.find((category) => category.id === guessUUID);

      if (!guessCategory) {
        console.warn(`${i + 1}/${transactionsToProcess.length} LLM could not classify the transaction. LLM guess: ${guess}`);
        await this.actualAiService.updateTransactionNotes(transaction.id, `${transaction.notes} | ${NOTES_NOT_GUESSED}`);
        continue;
      }
      console.log(`${i + 1}/${transactionsToProcess.length} Guess: ${guessCategory.name}`);

      await this.actualAiService.updateTransactionNotesAndCategory(
        transaction.id,
        `${transaction.notes} | ${NOTES_GUESSED}`,
        guessCategory.id,
      );
    }
  }
}

export default TransactionService;
