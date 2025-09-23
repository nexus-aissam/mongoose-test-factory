/**
 * Plugin implementation for mongoose-test-factory
 *
 * This file contains the main plugin classes and functions.
 */

import mongoose, { Schema, Model, Document } from "mongoose";
import {
  PluginOptions,
  PluginManager,
  PluginState,
  PluginHooks,
} from "./types/plugin";
import {
  BaseDocument,
  FactoryBuilder,
  FactoryError,
  ModelWithFactory,
} from "./types/common";
import { FactoryConfig } from "./types/common";
import { createFactory, FactoryHelpers } from "./factory";
import { globalGeneratorRegistry } from "./generators/registry";
import { SchemaAnalyzer } from "./utils/schema-analyzer";

/**
 * Global plugin state
 */
class PluginManagerImpl implements PluginManager {
  private state: PluginState;
  private schemaAnalyzer: SchemaAnalyzer;

  constructor() {
    this.state = {
      schemas: new Map(),
      factories: new Map(),
      generators: globalGeneratorRegistry,
      metrics: new Map(),
      config: this.getDefaultConfig(),
      hooks: {},
      initialized: false,
    };

    this.schemaAnalyzer = new SchemaAnalyzer();
  }

  /**
   * Initialize the plugin
   */
  async initialize(options: PluginOptions = {}): Promise<void> {
    if (this.state.initialized) {
      return;
    }

    try {
      // Merge with default configuration
      this.state.config = this.mergeWithDefaults(options);

      // Initialize generator registry
      this.state.generators.initialize();

      // Set faker locale if specified
      if (options.locale) {
        const { faker } = await import("@faker-js/faker");
        faker.constructor(options.locale);
      }

      // Set seed for reproducible data
      if (options.seed !== undefined) {
        const { faker } = await import("@faker-js/faker");
        faker.seed(options.seed);
      }

      this.state.initialized = true;
      this.state.initializedAt = new Date();

      await this.runHook("onPluginInitialized");

      console.info("[mongoose-test-factory] Plugin initialized successfully");
    } catch (error) {
      throw new FactoryError(
        `Failed to initialize plugin: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Apply plugin to schema
   */
  applyToSchema(schema: Schema, options: PluginOptions = {}): void {
    try {
      const mergedOptions = this.mergeWithDefaults(options);

      // Store schema registration
      this.state.schemas.set(schema, mergedOptions);

      // Add factory method to schema
      this.addFactoryMethod(schema, mergedOptions);

      // Run schema applied hook
      this.runHook("onSchemaApplied", schema, mergedOptions);

      console.debug("[mongoose-test-factory] Applied to schema");
    } catch (error) {
      this.runHook("onError", error, { operation: "applyToSchema" });
      throw new FactoryError(
        `Failed to apply plugin to schema: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get plugin state
   */
  getState(): PluginState {
    return { ...this.state };
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<PluginOptions>): void {
    this.state.config = { ...this.state.config, ...config };
    console.debug("[mongoose-test-factory] Configuration updated");
  }

  /**
   * Register hooks
   */
  registerHooks(hooks: Partial<PluginHooks>): void {
    this.state.hooks = { ...this.state.hooks, ...hooks };
    console.debug("[mongoose-test-factory] Hooks registered");
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.state.metrics);
  }

  /**
   * Reset plugin state
   */
  reset(): void {
    this.state.schemas.clear();
    this.state.factories.clear();
    this.state.metrics.clear();
    this.state.generators.clear();
    this.state.initialized = false;
    this.state.initializedAt = null;

    console.debug("[mongoose-test-factory] Plugin state reset");
  }

  /**
   * Disable plugin
   */
  async disable(): Promise<void> {
    if (!this.state.initialized) {
      return;
    }

    await this.runHook("onPluginDisabled");
    this.state.initialized = false;

    console.info("[mongoose-test-factory] Plugin disabled");
  }

  /**
   * Enable plugin
   */
  async enable(): Promise<void> {
    if (this.state.initialized) {
      return;
    }

    await this.initialize(this.state.config);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.state.initialized;
  }

  /**
   * Add factory method to schema
   */
  private addFactoryMethod(schema: Schema, options: PluginOptions): void {
    // Add static factory method
    schema.static("factory", function <
      T extends BaseDocument
    >(this: Model<T>, count?: number): FactoryBuilder<T> {
      const modelName = this.modelName;

      // Register factory creation
      pluginManager.runHook("onFactoryCreated", null, modelName);

      // Get factory configuration for this model
      const factoryConfig = pluginManager.getFactoryConfig(modelName);

      return createFactory(
        this,
        count !== undefined ? { count } : {},
        factoryConfig
      );
    });

    // Add instance method for convenience
    schema.method("factory", function <
      T extends BaseDocument
    >(this: T, count?: number): FactoryBuilder<T> {
      return (this.constructor as any).factory(count);
    });

    console.debug(`[mongoose-test-factory] Added factory method to schema`);
  }

  /**
   * Get factory configuration for model
   */
  getFactoryConfig(modelName: string): FactoryConfig<any> {
    // This would return model-specific factory configuration
    // For now, return empty config
    return {};
  }

  /**
   * Run lifecycle hook
   */
  private async runHook(
    hookName: keyof PluginHooks,
    ...args: any[]
  ): Promise<void> {
    const hook = this.state.hooks[hookName];
    if (hook && typeof hook === "function") {
      try {
        // Type assertion to handle any parameters
        const typedHook = hook as (...args: any[]) => Promise<void> | void;
        await typedHook(...args);
      } catch (error) {
        console.error(
          `[mongoose-test-factory] Hook ${hookName} failed:`,
          error
        );
      }
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PluginOptions {
    return {
      factory: {
        defaultBatchSize: 100,
        enableMetrics: false,
        enableCaching: true,
        cacheSize: 1000,
        validateByDefault: true,
        defaultTraits: [],
      },
      debug: false,
      patterns: {},
      locale: "en",
      maxBatchSize: 10000,
      autoRelations: true,
      relationMappings: {},
      performance: {
        enableCaching: true,
        cacheSize: 1000,
        enableBatching: true,
        batchSize: 100,
        enablePooling: false,
        poolSize: 10,
      },
      schemaAnalysis: {
        enablePatternRecognition: true,
        enableSemanticAnalysis: true,
        customPatterns: {},
        customSemantics: {},
      },
    };
  }

  /**
   * Merge options with defaults
   */
  private mergeWithDefaults(options: PluginOptions): PluginOptions {
    const defaults = this.getDefaultConfig();

    return {
      ...defaults,
      ...options,
      factory: { ...defaults.factory, ...options.factory },
      performance: { ...defaults.performance, ...options.performance },
      schemaAnalysis: { ...defaults.schemaAnalysis, ...options.schemaAnalysis },
    };
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManagerImpl();

/**
 * Main plugin function that adds factory capabilities to a Mongoose schema
 *
 * This function should be applied to your Mongoose schema using the `schema.plugin()` method.
 * It automatically adds a static `factory()` method to your model for generating test data.
 *
 * @param schema - The Mongoose schema to enhance with factory capabilities
 * @param options - Configuration options for the factory plugin
 * @param options.seed - Seed for reproducible data generation
 * @param options.locale - Locale for internationalized data (e.g., 'en_US', 'fr', 'ja')
 * @param options.debug - Enable debug logging for troubleshooting
 * @param options.factory - Factory-specific configuration options
 * @param options.performance - Performance optimization settings
 *
 * @example
 * ```typescript
 * import mongoose, { Schema } from 'mongoose';
 * import mongooseTestFactory from 'mongoose-test-factory';
 *
 * // Define your schema
 * const userSchema = new Schema({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true, unique: true },
 *   age: { type: Number, min: 18 }
 * });
 *
 * // Apply the factory plugin
 * userSchema.plugin(mongooseTestFactory);
 *
 * // Create your model
 * const User = mongoose.model('User', userSchema);
 *
 * // Now you can use the factory method
 * const user = User.factory().build();
 * const users = await User.factory(10).create();
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * userSchema.plugin(mongooseTestFactory, {
 *   seed: 12345,
 *   locale: 'en_US',
 *   debug: true,
 *   factory: {
 *     defaultBatchSize: 50
 *   }
 * });
 * ```
 */
export function mongooseTestFactory(
  schema: Schema,
  options: PluginOptions = {}
): void {
  // Ensure plugin is initialized
  if (!pluginManager.isEnabled()) {
    pluginManager.initialize(options).catch((error) => {
      console.error(
        "[mongoose-test-factory] Failed to initialize plugin:",
        error
      );
    });
  }

  // Apply plugin to schema
  pluginManager.applyToSchema(schema, options);
}

/**
 * Factory plugin utilities for global configuration and management
 *
 * @example
 * ```typescript
 * import { FactoryPlugin } from 'mongoose-test-factory';
 *
 * // Configure globally
 * await FactoryPlugin.initialize({
 *   seed: 12345,
 *   locale: 'en_US',
 *   debug: true
 * });
 * ```
 */
export const FactoryPlugin = {
  /**
   * Initialize the plugin with global configuration options
   *
   * @param options - Plugin configuration options
   * @param options.seed - Seed for reproducible data generation
   * @param options.locale - Locale for faker.js data generation (e.g., 'en_US', 'es', 'fr')
   * @param options.debug - Enable debug logging
   * @param options.factory - Factory-specific configuration
   * @param options.factory.defaultBatchSize - Default batch size for bulk operations
   * @param options.performance - Performance optimization settings
   * @returns Promise that resolves when initialization is complete
   *
   * @example
   * ```typescript
   * // Basic initialization
   * await FactoryPlugin.initialize();
   *
   * // With configuration
   * await FactoryPlugin.initialize({
   *   seed: 12345,
   *   locale: 'en_US',
   *   factory: {
   *     defaultBatchSize: 50
   *   }
   * });
   * ```
   */
  async initialize(options: PluginOptions = {}): Promise<void> {
    await pluginManager.initialize(options);
  },

  /**
   * Get the current plugin state and configuration
   *
   * @returns Current plugin state including schemas, factories, and metrics
   *
   * @example
   * ```typescript
   * const state = FactoryPlugin.getState();
   * console.log('Initialized:', state.initialized);
   * console.log('Registered schemas:', state.schemas.size);
   * ```
   */
  getState(): PluginState {
    return pluginManager.getState();
  },

  /**
   * Reset the plugin state, clearing all registered schemas and factories
   *
   * @example
   * ```typescript
   * // Clear all plugin state
   * FactoryPlugin.reset();
   * ```
   */
  reset(): void {
    pluginManager.reset();
  },

  /**
   * Disable the plugin, stopping all factory operations
   *
   * @returns Promise that resolves when plugin is disabled
   *
   * @example
   * ```typescript
   * await FactoryPlugin.disable();
   * ```
   */
  async disable(): Promise<void> {
    await pluginManager.disable();
  },

  /**
   * Enable the plugin if it was previously disabled
   *
   * @returns Promise that resolves when plugin is enabled
   *
   * @example
   * ```typescript
   * await FactoryPlugin.enable();
   * ```
   */
  async enable(): Promise<void> {
    await pluginManager.enable();
  },

  /**
   * Check if the plugin is currently enabled and operational
   *
   * @returns True if plugin is enabled, false otherwise
   *
   * @example
   * ```typescript
   * if (FactoryPlugin.isEnabled()) {
   *   console.log('Plugin is ready to use');
   * }
   * ```
   */
  isEnabled(): boolean {
    return pluginManager.isEnabled();
  },

  /**
   * Register lifecycle hooks for the plugin
   *
   * @param hooks - Object containing hook functions
   * @param hooks.onPluginInitialized - Called when plugin is initialized
   * @param hooks.onSchemaApplied - Called when plugin is applied to a schema
   * @param hooks.onFactoryCreated - Called when a factory is created
   * @param hooks.onError - Called when an error occurs
   *
   * @example
   * ```typescript
   * FactoryPlugin.registerHooks({
   *   onFactoryCreated: (factory, modelName) => {
   *     console.log(`Factory created for ${modelName}`);
   *   },
   *   onError: (error, context) => {
   *     console.error('Factory error:', error.message);
   *   }
   * });
   * ```
   */
  registerHooks(hooks: Partial<PluginHooks>): void {
    pluginManager.registerHooks(hooks);
  },

  /**
   * Get performance metrics and statistics from the plugin
   *
   * @returns Object containing performance metrics like generation times, cache hits, etc.
   *
   * @example
   * ```typescript
   * const metrics = FactoryPlugin.getMetrics();
   * console.log('Average generation time:', metrics.avgGenerationTime);
   * console.log('Total documents created:', metrics.totalCreated);
   * ```
   */
  getMetrics(): Record<string, any> {
    return pluginManager.getMetrics();
  },

  /**
   * Update the plugin configuration at runtime
   *
   * @param config - Partial configuration object to merge with existing config
   *
   * @example
   * ```typescript
   * // Update batch size for better performance
   * FactoryPlugin.updateConfig({
   *   factory: { defaultBatchSize: 200 }
   * });
   *
   * // Enable debug mode
   * FactoryPlugin.updateConfig({ debug: true });
   * ```
   */
  updateConfig(config: Partial<PluginOptions>): void {
    pluginManager.updateConfig(config);
  },

  /**
   * Set the locale for faker.js data generation
   *
   * @param locale - Locale string (e.g., 'en_US', 'es', 'fr', 'de', 'ja')
   *
   * @example
   * ```typescript
   * // Generate French names and addresses
   * FactoryPlugin.setLocale('fr');
   *
   * // Generate Japanese data
   * FactoryPlugin.setLocale('ja');
   * ```
   */
  setLocale(locale: string): void {
    pluginManager.updateConfig({ locale });
  },

  /**
   * Set a seed for reproducible data generation
   *
   * @param seed - Numeric seed value for faker.js
   *
   * @example
   * ```typescript
   * // Make tests deterministic
   * FactoryPlugin.setSeed(12345);
   *
   * // Now all generated data will be consistent across runs
   * const user1 = User.factory().build();
   * const user2 = User.factory().build();
   * // user1 and user2 will have the same data every time
   * ```
   */
  setSeed(seed: number): void {
    pluginManager.updateConfig({ seed });
  },
};

/**
 * Create a type-safe factory method for a specific Mongoose model
 *
 * @template T - The document type extending BaseDocument
 * @param model - The Mongoose model to create a factory for
 * @param config - Optional factory configuration including traits, defaults, and hooks
 * @returns Factory method function that accepts an optional count parameter
 *
 * @example
 * ```typescript
 * import { createModelFactory } from 'mongoose-test-factory';
 *
 * // Create a factory with custom configuration
 * const userFactory = createModelFactory(User, {
 *   defaults: { isActive: true },
 *   traits: {
 *     admin: (builder) => builder.with({ role: 'admin' }),
 *     verified: (builder) => builder.with({ emailVerified: true })
 *   }
 * });
 *
 * // Use the factory
 * const user = userFactory().build();
 * const users = userFactory(5).create();
 * ```
 */
export function createModelFactory<T extends BaseDocument>(
  model: Model<T>,
  config?: FactoryConfig<T>
): (count?: number) => FactoryBuilder<T> {
  return FactoryHelpers.createFactoryMethod(model, config);
}

/**
 * Type-safe utility to augment a Mongoose model with factory capabilities
 *
 * This function takes a Mongoose model and returns the same model type
 * augmented with the `factory()` method for generating test data.
 *
 * @template T - The document type extending Document
 * @param model - The Mongoose model to augment
 * @returns The same model type with factory capabilities
 *
 * @example
 * ```typescript
 * import mongoose, { Schema, Document } from 'mongoose';
 * import { withFactory } from 'mongoose-test-factory';
 *
 * interface IUser extends Document {
 *   name: string;
 *   email: string;
 * }
 *
 * const userSchema = new Schema<IUser>({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true, unique: true }
 * });
 *
 * userSchema.plugin(mongooseTestFactory);
 *
 * const UserModel = mongoose.model<IUser>('User', userSchema);
 * const User = withFactory(UserModel);
 * // Now User has the factory() method with full type safety
 * const user = User.factory().build();
 * const users = await User.factory(10).create();
 * ```
 */
export function withFactory<T extends Document>(
  model: mongoose.Model<T>
): ModelWithFactory<T> {
  return model as ModelWithFactory<T>;
}

/**
 * Plugin version information
 */
export const VERSION = "1.0.0";

/**
 * Plugin metadata
 */
export const PLUGIN_INFO = {
  name: "mongoose-test-factory",
  version: VERSION,
  description:
    "A comprehensive Mongoose plugin for generating realistic test data",
  author: "nexus-aissam",
  repository: "https://github.com/nexus-aissam/mongoose-test-factory",
  license: "MIT",
} as const;
