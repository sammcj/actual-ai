// Override config values for testing
export const createAiCategoryGroups = true
export const aiCategoryGroupConfidence = 8
export const maxAiCategoryGroups = 5
export const createAiRules = true
export const aiRuleConfidence = 8
export const maxAiRules = 10
export const syncAccountsBeforeClassify = false

// Re-export other config values with defaults
export const serverURL = ''
export const password = ''
export const budgetId = ''
export const e2ePassword = ''
export const cronSchedule = ''
export const classifyOnStartup = false
export const llmProvider = 'openai'
export const openaiBaseURL = 'https://api.openai.com/v1'
export const openaiApiKey = ''
export const openaiModel = 'gpt-4-turbo'
export const anthropicApiKey = ''
export const anthropicBaseURL = 'https://api.anthropic.com/v1'
export const anthropicModel = 'claude-3-5-sonnet-latest'
export const googleModel = 'gemini-1.5-flash'
export const googleBaseURL = 'https://generativelanguage.googleapis.com/v1beta'
export const googleApiKey = ''
export const ollamaBaseURL = ''
export const ollamaModel = 'phi3.5'
export const dataDir = '/tmp/actual-ai/'
