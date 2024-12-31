import {
  APICategoryEntity,
  APICategoryGroupEntity,
  APIPayeeEntity,
} from '@actual-app/api/@types/loot-core/server/api-models';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models';
import { ActualApiServiceI, Rule, PayeeRule } from './types';

class ActualApiService implements ActualApiServiceI {
  private actualApiClient: typeof import('@actual-app/api');

  private fs: typeof import('fs');

  private readonly dataDir: string;

  private readonly serverURL: string;

  private readonly password: string;

  private readonly budgetId: string;

  private readonly e2ePassword: string;

  constructor(
    actualApiClient: typeof import('@actual-app/api'),
    fs: typeof import('fs'),
    dataDir: string,
    serverURL: string,
    password: string,
    budgetId: string,
    e2ePassword: string,
  ) {
    this.actualApiClient = actualApiClient;
    this.fs = fs;
    this.dataDir = dataDir;
    this.serverURL = serverURL;
    this.password = password;
    this.budgetId = budgetId;
    this.e2ePassword = e2ePassword;
  }

  public async initializeApi() {
    if (!this.fs.existsSync(this.dataDir)) {
      this.fs.mkdirSync(this.dataDir);
    }

    await this.actualApiClient.init({
      dataDir: this.dataDir,
      serverURL: this.serverURL,
      password: this.password,
    });

    try {
      if (this.e2ePassword) {
        await this.actualApiClient.downloadBudget(this.budgetId, {
          password: this.e2ePassword,
        });
      } else {
        await this.actualApiClient.downloadBudget(this.budgetId);
      }
      console.log('Budget downloaded');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to download budget:', error.message);
      } else {
        console.error('Failed to download budget:', error);
      }
      throw new Error('Budget download failed');
    }
  }

  public async shutdownApi() {
    await this.actualApiClient.shutdown();
  }

  public async getCategoryGroups(): Promise<APICategoryGroupEntity[]> {
    return this.actualApiClient.getCategoryGroups();
  }

  public async getCategories(): Promise<(APICategoryEntity | APICategoryGroupEntity)[]> {
    return this.actualApiClient.getCategories();
  }

  public async getPayees(): Promise<APIPayeeEntity[]> {
    return this.actualApiClient.getPayees();
  }

  public async getTransactions(): Promise<TransactionEntity[]> {
    return this.actualApiClient.getTransactions(undefined, undefined, undefined);
  }

  public async updateTransactionNotes(id: string, notes: string): Promise<void> {
    await this.actualApiClient.updateTransaction(id, { notes });
  }

  public async updateTransactionNotesAndCategory(
    id: string,
    notes: string,
    categoryId: string,
  ): Promise<void> {
    await this.actualApiClient.updateTransaction(id, { notes, category: categoryId });
  }

  public async runBankSync(): Promise<void> {
    await this.actualApiClient.runBankSync();
  }

  public async createCategoryGroup(name: string): Promise<string> {
    const group = await this.actualApiClient.createCategoryGroup({
      name,
      is_income: false,
    })
    return group
  }

  public async getUncategorizedTransactions(): Promise<TransactionEntity[]> {
    const transactions = await this.getTransactions()
    return transactions.filter(
      (transaction) => !transaction.category
        && (transaction.transfer_id === null || transaction.transfer_id === undefined)
        && transaction.starting_balance_flag !== true
        && transaction.imported_payee !== null
        && transaction.imported_payee !== ''
    )
  }

  private convertToRule(rule: any): Rule {
    return {
      id: rule.id,
      stage: rule.stage || 'default',
      conditionsOp: rule.conditionsOp,
      conditions: rule.conditions,
      actions: rule.actions,
    }
  }

  private convertToPayeeRule(rule: any): PayeeRule {
    return {
      ...this.convertToRule(rule),
      payee_id: rule.payee_id,
    }
  }

  public async getRules(): Promise<Rule[]> {
    const rules = await this.actualApiClient.getRules()
    return rules.map(rule => this.convertToRule(rule))
  }

  public async createRule(rule: Partial<Rule>): Promise<Rule> {
    const createdRule = await this.actualApiClient.createRule({
      ...rule,
      stage: rule.stage || 'default',
    })
    return this.convertToRule(createdRule)
  }

  public async getPayeeRules(payeeId: string): Promise<PayeeRule[]> {
    const rules = await this.actualApiClient.getPayeeRules(payeeId)
    return rules.map(rule => this.convertToPayeeRule(rule))
  }

  public async createPayeeRule(rule: Partial<PayeeRule>): Promise<PayeeRule> {
    if (!rule.payee_id) {
      throw new Error('payee_id is required for payee rules')
    }
    const createdRule = await this.actualApiClient.createRule({
      ...rule,
      stage: rule.stage || 'default',
    })
    return this.convertToPayeeRule(createdRule)
  }
}

export default ActualApiService;
