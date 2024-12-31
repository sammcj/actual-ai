import { LanguageModel } from 'ai';
import {
  APICategoryEntity,
  APICategoryGroupEntity,
  APIPayeeEntity,
} from '@actual-app/api/@types/loot-core/server/api-models';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models';

export interface ConditionOrAction {
  field: string
  op: string
  value: string
}

export interface Rule {
  id?: string
  stage: 'pre' | 'default' | 'post'
  conditionsOp?: 'and' | 'or'
  conditions?: ConditionOrAction[]
  actions?: ConditionOrAction[]
}

export interface PayeeRule extends Rule {
  payee_id: string
}

export interface LlmModelFactoryI {
  create(): LanguageModel;
}

export interface ActualApiServiceI {
  initializeApi(): Promise<void>;

  shutdownApi(): Promise<void>;

  getCategoryGroups(): Promise<APICategoryGroupEntity[]>

  getCategories(): Promise<(APICategoryEntity | APICategoryGroupEntity)[]>

  getPayees(): Promise<APIPayeeEntity[]>

  getTransactions(): Promise<TransactionEntity[]>

  updateTransactionNotes(id: string, notes: string): Promise<void>

  updateTransactionNotesAndCategory(
    id: string,
    notes: string,
    categoryId: string,
  ): Promise<void>

  runBankSync(): Promise<void>

  createCategoryGroup(name: string): Promise<string>

  getUncategorizedTransactions(): Promise<TransactionEntity[]>

  getRules(): Promise<Rule[]>

  createRule(rule: Partial<Rule>): Promise<Rule>

  getPayeeRules(payeeId: string): Promise<PayeeRule[]>

  createPayeeRule(rule: Partial<PayeeRule>): Promise<PayeeRule>
}

export interface TransactionServiceI {
  processTransactions(): Promise<void>;
}

export interface ActualAiServiceI {
  classify(): Promise<void>;
}

export interface LlmServiceI {
  ask(prompt: string): Promise<string>;
}

export interface PromptGeneratorI {
  generate(
    categoryGroups: APICategoryGroupEntity[],
    transaction: TransactionEntity,
    payees: APIPayeeEntity[],
  ): string

  generateCategoryGroupAnalysis(
    categoryGroups: APICategoryGroupEntity[],
    transactions: TransactionEntity[],
    confidenceThreshold: number,
    maxGroups: number,
  ): string

  generateRuleAnalysis(
    transactions: TransactionEntity[],
    existingRules: Rule[],
    confidenceThreshold: number,
    maxRules: number,
  ): string
}
