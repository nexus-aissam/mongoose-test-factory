/**
 * Main type definitions export file for mongoose-test-factory
 * This file exports all types used throughout the plugin
 */

// Explicitly export TraitDefinition from factory to avoid ambiguity
export type { TraitDefinition } from "./factory";
export * from "./factory";
export * from "./generator";
export type { ValidationResult as PluginValidationResult } from "./plugin";
export * from "./schema";
export type { GenerationStrategy as StrategyGenerationStrategy } from "./strategy";
// Exclude TraitDefinition from common to avoid duplicate export
export * from "./common";
