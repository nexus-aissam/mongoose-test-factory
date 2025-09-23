/**
 * Common type definitions used across the mongoose-test-factory plugin
 *
 * This module contains the core type definitions that form the foundation
 * of the factory system, including document types, builder interfaces,
 * and generation contexts.
 */

import { Document, Model, Schema } from "mongoose";

/**
 * Base document interface that all generated documents must extend
 *
 * This interface extends Mongoose's Document type and allows for additional
 * custom properties. All documents created by the factory system will
 * implement this interface.
 *
 * @example
 * ```typescript
 * interface IUser extends BaseDocument {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 * ```
 */
export interface BaseDocument extends Document {
  [key: string]: any;
}

/**
 * Extended Mongoose model interface that includes the factory method
 *
 * This interface extends the standard Mongoose Model interface to include
 * the factory method that enables test data generation.
 *
 * @template T - The document type extending BaseDocument
 *
 * @example
 * ```typescript
 * const UserModel: ModelWithFactory<IUser> = mongoose.model('User', userSchema);
 * const user = UserModel.factory().build();
 * ```
 */
export interface ModelWithFactory<T extends BaseDocument = BaseDocument> extends Model<T> {
  /**
   * Create a factory instance for generating test data
   *
   * @param count - Optional number of documents to generate
   * @returns Factory builder instance for method chaining
   */
  factory(count?: number): FactoryBuilder<T>;
}

/**
 * Factory builder interface that provides a fluent API for data generation
 *
 * This interface defines the chainable methods available on factory instances,
 * allowing for intuitive and readable test data creation.
 *
 * @template T - The document type extending BaseDocument
 *
 * @example
 * ```typescript
 * const users = User.factory(5)
 *   .with({ isActive: true })
 *   .trait('verified')
 *   .build();
 * ```
 */
export interface FactoryBuilder<T extends BaseDocument> {
  /**
   * Set the number of documents to generate
   *
   * @param num - Number of documents to create (must be positive)
   * @returns Factory builder instance for method chaining
   *
   * @example
   * ```typescript
   * const users = User.factory().count(5).build();
   * ```
   */
  count(num: number): FactoryBuilder<T>;

  /**
   * Override specific field values in the generated documents
   *
   * Allows customization of generated data by providing specific values
   * instead of using automatically generated ones.
   *
   * @param field - Field name or object with multiple overrides
   * @param value - Value to set (required when field is a string)
   * @returns Factory builder instance for method chaining
   *
   * @example
   * ```typescript
   * // Override single field
   * const user = User.factory().with('name', 'John Doe').build();
   *
   * // Override multiple fields
   * const user = User.factory().with({
   *   name: 'Jane Smith',
   *   age: 30,
   *   isActive: true
   * }).build();
   * ```
   */
  with(field: keyof T, value: any): FactoryBuilder<T>;
  with(overrides: Partial<T>): FactoryBuilder<T>;

  /**
   * Create related documents for relationship fields
   *
   * Automatically handles ObjectId references and relationship creation.
   *
   * @param field - The relationship field name
   * @param count - Number of related documents to create
   * @returns Factory builder instance for method chaining
   *
   * @example
   * ```typescript
   * // Create user with 3 related posts
   * const user = await User.factory()
   *   .withRelated('posts', 3)
   *   .create();
   * ```
   */
  withRelated(field: keyof T, count: number): FactoryBuilder<T>;

  /**
   * Apply named traits for common data variations
   *
   * Traits are reusable configurations that apply specific modifications,
   * useful for creating common variations like 'admin users' or 'verified accounts'.
   *
   * @param name - Name of the trait to apply
   * @returns Factory builder instance for method chaining
   *
   * @example
   * ```typescript
   * const admin = User.factory()
   *   .trait('admin')
   *   .trait('verified')
   *   .build();
   * ```
   */
  trait(name: string): FactoryBuilder<T>;

  /**
   * Generate documents and save them to the database
   *
   * Creates the specified number of documents, validates them, and saves
   * to MongoDB. Returns documents with assigned _id values.
   *
   * @param count - Optional number to override previously set count
   * @returns Promise resolving to single document or array of documents
   *
   * @example
   * ```typescript
   * // Create and save single document
   * const user = await User.factory().create();
   *
   * // Create and save multiple documents
   * const users = await User.factory(5).create();
   * ```
   */
  create(): Promise<T[]>;
  create(count: 1): Promise<T>;
  create(count: number): Promise<T[]>;

  /**
   * Generate documents as plain JavaScript objects (fastest method)
   *
   * Creates plain objects without Mongoose document features or database
   * operations. Perfect for unit tests requiring simple data objects.
   *
   * @param count - Optional number to override previously set count
   * @returns Single object or array of plain JavaScript objects
   *
   * @example
   * ```typescript
   * // Build single object
   * const userData = User.factory().build();
   *
   * // Build multiple objects
   * const usersData = User.factory(10).build();
   * ```
   */
  build(): T[];
  build(count: 1): T;
  build(count: number): T[];

  /**
   * Generate documents as new Mongoose instances (not saved)
   *
   * Creates Mongoose document instances with all features (virtuals, methods)
   * but doesn't save to database. Perfect for testing instance methods.
   *
   * @param count - Optional number to override previously set count
   * @returns Single document instance or array of document instances
   *
   * @example
   * ```typescript
   * // Make single instance
   * const user = User.factory().make();
   * console.log(user.isNew); // true
   *
   * // Make multiple instances
   * const users = User.factory(5).make();
   * ```
   */
  make(): T[];
  make(count: 1): T;
  make(count: number): T[];
}

/**
 * Enumeration of MongoDB/Mongoose field types for schema analysis
 *
 * This enum represents all supported field types that the factory system
 * can analyze and generate data for. Used internally for type detection
 * and generator selection.
 *
 * @example
 * ```typescript
 * import { FieldType } from 'mongoose-test-factory';
 *
 * // Check field type in custom generator
 * if (fieldType === FieldType.STRING) {
 *   return generateStringValue();
 * }
 * ```
 */
export enum FieldType {
  /** Standard string fields */
  STRING = "String",
  /** Numeric fields (integers and floats) */
  NUMBER = "Number",
  /** Boolean true/false fields */
  BOOLEAN = "Boolean",
  /** Date and timestamp fields */
  DATE = "Date",
  /** MongoDB ObjectId references */
  OBJECTID = "ObjectId",
  /** Array fields containing multiple values */
  ARRAY = "Array",
  /** Nested object/subdocument fields */
  OBJECT = "Object",
  /** Mixed type fields that can contain any value */
  MIXED = "Mixed",
  /** Binary buffer fields */
  BUFFER = "Buffer",
  /** Map fields with key-value pairs */
  MAP = "Map",
  /** UUID string fields */
  UUID = "UUID",
  /** High-precision decimal numbers */
  DECIMAL128 = "Decimal128",
  /** Large integer values */
  BIGINT = "BigInt",
}

/**
 * Validation constraints extracted from Mongoose schema definitions
 *
 * This interface represents the validation rules defined in your Mongoose schema
 * that the factory system uses to generate compliant data automatically.
 *
 * @example
 * ```typescript
 * const constraints: ValidationConstraints = {
 *   required: true,
 *   minLength: 3,
 *   maxLength: 50,
 *   match: /^[a-zA-Z]+$/
 * };
 * ```
 */
export interface ValidationConstraints {
  /** Whether the field is required (cannot be null/undefined) */
  required?: boolean;
  /** Whether the field must have unique values */
  unique?: boolean;
  /** Minimum numeric value or minimum array length */
  min?: number;
  /** Maximum numeric value or maximum array length */
  max?: number;
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** Regular expression pattern the value must match */
  match?: RegExp;
  /** Array of allowed enum values */
  enum?: any[];
  /** Custom validation function with error message */
  validate?: {
    /** Function that returns true if value is valid */
    validator: (value: any) => boolean;
    /** Error message to display if validation fails */
    message: string;
  };
  /** Default value to use if none provided */
  default?: any;
}

/**
 * Information about field relationships and references
 *
 * This interface describes how fields relate to other documents or collections,
 * enabling automatic relationship generation and population.
 *
 * @example
 * ```typescript
 * const relationship: FieldRelationship = {
 *   type: "ref",
 *   model: "User",
 *   path: "author",
 *   isArray: false
 * };
 * ```
 */
export interface FieldRelationship {
  /** Type of relationship */
  type: "ref" | "embedded" | "subdocument";
  /** Referenced model name for ObjectId references */
  model?: string;
  /** Field path for nested relationships */
  path?: string;
  /** Whether this is an array of references */
  isArray?: boolean;
}

/**
 * Context for data generation
 */
export interface GenerationContext<T extends BaseDocument = BaseDocument> {
  schema: Schema;
  model: Model<T>;
  fieldPath: string;
  parentDocument?: any;
  index?: number;
  totalCount?: number;
  existingValues?: Set<any>;
  relationships?: Map<string, any[]>;
}

/**
 * Error types for the plugin
 */
export class FactoryError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "FactoryError";
  }
}

export class GenerationError extends FactoryError {
  constructor(message: string, public readonly fieldPath?: string) {
    super(message, "GENERATION_ERROR");
    this.name = "GenerationError";
  }
}

export class ValidationError extends FactoryError {
  constructor(message: string, public readonly fieldPath?: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class RelationshipError extends FactoryError {
  constructor(message: string, public readonly relationship?: string) {
    super(message, "RELATIONSHIP_ERROR");
    this.name = "RelationshipError";
  }
}

/**
 * Utility types for better type inference
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Type for extracting document type from model
 */
export type DocumentType<T> = T extends Model<infer U> ? U : never;

/**
 * Type for field name extraction
 */
export type FieldNames<T> = keyof T extends string ? keyof T : never;

/**
 * Trait definition type
 */
export type TraitDefinition<T extends BaseDocument> = (
  builder: FactoryBuilder<T>
) => FactoryBuilder<T>;

/**
 * Factory configuration type
 */
export interface FactoryConfig<T extends BaseDocument> {
  traits?: Record<string, TraitDefinition<T>>;
  defaults?: Partial<T>;
  hooks?: {
    beforeCreate?: (doc: T) => void | Promise<void>;
    afterCreate?: (doc: T) => void | Promise<void>;
    beforeBuild?: (doc: T) => void | Promise<void>;
    afterBuild?: (doc: T) => void | Promise<void>;
  };
}
