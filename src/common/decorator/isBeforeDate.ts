import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isDate } from 'util/types';

/**
 * Custom validator to ensure that one date is before another date.
 *
 * @param property The property to compare the current value to (ex. 'endDate')
 * @param validationOptions Additional validation options such as custom error messages.
 */
export function IsBeforeDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsBeforeDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: compareDateConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'compareDateConstraint' })
export class compareDateConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];

    // If either of the dates is missing, return true
    if (!value || !relatedValue) {
      return false;
    }

    if (!isDate(value) || !isDate(relatedValue)) {
      return false;
    }
    // Convert both values to Date objects
    const valueDate = new Date(value);
    const relatedDate = new Date(relatedValue);

    // If either date is invalid, return false
    if (isNaN(valueDate.getTime()) || isNaN(relatedDate.getTime())) {
      return false;
    }

    // Check if the current value is before the related value
    return valueDate <= relatedDate;
  }
  defaultMessage(args: ValidationArguments) {
    const value = args.object[args.property];
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];

    if (!value || !relatedValue) {
      return `${args.property} and ${relatedPropertyName} must both be provided`;
    }
    if (!isDate(value)) {
      return `${args.property} must be valid dates`;
    }

    // Convert both values to Date objects
    const valueDate = new Date(value);
    const relatedDate = new Date(relatedValue);

    if (isNaN(valueDate.getTime())) {
      return `${args.property} must be valid date`;
    }

    if (valueDate > relatedDate) {
      return `${args.property} date should be before ${relatedPropertyName} date`;
    }
    return '';
  }
}
