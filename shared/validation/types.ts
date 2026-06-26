export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function valid(): ValidationResult {
  return {
    valid: true,
    errors: [],
  };
}

export function invalid(errors: string[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}