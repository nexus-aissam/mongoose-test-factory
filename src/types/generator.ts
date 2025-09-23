/**
 * Generator-specific type definitions
 */

import { Schema } from "mongoose";
import { FieldType, GenerationContext, ValidationConstraints } from "./common";

/**
 * Base generator interface
 */
export interface BaseGenerator<T = any> {
  /**
   * Generate a value for the field
   */
  generate(context: GenerationContext): T | Promise<T>;

  /**
   * Check if this generator can handle the field type
   */
  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean;

  /**
   * Get priority for generator selection (higher = more specific)
   */
  getPriority(): number;

  /**
   * Validate generated value
   */
  validate?(value: T, constraints?: ValidationConstraints): boolean;

  /**   * Check if generator is enabled
   */
  isEnabled(): boolean;

  /**
   * Enable or disable the generator
   */
  setEnabled(enabled: boolean): void;

  /**
   * Get current configuration
   */
  getConfig?(): GeneratorConfig;

  /**
   * Update generator configuration
   */
  updateConfig(config: Partial<GeneratorConfig>): void;

  /**
   * Synchronous generate method (if applicable)
   */
  generateSync?(context: GenerationContext): T;
}

/**
 * String generator interface
 */
export interface StringGenerator extends BaseGenerator<string> {
  /**
   * Generate string based on field name patterns
   */
  generateByPattern(fieldName: string, context: GenerationContext): string;

  /**
   * Generate string matching regex
   */
  generateByRegex(pattern: RegExp, context: GenerationContext): string;

  /**
   * Generate from enum values
   */
  generateFromEnum(values: string[], context: GenerationContext): string;
}

/**
 * Number generator interface
 */
export interface NumberGenerator extends BaseGenerator<number> {
  /**
   * Generate integer within range
   */
  generateInteger(
    min?: number,
    max?: number,
    context?: GenerationContext
  ): number;

  /**
   * Generate float within range
   */
  generateFloat(
    min?: number,
    max?: number,
    precision?: number,
    context?: GenerationContext
  ): number;

  /**
   * Generate based on field semantics
   */
  generateBySemantic(fieldName: string, context: GenerationContext): number;
}

/**
 * Date generator interface
 */
export interface DateGenerator extends BaseGenerator<Date> {
  /**
   * Generate date within range
   */
  generateInRange(start?: Date, end?: Date, context?: GenerationContext): Date;

  /**
   * Generate past date
   */
  generatePast(years?: number, context?: GenerationContext): Date;

  /**
   * Generate future date
   */
  generateFuture(years?: number, context?: GenerationContext): Date;

  /**
   * Generate based on field semantics
   */
  generateBySemantic(fieldName: string, context: GenerationContext): Date;
}

/**
 * Array generator interface
 */
export interface ArrayGenerator extends BaseGenerator<any[]> {
  /**
   * Generate array of specific type
   */
  generateTypedArray<T>(
    elementGenerator: BaseGenerator<T>,
    length?: number,
    context?: GenerationContext
  ): T[];

  /**
   * Generate array with variable length
   */
  generateVariableArray<T>(
    elementGenerator: BaseGenerator<T>,
    minLength?: number,
    maxLength?: number,
    context?: GenerationContext
  ): T[];
}

/**
 * ObjectId generator interface
 */
export interface ObjectIdGenerator extends BaseGenerator<any> {
  /**
   * Generate reference to existing document
   */
  generateReference(
    modelName: string,
    context: GenerationContext
  ): Promise<any>;

  /**
   * Generate new ObjectId
   */
  generateNew(): any;

  /**
   * Generate with relationship constraints
   */
  generateWithConstraints(
    modelName: string,
    constraints: Record<string, any>,
    context: GenerationContext
  ): Promise<any>;
}

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  /** Priority for generator selection */
  priority?: number;

  /** Whether generator is enabled */
  enabled?: boolean;

  /** Custom options for generator */
  options?: Record<string, any>;

  /** Field patterns this generator should handle */
  patterns?: RegExp[];

  /** Field types this generator handles */
  fieldTypes?: FieldType[];
}

/**
 * Generator registry for managing available generators
 */
export interface GeneratorRegistry {
  /**
   * Initialize the generator registry
   */
  initialize(): void;
  /**
   * Register a generator
   */
  register(
    name: string,
    generator: BaseGenerator,
    config?: GeneratorConfig
  ): void;

  /**
   * Get generator by name
   */
  get(name: string): BaseGenerator | undefined;

  /**
   * Get best generator for field type
   */
  getBest(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): BaseGenerator | undefined;

  /**
   * Get all generators for field type
   */
  getAll(fieldType: FieldType): BaseGenerator[];

  /**
   * Remove generator
   */
  remove(name: string): boolean;

  /**
   * Check if generator exists
   */
  has(name: string): boolean;

  /**
   * Clear all generators
   */
  clear(): void;
}

/**
 * Generator factory for creating generators
 */
export interface GeneratorFactory {
  /**
   * Create string generator
   */
  createStringGenerator(config?: GeneratorConfig): StringGenerator;

  /**
   * Create number generator
   */
  createNumberGenerator(config?: GeneratorConfig): NumberGenerator;

  /**
   * Create date generator
   */
  createDateGenerator(config?: GeneratorConfig): DateGenerator;

  /**
   * Create array generator
   */
  createArrayGenerator(config?: GeneratorConfig): ArrayGenerator;

  /**
   * Create ObjectId generator
   */
  createObjectIdGenerator(config?: GeneratorConfig): ObjectIdGenerator;

  /**
   * Create custom generator
   */
  createCustomGenerator<T>(
    generateFn: (context: GenerationContext) => T | Promise<T>,
    config?: GeneratorConfig
  ): BaseGenerator<T>;
}

/**
 * Generation strategy for complex field handling
 */
export interface GenerationStrategy {
  /** Strategy name */
  name: string;

  /** Strategy description */
  description?: string;

  /** Whether strategy is applicable to field */
  isApplicable(
    fieldPath: string,
    schema: Schema,
    context: GenerationContext
  ): boolean;

  /** Generate value using strategy */
  generate(
    fieldPath: string,
    schema: Schema,
    context: GenerationContext
  ): any | Promise<any>;

  /** Strategy priority */
  priority: number;
}

/**
 * Smart generator that uses AI/ML for better data generation
 */
export interface SmartGenerator extends BaseGenerator {
  /**
   * Learn from existing data
   */
  learn(data: any[], fieldName: string): Promise<void>;

  /**
   * Generate based on learned patterns
   */
  generateSmart(context: GenerationContext): Promise<any>;

  /**
   * Get confidence score for generated value
   */
  getConfidence(value: any, context: GenerationContext): number;
}

/**
 * Generator performance metrics
 */
export interface GeneratorMetrics {
  /** Generator name */
  name: string;

  /** Number of generations */
  generationCount: number;

  /** Average generation time */
  avgGenerationTime: number;

  /** Success rate */
  successRate: number;

  /** Error count */
  errorCount: number;

  /** Cache hit rate */
  cacheHitRate: number;
}

/**
 * Cache entry for generated values
 */
export interface GeneratorCacheEntry {
  /** Cached value */
  value: any;

  /** Generation context hash */
  contextHash: string;

  /** Timestamp */
  timestamp: number;

  /** Hit count */
  hitCount: number;

  /** TTL in milliseconds */
  ttl?: number;
}
