/**
 * Schema analysis type definitions
 */

import { Schema, SchemaType } from 'mongoose';
import { FieldType, ValidationConstraints, FieldRelationship } from './common';

/**
 * Schema field analysis result
 */
export interface FieldAnalysis {
  /** Field path in schema */
  path: string;
  
  /** Field type */
  type: FieldType;
  
  /** Whether field is required */
  required: boolean;
  
  /** Whether field is unique */
  unique: boolean;
  
  /** Whether field is an array */
  isArray: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Validation constraints */
  constraints: ValidationConstraints;
  
  /** Relationship information */
  relationship?: FieldRelationship;
  
  /** Nested schema for subdocuments */
  nestedSchema?: SchemaAnalysisResult;
  
  /** Detected patterns from field name */
  patterns: string[];
  
  /** Semantic meaning inferred from field name */
  semantic?: string;
  
  /** Custom generator hint */
  generatorHint?: string;
  
  /** Whether field can be auto-generated */
  autoGenerate: boolean;
  
  /** Field description from schema */
  description?: string;
  
  /** Examples from schema */
  examples?: any[];
}

/**
 * Complete schema analysis result
 */
export interface SchemaAnalysisResult {
  /** Schema being analyzed */
  schema: Schema;
  
  /** Model name if available */
  modelName?: string;
  
  /** All field analyses */
  fields: Map<string, FieldAnalysis>;
  
  /** Required fields */
  requiredFields: string[];
  
  /** Unique fields */
  uniqueFields: string[];
  
  /** Fields with relationships */
  relationshipFields: string[];
  
  /** Nested schemas */
  nestedSchemas: Map<string, SchemaAnalysisResult>;
  
  /** Schema-level hooks */
  hooks: {
    pre: string[];
    post: string[];
  };
  
  /** Schema indexes */
  indexes: Array<{
    fields: Record<string, 1 | -1>;
    options?: Record<string, any>;
  }>;
  
  /** Schema plugins */
  plugins: Array<{
    name: string;
    options?: any;
  }>;
  
  /** Virtuals defined on schema */
  virtuals: string[];
  
  /** Schema methods */
  methods: string[];
  
  /** Schema statics */
  statics: string[];
  
  /** Analysis metadata */
  metadata: {
    analyzedAt: Date;
    version: string;
    complexity: 'simple' | 'moderate' | 'complex';
    depth: number;
    fieldCount: number;
    relationshipCount: number;
  };
}

/**
 * Schema pattern recognition result
 */
export interface PatternRecognitionResult {
  /** Field name */
  fieldName: string;
  
  /** Recognized patterns */
  patterns: Array<{
    name: string;
    confidence: number;
    type: 'email' | 'phone' | 'url' | 'name' | 'address' | 'date' | 'currency' | 'custom';
    regex?: RegExp;
    generator?: string;
  }>;
  
  /** Best match pattern */
  bestMatch?: {
    name: string;
    confidence: number;
    type: string;
  };
}

/**
 * Schema semantic analysis result
 */
export interface SemanticAnalysisResult {
  /** Field name */
  fieldName: string;
  
  /** Inferred semantic meaning */
  semantic: string;
  
  /** Confidence score */
  confidence: number;
  
  /** Suggested data type */
  suggestedType?: FieldType;
  
  /** Suggested constraints */
  suggestedConstraints?: Partial<ValidationConstraints>;
  
  /** Related fields */
  relatedFields: string[];
  
  /** Business domain */
  domain?: 'user' | 'product' | 'order' | 'payment' | 'content' | 'system' | 'custom';
}

/**
 * Schema analyzer interface
 */
export interface SchemaAnalyzer {
  /**
   * Analyze a Mongoose schema
   */
  analyze(schema: Schema, modelName?: string): SchemaAnalysisResult;
  
  /**
   * Analyze a specific field
   */
  analyzeField(schemaType: SchemaType, path: string): FieldAnalysis;
  
  /**
   * Recognize patterns in field names
   */
  recognizePatterns(fieldName: string): PatternRecognitionResult;
  
  /**
   * Perform semantic analysis on field names
   */
  analyzeSemantics(fieldName: string, fieldType: FieldType): SemanticAnalysisResult;
  
  /**
   * Extract validation constraints
   */
  extractConstraints(schemaType: SchemaType): ValidationConstraints;
  
  /**
   * Detect relationships
   */
  detectRelationships(schemaType: SchemaType, path: string): FieldRelationship | undefined;
  
  /**
   * Get field complexity score
   */
  getComplexityScore(analysis: FieldAnalysis): number;
  
  /**
   * Get schema complexity
   */
  getSchemaComplexity(analysis: SchemaAnalysisResult): 'simple' | 'moderate' | 'complex';
}

/**
 * Pattern definition for field recognition
 */
export interface FieldPattern {
  /** Pattern name */
  name: string;
  
  /** Pattern regex */
  regex: RegExp;
  
  /** Pattern type */
  type: 'email' | 'phone' | 'url' | 'name' | 'address' | 'date' | 'currency' | 'custom';
  
  /** Confidence weight */
  weight: number;
  
  /** Suggested generator */
  generator?: string;
  
  /** Additional validation */
  validation?: (fieldName: string) => boolean;
  
  /** Pattern description */
  description?: string;
}

/**
 * Semantic definition for field understanding
 */
export interface SemanticDefinition {
  /** Semantic name */
  name: string;
  
  /** Keywords that trigger this semantic */
  keywords: string[];
  
  /** Field type compatibility */
  compatibleTypes: FieldType[];
  
  /** Confidence scoring function */
  scoringFn: (fieldName: string, fieldType: FieldType) => number;
  
  /** Suggested constraints */
  constraints?: Partial<ValidationConstraints>;
  
  /** Related semantics */
  related?: string[];
  
  /** Business domain */
  domain?: string;
  
  /** Description */
  description?: string;
}

/**
 * Schema analysis options
 */
export interface AnalysisOptions {
  /** Whether to perform pattern recognition */
  enablePatterns?: boolean;
  
  /** Whether to perform semantic analysis */
  enableSemantics?: boolean;
  
  /** Custom patterns to use */
  customPatterns?: FieldPattern[];
  
  /** Custom semantics to use */
  customSemantics?: SemanticDefinition[];
  
  /** Maximum analysis depth for nested schemas */
  maxDepth?: number;
  
  /** Whether to analyze virtuals */
  analyzeVirtuals?: boolean;
  
  /** Whether to analyze methods */
  analyzeMethods?: boolean;
  
  /** Whether to cache analysis results */
  enableCaching?: boolean;
  
  /** Analysis timeout in milliseconds */
  timeout?: number;
}

/**
 * Schema analysis cache entry
 */
export interface AnalysisCacheEntry {
  /** Analysis result */
  result: SchemaAnalysisResult;
  
  /** Schema hash for invalidation */
  schemaHash: string;
  
  /** Cache timestamp */
  timestamp: Date;
  
  /** Access count */
  accessCount: number;
  
  /** TTL in milliseconds */
  ttl?: number;
}

/**
 * Schema comparison result
 */
export interface SchemaComparisonResult {
  /** Whether schemas are compatible */
  compatible: boolean;
  
  /** Compatibility score (0-1) */
  score: number;
  
  /** Common fields */
  commonFields: string[];
  
  /** Fields only in first schema */
  firstOnlyFields: string[];
  
  /** Fields only in second schema */
  secondOnlyFields: string[];
  
  /** Type differences */
  typeDifferences: Array<{
    field: string;
    firstType: FieldType;
    secondType: FieldType;
  }>;
  
  /** Constraint differences */
  constraintDifferences: Array<{
    field: string;
    difference: string;
  }>;
}

/**
 * Schema evolution tracking
 */
export interface SchemaEvolution {
  /** Schema versions */
  versions: Array<{
    version: string;
    timestamp: Date;
    changes: SchemaChange[];
    analysis: SchemaAnalysisResult;
  }>;
  
  /** Current version */
  currentVersion: string;
  
  /** Evolution summary */
  summary: {
    totalChanges: number;
    addedFields: number;
    removedFields: number;
    modifiedFields: number;
    breakingChanges: number;
  };
}

/**
 * Schema change description
 */
export interface SchemaChange {
  /** Change type */
  type: 'added' | 'removed' | 'modified' | 'renamed';
  
  /** Field path affected */
  fieldPath: string;
  
  /** Previous value */
  oldValue?: any;
  
  /** New value */
  newValue?: any;
  
  /** Whether change is breaking */
  breaking: boolean;
  
  /** Change description */
  description: string;
  
  /** Migration suggestion */
  migration?: string;
}