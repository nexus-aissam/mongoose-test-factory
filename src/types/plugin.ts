/**
 * Plugin-specific type definitions
 */

import { Schema } from "mongoose";
import { GlobalFactoryConfig } from "./factory";
import { GeneratorRegistry } from "./generator";
import { BaseDocument, FactoryBuilder } from "./common";

/**
 * Plugin options for mongoose-test-factory
 */
export interface PluginOptions {
  /** Global factory configuration */
  factory?: GlobalFactoryConfig;

  /** Custom generator registry */
  generators?: GeneratorRegistry;

  /** Whether to enable debug mode */
  debug?: boolean;

  /** Custom field name patterns for smart generation */
  patterns?: Record<string, RegExp>;

  /** Default locale for faker.js */
  locale?: string;

  /** Custom seed for reproducible data */
  seed?: number;

  /** Maximum number of documents to create at once */
  maxBatchSize?: number;

  /** Whether to enable relationship auto-discovery */
  autoRelations?: boolean;

  /** Custom relationship mappings */
  relationMappings?: Record<
    string,
    {
      model: string;
      type: "hasOne" | "hasMany" | "belongsTo";
      foreignKey?: string;
      localKey?: string;
    }
  >;

  /** Performance optimization settings */
  performance?: {
    enableCaching?: boolean;
    cacheSize?: number;
    enableBatching?: boolean;
    batchSize?: number;
    enablePooling?: boolean;
    poolSize?: number;
  };

  /** Schema analysis options */
  schemaAnalysis?: {
    enablePatternRecognition?: boolean;
    enableSemanticAnalysis?: boolean;
    customPatterns?: Record<string, RegExp>;
    customSemantics?: Record<string, (fieldName: string) => any>;
  };
}

/**
 * Plugin registration information
 */
export interface PluginRegistration {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version: string;

  /** Schemas this plugin is applied to */
  schemas: WeakSet<Schema>;

  /** Plugin options */
  options: PluginOptions;

  /** Registration timestamp */
  registeredAt: Date;

  /** Whether plugin is active */
  active: boolean;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called when plugin is initialized
   */
  onPluginInitialized?(): void | Promise<void>;
  /**
   * Called when plugin is first applied to a schema
   */
  onSchemaApplied?(
    schema: Schema,
    options: PluginOptions
  ): void | Promise<void>;

  /**
   * Called before factory method is added to model
   */
  onFactoryRegistration?(
    modelName: string,
    schema: Schema
  ): void | Promise<void>;

  /**
   * Called when factory is created
   */
  onFactoryCreated?<T extends BaseDocument>(
    factory: FactoryBuilder<T>,
    modelName: string
  ): void | Promise<void>;

  /**
   * Called before document generation
   */
  onBeforeGeneration?(modelName: string, count: number): void | Promise<void>;

  /**
   * Called after document generation
   */
  onAfterGeneration?<T extends BaseDocument>(
    documents: T[],
    modelName: string
  ): void | Promise<void>;

  /**
   * Called on plugin errors
   */
  onError?(
    error: Error,
    context: { modelName?: string; operation?: string }
  ): void | Promise<void>;

  /**
   * Called when plugin is disabled
   */
  onPluginDisabled?(): void | Promise<void>;
}

/**
 * Plugin state management
 */
export interface PluginState {
  /** Registered schemas */
  schemas: Map<Schema, PluginOptions>;

  /** Active factories */
  factories: Map<string, any>;

  /** Generator registry */
  generators: GeneratorRegistry;

  /** Performance metrics */
  metrics: Map<string, any>;

  /** Plugin configuration */
  config: PluginOptions;

  /** Plugin hooks */
  hooks: PluginHooks;

  /** Whether plugin is initialized */
  initialized: boolean;

  /** Initialization timestamp */
  initializedAt?: Date | null;
}

/**
 * Plugin manager interface
 */
export interface PluginManager {
  /**
   * Initialize the plugin
   */
  initialize(options?: PluginOptions): Promise<void>;

  /**
   * Apply plugin to schema
   */
  applyToSchema(schema: Schema, options?: PluginOptions): void;

  /**
   * Get plugin state
   */
  getState(): PluginState;

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<PluginOptions>): void;

  /**
   * Register hooks
   */
  registerHooks(hooks: Partial<PluginHooks>): void;

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any>;

  /**
   * Reset plugin state
   */
  reset(): void;

  /**
   * Disable plugin
   */
  disable(): Promise<void>;

  /**
   * Enable plugin
   */
  enable(): Promise<void>;

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean;
}

/**
 * Plugin extension interface for adding custom functionality
 */
export interface PluginExtension {
  /** Extension name */
  name: string;

  /** Extension version */
  version: string;

  /** Extension description */
  description?: string;

  /** Extension dependencies */
  dependencies?: string[];

  /** Extension initialization */
  initialize(pluginManager: PluginManager): Promise<void>;

  /** Extension cleanup */
  cleanup?(): Promise<void>;

  /** Custom schema modifications */
  modifySchema?(schema: Schema, options: PluginOptions): void;

  /** Custom generator registration */
  registerGenerators?(registry: GeneratorRegistry): void;

  /** Custom hooks */
  hooks?: Partial<PluginHooks>;
}

/**
 * Plugin configuration validator
 */
export interface ConfigValidator {
  /**
   * Validate plugin options
   */
  validate(options: PluginOptions): ValidationResult;

  /**
   * Get default options
   */
  getDefaults(): PluginOptions;

  /**
   * Merge options with defaults
   */
  mergeWithDefaults(options: Partial<PluginOptions>): PluginOptions;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors */
  errors: string[];

  /** Validation warnings */
  warnings: string[];

  /** Sanitized options */
  sanitized?: PluginOptions;
}

/**
 * Plugin debug information
 */
export interface DebugInfo {
  /** Plugin version */
  version: string;

  /** Node.js version */
  nodeVersion: string;

  /** Mongoose version */
  mongooseVersion: string;

  /** Active schemas */
  activeSchemas: string[];

  /** Registered generators */
  generators: string[];

  /** Performance metrics */
  metrics: Record<string, any>;

  /** Memory usage */
  memoryUsage: NodeJS.MemoryUsage;

  /** Configuration */
  config: PluginOptions;

  /** Error log */
  errors: Array<{
    timestamp: Date;
    error: string;
    stack?: string;
    context?: Record<string, any>;
  }>;
}
