/**
 * Factory-specific type definitions
 */

import { Model, Schema } from "mongoose";
import {
  BaseDocument,
  FactoryBuilder,
  FactoryConfig,
  GenerationContext,
} from "./common";

/**
 * Factory options for document generation
 */
export interface FactoryOptions {
  /** Number of documents to create */
  count?: number;

  /** Field overrides */
  overrides?: Record<string, any>;

  /** Traits to apply */
  traits?: string[];

  /** Related document counts */
  relations?: Record<string, number>;

  /** Whether to save to database */
  persist?: boolean;

  /** Batch size for bulk operations */
  batchSize?: number;

  /** Whether to validate before saving */
  validate?: boolean;

  /** Custom generation context */
  context?: Partial<GenerationContext>;
}

/**
 * Factory registry entry
 */
export interface FactoryRegistryEntry<T extends BaseDocument> {
  model: Model<T, {}, {}, {}, T, any, any>;
  schema: Schema;
  config: FactoryConfig<T>;
  builder: new (
    model: Model<T, {}, {}, {}, T, any, any>,
    options?: FactoryOptions
  ) => FactoryBuilder<T>;
}

/**
 * Factory state for tracking generation progress
 */
export interface FactoryState<T extends BaseDocument> {
  model: Model<T, {}, {}, {}, T, any, any>;
  count: number;
  overrides: Partial<T>;
  traits: string[];
  relations: Record<string, number>;
  context: GenerationContext<T>;
  options: FactoryOptions;
}

/**
 * Factory method signature
 */
export type FactoryMethod<T extends BaseDocument> = (
  this: Model<T, {}, {}, {}, T, any, any>,
  count?: number
) => FactoryBuilder<T>;

/**
 * Factory definition for registering custom factories
 */
export interface FactoryDefinition<T extends BaseDocument> {
  /** Model to create factory for */
  model: Model<T, {}, {}, {}, T, any, any>;

  /** Default field values */
  defaults?: Partial<T>;

  /** Named traits */
  traits?: Record<string, (builder: FactoryBuilder<T>) => FactoryBuilder<T>>;

  /** Relationship definitions */
  relationships?: Record<
    string,
    {
      model: string;
      type: "hasOne" | "hasMany" | "belongsTo";
      foreignKey?: string;
      localKey?: string;
    }
  >;

  /** Custom generation hooks */
  hooks?: {
    beforeGenerate?: (context: GenerationContext) => void | Promise<void>;
    afterGenerate?: (
      document: T,
      context: GenerationContext
    ) => void | Promise<void>;
    beforeSave?: (document: T) => void | Promise<void>;
    afterSave?: (document: T) => void | Promise<void>;
  };

  /** Custom field generators */
  generators?: Record<string, (context: GenerationContext) => any>;
}

/**
 * Trait definition for reusable factory modifications
 */
export interface TraitDefinition<T extends BaseDocument> {
  /** Trait name */
  name: string;

  /** Field overrides */
  overrides?: Partial<T>;

  /** Additional traits to apply */
  traits?: string[];

  /** Custom field generators */
  generators?: Record<string, (context: GenerationContext) => any>;

  /** Custom hooks for this trait */
  hooks?: {
    beforeGenerate?: (context: GenerationContext) => void | Promise<void>;
    afterGenerate?: (
      document: T,
      context: GenerationContext
    ) => void | Promise<void>;
  };
}

/**
 * Factory manager interface
 */
export interface FactoryManager {
  /**
   * Register a factory for a model
   */
  register<T extends BaseDocument>(definition: FactoryDefinition<T>): void;

  /**
   * Get factory for a model
   */
  get<T extends BaseDocument>(
    model: Model<T, {}, {}, {}, T, any, any>
  ): FactoryBuilder<T> | undefined;

  /**
   * Check if factory exists for model
   */
  has<T extends BaseDocument>(
    model: Model<T, {}, {}, {}, T, any, any>
  ): boolean;

  /**
   * Remove factory for model
   */
  remove<T extends BaseDocument>(
    model: Model<T, {}, {}, {}, T, any, any>
  ): boolean;

  /**
   * Clear all registered factories
   */
  clear(): void;

  /**
   * Get all registered model names
   */
  getModelNames(): string[];
}

/**
 * Factory builder creation options
 */
export interface BuilderOptions {
  /** Initial count */
  initialCount?: number;

  /** Initial overrides */
  initialOverrides?: Record<string, any>;

  /** Initial traits */
  initialTraits?: string[];

  /** Parent factory state (for nested creation) */
  parentState?: FactoryState<any>;
}

/**
 * Bulk creation options
 */
export interface BulkCreateOptions {
  /** Batch size for processing */
  batchSize?: number;

  /** Whether to continue on errors */
  continueOnError?: boolean;

  /** Whether to validate documents */
  validate?: boolean;

  /** Whether to use ordered inserts */
  ordered?: boolean;

  /** Custom write concern */
  writeConcern?: {
    w?: number | string;
    j?: boolean;
    wtimeout?: number;
  };
}

/**
 * Factory execution result
 */
export interface FactoryResult<T extends BaseDocument> {
  /** Created documents */
  documents: T[];

  /** Number of successful creations */
  success: number;

  /** Number of failed creations */
  failed: number;

  /** Any errors that occurred */
  errors: Error[];

  /** Execution time in milliseconds */
  executionTime: number;

  /** Memory usage information */
  memoryUsage?: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };
}

/**
 * Factory performance metrics
 */
export interface FactoryMetrics {
  /** Model name */
  modelName: string;

  /** Total documents created */
  totalCreated: number;

  /** Average creation time per document */
  avgCreationTime: number;

  /** Total execution time */
  totalExecutionTime: number;

  /** Peak memory usage */
  peakMemoryUsage: number;

  /** Cache hit rate */
  cacheHitRate: number;

  /** Error rate */
  errorRate: number;
}

/**
 * Factory configuration options
 */
export interface GlobalFactoryConfig {
  /** Default batch size for bulk operations */
  defaultBatchSize?: number;

  /** Whether to enable performance metrics */
  enableMetrics?: boolean;

  /** Whether to enable caching */
  enableCaching?: boolean;

  /** Cache size limit */
  cacheSize?: number;

  /** Whether to validate by default */
  validateByDefault?: boolean;

  /** Default traits to apply */
  defaultTraits?: string[];

  /** Global hooks */
  globalHooks?: {
    beforeCreate?: (context: GenerationContext) => void | Promise<void>;
    afterCreate?: (
      document: any,
      context: GenerationContext
    ) => void | Promise<void>;
  };
}
