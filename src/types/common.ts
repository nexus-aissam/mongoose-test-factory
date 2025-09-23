/**
 * Common type definitions used across the mongoose-test-factory plugin
 */

import { Document, Model, Schema } from "mongoose";

/**
 * Generic document type with optional custom properties
 */
export interface BaseDocument extends Document {
  [key: string]: any;
}

/**
 * Mongoose model type with factory method
 */
export interface ModelWithFactory<T extends BaseDocument = BaseDocument> extends Model<T> {
  factory(count?: number): FactoryBuilder<T>;
}

/**
 * Factory builder interface for fluent API
 */
export interface FactoryBuilder<T extends BaseDocument> {
  /**
   * Set the number of documents to create
   */
  count(num: number): FactoryBuilder<T>;

  /**
   * Override specific field values
   */
  with(field: keyof T, value: any): FactoryBuilder<T>;
  with(overrides: Partial<T>): FactoryBuilder<T>;

  /**
   * Add related documents
   */
  withRelated(field: keyof T, count: number): FactoryBuilder<T>;

  /**
   * Apply named traits
   */
  trait(name: string): FactoryBuilder<T>;

  /**
   * Create documents and save to database
   */
  create(): Promise<T[]>;
  create(count: 1): Promise<T>;
  create(count: number): Promise<T[]>;

  /**
   * Build documents without saving
   */
  build(): T[];
  build(count: 1): T;
  build(count: number): T[];

  /**
   * Make documents (create new instances)
   */
  make(): T[];
  make(count: 1): T;
  make(count: number): T[];
}

/**
 * Field type enumeration for schema analysis
 */
export enum FieldType {
  STRING = "String",
  NUMBER = "Number",
  BOOLEAN = "Boolean",
  DATE = "Date",
  OBJECTID = "ObjectId",
  ARRAY = "Array",
  OBJECT = "Object",
  MIXED = "Mixed",
  BUFFER = "Buffer",
  MAP = "Map",
  UUID = "UUID",
  DECIMAL128 = "Decimal128",
  BIGINT = "BigInt",
}

/**
 * Validation constraint types
 */
export interface ValidationConstraints {
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  match?: RegExp;
  enum?: any[];
  validate?: {
    validator: (value: any) => boolean;
    message: string;
  };
  default?: any;
}

/**
 * Field relationship information
 */
export interface FieldRelationship {
  type: "ref" | "embedded" | "subdocument";
  model?: string;
  path?: string;
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
