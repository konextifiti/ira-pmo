interface ValidationPayload {
  siteId: number
  status?: string
  notes?: string
}

interface ValidationResult {
  valid: boolean
  errors?: string[]
}

function validateSubmission(payload: ValidationPayload): ValidationResult {
  // TODO: Replace with actual AI skill hook per agent validation
  // Will integrate with agent-based LLM validation in phase 2
  return { valid: true }
}

export { validateSubmission }
export type { ValidationPayload, ValidationResult }
