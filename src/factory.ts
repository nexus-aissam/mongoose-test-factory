/**
 * Core Factory implementation for mongoose-test-factory
 *
 * This file contains the main Factory class that provides a fluent API
 * for creating test data with schema introspection and relationship management.
 */

import { Model, Document } from "mongoose";
import {
  BaseDocument,
  FactoryBuilder,
  FactoryConfig,
  GenerationContext,
  FactoryError,
  GenerationError,
  DeepPartial,
} from "./types/common";
import {
  FactoryOptions,
  FactoryState,
  FactoryResult,
  BulkCreateOptions,
  TraitDefinition,
} from "./types/factory";
import { SchemaAnalyzer } from "./utils/schema-analyzer";
import { GeneratorRegistry } from "./generators/registry";
import { RelationshipManager } from "./utils/relationship-manager";

/**
 * Main Factory class that implements the FactoryBuilder interface
 *
 * @template T - The document type this factory creates
 */
export class Factory<T extends BaseDocument> implements FactoryBuilder<T> {
  private state: FactoryState<T>;
  private schemaAnalyzer: SchemaAnalyzer;
  private generatorRegistry: GeneratorRegistry;
  private relationshipManager: RelationshipManager;

  /**
   * Create a new Factory instance
   *
   * @param model - The Mongoose model to create documents for
   * @param options - Factory configuration options
   */
  constructor(
    model: Model<T>,
    options: FactoryOptions = {},
    config: FactoryConfig<T> = {}
  ) {
    this.state = {
      model,
      count: options.count ?? 1,
      overrides: (options.overrides ?? {}) as Partial<T>,
      traits: options.traits ?? [],
      relations: options.relations ?? {},
      context: this.createGenerationContext(model, options),
      options,
    };

    this.schemaAnalyzer = new SchemaAnalyzer();
    this.generatorRegistry = new GeneratorRegistry();
    this.relationshipManager = new RelationshipManager();

    // Apply factory configuration
    this.applyConfig(config);
  }

  /**
   * Set the number of documents to create
   *
   * @param num - Number of documents
   * @returns Factory instance for method chaining
   */
  count(num: number): FactoryBuilder<T> {
    if (num < 0) {
      throw new FactoryError("Count must be a positive number");
    }

    this.state.count = num;
    this.state.context.totalCount = num;
    return this;
  }

  /**
   * Override specific field values
   *
   * @param field - Field name or object with multiple overrides
   * @param value - Value to set (if field is string)
   * @returns Factory instance for method chaining
   */
  with(field: keyof T | Partial<T>, value?: any): FactoryBuilder<T> {
    if (typeof field === "string") {
      if (value === undefined) {
        throw new FactoryError("Value must be provided when field is a string");
      }
      (this.state.overrides as any)[field] = value;
    } else {
      Object.assign(this.state.overrides, field);
    }

    return this;
  }

  /**
   * Add related documents
   *
   * @param field - Relationship field name
   * @param count - Number of related documents to create
   * @returns Factory instance for method chaining
   */
  withRelated(field: keyof T, count: number): FactoryBuilder<T> {
    if (count < 0) {
      throw new FactoryError("Related count must be a positive number");
    }

    this.state.relations[field as string] = count;
    return this;
  }

  /**
   * Apply named traits
   *
   * @param name - Trait name
   * @returns Factory instance for method chaining
   */
  trait(name: string): FactoryBuilder<T> {
    if (!this.state.traits.includes(name)) {
      this.state.traits.push(name);
    }
    return this;
  }

  /**
   * Create documents and save to database
   */
  create(): Promise<T[]>;
  create(count: 1): Promise<T>;
  create(count: number): Promise<T[]>;
  async create(count?: number): Promise<T | T[]> {
    const actualCount = count ?? this.state.count;
    this.state.count = actualCount;
    this.state.context.totalCount = actualCount;

    try {
      const documents = await this.generateDocuments(actualCount, true);
      const result = await this.persistDocuments(documents);

      // Apply after-create hooks
      for (const doc of result.documents) {
        await this.runHooks("afterCreate", doc);
      }

      return actualCount === 1 ? result.documents[0]! : result.documents;
    } catch (error) {
      throw new GenerationError(
        `Failed to create documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "create"
      );
    }
  }

  /**
   * Build documents without saving
   */
  build(): T[];
  build(count: 1): T;
  build(count: number): T[];
  build(count?: number): T | T[] {
    const actualCount = count ?? this.state.count;
    this.state.count = actualCount;
    this.state.context.totalCount = actualCount;

    try {
      const documents = this.generateDocumentsSync(actualCount);
      return actualCount === 1 ? documents[0]! : documents;
    } catch (error) {
      throw new GenerationError(
        `Failed to build documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "build"
      );
    }
  }

  /**
   * Make documents (create new instances)
   */
  make(): T[];
  make(count: 1): T;
  make(count: number): T[];
  make(count?: number): T | T[] {
    const actualCount = count ?? this.state.count;
    this.state.count = actualCount;
    this.state.context.totalCount = actualCount;

    try {
      const documents = this.generateDocumentsSync(actualCount);
      const instances = documents.map((doc) => new this.state.model(doc));
      return actualCount === 1 ? instances[0]! : instances;
    } catch (error) {
      throw new GenerationError(
        `Failed to make documents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "make"
      );
    }
  }

  /**
   * Generate documents with the current factory state
   *
   * @param count - Number of documents to generate
   * @param forPersistence - Whether documents will be persisted
   * @returns Generated documents
   */
  private async generateDocuments(
    count: number,
    forPersistence: boolean
  ): Promise<T[]> {
    const documents: T[] = [];
    const schema = this.state.model.schema;
    const analysis = this.schemaAnalyzer.analyze(
      schema,
      this.state.model.modelName
    );

    // Run before-generate hooks
    await this.runHooks("beforeGenerate", null);

    for (let i = 0; i < count; i++) {
      this.state.context.index = i;

      try {
        // Apply before-build hooks
        await this.runHooks("beforeBuild", null);

        // Generate base document
        const document = await this.generateSingleDocument(analysis);

        // Apply after-build hooks
        await this.runHooks("afterBuild", document);

        documents.push(document);
      } catch (error) {
        throw new GenerationError(
          `Failed to generate document at index ${i}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          `index_${i}`
        );
      }
    }

    return documents;
  }

  /**
   * Generate a single document
   *
   * @param analysis - Schema analysis result
   * @returns Generated document
   */
  private async generateSingleDocument(analysis: any): Promise<T> {
    const document: Partial<T> = {};

    // Apply traits first
    await this.applyTraits();

    // Generate fields based on schema analysis
    for (const [fieldPath, fieldAnalysis] of analysis.fields) {
      if (this.shouldGenerateField(fieldPath, fieldAnalysis)) {
        const value = await this.generateFieldValue(fieldPath, fieldAnalysis);
        this.setFieldValue(document, fieldPath, value);
      }
    }

    // Apply overrides
    Object.assign(document, this.state.overrides);

    // Generate relationships
    await this.generateRelationships(document, analysis);

    return document as T;
  }

  /**
   * Generate documents synchronously (for build/make operations)
   *
   * @param count - Number of documents to generate
   * @returns Generated documents
   */
  private generateDocumentsSync(count: number): T[] {
    const documents: T[] = [];
    const schema = this.state.model.schema;
    const analysis = this.schemaAnalyzer.analyze(
      schema,
      this.state.model.modelName
    );

    for (let i = 0; i < count; i++) {
      this.state.context.index = i;

      try {
        // Generate base document synchronously
        const document = this.generateSingleDocumentSync(analysis);
        documents.push(document);
      } catch (error) {
        throw new GenerationError(
          `Failed to generate document at index ${i}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          `index_${i}`
        );
      }
    }

    return documents;
  }

  /**
   * Generate a single document synchronously
   *
   * @param analysis - Schema analysis result
   * @returns Generated document
   */
  private generateSingleDocumentSync(analysis: any): T {
    const document: Partial<T> = {};

    // Generate fields based on schema analysis
    for (const [fieldPath, fieldAnalysis] of analysis.fields) {
      if (this.shouldGenerateField(fieldPath, fieldAnalysis)) {
        const value = this.generateFieldValueSync(fieldPath, fieldAnalysis);
        this.setFieldValue(document, fieldPath, value);
      }
    }

    // Apply overrides
    Object.assign(document, this.state.overrides);

    return document as T;
  }

  /**
   * Generate field value synchronously
   *
   * @param fieldPath - Field path in the document
   * @param fieldAnalysis - Field analysis result
   * @returns Generated value
   */
  private generateFieldValueSync(fieldPath: string, fieldAnalysis: any): any {
    this.state.context.fieldPath = fieldPath;

    // Check for custom generators
    const generator = this.generatorRegistry.getBest(
      fieldAnalysis.type,
      fieldAnalysis.constraints
    );

    if (!generator) {
      throw new GenerationError(
        `No generator found for field type: ${fieldAnalysis.type}`,
        fieldPath
      );
    }

    try {
      // Use synchronous generation if available, otherwise fallback to basic value
      if (generator.generateSync) {
        return generator.generateSync(this.state.context as unknown as GenerationContext);
      } else {
        // Fallback to basic values for sync operation
        return this.getBasicValue(fieldAnalysis.type);
      }
    } catch (error) {
      throw new GenerationError(
        `Failed to generate value for field ${fieldPath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        fieldPath
      );
    }
  }

  /**
   * Get basic value for a field type (fallback for sync generation)
   *
   * @param fieldType - Field type
   * @returns Basic value
   */
  private getBasicValue(fieldType: string): any {
    switch (fieldType.toLowerCase()) {
      case "string":
        return "test-value";
      case "number":
        return 42;
      case "boolean":
        return true;
      case "date":
        return new Date();
      case "objectid":
        return new (require("mongoose").Types.ObjectId)();
      default:
        return "default-value";
    }
  }

  /**
   * Generate value for a specific field
   *
   * @param fieldPath - Field path in the document
   * @param fieldAnalysis - Field analysis result
   * @returns Generated value
   */
  private async generateFieldValue(
    fieldPath: string,
    fieldAnalysis: any
  ): Promise<any> {
    this.state.context.fieldPath = fieldPath;

    // Check for custom generators
    const generator = this.generatorRegistry.getBest(
      fieldAnalysis.type,
      fieldAnalysis.constraints
    );

    if (!generator) {
      throw new GenerationError(
        `No generator found for field type: ${fieldAnalysis.type}`,
        fieldPath
      );
    }

    try {
      return await generator.generate(this.state.context as unknown as GenerationContext);
    } catch (error) {
      throw new GenerationError(
        `Failed to generate value for field ${fieldPath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        fieldPath
      );
    }
  }

  /**
   * Set field value in document, handling nested paths
   *
   * @param document - Target document
   * @param fieldPath - Field path (e.g., 'user.profile.name')
   * @param value - Value to set
   */
  private setFieldValue(
    document: Partial<T>,
    fieldPath: string,
    value: any
  ): void {
    const paths = fieldPath.split(".");
    let current: any = document;

    for (let i = 0; i < paths.length - 1; i++) {
      const path = paths[i];
      if (path && !current[path]) {
        current[path] = {};
      }
      if (path) {
        current = current[path];
      }
    }

    const lastPath = paths[paths.length - 1];
    if (lastPath) {
      current[lastPath] = value;
    }
  }

  /**
   * Check if field should be generated
   *
   * @param fieldPath - Field path
   * @param fieldAnalysis - Field analysis
   * @returns Whether to generate the field
   */
  private shouldGenerateField(fieldPath: string, fieldAnalysis: any): boolean {
    // Skip if override is provided
    if (this.state.overrides.hasOwnProperty(fieldPath)) {
      return false;
    }

    // Skip if field is not auto-generateable
    if (!fieldAnalysis.autoGenerate) {
      return false;
    }

    // Skip MongoDB internal fields
    if (fieldPath === "_id" || fieldPath === "__v") {
      return false;
    }

    return true;
  }

  /**
   * Apply traits to the factory state
   */
  private async applyTraits(): Promise<void> {
    // Traits would be applied here from factory configuration
    // This is a placeholder for trait application logic
  }

  /**
   * Generate relationships for the document
   *
   * @param document - Document to add relationships to
   * @param analysis - Schema analysis
   */
  private async generateRelationships(
    document: Partial<T>,
    analysis: any
  ): Promise<void> {
    for (const [fieldName, count] of Object.entries(this.state.relations)) {
      await this.relationshipManager.generateRelationship(
        document,
        fieldName,
        count as number,
        this.state.context as unknown as GenerationContext
      );
    }
  }

  /**
   * Persist documents to database
   *
   * @param documents - Documents to persist
   * @returns Factory result with persistence information
   */
  private async persistDocuments(documents: T[]): Promise<FactoryResult<T>> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const result: FactoryResult<T> = {
      documents: [],
      success: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
      memoryUsage: {
        before: startMemory,
        after: startMemory,
        peak: startMemory,
      },
    };

    try {
      // Use bulk insert for better performance
      const options: BulkCreateOptions = {
        batchSize: this.state.options.batchSize ?? 100,
        validate: this.state.options.validate ?? true,
        continueOnError: false,
        ordered: true,
      };

      const createdDocs = await this.bulkCreate(documents, options);
      result.documents = createdDocs;
      result.success = createdDocs.length;
    } catch (error) {
      result.failed = documents.length;
      result.errors.push(
        error instanceof Error ? error : new Error("Unknown persistence error")
      );
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    result.executionTime = endTime - startTime;
    result.memoryUsage!.after = endMemory;
    result.memoryUsage!.peak = endMemory; // Simplified - would need proper peak tracking

    return result;
  }

  /**
   * Bulk create documents in batches
   *
   * @param documents - Documents to create
   * @param options - Bulk create options
   * @returns Created documents
   */
  private async bulkCreate(
    documents: T[],
    options: BulkCreateOptions
  ): Promise<T[]> {
    const batchSize = options.batchSize ?? 100;
    const createdDocs: T[] = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      try {
        const result = await this.state.model.insertMany(batch, {
          ordered: options.ordered ?? true,
        });

        createdDocs.push(...(result as T[]));
      } catch (error) {
        if (!options.continueOnError) {
          throw error;
        }
        // Log error and continue with next batch
        console.warn(
          `Batch insert failed for batch starting at index ${i}:`,
          error
        );
      }
    }

    return createdDocs;
  }

  /**
   * Run lifecycle hooks
   *
   * @param hookName - Name of the hook
   * @param document - Document context (if applicable)
   */
  private async runHooks(hookName: string, document: T | null): Promise<void> {
    // Hook execution would be implemented here
    // This is a placeholder for hook execution logic
  }

  /**
   * Apply factory configuration
   *
   * @param config - Factory configuration
   */
  private applyConfig(config: FactoryConfig<T>): void {
    // Apply default values
    if (config.defaults) {
      Object.assign(this.state.overrides, config.defaults);
    }

    // Register traits
    if (config.traits) {
      // Traits would be registered here
    }

    // Register hooks
    if (config.hooks) {
      // Hooks would be registered here
    }
  }

  /**
   * Create generation context
   *
   * @param model - Mongoose model
   * @param options - Factory options
   * @returns Generation context
   */
  private createGenerationContext(
    model: Model<T>,
    options: FactoryOptions
  ): GenerationContext<T> {
    return {
      schema: model.schema,
      model: model as any,
      fieldPath: "",
      index: 0,
      totalCount: options.count ?? 1,
      existingValues: new Set(),
      relationships: new Map(),
      ...options.context,
    };
  }
}

/**
 * Create a new factory instance
 *
 * @param model - Mongoose model
 * @param options - Factory options
 * @param config - Factory configuration
 * @returns New factory instance
 */
export function createFactory<T extends BaseDocument>(
  model: Model<T>,
  options?: FactoryOptions,
  config?: FactoryConfig<T>
): FactoryBuilder<T> {
  return new Factory(model, options, config);
}

/**
 * Factory helper functions
 */
export const FactoryHelpers = {
  /**
   * Create a factory method for a model
   *
   * @param model - Mongoose model
   * @param config - Factory configuration
   * @returns Factory method
   */
  createFactoryMethod<T extends BaseDocument>(
    model: Model<T>,
    config?: FactoryConfig<T>
  ) {
    return function (this: Model<T>, count?: number) {
      return new Factory(this, count !== undefined ? { count } : {}, config);
    };
  },

  /**
   * Validate factory configuration
   *
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig<T extends BaseDocument>(config: FactoryConfig<T>): boolean {
    // Configuration validation logic would go here
    return true;
  },
};
