import { ProfileValidationErrors } from '@/src/types/user';

const MIN_LENGTH = 3;

export function validateProfileField(field: string, value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${field} is required`;
  }

  if (trimmed.length < MIN_LENGTH) {
    return `${field} must be at least ${MIN_LENGTH} characters`;
  }

  return undefined;
}

export function validateProfileForm(values: {
  firstName: string;
  lastName: string;
}): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};

  const firstNameError = validateProfileField('First name', values.firstName);
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateProfileField('Last name', values.lastName);
  if (lastNameError) errors.lastName = lastNameError;

  return errors;
}

export function hasValidationErrors(errors: ProfileValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
