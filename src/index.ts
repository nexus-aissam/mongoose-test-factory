/**
 * Main entry point for mongoose-test-factory plugin
 *
 * This file exports all public APIs and types.
 */

import { FactoryBuilder } from "./types/common";
import { mongooseTestFactory } from "./plugin";

// Main plugin function and utilities
export {
  FactoryPlugin,
  createModelFactory,
  pluginManager as PluginManager,
  VERSION,
  PLUGIN_INFO,
} from "./plugin";

// Export types
export type {
  BaseDocument,
  FactoryConfig,
  GenerationContext,
  FactoryError,
  GenerationError,
  DeepPartial,
  FieldType,
  ValidationConstraints,
  FieldRelationship,
} from "./types/common";

// Import the mongoose augmentation to enable global type extensions
import "./types/mongoose-augmentation";

// Export type helpers
export type {
  WithFactoryMethod,
  ModelWithFactory,
} from "./types/mongoose-augmentation";

export { withFactory } from "./plugin";

export type {
  FactoryOptions,
  FactoryState,
  FactoryResult,
  TraitDefinition,
  GlobalFactoryConfig,
} from "./types/factory";

export type { PluginOptions, PluginState, PluginHooks } from "./types/plugin";

// Export factory utilities
export { Factory, createFactory, FactoryHelpers } from "./factory";

// Export generators (explicitly to avoid conflicts)
export {
  BaseGenerator,
  StringGenerator,
  NumberGenerator,
  DateGenerator,
  EmailStringGenerator,
  PasswordStringGenerator,
  SlugStringGenerator,
  PriceNumberGenerator,
  AgeNumberGenerator,
  RatingNumberGenerator,
  TimestampDateGenerator,
  BirthDateGenerator,
  FutureDateGenerator,
  MixedGenerator,
  GeneratorRegistryClass,
  GeneratorFactoryClass,
  globalGeneratorRegistry,
} from "./generators";

// Export utilities
export { SchemaAnalyzer } from "./utils/schema-analyzer";
export { RelationshipManager } from "./utils/relationship-manager";

// Import the mongoose augmentation (already imported above)

export default mongooseTestFactory;
