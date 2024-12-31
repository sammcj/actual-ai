import {
  APICategoryEntity,
  APICategoryGroupEntity,
  APIPayeeEntity,
} from '@actual-app/api/@types/loot-core/server/api-models';
import TransactionService from '../src/transaction-service';
import InMemoryActualApiService from './test-doubles/in-memory-actual-api-service';
import MockedLlmService from './test-doubles/mocked-llm-service';
import MockedPromptGenerator from './test-doubles/mocked-prompt-generator';
import GivenActualData from './test-doubles/given/given-actual-data';

// Mock the config module
jest.mock('../src/config', () => {
  console.log('Mocking config module...')
  const config = {
    createAiCategoryGroups: true,
    aiCategoryGroupConfidence: 8,
    maxAiCategoryGroups: 5,
    createAiRules: true,
    aiRuleConfidence: 8,
    maxAiRules: 10,
    syncAccountsBeforeClassify: false,
    serverURL: '',
    password: '',
    budgetId: '',
    e2ePassword: '',
    cronSchedule: '',
    classifyOnStartup: false,
    llmProvider: 'openai',
    openaiBaseURL: 'https://api.openai.com/v1',
    openaiApiKey: '',
    openaiModel: 'gpt-4-turbo',
    anthropicApiKey: '',
    anthropicBaseURL: 'https://api.anthropic.com/v1',
    anthropicModel: 'claude-3-5-sonnet-latest',
    googleModel: 'gemini-1.5-flash',
    googleBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    googleApiKey: '',
    ollamaBaseURL: '',
    ollamaModel: 'phi3.5',
    dataDir: '/tmp/actual-ai/',
  }
  console.log('Config values:', config)
  return config
});

describe('TransactionService', () => {
  let sut: TransactionService;
  let inMemoryApiService: InMemoryActualApiService;
  let mockedLlmService: MockedLlmService;
  let mockedPromptGenerator: MockedPromptGenerator;
  let shouldRunBankSync = false;

  beforeEach(() => {
    // Clear require cache to ensure config mock is fresh
    jest.resetModules();

    inMemoryApiService = new InMemoryActualApiService();
    mockedLlmService = new MockedLlmService();
    mockedPromptGenerator = new MockedPromptGenerator();

    // Set default responses
    mockedLlmService.setGuess('idk')
    mockedLlmService.setCategoryGroupResponse('[]')
    mockedLlmService.setRuleResponse('[]')
  })

  const setupApiService = () => {
    console.log('Setting up API service...');
    const categoryGroups: APICategoryGroupEntity[] = GivenActualData.createSampleCategoryGroups();
    const categories: APICategoryEntity[] = GivenActualData.createSampleCategories();
    const payees: APIPayeeEntity[] = GivenActualData.createSamplePayees();

    console.log('Initial category groups:', JSON.stringify(categoryGroups, null, 2));
    inMemoryApiService.setCategoryGroups(categoryGroups);
    inMemoryApiService.setCategories(categories);
    inMemoryApiService.setPayees(payees);
  }

  describe('Category Group Creation', () => {
    beforeEach(() => {
      console.log('\n=== Setting up Category Group Creation test ===')
      setupApiService()
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump();
    });

    it('should create new category groups when suggestions meet confidence threshold', async () => {
    // Arrange
      console.log('\nArranging test...');
      const transaction = GivenActualData.createTransaction(
        '1',
        -123,
        'NewStore',
        'Transaction for testing category groups',
      );
      console.log('Test transaction:', JSON.stringify(transaction, null, 2));
      inMemoryApiService.setTransactions([transaction]);

      const suggestedGroups = [
        { name: 'Shopping', confidence: 9, reason: 'Common retail transactions' },
        { name: 'Entertainment', confidence: 8, reason: 'Entertainment expenses' }
      ]

      console.log('Setting up LLM response with groups:', JSON.stringify(suggestedGroups, null, 2))
      mockedLlmService.setCategoryGroupResponse(JSON.stringify(suggestedGroups));

      // Act
      console.log('\nCreating TransactionService...');
      sut = new TransactionService(
        inMemoryApiService,
        mockedLlmService,
        mockedPromptGenerator,
        shouldRunBankSync,
      );

      console.log('Processing transactions...');
      await sut.processTransactions();

      // Debug
      console.log('\nFinal state:')
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump();

      // Assert
      const createdGroups = inMemoryApiService.getCreatedCategoryGroups()
      console.log('Created groups:', createdGroups)
      expect(createdGroups).toContain('ai-Shopping')
      expect(createdGroups).toContain('ai-Entertainment')
    })

    it('should not create category groups when confidence is below threshold', async () => {
      // Arrange
      console.log('\nArranging test...')
      const transaction = GivenActualData.createTransaction(
        '1',
        -123,
        'NewStore',
        'Transaction for testing category groups',
      )
      console.log('Test transaction:', JSON.stringify(transaction, null, 2))
      inMemoryApiService.setTransactions([transaction])

      const suggestedGroups = [
        { name: 'Shopping', confidence: 5, reason: 'Common retail transactions' }
      ]

      console.log('Setting up LLM response with low confidence group:', JSON.stringify(suggestedGroups, null, 2))
      mockedLlmService.setCategoryGroupResponse(JSON.stringify(suggestedGroups))

      // Act
      console.log('\nCreating TransactionService...')
      sut = new TransactionService(
        inMemoryApiService,
        mockedLlmService,
        mockedPromptGenerator,
        shouldRunBankSync,
      )

      console.log('Processing transactions...')
      await sut.processTransactions()

      // Debug
      console.log('\nFinal state:')
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump()

      // Assert
      const createdGroups = inMemoryApiService.getCreatedCategoryGroups()
      console.log('Created groups:', createdGroups)
      expect(createdGroups).toHaveLength(0)
    });
  });

  describe('Rule Creation', () => {
    beforeEach(() => {
      console.log('\n=== Setting up Rule Creation test ===')
      setupApiService()
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump()
    })

    it('should create new rules when suggestions meet confidence threshold', async () => {
  // Arrange
      console.log('\nArranging test...');
      const transaction = GivenActualData.createTransaction(
        '1',
        -123,
        'MonthlyService',
        'Recurring service payment',
      );
      console.log('Test transaction:', JSON.stringify(transaction, null, 2));
      inMemoryApiService.setTransactions([transaction]);

      const suggestedRules = [{
        stage: 'pre',
        conditionsOp: 'and',
        conditions: [
          { field: 'payee', op: 'contains', value: 'MonthlyService' }
        ],
        actions: [
          { field: 'category', op: 'set', value: GivenActualData.CATEGORY_GROCERIES }
        ],
        confidence: 9,
        reason: 'Recurring payment pattern detected'
      }]

      console.log('Setting up LLM response with rules:', JSON.stringify(suggestedRules, null, 2))
      mockedLlmService.setRuleResponse(JSON.stringify(suggestedRules));

      // Act
      console.log('\nCreating TransactionService...');
      sut = new TransactionService(
        inMemoryApiService,
        mockedLlmService,
        mockedPromptGenerator,
        shouldRunBankSync,
      );

      console.log('Processing transactions...');
      await sut.processTransactions();

      // Debug
      console.log('\nFinal state:')
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump();

      // Assert
      const rules = await inMemoryApiService.getRules()
      console.log('Created rules:', JSON.stringify(rules, null, 2))
      expect(rules).toHaveLength(1)
      expect(rules[0].stage).toBe('pre')
      expect(rules[0].conditions?.[0].value).toBe('MonthlyService')
    });

    it('should not create rules when confidence is below threshold', async () => {
    // Arrange
      console.log('\nArranging test...');
      const transaction = GivenActualData.createTransaction(
        '1',
        -123,
        'MonthlyService',
        'Recurring service payment',
      );
      console.log('Test transaction:', JSON.stringify(transaction, null, 2));
      inMemoryApiService.setTransactions([transaction]);

      const suggestedRules = [{
        stage: 'pre',
        conditionsOp: 'and',
        conditions: [
          { field: 'payee', op: 'contains', value: 'MonthlyService' }
        ],
        actions: [
          { field: 'category', op: 'set', value: GivenActualData.CATEGORY_GROCERIES }
        ],
        confidence: 5,
        reason: 'Recurring payment pattern detected'
      }]

      console.log('Setting up LLM response with low confidence rule:', JSON.stringify(suggestedRules, null, 2))
      mockedLlmService.setRuleResponse(JSON.stringify(suggestedRules));

      // Act
      console.log('\nCreating TransactionService...');
      sut = new TransactionService(
        inMemoryApiService,
        mockedLlmService,
        mockedPromptGenerator,
        shouldRunBankSync,
      );

      console.log('Processing transactions...');
      await sut.processTransactions();

      // Debug
      console.log('\nFinal state:')
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump();

      // Assert
      const rules = await inMemoryApiService.getRules()
      console.log('Created rules:', JSON.stringify(rules, null, 2))
      expect(rules).toHaveLength(0)
    });
  });

  describe('Transaction Categorization', () => {
    beforeEach(() => {
      console.log('\n=== Setting up Transaction Categorization test ===')
      setupApiService()
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump()
    })

    it('It should assign a category to transaction', async () => {
      // Arrange
      const transaction = GivenActualData.createTransaction(
        '1',
        -123,
        'Carrefour 1234',
        'Carrefour XXXX1234567 822-307-2000',
      );
      console.log('Test transaction:', JSON.stringify(transaction, null, 2));
      inMemoryApiService.setTransactions([transaction])
      mockedLlmService.setGuess(GivenActualData.CATEGORY_GROCERIES);

      // Act
      console.log('\nCreating TransactionService...');
      sut = new TransactionService(
        inMemoryApiService,
        mockedLlmService,
        mockedPromptGenerator,
        shouldRunBankSync,
      );

      console.log('Processing transactions...');
      await sut.processTransactions();

      // Debug
      console.log('\nFinal state:')
      inMemoryApiService.dump()
      mockedLlmService.dump()
      mockedPromptGenerator.dump();

      // Assert
      const updatedTransactions = await inMemoryApiService.getTransactions();
      expect(updatedTransactions[0].category).toBe(GivenActualData.CATEGORY_GROCERIES)
    })

    // ... other transaction categorization tests ...
  });

  it('It should run bank sync when flag is set', async () => {
    // Arrange
    shouldRunBankSync = true;
    setupApiService();

    // Act
    sut = new TransactionService(
      inMemoryApiService,
      mockedLlmService,
      mockedPromptGenerator,
      shouldRunBankSync,
    );
    await sut.processTransactions();

    // Assert
    expect(inMemoryApiService.getWasBankSyncRan()).toBe(true);
  });
});
