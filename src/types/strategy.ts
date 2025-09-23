/**
 * Strategy pattern type definitions for data generation
 */

import { Schema } from "mongoose";
import { GenerationContext, BaseDocument } from "./common";
import { FactoryBuilder } from "./common";

/**
 * Base strategy interface for data generation
 */
export interface GenerationStrategy {
  /** Strategy name */
  name: string;

  /** Strategy description */
  description?: string;

  /** Strategy priority (higher = more specific) */
  priority: number;

  /** Whether strategy is applicable to the current context */
  isApplicable(context: GenerationContext): boolean;

  /** Generate data using this strategy */
  generate(context: GenerationContext): any | Promise<any>;

  /** Validate generated data */
  validate?(value: any, context: GenerationContext): boolean;

  /** Strategy configuration */
  config?: StrategyConfig;
}

/**
 * Strategy configuration options
 */
export interface StrategyConfig {
  /** Whether strategy is enabled */
  enabled?: boolean;

  /** Strategy-specific options */
  options?: Record<string, any>;

  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
  };

  /** Performance limits */
  limits?: {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
  };
}

/**
 * Relationship generation strategy
 */
export interface RelationshipStrategy extends GenerationStrategy {
  /** Type of relationship */
  relationshipType: "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";

  /** Generate related documents */
  generateRelated(
    parentDocument: any,
    relationshipField: string,
    context: GenerationContext
  ): Promise<any>;

  /** Maintain referential integrity */
  maintainIntegrity?: boolean;

  /** Cascade operations */
  cascade?: {
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

/**
 * Business scenario strategy
 */
export interface ScenarioStrategy extends GenerationStrategy {
  /** Scenario name */
  scenarioName: string;

  /** Business domain */
  domain:
    | "ecommerce"
    | "social"
    | "saas"
    | "cms"
    | "finance"
    | "healthcare"
    | "education"
    | "custom";

  /** Generate complete business scenario */
  generateScenario<T extends BaseDocument>(
    factory: FactoryBuilder<T>,
    count: number
  ): Promise<T[]>;

  /** Scenario dependencies */
  dependencies?: string[];

  /** Scenario configuration */
  scenarioConfig?: {
    realistic?: boolean;
    complexity?: "simple" | "moderate" | "complex";
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Performance optimization strategy
 */
export interface PerformanceStrategy extends GenerationStrategy {
  /** Optimization type */
  optimizationType: "memory" | "cpu" | "io" | "network" | "cache";

  /** Apply optimization */
  optimize(context: GenerationContext): GenerationContext;

  /** Performance metrics */
  getMetrics(): PerformanceMetrics;

  /** Resource limits */
  limits: {
    maxMemory?: number;
    maxCpu?: number;
    maxTime?: number;
  };
}

/**
 * Validation strategy for generated data
 */
export interface ValidationStrategy extends GenerationStrategy {
  /** Validation type */
  validationType: "schema" | "business" | "semantic" | "performance";

  /** Validate generated data */
  validateData(data: any, context: GenerationContext): ValidationResult;

  /** Auto-fix validation errors */
  autoFix?: boolean;

  /** Validation rules */
  rules: ValidationRule[];
}

/**
 * Caching strategy for performance
 */
export interface CachingStrategy extends GenerationStrategy {
  /** Cache type */
  cacheType: "memory" | "disk" | "redis" | "custom";

  /** Cache key generation */
  generateKey(context: GenerationContext): string;

  /** Store value in cache */
  store(key: string, value: any, ttl?: number): Promise<void>;

  /** Retrieve value from cache */
  retrieve(key: string): Promise<any | null>;

  /** Clear cache */
  clear(pattern?: string): Promise<void>;

  /** Cache statistics */
  getStats(): CacheStats;
}

/**
 * Smart generation strategy using ML/AI
 */
export interface SmartStrategy extends GenerationStrategy {
  /** Learning model type */
  modelType: "pattern" | "sequence" | "classification" | "regression";

  /** Train the model */
  train(data: any[], labels?: any[]): Promise<void>;

  /** Predict/generate using trained model */
  predict(context: GenerationContext): Promise<any>;

  /** Model confidence score */
  getConfidence(prediction: any, context: GenerationContext): number;

  /** Model metadata */
  modelInfo: {
    trained: boolean;
    accuracy?: number;
    dataPoints?: number;
    lastTrained?: Date;
  };
}

/**
 * Strategy registry for managing strategies
 */
export interface StrategyRegistry {
  /** Register a strategy */
  register(strategy: GenerationStrategy): void;

  /** Get strategy by name */
  get(name: string): GenerationStrategy | undefined;

  /** Get all strategies for context */
  getApplicable(context: GenerationContext): GenerationStrategy[];

  /** Get best strategy for context */
  getBest(context: GenerationContext): GenerationStrategy | undefined;

  /** Remove strategy */
  remove(name: string): boolean;

  /** List all strategy names */
  list(): string[];

  /** Clear all strategies */
  clear(): void;

  /** Enable/disable strategy */
  setEnabled(name: string, enabled: boolean): void;
}

/**
 * Strategy execution context
 */
export interface StrategyExecutionContext extends GenerationContext {
  /** Strategy being executed */
  strategy: GenerationStrategy;

  /** Execution start time */
  startTime: number;

  /** Memory usage at start */
  startMemory: NodeJS.MemoryUsage;

  /** Parent execution context */
  parent?: StrategyExecutionContext;

  /** Child execution contexts */
  children: StrategyExecutionContext[];

  /** Execution metadata */
  metadata: {
    attempts: number;
    errors: Error[];
    warnings: string[];
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * Strategy execution result
 */
export interface StrategyExecutionResult {
  /** Generated value */
  value: any;

  /** Execution success */
  success: boolean;

  /** Execution time in milliseconds */
  executionTime: number;

  /** Memory usage */
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };

  /** Strategy used */
  strategy: string;

  /** Confidence score */
  confidence?: number;

  /** Errors encountered */
  errors: Error[];

  /** Warnings */
  warnings: string[];

  /** Cache information */
  cache: {
    hit: boolean;
    key?: string;
    ttl?: number;
  };
}

/**
 * Performance metrics for strategies
 */
export interface PerformanceMetrics {
  /** Strategy name */
  strategyName: string;

  /** Total executions */
  executions: number;

  /** Successful executions */
  successes: number;

  /** Failed executions */
  failures: number;

  /** Average execution time */
  avgExecutionTime: number;

  /** Min execution time */
  minExecutionTime: number;

  /** Max execution time */
  maxExecutionTime: number;

  /** Average memory usage */
  avgMemoryUsage: number;

  /** Peak memory usage */
  peakMemoryUsage: number;

  /** Cache hit rate */
  cacheHitRate: number;

  /** Error rate */
  errorRate: number;

  /** Last execution */
  lastExecution?: Date;

  /** Performance trend */
  trend: "improving" | "stable" | "degrading";
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation success */
  valid: boolean;

  /** Validation errors */
  errors: Array<{
    field: string;
    message: string;
    code: string;
    severity: "error" | "warning" | "info";
  }>;

  /** Fixed value (if auto-fix enabled) */
  fixedValue?: any;

  /** Validation metadata */
  metadata: {
    validator: string;
    timestamp: Date;
    executionTime: number;
  };
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule name */
  name: string;

  /** Rule description */
  description?: string;

  /** Rule function */
  validate: (
    value: any,
    context: GenerationContext
  ) => boolean | Promise<boolean>;

  /** Error message */
  errorMessage: string;

  /** Rule severity */
  severity: "error" | "warning" | "info";

  /** Auto-fix function */
  fix?: (value: any, context: GenerationContext) => any;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache size */
  size: number;

  /** Cache hits */
  hits: number;

  /** Cache misses */
  misses: number;

  /** Hit rate */
  hitRate: number;

  /** Total keys */
  keyCount: number;

  /** Memory usage */
  memoryUsage: number;

  /** Average key size */
  avgKeySize: number;

  /** Average value size */
  avgValueSize: number;

  /** Oldest entry timestamp */
  oldestEntry?: Date;

  /** Newest entry timestamp */
  newestEntry?: Date;
}

/**
 * Strategy chain for complex generation
 */
export interface StrategyChain {
  /** Chain name */
  name: string;

  /** Strategies in execution order */
  strategies: GenerationStrategy[];

  /** Execute the chain */
  execute(context: GenerationContext): Promise<StrategyExecutionResult>;

  /** Add strategy to chain */
  add(strategy: GenerationStrategy, position?: number): void;

  /** Remove strategy from chain */
  remove(strategyName: string): boolean;

  /** Chain configuration */
  config: {
    failFast?: boolean;
    parallel?: boolean;
    timeout?: number;
  };
}
