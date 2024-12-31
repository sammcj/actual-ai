import { APICategoryGroupEntity, APIPayeeEntity } from '@actual-app/api/@types/loot-core/server/api-models'
import { TransactionEntity } from '@actual-app/api/@types/loot-core/types/models'
import { PromptGeneratorI, Rule } from './types'

export default class PromptGenerator implements PromptGeneratorI {
  generate(
    categoryGroups: APICategoryGroupEntity[],
    transaction: TransactionEntity,
    payees: APIPayeeEntity[],
  ): string {
    const lines = ['I want to categorize the given bank transactions into the following categories:']

    categoryGroups.forEach((categoryGroup) => {
      categoryGroup.categories.forEach((category) => {
        lines.push(`* ${category.name} (${categoryGroup.name}) (ID: "${category.id}")`)
      })
    })

    const payeeName = payees.find((payee) => payee.id === transaction.payee)?.name

    lines.push('Please categorize the following transaction:')
    lines.push(`* Amount: ${Math.abs(transaction.amount)}`)
    lines.push(`* Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'}`)
    lines.push(`* Description: ${transaction.notes ?? ''}`)

    if (payeeName && payeeName !== transaction.imported_payee) {
      lines.push(`* Payee: ${payeeName}`)
      lines.push(`* Payee RAW: ${transaction.imported_payee}`)
    } else {
      lines.push(`* Payee: ${transaction.imported_payee}`)
    }

    lines.push('ANSWER BY A CATEGORY ID. DO NOT WRITE THE WHOLE SENTENCE. Do not guess, if you don\'t know the answer, return "idk".')

    return lines.join('\n')
  }

  generateCategoryGroupAnalysis(
    categoryGroups: APICategoryGroupEntity[],
    transactions: TransactionEntity[],
    confidenceThreshold: number,
    maxGroups: number,
  ): string {
    const lines = [
      'Analyze the following uncategorized transactions and suggest new category groups.',
      '',
      'Current category groups:',
    ]

    categoryGroups.forEach((group) => {
      lines.push(`* ${group.name}`)
    })

    lines.push('', 'Uncategorized transactions:')

    transactions.forEach((transaction) => {
      lines.push(`* Amount: ${Math.abs(transaction.amount)} | Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'} | Payee: ${transaction.imported_payee} | Description: ${transaction.notes ?? ''}`)
    })

    lines.push(
      '',
      `Based on the transactions above and existing category groups, suggest up to ${maxGroups} new category groups.`,
      `Only suggest groups if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`,
      'Do not suggest groups that are similar to existing ones.',
      'IMPORTANT: Your response must be valid JSON. Do not include any explanatory text outside the JSON array.',
      'Example response format:',
      '[',
      '  {',
      '    "name": "group name without ai- prefix",',
      '    "confidence": 9,',
      '    "reason": "brief explanation why this group would be useful"',
      '  }',
      ']',
      '',
      'If no new groups are needed or confidence threshold is not met, return exactly: []',
    )

    return lines.join('\n')
  }

  generateRuleAnalysis(
    transactions: TransactionEntity[],
    existingRules: Rule[],
    confidenceThreshold: number,
    maxRules: number,
  ): string {
    const lines = [
      'Analyze the following transactions and suggest new rules for automatic categorization.',
      '',
      'Current rules:',
    ]

    existingRules.forEach((rule) => {
      lines.push(`* Stage: ${rule.stage} | Conditions: ${JSON.stringify(rule.conditions)} | Actions: ${JSON.stringify(rule.actions)}`)
    })

    lines.push('', 'Transactions to analyze:')

    transactions.forEach((transaction) => {
      lines.push(`* Amount: ${Math.abs(transaction.amount)} | Type: ${transaction.amount > 0 ? 'Income' : 'Outcome'} | Payee: ${transaction.imported_payee} | Description: ${transaction.notes ?? ''}`)
    })

    lines.push(
      '',
      `Based on the transactions above and existing rules, suggest up to ${maxRules} new rules.`,
      `Only suggest rules if you are confident they would be useful (confidence threshold: ${confidenceThreshold}/10).`,
      'Do not suggest rules that are similar to existing ones.',
      'IMPORTANT: Your response must be valid JSON. Do not include any explanatory text outside the JSON array.',
      'Example response format:',
      '[',
      '  {',
      '    "stage": "default",',
      '    "conditionsOp": "and",',
      '    "conditions": [',
      '      {',
      '        "field": "payee",',
      '        "op": "contains",',
      '        "value": "example-value"',
      '      }',
      '    ],',
      '    "actions": [',
      '      {',
      '        "field": "category",',
      '        "op": "set",',
      '        "value": "actual-category-id-from-list-above"',
      '      }',
      '    ],',
      '    "confidence": 9,',
      '    "reason": "Example reason for the rule"',
      '  }',
      ']',
      '',
      'Rules:',
      '1. Response must be a valid JSON array',
      '2. stage must be exactly "default"',
      '3. conditionsOp must be exactly "and" or "or"',
      '4. field must be exactly "payee", "amount", or "notes"',
      '5. op must be exactly "is", "contains", "startsWith", "endsWith", "gt", or "lt"',
      '6. value must be a string',
      '7. confidence must be a number between 1 and 10',
      '8. category-id must be one of the actual category IDs shown above',
      '',
      'If no new rules are needed or confidence threshold is not met, return exactly: []',
    )

    return lines.join('\n')
  }
}
