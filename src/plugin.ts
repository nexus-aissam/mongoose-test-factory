/**
 * Plugin implementation for mongoose-test-factory
 *
 * This file contains the main plugin classes and functions.
 */

import { Schema, Model } from "mongoose";
import {
  PluginOptions,
  PluginManager,
  PluginState,
  PluginHooks,
} from "./types/plugin";
import { BaseDocument, FactoryBuilder, FactoryError } from "./types/common";
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
    >(this: Model<T, {}, {}, {}, T, any, any>, count?: number): FactoryBuilder<T> {
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
      return (this.constructor as Model<T, {}, {}, {}, T, any, any>).factory(
        count
      );
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
 * Main plugin function
 *
 * @param schema - Mongoose schema to apply plugin to
 * @param options - Plugin options
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
 * Factory plugin utilities
 */
export const FactoryPlugin = {
  /**
   * Initialize the plugin with global options
   */
  async initialize(options: PluginOptions = {}): Promise<void> {
    await pluginManager.initialize(options);
  },

  /**
   * Get plugin state
   */
  getState(): PluginState {
    return pluginManager.getState();
  },

  /**
   * Reset plugin state
   */
  reset(): void {
    pluginManager.reset();
  },

  /**
   * Disable plugin
   */
  async disable(): Promise<void> {
    await pluginManager.disable();
  },

  /**
   * Enable plugin
   */
  async enable(): Promise<void> {
    await pluginManager.enable();
  },

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return pluginManager.isEnabled();
  },

  /**
   * Register hooks
   */
  registerHooks(hooks: Partial<PluginHooks>): void {
    pluginManager.registerHooks(hooks);
  },

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, any> {
    return pluginManager.getMetrics();
  },

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PluginOptions>): void {
    pluginManager.updateConfig(config);
  },

  /**
   * Set faker locale
   */
  setLocale(locale: string): void {
    pluginManager.updateConfig({ locale });
  },

  /**
   * Set seed for reproducible data
   */
  setSeed(seed: number): void {
    pluginManager.updateConfig({ seed });
  },
};

/**
 * Type-safe model factory creation
 */
export function createModelFactory<T extends BaseDocument>(
  model: Model<T, {}, {}, {}, T, any, any>,
  config?: FactoryConfig<T>
): (count?: number) => FactoryBuilder<T> {
  return FactoryHelpers.createFactoryMethod(model, config);
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
