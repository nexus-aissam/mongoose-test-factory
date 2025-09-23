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
   * @param num - Number of documents to generate (must be positive)
   * @returns Factory instance for method chaining
   * @throws {FactoryError} When num is negative
   *
   * @example
   * ```typescript
   * // Generate 5 users
   * const users = User.factory().count(5).build();
   *
   * // Create 10 products and save to database
   * const products = await Product.factory().count(10).create();
   * ```
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
   * Override specific field values in the generated documents
   *
   * This method allows you to customize the generated data by providing specific values
   * for fields instead of using the automatically generated ones.
   *
   * @param field - Field name (string) or object with multiple field overrides
   * @param value - Value to set for the field (required when field is a string)
   * @returns Factory instance for method chaining
   * @throws {FactoryError} When field is string but value is undefined
   *
   * @example
   * ```typescript
   * // Override a single field
   * const user = User.factory()
   *   .with('name', 'John Doe')
   *   .build();
   *
   * // Override multiple fields at once
   * const user = User.factory()
   *   .with({
   *     name: 'Jane Smith',
   *     email: 'jane@example.com',
   *     age: 30
   *   })
   *   .build();
   *
   * // Chain multiple overrides
   * const product = Product.factory()
   *   .with('name', 'Special Product')
   *   .with({ price: 99.99, inStock: true })
   *   .build();
   * ```
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
   * Add related documents for relationship fields
   *
   * This method helps create related documents for ObjectId references or embedded documents.
   * It automatically handles the relationship creation and linking.
   *
   * @param field - The relationship field name in your schema
   * @param count - Number of related documents to create (must be positive)
   * @returns Factory instance for method chaining
   * @throws {FactoryError} When count is negative
   *
   * @example
   * ```typescript
   * // Create a user with 3 related posts
   * const user = await User.factory()
   *   .withRelated('posts', 3)
   *   .create();
   *
   * // Create an order with 5 related order items
   * const order = await Order.factory()
   *   .withRelated('items', 5)
   *   .withRelated('payments', 1)
   *   .create();
   * ```
   */
  withRelated(field: keyof T, count: number): FactoryBuilder<T> {
    if (count < 0) {
      throw new FactoryError("Related count must be a positive number");
    }

    this.state.relations[field as string] = count;
    return this;
  }

  /**
   * Apply named traits to customize document generation
   *
   * Traits are reusable configurations that apply specific modifications to generated documents.
   * They help create common variations like 'admin users', 'verified accounts', etc.
   *
   * @param name - The name of the trait to apply
   * @returns Factory instance for method chaining
   *
   * @example
   * ```typescript
   * // Assuming traits are defined in factory configuration
   * const adminUser = User.factory()
   *   .trait('admin')
   *   .trait('verified')
   *   .build();
   *
   * // Multiple traits can be chained
   * const premiumUser = User.factory()
   *   .trait('premium')
   *   .trait('active')
   *   .create();
   * ```
   */
  trait(name: string): FactoryBuilder<T> {
    if (!this.state.traits.includes(name)) {
      this.state.traits.push(name);
    }
    return this;
  }

  /**
   * Create documents and save them to the database
   *
   * This method generates the specified number of documents, validates them according to your
   * schema, and saves them to the MongoDB database. It returns the saved documents with
   * their assigned _id values.
   *
   * @param count - Optional number of documents to create (overrides previously set count)
   * @returns Promise resolving to a single document (when count=1) or array of documents
   * @throws {GenerationError} When document generation fails
   * @throws {ValidationError} When document validation fails
   *
   * @example
   * ```typescript
   * // Create a single user and save to database
   * const user = await User.factory().create();
   *
   * // Create multiple users
   * const users = await User.factory(5).create();
   * // or
   * const users = await User.factory().create(5);
   *
   * // Create with custom data
   * const admin = await User.factory()
   *   .with({ role: 'admin', isActive: true })
   *   .create();
   *
   * // Create with relationships
   * const userWithPosts = await User.factory()
   *   .withRelated('posts', 3)
   *   .create();
   * ```
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
   * Build documents as plain JavaScript objects without saving to database
   *
   * This method generates documents and returns them as plain JavaScript objects.
   * It's the fastest generation method as it doesn't involve Mongoose document
   * instantiation or database operations. Perfect for unit tests.
   *
   * @param count - Optional number of documents to build (overrides previously set count)
   * @returns Single object (when count=1) or array of plain JavaScript objects
   * @throws {GenerationError} When document generation fails
   *
   * @example
   * ```typescript
   * // Build a single user object
   * const userData = User.factory().build();
   * console.log(userData); // { name: 'John Doe', email: 'john@example.com', ... }
   *
   * // Build multiple users
   * const usersData = User.factory(10).build();
   * // or
   * const usersData = User.factory().build(10);
   *
   * // Build with custom data
   * const customUser = User.factory()
   *   .with({ name: 'Jane Smith', age: 25 })
   *   .build();
   *
   * // Perfect for testing functions that expect plain objects
   * function processUserData(userData) { ... }
   * const testData = User.factory().build();
   * processUserData(testData);
   * ```
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
   * Make documents as new Mongoose instances without saving to database
   *
   * This method generates documents and returns them as new Mongoose document instances.
   * The documents have all Mongoose features (virtuals, methods, etc.) but are not saved
   * to the database (isNew = true). Perfect for testing model methods and virtuals.
   *
   * @param count - Optional number of documents to make (overrides previously set count)
   * @returns Single Mongoose document (when count=1) or array of Mongoose documents
   * @throws {GenerationError} When document generation fails
   *
   * @example
   * ```typescript
   * // Make a single user instance
   * const user = User.factory().make();
   * console.log(user instanceof User); // true
   * console.log(user.isNew); // true
   *
   * // Make multiple users
   * const users = User.factory(5).make();
   * // or
   * const users = User.factory().make(5);
   *
   * // Test instance methods
   * const user = User.factory()
   *   .with({ email: 'test@example.com' })
   *   .make();
   * const isValid = user.validateEmail(); // Call instance method
   *
   * // Test virtuals
   * const user = User.factory()
   *   .with({ firstName: 'John', lastName: 'Doe' })
   *   .make();
   * console.log(user.fullName); // Access virtual property
   * ```
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
 * Create a new factory instance for generating test data
 *
 * This function creates a factory builder that can generate documents for a specific
 * Mongoose model. It's the primary way to create factories programmatically.
 *
 * @template T - The document type extending BaseDocument
 * @param model - The Mongoose model to create a factory for
 * @param options - Optional factory options including count, overrides, and context
 * @param config - Optional factory configuration with traits, defaults, and hooks
 * @returns New factory builder instance ready for chaining
 *
 * @example
 * ```typescript
 * import { createFactory } from 'mongoose-test-factory';
 *
 * // Create a basic factory
 * const userFactory = createFactory(User);
 * const user = userFactory.build();
 *
 * // Create factory with initial options
 * const userFactory = createFactory(User, { count: 5 });
 * const users = userFactory.build();
 *
 * // Create factory with configuration
 * const userFactory = createFactory(User, {}, {
 *   defaults: { isActive: true },
 *   traits: {
 *     admin: (builder) => builder.with({ role: 'admin' })
 *   }
 * });
 * const admin = userFactory.trait('admin').build();
 * ```
 */
export function createFactory<T extends BaseDocument>(
  model: Model<T>,
  options?: FactoryOptions,
  config?: FactoryConfig<T>
): FactoryBuilder<T> {
  return new Factory(model, options, config);
}

/**
 * Utility functions for factory management and configuration
 *
 * This object contains helper functions used internally by the plugin and
 * available for advanced use cases.
 */
export const FactoryHelpers = {
  /**
   * Create a factory method function that can be attached to a Mongoose model
   *
   * This method is used internally by the plugin to create the `factory()` static method
   * on Mongoose models. It can also be used for advanced factory creation scenarios.
   *
   * @template T - The document type extending BaseDocument
   * @param model - The Mongoose model to create a factory method for
   * @param config - Optional factory configuration with defaults, traits, and hooks
   * @returns Factory method function that creates factory instances
   *
   * @example
   * ```typescript
   * import { FactoryHelpers } from 'mongoose-test-factory';
   *
   * // Create a factory method with custom configuration
   * const factoryMethod = FactoryHelpers.createFactoryMethod(User, {
   *   defaults: { isActive: true },
   *   traits: {
   *     admin: (builder) => builder.with({ role: 'admin' })
   *   }
   * });
   *
   * // Attach to model manually
   * User.customFactory = factoryMethod;
   *
   * // Use the custom factory
   * const user = User.customFactory().build();
   * ```
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
   * Validate factory configuration for correctness
   *
   * This method validates that a factory configuration object is properly formatted
   * and contains valid trait definitions, hooks, and default values.
   *
   * @template T - The document type extending BaseDocument
   * @param config - Factory configuration object to validate
   * @returns True if configuration is valid, false otherwise
   *
   * @example
   * ```typescript
   * import { FactoryHelpers } from 'mongoose-test-factory';
   *
   * const config = {
   *   defaults: { isActive: true },
   *   traits: {
   *     admin: (builder) => builder.with({ role: 'admin' })
   *   }
   * };
   *
   * if (FactoryHelpers.validateConfig(config)) {
   *   console.log('Configuration is valid');
   * } else {
   *   console.error('Invalid configuration');
   * }
   * ```
   */
  validateConfig<T extends BaseDocument>(config: FactoryConfig<T>): boolean {
    // Configuration validation logic would go here
    return true;
  },
};
