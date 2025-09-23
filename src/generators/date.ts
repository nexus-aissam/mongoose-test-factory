/**
 * Date Generator for mongoose-test-factory
 *
 * Generates realistic date values with semantic awareness,
 * business logic, and proper date range handling.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { DateGenerator } from "../types/generator";
import {
  FieldType,
  GenerationContext,
  ValidationConstraints,
} from "../types/common";

/**
 * Date generator implementation
 */
export class MongooseDateGenerator
  extends AbstractBaseGenerator<Date>
  implements DateGenerator
{
  private createdAtPatterns = [
    /^(created|createdAt|created_at|dateCreated|date_created)$/i,
    /^.*created.*$/i,
  ];

  private updatedAtPatterns = [
    /^(updated|updatedAt|updated_at|dateUpdated|date_updated|modified|modifiedAt)$/i,
    /^.*updated.*$/i,
    /^.*modified.*$/i,
  ];

  private birthPatterns = [
    /^(birth|birthday|birthDate|birth_date|dateOfBirth|date_of_birth|born)$/i,
    /^.*birth.*$/i,
    /^.*born.*$/i,
  ];

  private expiryPatterns = [
    /^(expiry|expires|expiresAt|expires_at|expiration|expirationDate)$/i,
    /^.*expir.*$/i,
  ];

  private startPatterns = [
    /^(start|startDate|start_date|startedAt|started_at|from)$/i,
    /^.*start.*$/i,
  ];

  private endPatterns = [
    /^(end|endDate|end_date|endedAt|ended_at|to|until)$/i,
    /^.*end.*$/i,
  ];

  private dueDatePatterns = [
    /^(due|dueDate|due_date|deadline)$/i,
    /^.*due.*$/i,
    /^.*deadline.*$/i,
  ];

  constructor() {
    super({
      priority: 10,
      enabled: true,
      fieldTypes: [FieldType.DATE],
      options: {
        defaultPastYears: 5,
        defaultFutureYears: 2,
        enableBusinessDays: false,
        timezone: "UTC",
      },
    });
  }

  /**
   * Check if this generator can handle the field type
   */
  canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    return fieldType === FieldType.DATE;
  }

  /**
   * Generate date value
   */
  async generate(context: GenerationContext): Promise<Date> {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // Try semantic-based generation first
    const semanticDate = this.generateBySemantic(fieldName, context);
    if (semanticDate) {
      return this.applyConstraints(semanticDate, constraints);
    }

    // Try constraint-based generation
    if (constraints?.min || constraints?.max) {
      return this.generateByConstraints(constraints, context);
    }

    // Fallback to recent date
    return this.generateRecent();
  }

  /**
   * Generate date within range
   */
  generateInRange(start?: Date, end?: Date, context?: GenerationContext): Date {
    const startDate = start ?? this.getDefaultStartDate();
    const endDate = end ?? this.getDefaultEndDate();

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);

    return new Date(randomTime);
  }

  /**
   * Generate past date
   */
  generatePast(years: number = 5, context?: GenerationContext): Date {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setFullYear(now.getFullYear() - years);

    return this.generateInRange(pastDate, now, context);
  }

  /**
   * Generate future date
   */
  generateFuture(years: number = 2, context?: GenerationContext): Date {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setFullYear(now.getFullYear() + years);

    return this.generateInRange(now, futureDate, context);
  }

  /**
   * Generate based on field semantics
   */
  generateBySemantic(fieldName: string, context: GenerationContext): Date {
    const lowerFieldName = fieldName.toLowerCase();

    // Created at patterns - recent past dates
    if (this.matchesAnyPattern(lowerFieldName, this.createdAtPatterns)) {
      return this.generateCreatedAt();
    }

    // Updated at patterns - should be after created at
    if (this.matchesAnyPattern(lowerFieldName, this.updatedAtPatterns)) {
      return this.generateUpdatedAt(context);
    }

    // Birth date patterns - generate realistic birth dates
    if (this.matchesAnyPattern(lowerFieldName, this.birthPatterns)) {
      return this.generateBirthDate();
    }

    // Expiry patterns - future dates
    if (this.matchesAnyPattern(lowerFieldName, this.expiryPatterns)) {
      return this.generateExpiryDate();
    }

    // Start date patterns - past or future start dates
    if (this.matchesAnyPattern(lowerFieldName, this.startPatterns)) {
      return this.generateStartDate();
    }

    // End date patterns - should be after start date
    if (this.matchesAnyPattern(lowerFieldName, this.endPatterns)) {
      return this.generateEndDate(context);
    }

    // Due date patterns - near future dates
    if (this.matchesAnyPattern(lowerFieldName, this.dueDatePatterns)) {
      return this.generateDueDate();
    }

    // Specific semantic patterns
    const specific = this.generateBySpecificSemantic(lowerFieldName);
    if (specific) {
      return specific;
    }

    // Fallback to recent date if no semantic match
    return this.generateRecent();
  }

  /**
   * Generate created at date
   */
  private generateCreatedAt(): Date {
    // Generate dates from recent past (last 2 years)
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);

    return faker.date.between({ from: twoYearsAgo, to: now });
  }

  /**
   * Generate updated at date
   */
  private generateUpdatedAt(context: GenerationContext): Date {
    // Should be after created at if available
    const createdAt = this.getRelatedDate(context, "created");

    if (createdAt) {
      const now = new Date();
      return faker.date.between({ from: createdAt, to: now });
    }

    // Fallback to recent date
    return this.generateRecent();
  }

  /**
   * Generate birth date
   */
  private generateBirthDate(): Date {
    // Generate realistic birth dates (18-80 years old)
    const now = new Date();
    const minAge = 18;
    const maxAge = 80;

    const oldestDate = new Date(now);
    oldestDate.setFullYear(now.getFullYear() - maxAge);

    const youngestDate = new Date(now);
    youngestDate.setFullYear(now.getFullYear() - minAge);

    return faker.date.between({ from: oldestDate, to: youngestDate });
  }

  /**
   * Generate expiry date
   */
  private generateExpiryDate(): Date {
    // Generate expiry dates 1 month to 5 years in the future
    const now = new Date();
    const oneMonth = new Date(now);
    oneMonth.setMonth(now.getMonth() + 1);

    const fiveYears = new Date(now);
    fiveYears.setFullYear(now.getFullYear() + 5);

    return faker.date.between({ from: oneMonth, to: fiveYears });
  }

  /**
   * Generate start date
   */
  private generateStartDate(): Date {
    // Generate start dates within past year to next year
    const now = new Date();
    const pastYear = new Date(now);
    pastYear.setFullYear(now.getFullYear() - 1);

    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    return faker.date.between({ from: pastYear, to: nextYear });
  }

  /**
   * Generate end date
   */
  private generateEndDate(context: GenerationContext): Date {
    // Should be after start date if available
    const startDate = this.getRelatedDate(context, "start");

    if (startDate) {
      const maxEnd = new Date(startDate);
      maxEnd.setFullYear(startDate.getFullYear() + 2); // Max 2 years duration

      return faker.date.between({ from: startDate, to: maxEnd });
    }

    // Fallback to future date
    return this.generateFuture(1);
  }

  /**
   * Generate due date
   */
  private generateDueDate(): Date {
    // Generate due dates 1 week to 6 months in the future
    const now = new Date();
    const oneWeek = new Date(now);
    oneWeek.setDate(now.getDate() + 7);

    const sixMonths = new Date(now);
    sixMonths.setMonth(now.getMonth() + 6);

    return faker.date.between({ from: oneWeek, to: sixMonths });
  }

  /**
   * Generate by specific semantic patterns
   */
  private generateBySpecificSemantic(fieldName: string): Date | null {
    // Published date
    if (fieldName.includes("publish")) {
      return this.generatePast(2);
    }

    // Scheduled date
    if (fieldName.includes("schedul")) {
      return this.generateFuture(0.5);
    }

    // Login/Last seen dates
    if (
      fieldName.includes("login") ||
      fieldName.includes("seen") ||
      fieldName.includes("visit")
    ) {
      return this.generateRecent(30); // Last 30 days
    }

    // Registration date
    if (fieldName.includes("register") || fieldName.includes("signup")) {
      return this.generatePast(3);
    }

    // Timestamp
    if (fieldName.includes("timestamp") || fieldName.includes("time")) {
      return this.generateRecent(7); // Last week
    }

    return null;
  }

  /**
   * Generate recent date
   */
  private generateRecent(days: number = 90): Date {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);

    return faker.date.between({ from: pastDate, to: now });
  }

  /**
   * Generate date based on constraints
   */
  private generateByConstraints(
    constraints: ValidationConstraints,
    context: GenerationContext
  ): Date {
    const min = constraints.min
      ? new Date(constraints.min)
      : this.getDefaultStartDate();
    const max = constraints.max
      ? new Date(constraints.max)
      : this.getDefaultEndDate();

    return this.generateInRange(min, max, context);
  }

  /**
   * Apply constraints to generated date
   */
  private applyConstraints(
    date: Date,
    constraints?: ValidationConstraints
  ): Date {
    if (!constraints) {
      return date;
    }

    let result = new Date(date);

    // Apply min constraint
    if (constraints.min) {
      const minDate = new Date(constraints.min);
      if (result < minDate) {
        result = minDate;
      }
    }

    // Apply max constraint
    if (constraints.max) {
      const maxDate = new Date(constraints.max);
      if (result > maxDate) {
        result = maxDate;
      }
    }

    return result;
  }

  /**
   * Get default start date
   */
  private getDefaultStartDate(): Date {
    const years = this.getOption("defaultPastYears", 5);
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  }

  /**
   * Get default end date
   */
  private getDefaultEndDate(): Date {
    const years = this.getOption("defaultFutureYears", 2);
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return date;
  }

  /**
   * Get related date from context
   */
  private getRelatedDate(
    context: GenerationContext,
    type: string
  ): Date | null {
    // This would extract related dates from context
    // For example, if generating updatedAt, get createdAt
    return null;
  }

  /**
   * Check if patterns match field name
   */
  private matchesAnyPattern(fieldName: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Get constraints from generation context
   */
  private getConstraintsFromContext(
    context: GenerationContext
  ): ValidationConstraints | undefined {
    // This would extract constraints from the context
    return undefined;
  }

  /**
   * Type-specific validation for dates
   */
  protected override validateTypeSpecific(
    value: Date,
    constraints: ValidationConstraints
  ): boolean {
    // Check if date is valid
    if (isNaN(value.getTime())) {
      return false;
    }

    // Range validation
    if (constraints.min) {
      const minDate = new Date(constraints.min);
      if (value < minDate) {
        return false;
      }
    }

    if (constraints.max) {
      const maxDate = new Date(constraints.max);
      if (value > maxDate) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Specialized generators for specific date types
 */
export class TimestampDateGenerator extends MongooseDateGenerator {
  constructor() {
    super();
    this.priority = 50; // Higher priority for timestamp fields
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.DATE &&
      /^(timestamp|created|updated|modified)$/i.test(fieldName)
    );
  }

  override async generate(context: GenerationContext): Promise<Date> {
    return faker.date.recent({ days: 30 });
  }
}

export class BirthDateGenerator extends MongooseDateGenerator {
  constructor() {
    super();
    this.priority = 50;
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.DATE &&
      /^(birth|birthday|born|dob)$/i.test(fieldName)
    );
  }

  override async generate(context: GenerationContext): Promise<Date> {
    return faker.date.birthdate({ min: 18, max: 80, mode: "age" });
  }
}

export class FutureDateGenerator extends MongooseDateGenerator {
  constructor() {
    super();
    this.priority = 45;
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.DATE &&
      /^(expiry|expires|due|deadline|schedule)$/i.test(fieldName)
    );
  }

  override async generate(context: GenerationContext): Promise<Date> {
    return faker.date.future({ years: 2 });
  }
}
