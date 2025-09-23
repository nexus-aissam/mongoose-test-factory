/**
 * Number Generator for mongoose-test-factory
 *
 * Generates realistic numeric values with constraint awareness,
 * semantic analysis, and business logic.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { NumberGenerator } from "../types/generator";
import {
  FieldType,
  GenerationContext,
  ValidationConstraints,
} from "../types/common";

/**
 * Number generator implementation
 */
export class MongooseNumberGenerator
  extends AbstractBaseGenerator<number>
  implements NumberGenerator
{
  private pricePatterns = [
    /^(price|cost|amount|total|fee|charge|payment)$/i,
    /^.*price$/i,
    /^.*cost$/i,
  ];

  private agePatterns = [/^(age|years|year)$/i, /^.*age$/i];

  private quantityPatterns = [
    /^(quantity|qty|count|num|number|stock|inventory)$/i,
    /^.*quantity$/i,
    /^.*count$/i,
  ];

  private scorePatterns = [
    /^(score|rating|rate|points|grade)$/i,
    /^.*score$/i,
    /^.*rating$/i,
  ];

  private percentagePatterns = [
    /^(percent|percentage|ratio|rate)$/i,
    /^.*percent$/i,
  ];

  private coordinatePatterns = [
    /^(lat|latitude|lng|longitude|x|y|z)$/i,
    /^.*coordinate$/i,
  ];

  constructor() {
    super({
      priority: 10,
      enabled: true,
      fieldTypes: [FieldType.NUMBER],
      options: {
        defaultMin: 0,
        defaultMax: 100,
        precision: 2,
        enableSemantic: true,
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
    return fieldType === FieldType.NUMBER;
  }

  /**
   * Generate number value
   */
  async generate(context: GenerationContext): Promise<number> {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // Try semantic-based generation first
    const semanticValue = this.generateBySemantic(fieldName, context);
    if (semanticValue !== null) {
      return this.applyConstraints(semanticValue, constraints);
    }

    // Try constraint-based generation
    if (constraints) {
      return this.generateByConstraints(constraints, context);
    }

    // Fallback to default range
    return this.generateInteger(
      this.getOption("defaultMin", 0),
      this.getOption("defaultMax", 100)
    );
  }

  /**
   * Generate integer within range
   */
  generateInteger(
    min: number = 0,
    max: number = 100,
    context?: GenerationContext
  ): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate float within range
   */
  generateFloat(
    min: number = 0,
    max: number = 1,
    precision: number = 2,
    context?: GenerationContext
  ): number {
    const factor = Math.pow(10, precision);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
  }

  /**
   * Generate based on field semantics
   */
  generateBySemantic(fieldName: string, context: GenerationContext): number {
    const lowerFieldName = fieldName.toLowerCase();

    // Price/Money patterns
    if (this.matchesAnyPattern(lowerFieldName, this.pricePatterns)) {
      return this.generatePrice();
    }

    // Age patterns
    if (this.matchesAnyPattern(lowerFieldName, this.agePatterns)) {
      return this.generateAge();
    }

    // Quantity patterns
    if (this.matchesAnyPattern(lowerFieldName, this.quantityPatterns)) {
      return this.generateQuantity();
    }

    // Score/Rating patterns
    if (this.matchesAnyPattern(lowerFieldName, this.scorePatterns)) {
      return this.generateScore(fieldName);
    }

    // Percentage patterns
    if (this.matchesAnyPattern(lowerFieldName, this.percentagePatterns)) {
      return this.generatePercentage();
    }

    // Coordinate patterns
    if (this.matchesAnyPattern(lowerFieldName, this.coordinatePatterns)) {
      return this.generateCoordinate(fieldName);
    }

    // Specific semantic patterns
    const semanticValue = this.generateBySpecificSemantic(lowerFieldName);
    if (semanticValue !== null && semanticValue !== undefined) {
      return semanticValue;
    }

    // Fallback to default range if no semantic match
    return this.generateInteger(
      this.getOption("defaultMin", 0),
      this.getOption("defaultMax", 100)
    );
  }

  /**
   * Generate price value
   */
  private generatePrice(): number {
    // Generate realistic price ranges
    const priceRanges = [
      { min: 1, max: 50, weight: 0.4 }, // Low-cost items
      { min: 50, max: 200, weight: 0.3 }, // Mid-range items
      { min: 200, max: 1000, weight: 0.2 }, // High-end items
      { min: 1000, max: 5000, weight: 0.1 }, // Premium items
    ];

    const selectedRange = this.weightedRandomSelect(priceRanges);
    return this.generateFloat(selectedRange.min, selectedRange.max, 2);
  }

  /**
   * Generate age value
   */
  private generateAge(): number {
    // Generate realistic age distribution
    const ageRanges = [
      { min: 18, max: 25, weight: 0.2 }, // Young adults
      { min: 25, max: 35, weight: 0.3 }, // Adults
      { min: 35, max: 50, weight: 0.3 }, // Middle-aged
      { min: 50, max: 70, weight: 0.15 }, // Older adults
      { min: 70, max: 90, weight: 0.05 }, // Elderly
    ];

    const selectedRange = this.weightedRandomSelect(ageRanges);
    return this.generateInteger(selectedRange.min, selectedRange.max);
  }

  /**
   * Generate quantity value
   */
  private generateQuantity(): number {
    // Generate realistic quantity distribution
    const quantityRanges = [
      { min: 1, max: 10, weight: 0.5 }, // Small quantities
      { min: 10, max: 100, weight: 0.3 }, // Medium quantities
      { min: 100, max: 1000, weight: 0.15 }, // Large quantities
      { min: 1000, max: 10000, weight: 0.05 }, // Bulk quantities
    ];

    const selectedRange = this.weightedRandomSelect(quantityRanges);
    return this.generateInteger(selectedRange.min, selectedRange.max);
  }

  /**
   * Generate score/rating value
   */
  private generateScore(fieldName: string): number {
    const lowerFieldName = fieldName.toLowerCase();

    // 5-star rating system
    if (lowerFieldName.includes("star") || lowerFieldName.includes("rating")) {
      return this.generateFloat(1, 5, 1);
    }

    // Percentage score (0-100)
    if (
      lowerFieldName.includes("percent") ||
      lowerFieldName.includes("score")
    ) {
      return this.generateInteger(0, 100);
    }

    // Grade (0-100)
    if (lowerFieldName.includes("grade")) {
      const grades = [60, 65, 70, 75, 80, 85, 90, 95, 100];
      return this.getRandomElement(grades);
    }

    // Default rating (1-10)
    return this.generateInteger(1, 10);
  }

  /**
   * Generate percentage value
   */
  private generatePercentage(): number {
    // Generate realistic percentage distribution
    const percentageRanges = [
      { min: 0, max: 25, weight: 0.2 }, // Low percentages
      { min: 25, max: 50, weight: 0.3 }, // Low-medium
      { min: 50, max: 75, weight: 0.3 }, // Medium-high
      { min: 75, max: 100, weight: 0.2 }, // High percentages
    ];

    const selectedRange = this.weightedRandomSelect(percentageRanges);
    return this.generateFloat(selectedRange.min, selectedRange.max, 2);
  }

  /**
   * Generate coordinate value
   */
  private generateCoordinate(fieldName: string): number {
    const lowerFieldName = fieldName.toLowerCase();

    // Latitude (-90 to 90)
    if (lowerFieldName.includes("lat")) {
      return this.generateFloat(-90, 90, 6);
    }

    // Longitude (-180 to 180)
    if (lowerFieldName.includes("lng") || lowerFieldName.includes("long")) {
      return this.generateFloat(-180, 180, 6);
    }

    // Generic coordinate
    return this.generateFloat(-1000, 1000, 3);
  }

  /**
   * Generate by specific semantic patterns
   */
  private generateBySpecificSemantic(fieldName: string): number | null {
    // Weight/Mass
    if (fieldName.includes("weight") || fieldName.includes("mass")) {
      return this.generateFloat(0.1, 100, 2); // kg
    }

    // Height/Length
    if (fieldName.includes("height") || fieldName.includes("length")) {
      return this.generateFloat(0.1, 300, 2); // cm
    }

    // Temperature
    if (fieldName.includes("temp") || fieldName.includes("temperature")) {
      return this.generateFloat(-40, 50, 1); // Celsius
    }

    // Year
    if (fieldName.includes("year")) {
      return this.generateInteger(1900, new Date().getFullYear());
    }

    // Month
    if (fieldName.includes("month")) {
      return this.generateInteger(1, 12);
    }

    // Day
    if (fieldName.includes("day")) {
      return this.generateInteger(1, 31);
    }

    // Hour
    if (fieldName.includes("hour")) {
      return this.generateInteger(0, 23);
    }

    // Minute/Second
    if (fieldName.includes("minute") || fieldName.includes("second")) {
      return this.generateInteger(0, 59);
    }

    // Size (bytes, MB, etc.)
    if (fieldName.includes("size") || fieldName.includes("bytes")) {
      return this.generateInteger(1024, 1024 * 1024 * 100); // 1KB to 100MB
    }

    // Duration (seconds)
    if (fieldName.includes("duration") || fieldName.includes("timeout")) {
      return this.generateInteger(1, 3600); // 1 second to 1 hour
    }

    // Priority
    if (fieldName.includes("priority")) {
      return this.generateInteger(1, 5);
    }

    // Level
    if (fieldName.includes("level")) {
      return this.generateInteger(1, 100);
    }

    return null;
  }

  /**
   * Generate number based on constraints
   */
  private generateByConstraints(
    constraints: ValidationConstraints,
    context: GenerationContext
  ): number {
    const min = constraints.min ?? this.getOption("defaultMin", 0);
    const max = constraints.max ?? this.getOption("defaultMax", 100);

    // Check if we need integer or float
    const needsFloat = this.needsFloatValue(min, max, constraints);

    if (needsFloat) {
      const precision =
        this.inferPrecision(constraints) ?? this.getOption("precision", 2);
      return this.generateFloat(min, max, precision);
    } else {
      return this.generateInteger(min, max);
    }
  }

  /**
   * Apply constraints to generated number
   */
  private applyConstraints(
    value: number,
    constraints?: ValidationConstraints
  ): number {
    if (!constraints) {
      return value;
    }

    let result = value;

    // Apply min constraint
    if (constraints.min !== undefined && result < constraints.min) {
      result = constraints.min;
    }

    // Apply max constraint
    if (constraints.max !== undefined && result > constraints.max) {
      result = constraints.max;
    }

    return result;
  }

  /**
   * Check if patterns match field name
   */
  private matchesAnyPattern(fieldName: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Weighted random selection
   */
  private weightedRandomSelect<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }

    if (items.length === 0) {
      throw new Error("Cannot select from an empty array");
    }
    // At this point, items.length > 0, so items[items.length - 1] is always T
    return items[items.length - 1] as T;
  }

  /**
   * Determine if float value is needed
   */
  private needsFloatValue(
    min: number,
    max: number,
    constraints: ValidationConstraints
  ): boolean {
    // If min or max are floats, we need float values
    if (min % 1 !== 0 || max % 1 !== 0) {
      return true;
    }

    // If range is small, prefer floats for more variety
    if (max - min <= 10) {
      return true;
    }

    return false;
  }

  /**
   * Infer precision from constraints or field semantics
   */
  private inferPrecision(
    constraints: ValidationConstraints
  ): number | undefined {
    // Could analyze min/max values to infer precision
    // For now, return undefined to use default
    return undefined;
  }

  /**
   * Get constraints from generation context
   */
  private getConstraintsFromContext(
    context: GenerationContext
  ): ValidationConstraints | undefined {
    // This would extract constraints from the context
    // Implementation depends on how context is structured
    return undefined;
  }

  /**
   * Type-specific validation for numbers
   */
  protected override validateTypeSpecific(
    value: number,
    constraints: ValidationConstraints
  ): boolean {
    // Range validation
    if (constraints.min !== undefined && value < constraints.min) {
      return false;
    }

    if (constraints.max !== undefined && value > constraints.max) {
      return false;
    }

    // Check if number is finite
    if (!Number.isFinite(value)) {
      return false;
    }

    return true;
  }
}

/**
 * Specialized generators for specific number types
 */
export class PriceNumberGenerator extends MongooseNumberGenerator {
  constructor() {
    super();
    this.priority = 50; // Higher priority for price fields
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.NUMBER &&
      /^(price|cost|amount|total|fee|charge|payment)$/i.test(fieldName)
    );
  }

  override async generate(context: GenerationContext): Promise<number> {
    return parseFloat(faker.commerce.price({ min: 1, max: 1000, dec: 2 }));
  }
}

export class AgeNumberGenerator extends MongooseNumberGenerator {
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
      fieldType === FieldType.NUMBER && fieldName.toLowerCase().includes("age")
    );
  }

  override async generate(context: GenerationContext): Promise<number> {
    return faker.number.int({ min: 18, max: 80 });
  }
}

export class RatingNumberGenerator extends MongooseNumberGenerator {
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
      fieldType === FieldType.NUMBER &&
      /^(rating|score|stars|grade)$/i.test(fieldName)
    );
  }

  override async generate(context: GenerationContext): Promise<number> {
    return faker.number.float({ min: 1, max: 5, fractionDigits: 1 });
  }
}
