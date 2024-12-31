import { APICategoryGroupEntity, APIPayeeEntity } from '@actual-app/api/@types/loot-core/server/api-models';
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models';
import { PromptGeneratorI, Rule } from './types';

class PromptGenerator implements PromptGeneratorI {
  generate(
    categoryGroups: APICategoryGroupEntity[],
    transaction: TransactionEntity,
    payees: APIPayeeEntity[],
  ): string {
    let prompt = 'I want to categorize the given bank transactions into the following categories:\n';
    categoryGroups.forEach((categoryGroup) => {
      categoryGroup.categories.forEach((category) => {
        prompt += `* ${category.name} (${categoryGroup.name}) (ID: "${category.id}") \n`;
      });
    });

    const payeeName = payees.find((payee) => payee.id === transaction.payee)?.name;

    prompt += 'Please categorize the following transaction: \n';
    prompt += `* Amount: ${Math.abs(transaction.amount)}\n`;
    prompt += `* Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'}\n`;
    prompt += `* Description: ${transaction.notes ?? ''}\n`;
    if (payeeName && payeeName !== transaction.imported_payee) {
      prompt += `* Payee: ${payeeName}\n`;
      prompt += `* Payee RAW: ${transaction.imported_payee}\n`;
    } else {
      prompt += `* Payee: ${transaction.imported_payee}\n`;
    }

    prompt += 'ANSWER BY A CATEGORY ID. DO NOT WRITE THE WHOLE SENTENCE. Do not guess, if you don\'t know the answer, return "idk".';

    return prompt
  }

  generateCategoryGroupAnalysis(
    categoryGroups: APICategoryGroupEntity[],
    transactions: TransactionEntity[],
    confidenceThreshold: number,
    maxGroups: number,
  ): string {
    let prompt = 'Analyze the following uncategorized transactions and suggest new category groups.\n\n'

    prompt += 'Current category groups:\n'
    categoryGroups.forEach((group) => {
      prompt += `* ${group.name}\n`
    })

    prompt += '\nUncategorized transactions:\n'
    transactions.forEach((transaction) => {
      prompt += `* Amount: ${Math.abs(transaction.amount)} | Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'} | Payee: ${transaction.imported_payee} | Description: ${transaction.notes ?? ''}\n`
    })

    prompt += `\nBased on the transactions above and existing category groups, suggest up to ${maxGroups} new category groups.`
    prompt += `\nOnly suggest groups if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`
    prompt += '\nDo not suggest groups that are similar to existing ones.'
    prompt += '\nRespond in JSON format like this:'
    prompt += `\n[
  {
    "name": "group name without ai- prefix",
    "confidence": number from 1-10,
    "reason": "brief explanation why this group would be useful"
  }
]\n`
    prompt += '\nIf no new groups are needed or confidence threshold is not met, return an empty array: []'

    return prompt
  }

  generateRuleAnalysis(
    transactions: TransactionEntity[],
    existingRules: Rule[],
    confidenceThreshold: number,
    maxRules: number,
  ): string {
    let prompt = 'Analyze the following transactions and suggest new rules for automatic categorization.\n\n'

    prompt += 'Current rules:\n'
    existingRules.forEach((rule) => {
      prompt += `* Stage: ${rule.stage} | Conditions: ${JSON.stringify(rule.conditions)} | Actions: ${JSON.stringify(rule.actions)}\n`
    })

    prompt += '\nTransactions to analyze:\n'
    transactions.forEach((transaction) => {
      prompt += `* Amount: ${Math.abs(transaction.amount)} | Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'} | Payee: ${transaction.imported_payee} | Description: ${transaction.notes ?? ''}\n`
    })

    prompt += `\nBased on the transactions above and existing rules, suggest up to ${maxRules} new rules.`
    prompt += `\nOnly suggest rules if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`
    prompt += '\nDo not suggest rules that are similar to existing ones.'
    prompt += '\nRespond in JSON format like this:'
    prompt += `\n[
  {
    "stage": "pre" | "default" | "post",
    "conditionsOp": "and" | "or",
    "conditions": [
      {
        "field": "payee" | "amount" | "notes",
        "op": "is" | "contains" | "startsWith" | "endsWith" | "gt" | "lt",
        "value": "string"
      }
    ],
    "actions": [
      {
        "field": "category",
        "op": "set",
        "value": "category-id"
      }
    ],
    "confidence": number from 1-10,
    "reason": "brief explanation why this rule would be useful"
  }
]\n`
    prompt += '\nIf no new rules are needed or confidence threshold is not met, return an empty array: []';

    return prompt;
  }
}

export default PromptGenerator;
