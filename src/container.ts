import * as actualApiClient from '@actual-app/api';
import fs from 'fs';
import ActualApiService from './actual-api-service';
import TransactionService from './transaction-service';
import LlmModelFactory from './llm-model-factory';
import {
  anthropicApiKey,
  anthropicBaseURL,
  anthropicModel,
  budgetId,
  dataDir,
  e2ePassword,
  googleApiKey,
  googleBaseURL,
  googleModel,
  llmProvider,
  ollamaBaseURL,
  ollamaModel,
  openaiApiKey,
  openaiBaseURL,
  openaiModel,
  password,
  serverURL,
  syncAccountsBeforeClassify,
} from './config';
import ActualAiService from './actual-ai';
import PromptGenerator from './prompt-generator';
import LlmService from './llm-service';

const llmModelFactory = new LlmModelFactory(
  llmProvider,
  openaiApiKey,
  openaiModel,
  openaiBaseURL,
  anthropicBaseURL,
  anthropicApiKey,
  anthropicModel,
  googleModel,
  googleBaseURL,
  googleApiKey,
  ollamaModel,
  ollamaBaseURL,
);

const actualApiService = new ActualApiService(
  actualApiClient,
  fs,
  dataDir,
  serverURL,
  password,
  budgetId,
  e2ePassword,
);

const llmService = new LlmService(
  llmModelFactory,
);

const transactionService = new TransactionService(
  actualApiService,
  llmService,
  new PromptGenerator(),
  syncAccountsBeforeClassify,
);

const actualAi = new ActualAiService(
  transactionService,
  actualApiService,
);

export default actualAi;
