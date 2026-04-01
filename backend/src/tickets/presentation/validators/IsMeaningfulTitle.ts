import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TitleValidator } from '../../domain/value-objects/TitleValidator';

@ValidatorConstraint({ name: 'isMeaningfulTitle', async: false })
class IsMeaningfulTitleConstraint implements ValidatorConstraintInterface {
  private reason = '';

  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const result = TitleValidator.validate(value);
    if (!result.valid) {
      this.reason = result.reason ?? 'Invalid title';
    }
    return result.valid;
  }

  defaultMessage(): string {
    return this.reason || 'Title must contain meaningful words';
  }
}

export function IsMeaningfulTitle(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMeaningfulTitleConstraint,
    });
  };
}
