/**
 * Generator Registry for mongoose-test-factory
 *
 * Manages registration, discovery, and selection of data generators
 * with priority-based matching and configuration support.
 */

import {
  BaseGenerator,
  GeneratorRegistry as IGeneratorRegistry,
  GeneratorConfig,
} from "../types/generator";
import {
  FieldType,
  ValidationConstraints,
  GenerationError,
} from "../types/common";

// Import core generators
import {
  MongooseStringGenerator,
  EmailStringGenerator,
  PasswordStringGenerator,
  SlugStringGenerator,
} from "./string";
import {
  MongooseNumberGenerator,
  PriceNumberGenerator,
  AgeNumberGenerator,
  RatingNumberGenerator,
} from "./number";
import {
  MongooseDateGenerator,
  TimestampDateGenerator,
  BirthDateGenerator,
  FutureDateGenerator,
} from "./date";

/**
 * Generator registry implementation
 */
export class GeneratorRegistry implements IGeneratorRegistry {
  private generators = new Map<string, BaseGenerator>();
  private generatorConfigs = new Map<string, GeneratorConfig>();
  private fieldTypeCache = new Map<FieldType, BaseGenerator[]>();
  private initialized = false;

  /**
   * Initialize registry with default generators
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.registerDefaultGenerators();
    this.initialized = true;
  }

  /**
   * Register a generator
   */
  register(
    name: string,
    generator: BaseGenerator,
    config?: GeneratorConfig
  ): void {
    if (!generator) {
      throw new GenerationError(
        `Generator cannot be null or undefined: ${name}`
      );
    }

    if (this.generators.has(name)) {
      console.warn(
        `Generator with name '${name}' already exists. Overwriting.`
      );
    }

    this.generators.set(name, generator);

    if (config) {
      this.generatorConfigs.set(name, config);
      generator.updateConfig(config);
    }

    // Clear cache to force re-evaluation
    this.clearCache();

    console.debug(`Registered generator: ${name}`);
  }

  /**
   * Get generator by name
   */
  get(name: string): BaseGenerator | undefined {
    return this.generators.get(name);
  }

  /**
   * Get best generator for field type
   */
  getBest(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): BaseGenerator | undefined {
    this.ensureInitialized();

    const candidates = this.getAll(fieldType);

    if (candidates.length === 0) {
      return undefined;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // Sort by priority (higher = better) and enabled status
    const sortedCandidates = candidates
      .filter((generator) => generator.isEnabled())
      .sort((a, b) => {
        const priorityDiff = b.getPriority() - a.getPriority();
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        // If priorities are equal, prefer more specific generators
        return (
          this.getSpecificityScore(b, fieldType, constraints) -
          this.getSpecificityScore(a, fieldType, constraints)
        );
      });

    return sortedCandidates[0];
  }

  /**
   * Get all generators for field type
   */
  getAll(fieldType: FieldType): BaseGenerator[] {
    this.ensureInitialized();

    // Check cache first
    if (this.fieldTypeCache.has(fieldType)) {
      return this.fieldTypeCache.get(fieldType)!;
    }

    const matchingGenerators: BaseGenerator[] = [];

    for (const generator of this.generators.values()) {
      if (generator.canHandle(fieldType)) {
        matchingGenerators.push(generator);
      }
    }

    // Cache the result
    this.fieldTypeCache.set(fieldType, matchingGenerators);

    return matchingGenerators;
  }

  /**
   * Remove generator
   */
  remove(name: string): boolean {
    const removed = this.generators.delete(name);

    if (removed) {
      this.generatorConfigs.delete(name);
      this.clearCache();
      console.debug(`Removed generator: ${name}`);
    }

    return removed;
  }

  /**
   * Check if generator exists
   */
  has(name: string): boolean {
    return this.generators.has(name);
  }

  /**
   * Clear all generators
   */
  clear(): void {
    this.generators.clear();
    this.generatorConfigs.clear();
    this.clearCache();
    this.initialized = false;
    console.debug("Cleared all generators");
  }

  /**
   * Get all generator names
   */
  getNames(): string[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Get generator statistics
   */
  getStats(): GeneratorRegistryStats {
    return {
      totalGenerators: this.generators.size,
      enabledGenerators: Array.from(this.generators.values()).filter((g) =>
        g.isEnabled()
      ).length,
      generatorsByType: this.getGeneratorsByType(),
      cacheSize: this.fieldTypeCache.size,
    };
  }

  /**
   * Enable or disable a generator
   */
  setEnabled(name: string, enabled: boolean): boolean {
    const generator = this.generators.get(name);

    if (!generator) {
      return false;
    }

    generator.setEnabled(enabled);
    this.clearCache(); // Clear cache since enabled status affects selection

    console.debug(`${enabled ? "Enabled" : "Disabled"} generator: ${name}`);
    return true;
  }

  /**
   * Update generator configuration
   */
  updateConfig(name: string, config: Partial<GeneratorConfig>): boolean {
    const generator = this.generators.get(name);

    if (!generator) {
      return false;
    }

    const existingConfig = this.generatorConfigs.get(name) || {};
    const newConfig = { ...existingConfig, ...config };

    this.generatorConfigs.set(name, newConfig);
    generator.updateConfig(config);
    this.clearCache();

    console.debug(`Updated config for generator: ${name}`);
    return true;
  }

  /**
   * Get generators that can handle multiple field types
   */
  getMultiTypeGenerators(): Array<{
    name: string;
    generator: BaseGenerator;
    types: FieldType[];
  }> {
    const result: Array<{
      name: string;
      generator: BaseGenerator;
      types: FieldType[];
    }> = [];

    for (const [name, generator] of this.generators) {
      const supportedTypes: FieldType[] = [];

      for (const fieldType of Object.values(FieldType)) {
        if (generator.canHandle(fieldType)) {
          supportedTypes.push(fieldType);
        }
      }

      if (supportedTypes.length > 1) {
        result.push({ name, generator, types: supportedTypes });
      }
    }

    return result;
  }

  /**
   * Register default generators
   */
  private registerDefaultGenerators(): void {
    // String generators
    this.register("string", new MongooseStringGenerator());
    this.register("email", new EmailStringGenerator());
    this.register("password", new PasswordStringGenerator());
    this.register("slug", new SlugStringGenerator());

    // Number generators
    this.register("number", new MongooseNumberGenerator());
    this.register("price", new PriceNumberGenerator());
    this.register("age", new AgeNumberGenerator());
    this.register("rating", new RatingNumberGenerator());

    // Date generators
    this.register("date", new MongooseDateGenerator());
    this.register("timestamp", new TimestampDateGenerator());
    this.register("birthdate", new BirthDateGenerator());
    this.register("futuredate", new FutureDateGenerator());

    console.debug("Registered default generators");
  }

  /**
   * Calculate specificity score for generator selection
   */
  private getSpecificityScore(
    generator: BaseGenerator,
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): number {
    let score = 0;

    // Base score from priority
    score += generator.getPriority();

    // Bonus for constraint handling
    if (constraints) {
      // Bonus for enum handling
      if (constraints.enum && this.canHandleEnum(generator)) {
        score += 10;
      }

      // Bonus for regex handling
      if (constraints.match && this.canHandleRegex(generator)) {
        score += 10;
      }

      // Bonus for range handling
      if (
        (constraints.min !== undefined || constraints.max !== undefined) &&
        this.canHandleRange(generator)
      ) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Check if generator can handle enum constraints
   */
  private canHandleEnum(generator: BaseGenerator): boolean {
    // This would check if generator has enum handling capability
    return (
      generator.constructor.name.includes("String") ||
      generator.constructor.name.includes("Enum")
    );
  }

  /**
   * Check if generator can handle regex constraints
   */
  private canHandleRegex(generator: BaseGenerator): boolean {
    // This would check if generator has regex handling capability
    return generator.constructor.name.includes("String");
  }

  /**
   * Check if generator can handle range constraints
   */
  private canHandleRange(generator: BaseGenerator): boolean {
    // This would check if generator has range handling capability
    return (
      generator.constructor.name.includes("Number") ||
      generator.constructor.name.includes("Date")
    );
  }

  /**
   * Get generators grouped by type
   */
  private getGeneratorsByType(): Record<string, number> {
    const typeCount: Record<string, number> = {};

    for (const generator of this.generators.values()) {
      const typeName = generator.constructor.name;
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    }

    return typeCount;
  }

  /**
   * Clear field type cache
   */
  private clearCache(): void {
    this.fieldTypeCache.clear();
  }

  /**
   * Ensure registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

/**
 * Registry statistics interface
 */
interface GeneratorRegistryStats {
  totalGenerators: number;
  enabledGenerators: number;
  generatorsByType: Record<string, number>;
  cacheSize: number;
}

/**
 * Generator factory for creating new generators
 */
export class GeneratorFactory {
  /**
   * Create a custom generator
   */
  static createCustom<T>(
    name: string,
    canHandleFn: (
      fieldType: FieldType,
      constraints?: ValidationConstraints
    ) => boolean,
    generateFn: (context: any) => T | Promise<T>,
    config?: GeneratorConfig
  ): BaseGenerator<T> {
    class CustomGenerator extends class {
      private config: GeneratorConfig;
      private priority: number;
      private enabled: boolean;

      constructor(config: GeneratorConfig = {}) {
        this.config = config;
        this.priority = config.priority ?? 0;
        this.enabled = config.enabled ?? true;
      }

      canHandle(
        fieldType: FieldType,
        constraints?: ValidationConstraints
      ): boolean {
        return canHandleFn(fieldType, constraints);
      }

      async generate(context: any): Promise<T> {
        return await generateFn(context);
      }

      getPriority(): number {
        return this.priority;
      }

      isEnabled(): boolean {
        return this.enabled;
      }

      setEnabled(enabled: boolean): void {
        this.enabled = enabled;
      }

      updateConfig(newConfig: Partial<GeneratorConfig>): void {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.priority !== undefined) {
          this.priority = newConfig.priority;
        }
        if (newConfig.enabled !== undefined) {
          this.enabled = newConfig.enabled;
        }
      }

      getConfig(): GeneratorConfig {
        return { ...this.config };
      }

      validate(value: T, constraints?: ValidationConstraints): boolean {
        return true; // Basic implementation
      }
    } {
      constructor() {
        super(config);
      }
    }

    return new CustomGenerator();
  }

  /**
   * Create a string generator with pattern
   */
  static createStringPattern(
    pattern: RegExp,
    generateFn: () => string,
    priority: number = 30
  ): BaseGenerator<string> {
    return this.createCustom(
      "string-pattern",
      (fieldType, constraints) => {
        return (
          fieldType === FieldType.STRING &&
          constraints?.match?.toString() === pattern.toString()
        );
      },
      generateFn,
      { priority }
    );
  }

  /**
   * Create a number range generator
   */
  static createNumberRange(
    min: number,
    max: number,
    priority: number = 30
  ): BaseGenerator<number> {
    return this.createCustom(
      "number-range",
      (fieldType, constraints) => {
        return (
          fieldType === FieldType.NUMBER &&
          constraints?.min === min &&
          constraints?.max === max
        );
      },
      () => Math.floor(Math.random() * (max - min + 1)) + min,
      { priority }
    );
  }
}

// Global registry instance
export const globalGeneratorRegistry = new GeneratorRegistry();
