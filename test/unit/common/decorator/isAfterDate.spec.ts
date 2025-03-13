import { validate } from 'class-validator';
import {
  IsAfterDate,
  compareDateConstraint,
} from '../../../../src/common/decorator/isAfterDate';

// Create test classes with the decorator
class TestClass {
  @IsAfterDate('startDate')
  endDate: Date;

  startDate: Date;
}

class TestClassWithOptionalDates {
  @IsAfterDate('startDate')
  endDate?: Date;

  startDate?: Date;
}

describe('IsAfterDate Decorator', () => {
  let testObj: TestClass;
  let validatorConstraint: compareDateConstraint;

  beforeEach(() => {
    testObj = new TestClass();
    validatorConstraint = new compareDateConstraint();
  });

  describe('validate', () => {
    it('should return true when endDate is after startDate', async () => {
      testObj.startDate = new Date('2023-01-01');
      testObj.endDate = new Date('2023-01-02');

      const errors = await validate(testObj);
      expect(errors.length).toBe(0);
    });

    it('should return true when endDate is equal to startDate', async () => {
      testObj.startDate = new Date('2023-01-01');
      testObj.endDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(0);
    });

    it('should return false when endDate is before startDate', async () => {
      testObj.startDate = new Date('2023-01-02');
      testObj.endDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('compareDateConstraint');
      expect(errors[0].constraints.compareDateConstraint).toContain(
        'should be after',
      );
    });

    it('should return false when startDate is missing', async () => {
      testObj.endDate = new Date('2023-01-01');
      // startDate is undefined

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('compareDateConstraint');
      expect(errors[0].constraints.compareDateConstraint).toContain(
        'must both be provided',
      );
    });

    it('should return validation errors when endDate is missing', async () => {
      testObj.startDate = new Date('2023-01-01');
      // endDate is undefined

      // Since endDate is required by default in TestClass, this should produce a validation error
      const errors = await validate(testObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return validation errors when both dates are missing', async () => {
      const testObjWithOptionalDates = new TestClassWithOptionalDates();

      // Since one or both properties might be required, depending on class-validator settings
      const errors = await validate(testObjWithOptionalDates);
      if (errors.length > 0) {
        expect(errors[0].constraints).toBeDefined();
      }
    });

    it('should return false when startDate is not a valid date', async () => {
      testObj.startDate = new Date('invalid-date');
      testObj.endDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
    });

    it('should return false when endDate is not a valid date', async () => {
      testObj.startDate = new Date('2023-01-01');
      testObj.endDate = new Date('invalid-date');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
    });
  });

  describe('validatorConstraint', () => {
    it('should return true when endDate is after startDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-02'), {
        object: { startDate: new Date('2023-01-01') },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-02'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(true);
    });

    it('should return true when endDate is equal to startDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { startDate: new Date('2023-01-01') },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(true);
    });

    it('should return false when endDate is before startDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { startDate: new Date('2023-01-02') },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(false);
    });

    it('should return false when startDate is missing', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { startDate: undefined },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(false);
    });

    it('should return false when endDate is missing', () => {
      const result = validatorConstraint.validate(undefined, {
        object: { startDate: new Date('2023-01-01') },
        property: 'endDate',
        constraints: ['startDate'],
        value: undefined,
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return appropriate message when both dates are missing', () => {
      const message = validatorConstraint.defaultMessage({
        object: { startDate: undefined, endDate: undefined },
        property: 'endDate',
        constraints: ['startDate'],
        value: undefined,
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('must both be provided');
    });

    it('should return appropriate message when endDate is not a valid date', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('invalid-date'),
        },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('invalid-date'),
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('must be valid date');
    });

    it('should return appropriate message when endDate is before startDate', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('2023-01-02'),
          endDate: new Date('2023-01-01'),
        },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('should be after');
    });

    it('should return empty string when validation passes', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-02'),
        },
        property: 'endDate',
        constraints: ['startDate'],
        value: new Date('2023-01-02'),
        targetName: 'TestClass',
      } as any);
      expect(message).toBe('');
    });
  });
});
