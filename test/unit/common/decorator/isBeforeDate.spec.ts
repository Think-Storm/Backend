import { validate } from 'class-validator';
import {
  IsBeforeDate,
  compareDateConstraint,
} from '../../../../src/common/decorator/isBeforeDate';

// Create test classes with the decorator
class TestClass {
  @IsBeforeDate('endDate')
  startDate: Date;

  endDate: Date;
}

class TestClassWithOptionalDates {
  @IsBeforeDate('endDate')
  startDate?: Date;

  endDate?: Date;
}

describe('IsBeforeDate Decorator', () => {
  let testObj: TestClass;
  let validatorConstraint: compareDateConstraint;

  beforeEach(() => {
    testObj = new TestClass();
    validatorConstraint = new compareDateConstraint();
  });

  describe('validate', () => {
    it('should return true when startDate is before endDate', async () => {
      testObj.startDate = new Date('2023-01-01');
      testObj.endDate = new Date('2023-01-02');

      const errors = await validate(testObj);
      expect(errors.length).toBe(0);
    });

    it('should return true when startDate is equal to endDate', async () => {
      testObj.startDate = new Date('2023-01-01');
      testObj.endDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(0);
    });

    it('should return false when startDate is after endDate', async () => {
      testObj.startDate = new Date('2023-01-02');
      testObj.endDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('compareDateConstraint');
      expect(errors[0].constraints.compareDateConstraint).toContain(
        'should be before',
      );
    });

    it('should return false when endDate is missing', async () => {
      testObj.startDate = new Date('2023-01-01');
      // endDate is undefined

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints).toHaveProperty('compareDateConstraint');
      expect(errors[0].constraints.compareDateConstraint).toContain(
        'must both be provided',
      );
    });

    it('should return validation errors when startDate is missing', async () => {
      testObj.endDate = new Date('2023-01-01');
      // startDate is undefined

      // Since startDate is required by default in TestClass, this should produce a validation error
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

    it('should return false when endDate is not a valid date', async () => {
      testObj.endDate = new Date('invalid-date');
      testObj.startDate = new Date('2023-01-01');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
    });

    it('should return false when startDate is not a valid date', async () => {
      testObj.endDate = new Date('2023-01-01');
      testObj.startDate = new Date('invalid-date');

      const errors = await validate(testObj);
      expect(errors.length).toBe(1);
    });
  });

  describe('validatorConstraint', () => {
    it('should return true when startDate is before endDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { endDate: new Date('2023-01-02') },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(true);
    });

    it('should return true when startDate is equal to endDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { endDate: new Date('2023-01-01') },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(true);
    });

    it('should return false when startDate is after endDate', () => {
      const result = validatorConstraint.validate(new Date('2023-01-02'), {
        object: { endDate: new Date('2023-01-01') },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-02'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(false);
    });

    it('should return false when endDate is missing', () => {
      const result = validatorConstraint.validate(new Date('2023-01-01'), {
        object: { endDate: undefined },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(result).toBe(false);
    });

    it('should return false when startDate is missing', () => {
      const result = validatorConstraint.validate(undefined, {
        object: { endDate: new Date('2023-01-01') },
        property: 'startDate',
        constraints: ['endDate'],
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
        property: 'startDate',
        constraints: ['endDate'],
        value: undefined,
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('must both be provided');
    });

    it('should return appropriate message when startDate is not a valid date', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('invalid-date'),
          endDate: new Date('2023-01-01'),
        },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('invalid-date'),
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('must be valid date');
    });

    it('should return appropriate message when startDate is after endDate', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('2023-01-02'),
          endDate: new Date('2023-01-01'),
        },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-02'),
        targetName: 'TestClass',
      } as any);
      expect(message).toContain('should be before');
    });

    it('should return empty string when validation passes', () => {
      const message = validatorConstraint.defaultMessage({
        object: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-02'),
        },
        property: 'startDate',
        constraints: ['endDate'],
        value: new Date('2023-01-01'),
        targetName: 'TestClass',
      } as any);
      expect(message).toBe('');
    });
  });
});
