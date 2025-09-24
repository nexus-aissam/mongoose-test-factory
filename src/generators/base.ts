/**
 * Base Generator for mongoose-test-factory
 *
 * Abstract base class that all generators extend, providing common functionality
 * and establishing the contract for data generation.
 */

import { BaseGenerator, GeneratorConfig } from "../types/generator";
import {
  FieldType,
  GenerationContext,
  ValidationConstraints,
  GenerationError,
} from "../types/common";

/**
 * Abstract base generator class
 *
 * @template T - The type of value this generator produces
 */
export abstract class AbstractBaseGenerator<T = any>
  implements BaseGenerator<T>
{
  protected config: GeneratorConfig;
  protected priority: number;
  protected enabled: boolean;

  /**
   * Create a new base generator
   *
   * @param config - Generator configuration
   */
  constructor(config: GeneratorConfig = {}) {
    this.config = config;
    this.priority = config.priority ?? 0;
    this.enabled = config.enabled ?? true;
  }

  /**
   * Generate a value for the field
   * Must be implemented by concrete generators
   *
   * @param context - Generation context
   * @returns Generated value or promise
   */
  abstract generate(context: GenerationContext): T | Promise<T>;

  /**
   * Generate a value synchronously
   * Default implementation calls generate() and returns synchronously if possible
   *
   * @param context - Generation context
   * @returns Generated value
   */
  generateSync(context: GenerationContext): T {
    const result = this.generate(context);

    // If the result is a promise, we can't handle it synchronously
    if (result instanceof Promise) {
      throw new GenerationError(
        `Generator ${this.constructor.name} does not support synchronous generation`,
        context.fieldPath || 'unknown'
      );
    }

    return result;
  }

  /**
   * Check if this generator can handle the field type
   * Must be implemented by concrete generators
   *
   * @param fieldType - Field type to check
   * @param constraints - Optional validation constraints
   * @returns Whether this generator can handle the field
   */
  abstract canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean;

  /**
   * Get priority for generator selection (higher = more specific)
   *
   * @returns Priority score
   */
  getPriority(): number {
    return this.priority;
  }

  /**
   * Validate generated value against constraints
   *
   * @param value - Value to validate
   * @param constraints - Validation constraints
   * @returns Whether value is valid
   */
  validate(value: T, constraints?: ValidationConstraints): boolean {
    if (!constraints) {
      return true;
    }

    try {
      // Check required constraint
      if (constraints.required && (value === null || value === undefined)) {
        return false;
      }

      // Check enum constraint
      if (constraints.enum && !constraints.enum.includes(value)) {
        return false;
      }

      // Check custom validator
      if (constraints.validate && !constraints.validate.validator(value)) {
        return false;
      }

      // Type-specific validation (implemented in subclasses)
      return this.validateTypeSpecific(value, constraints);
    } catch (error) {
      return false;
    }
  }

  /**
   * Type-specific validation (override in subclasses)
   *
   * @param value - Value to validate
   * @param constraints - Validation constraints
   * @returns Whether value is valid
   */
  protected validateTypeSpecific(
    value: T,
    constraints: ValidationConstraints
  ): boolean {
    return true;
  }

  /**
   * Check if generator is enabled
   *
   * @returns Whether generator is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable the generator
   *
   * @param enabled - Whether to enable the generator
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Update generator configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.priority !== undefined) {
      this.priority = config.priority;
    }

    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
  }

  /**
   * Get generator configuration
   *
   * @returns Current configuration
   */
  getConfig(): GeneratorConfig {
    return { ...this.config };
  }

  /**
   * Generate value with error handling
   *
   * @param context - Generation context
   * @returns Generated value
   */
  async generateSafely(context: GenerationContext): Promise<T> {
    try {
      const value = await this.generate(context);

      if (this.config.options?.enableValidation !== false) {
        const fieldAnalysis = this.getFieldAnalysisFromContext(context);
        const isValid = this.validate(value, fieldAnalysis?.constraints);

        if (!isValid) {
          throw new GenerationError(
            `Generated value failed validation: ${value}`,
            context.fieldPath
          );
        }
      }

      return value;
    } catch (error) {
      throw new GenerationError(
        `Generator failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        context.fieldPath
      );
    }
  }

  /**
   * Get field analysis from generation context
   *
   * @param context - Generation context
   * @returns Field analysis or undefined
   */
  protected getFieldAnalysisFromContext(context: GenerationContext): any {
    // This would extract field analysis from the context
    // Implementation depends on how context is structured
    return undefined;
  }

  /**
   * Get option value from configuration
   *
   * @param key - Option key
   * @param defaultValue - Default value if option not found
   * @returns Option value
   */
  protected getOption<K>(key: string, defaultValue?: K): K {
    return this.config.options?.[key] ?? defaultValue;
  }

  /**
   * Check if field name matches any patterns
   *
   * @param fieldName - Field name to check
   * @returns Whether field matches patterns
   */
  protected matchesPatterns(fieldName: string): boolean {
    if (!this.config.patterns || this.config.patterns.length === 0) {
      return false;
    }

    return this.config.patterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Get random element from array
   *
   * @param array - Array to select from
   * @returns Random element
   */
  protected getRandomElement<E>(array: E[]): E {
    if (array.length === 0) {
      throw new Error("Cannot get random element from empty array");
    }

    return array[Math.floor(Math.random() * array.length)]!;
  }

  /**
   * Get random number in range
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random number
   */
  protected getRandomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get random float in range
   *
   * @param min - Minimum value
   * @param max - Maximum value
   * @param precision - Number of decimal places
   * @returns Random float
   */
  protected getRandomFloat(
    min: number = 0,
    max: number = 1,
    precision: number = 2
  ): number {
    const factor = Math.pow(10, precision);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
  }

  /**
   * Generate unique value using existing values set
   *
   * @param context - Generation context
   * @param generateFn - Function to generate value
   * @param maxAttempts - Maximum attempts to generate unique value
   * @returns Unique value
   */
  protected async generateUnique(
    context: GenerationContext,
    generateFn: () => T | Promise<T>,
    maxAttempts: number = 100
  ): Promise<T> {
    if (!context.existingValues) {
      context.existingValues = new Set();
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const value = await generateFn();

      if (!context.existingValues.has(value)) {
        context.existingValues.add(value);
        return value;
      }
    }

    throw new GenerationError(
      `Could not generate unique value after ${maxAttempts} attempts`,
      context.fieldPath
    );
  }

  /**
   * Create a seeded random number generator
   *
   * @param seed - Seed value
   * @returns Seeded random function
   */
  protected createSeededRandom(seed?: number): () => number {
    let currentSeed = seed ?? Math.floor(Math.random() * 1000000);

    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Sleep for specified milliseconds (for rate limiting)
   *
   * @param ms - Milliseconds to sleep
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cache key generation for caching results
   *
   * @param context - Generation context
   * @param additionalKeys - Additional keys for cache
   * @returns Cache key
   */
  protected getCacheKey(
    context: GenerationContext,
    ...additionalKeys: string[]
  ): string {
    const baseKey = `${context.model.modelName}:${context.fieldPath}:${context.index}`;
    return additionalKeys.length > 0
      ? `${baseKey}:${additionalKeys.join(":")}`
      : baseKey;
  }

  /**
   * Log debug information if debugging is enabled
   *
   * @param message - Debug message
   * @param data - Additional debug data
   */
  protected debug(message: string, data?: any): void {
    if (this.getOption("debug", false)) {
      console.debug(`[${this.constructor.name}] ${message}`, data);
    }
  }

  /**
   * Log warning message
   *
   * @param message - Warning message
   * @param data - Additional data
   */
  protected warn(message: string, data?: any): void {
    console.warn(`[${this.constructor.name}] ${message}`, data);
  }
}

/**
 * Generator utility functions
 */
export const GeneratorUtils = {
  /**
   * Create generator configuration with defaults
   *
   * @param config - Partial configuration
   * @returns Complete configuration
   */
  createConfig(config: Partial<GeneratorConfig> = {}): GeneratorConfig {
    return {
      priority: 0,
      enabled: true,
      options: {},
      patterns: config.patterns ?? [],
      fieldTypes: config.fieldTypes ?? [],
      ...config,
    };
  },

  /**
   * Validate generator configuration
   *
   * @param config - Configuration to validate
   * @returns Whether configuration is valid
   */
  validateConfig(config: GeneratorConfig): boolean {
    if (typeof config.priority !== "number" || config.priority < 0) {
      return false;
    }

    if (typeof config.enabled !== "boolean") {
      return false;
    }

    if (config.patterns && !Array.isArray(config.patterns)) {
      return false;
    }

    if (config.fieldTypes && !Array.isArray(config.fieldTypes)) {
      return false;
    }

    return true;
  },

  /**
   * Merge generator configurations
   *
   * @param base - Base configuration
   * @param override - Override configuration
   * @returns Merged configuration
   */
  mergeConfigs(
    base: GeneratorConfig,
    override: Partial<GeneratorConfig>
  ): GeneratorConfig {
    const merged: GeneratorConfig = {
      ...base,
      ...override,
      options: { ...base.options, ...override.options },
    };

    // Handle patterns with proper undefined checking
    if (override.patterns !== undefined) {
      merged.patterns = override.patterns;
    } else {
      merged.patterns = base.patterns ?? [];
    }

    // Handle fieldTypes with proper undefined checking
    if (override.fieldTypes !== undefined) {
      merged.fieldTypes = override.fieldTypes;
    } else {
      merged.fieldTypes = base.fieldTypes ?? [];
    }

    return merged;
  },
};
