import {
  APICategoryEntity,
  APICategoryGroupEntity,
  APIPayeeEntity,
} from '@actual-app/api/@types/loot-core/server/api-models';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models';
import { ActualApiServiceI, Rule, PayeeRule } from '../../src/types';

export default class InMemoryActualApiService implements ActualApiServiceI {
  private categoryGroups: APICategoryGroupEntity[] = [];
  private categories: (APICategoryEntity | APICategoryGroupEntity)[] = [];
  private payees: APIPayeeEntity[] = [];
  private transactions: TransactionEntity[] = [];
  private rules: Rule[] = [];
  private payeeRules: PayeeRule[] = [];
  private wasBankSyncRan = false;
  private createdCategoryGroups: string[] = [];

  async initializeApi(): Promise<void> {
    // Initialize the API (mock implementation)
  }

  async shutdownApi(): Promise<void> {
    // Shutdown the API (mock implementation)
  }

  async getCategoryGroups(): Promise<APICategoryGroupEntity[]> {
    console.log('Getting category groups:', JSON.stringify(this.categoryGroups, null, 2))
    return Promise.resolve([...this.categoryGroups]);
  }

  setCategoryGroups(categoryGroups: APICategoryGroupEntity[]): void {
    console.log('Setting category groups:', JSON.stringify(categoryGroups, null, 2))
    this.categoryGroups = [...categoryGroups];
  }

  async getCategories(): Promise<(APICategoryEntity | APICategoryGroupEntity)[]> {
    return Promise.resolve([...this.categories]);
  }

  setCategories(categories: (APICategoryEntity | APICategoryGroupEntity)[]): void {
    this.categories = [...categories];
  }

  async getPayees(): Promise<APIPayeeEntity[]> {
    return Promise.resolve([...this.payees]);
  }

  setPayees(payees: APIPayeeEntity[]): void {
    this.payees = [...payees];
  }

  async getTransactions(): Promise<TransactionEntity[]> {
    return Promise.resolve([...this.transactions]);
  }

  setTransactions(transactions: TransactionEntity[]): void {
    console.log('Setting transactions:', JSON.stringify(transactions, null, 2))
    this.transactions = transactions.map(t => ({ ...t }));
  }

  async updateTransactionNotes(id: string, notes: string): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.transactions.find((t) => t.id === id);

      if (!transaction) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      transaction.notes = notes;
      resolve();
    });
  }

  async updateTransactionNotesAndCategory(
    id: string,
    notes: string,
    categoryId: string,
  ): Promise<void> {
    return new Promise((resolve) => {
      const transaction = this.transactions.find((t) => t.id === id);
      if (!transaction) {
        throw new Error(`Transaction with id ${id} not found`);
      }
      transaction.notes = notes;
      transaction.category = categoryId;
      resolve();
    });
  }

  async runBankSync(): Promise<void> {
    this.wasBankSyncRan = true;
    return Promise.resolve();
  }

  public getWasBankSyncRan(): boolean {
    return this.wasBankSyncRan;
  }

  async createCategoryGroup(name: string): Promise<string> {
    console.log('Creating category group:', name)
    this.createdCategoryGroups.push(name)
    const id = `group-${this.createdCategoryGroups.length}`
    const newGroup: APICategoryGroupEntity = {
      id,
      name,
      is_income: false,
      categories: [],
    }
    console.log('New category group:', JSON.stringify(newGroup, null, 2))
    this.categoryGroups = [...this.categoryGroups, newGroup]
    return Promise.resolve(id)
  }

  getCreatedCategoryGroups(): string[] {
    console.log('Getting created category groups:', this.createdCategoryGroups)
    return [...this.createdCategoryGroups]
  }

  async getUncategorizedTransactions(): Promise<TransactionEntity[]> {
    const uncategorized = this.transactions.filter(
      (t) => !t.category &&
        (t.transfer_id === undefined) &&
        t.starting_balance_flag !== true &&
        t.imported_payee !== null &&
        t.imported_payee !== ''
    )
    console.log('Getting uncategorized transactions:', JSON.stringify(uncategorized, null, 2))
    return Promise.resolve(uncategorized.map(t => ({ ...t })))
  }

  async getRules(): Promise<Rule[]> {
    console.log('Getting rules:', JSON.stringify(this.rules, null, 2))
    return Promise.resolve([...this.rules])
  }

  setRules(rules: Rule[]): void {
    console.log('Setting rules:', JSON.stringify(rules, null, 2))
    this.rules = rules.map(r => ({ ...r }))
  }

  async createRule(rule: Rule): Promise<Rule> {
    console.log('Creating rule:', JSON.stringify(rule, null, 2))
    const newRule = { ...rule, id: `rule-${this.rules.length + 1}` }
    this.rules = [...this.rules, newRule]
    console.log('Rules after creation:', JSON.stringify(this.rules, null, 2))
    return Promise.resolve({ ...newRule })
  }

  async getPayeeRules(payeeId: string): Promise<PayeeRule[]> {
    const rules = this.payeeRules.filter(r => r.payee_id === payeeId)
    console.log('Getting payee rules for', payeeId, ':', JSON.stringify(rules, null, 2))
    return Promise.resolve(rules.map(r => ({ ...r })))
  }

  setPayeeRules(rules: PayeeRule[]): void {
    console.log('Setting payee rules:', JSON.stringify(rules, null, 2))
    this.payeeRules = rules.map(r => ({ ...r }))
  }

  async createPayeeRule(rule: PayeeRule): Promise<PayeeRule> {
    console.log('Creating payee rule:', JSON.stringify(rule, null, 2))
    const newRule = { ...rule, id: `payee-rule-${this.payeeRules.length + 1}` }
    this.payeeRules = [...this.payeeRules, newRule]
    console.log('Payee rules after creation:', JSON.stringify(this.payeeRules, null, 2))
    return Promise.resolve({ ...newRule })
  }

  // For debugging
  dump(): void {
    console.log('=== InMemoryActualApiService State ===')
    console.log('Category Groups:', JSON.stringify(this.categoryGroups, null, 2))
    console.log('Categories:', JSON.stringify(this.categories, null, 2))
    console.log('Created Category Groups:', this.createdCategoryGroups)
    console.log('Rules:', JSON.stringify(this.rules, null, 2))
    console.log('Transactions:', JSON.stringify(this.transactions, null, 2))
    console.log('=== End State ===')
  }
}
