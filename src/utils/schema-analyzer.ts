/**
 * Schema Analyzer for mongoose-test-factory
 *
 * Provides comprehensive analysis of Mongoose schemas including field types,
 * validation constraints, relationships, and intelligent pattern recognition.
 */

import { Schema, SchemaType, SchemaTypeOptions } from "mongoose";
import {
  FieldType,
  ValidationConstraints,
  FieldRelationship,
} from "../types/common";

/**
 * Schema analysis result interface
 */
export interface SchemaAnalysisResult {
  schema: Schema;
  modelName?: string | undefined; // Make it optional and include undefined
  fields: Map<string, FieldAnalysis>;
  requiredFields: string[];
  uniqueFields: string[];
  relationshipFields: string[];
  nestedSchemas: Map<string, Schema>;
  hooks: {
    pre: string[];
    post: string[];
  };
  patterns: PatternRecognitionResult;
  semantic: SemanticAnalysisResult;
  metadata: {
    analyzedAt?: Date;
    complexity?: string;
    depth?: number;
    fieldCount?: number;
    analysisTime?: number;
    relationshipCount?: number;
    version?: string;
  };
}

/**
 * Field analysis interface
 */
export interface FieldAnalysis {
  path: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  isArray: boolean;
  defaultValue?: any | undefined; // Add undefined explicitly
  constraints: ValidationConstraints;
  relationship?: FieldRelationship | undefined; // Add undefined explicitly
  patterns: string[];
  semantic?: string | undefined; // Add undefined explicitly
  generatorHint?: string | undefined; // Add undefined explicitly
  autoGenerate: boolean;
  description?: string | undefined; // Add undefined explicitly
  examples?: any[] | undefined; // Add undefined explicitly
  nestedSchema?: SchemaAnalysisResult | undefined; // Add undefined explicitly
}

/**
 * Pattern recognition result interface
 */
export interface PatternRecognitionResult {
  fieldPatterns: Map<string, FieldPattern[]>;
  namingConventions: string[];
  commonPrefixes: string[];
  commonSuffixes: string[];
  confidence: number;
  patterns?: FieldPattern[]; // Added for compatibility
}

/**
 * Semantic analysis result interface
 */
export interface SemanticAnalysisResult {
  category?:
    | "user"
    | "product"
    | "order"
    | "payment"
    | "content"
    | "system"
    | "custom";
  purpose: string[];
  relatedModels: string[];
  businessLogic: string[];
  dataFlow: string[];
  semantic?: string; // Added for compatibility
}

/**
 * Field pattern interface
 */
export interface FieldPattern {
  name: string;
  confidence: number; // This is required, not optional
  type:
    | "email"
    | "phone"
    | "url"
    | "name"
    | "address"
    | "currency"
    | "date"
    | "custom";
  regex?: RegExp | undefined; // Add undefined explicitly
  generator?: string | undefined; // Add undefined explicitly
  weight?: number | undefined; // Add undefined explicitly
  validation?: ((fieldName: string) => boolean) | undefined; // Add undefined explicitly
}
/**
 * Semantic definition interface
 */
export interface SemanticDefinition {
  name: string; // Added missing property
  keywords: string[]; // Added for compatibility
  compatibleTypes: FieldType[]; // Added for compatibility
  scoringFn: (fieldName: string, fieldType: FieldType) => number; // Added for compatibility
  domain: string; // Added for compatibility
  constraints?: Partial<ValidationConstraints>; // Added for compatibility
  related?: string[]; // Added for compatibility
}

/**
 * Analysis options interface
 */
export interface AnalysisOptions {
  enablePatternRecognition?: boolean;
  enableSemanticAnalysis?: boolean;
  enableCaching?: boolean;
  maxDepth?: number;
  customPatterns?: FieldPattern[];
  customSemantics?: SemanticDefinition[];
  enablePatterns?: boolean; // Added for compatibility
  enableSemantics?: boolean; // Added for compatibility
}

/**
 * Main schema analyzer class
 */
export class SchemaAnalyzer {
  private patterns: FieldPattern[];
  private semantics: SemanticDefinition[];
  private analysisCache = new Map<string, SchemaAnalysisResult>();

  constructor() {
    this.patterns = this.getDefaultPatterns();
    this.semantics = this.getDefaultSemantics();
  }

  /**
   * Analyze a Mongoose schema comprehensively
   */
  analyze(
    schema: Schema,
    modelName?: string,
    options: AnalysisOptions = {}
  ): SchemaAnalysisResult {
    const cacheKey = this.generateCacheKey(schema, modelName, options);

    if (options.enableCaching && this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const startTime = Date.now();
    const result: SchemaAnalysisResult = {
      schema,
      modelName,
      fields: new Map(),
      requiredFields: [],
      uniqueFields: [],
      relationshipFields: [],
      nestedSchemas: new Map(),
      hooks: {
        pre: this.extractHooks(schema, "pre"),
        post: this.extractHooks(schema, "post"),
      },
      patterns: {
        fieldPatterns: new Map(),
        namingConventions: [],
        commonPrefixes: [],
        commonSuffixes: [],
        confidence: 0,
        patterns: [],
      },
      semantic: {
        purpose: [],
        relatedModels: [],
        businessLogic: [],
        dataFlow: [],
      },
      metadata: {
        analyzedAt: new Date(),
        version: "1.0.0",
        complexity: "simple",
        depth: 0,
        fieldCount: 0,
        relationshipCount: 0,
      },
    };

    // Analyze all schema paths
    this.analyzeFields(schema, result, options);

    // Calculate metadata
    this.calculateMetadata(result);

    // Cache result if enabled
    if (options.enableCaching) {
      this.analysisCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Analyze a specific field in the schema
   */
  analyzeField(
    schemaType: SchemaType,
    path: string,
    options: AnalysisOptions = {}
  ): FieldAnalysis {
    const fieldType = this.getFieldType(schemaType);
    const constraints = this.extractConstraints(schemaType);
    const relationship = this.detectRelationships(schemaType, path);

    const patternResult =
      options.enablePatternRecognition !== false &&
      options.enablePatterns !== false
        ? this.recognizePatterns(path)
        : { patterns: [] };

    const semanticResult =
      options.enableSemanticAnalysis !== false &&
      options.enableSemantics !== false
        ? this.analyzeSemantics(path, fieldType)
        : { semantic: undefined };

    const analysis: FieldAnalysis = {
      path,
      type: fieldType,
      required: constraints.required ?? false,
      unique: constraints.unique ?? false,
      isArray: this.isArrayField(schemaType),
      defaultValue: constraints.default,
      constraints,
      relationship: relationship || undefined, // Fix: Ensure it's either FieldRelationship or undefined
      patterns: patternResult.patterns?.map((p: FieldPattern) => p.name) || [],
      semantic: semanticResult.semantic,
      generatorHint: this.getGeneratorHint(
        fieldType,
        patternResult.patterns || [],
        semanticResult.semantic
      ),
      autoGenerate: this.shouldAutoGenerate(path, constraints, relationship),
      description: this.getFieldDescription(schemaType),
      examples: this.getFieldExamples(schemaType),
    };

    // Analyze nested schema if present
    if (this.hasNestedSchema(schemaType)) {
      analysis.nestedSchema = this.analyzeNestedSchema(schemaType, options);
    }

    return analysis;
  }

  /**
   * Recognize patterns in field names
   */
  recognizePatterns(fieldName: string): {
    patterns: FieldPattern[];
    bestMatch?: FieldPattern | undefined; // Add undefined explicitly
  } {
    const recognizedPatterns: FieldPattern[] = [];
    let bestMatch: FieldPattern | undefined;
    let highestConfidence = 0;

    for (const pattern of this.patterns) {
      if (pattern.regex && pattern.regex.test(fieldName)) {
        const confidence = this.calculatePatternConfidence(fieldName, pattern);

        const recognizedPattern: FieldPattern = {
          name: pattern.name,
          confidence,
          type: pattern.type,
          regex: pattern.regex,
          generator: pattern.generator,
        };

        recognizedPatterns.push(recognizedPattern);

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = recognizedPattern; // Use the full pattern object
        }
      }
    }

    return {
      patterns: recognizedPatterns.sort((a, b) => b.confidence - a.confidence),
      bestMatch: bestMatch || undefined, // Explicitly handle undefined
    };
  }

  /**
   * Perform semantic analysis on field names
   */
  analyzeSemantics(
    fieldName: string,
    fieldType: FieldType
  ): {
    semantic?: string | undefined; // Add undefined explicitly
    confidence: number;
    suggestedType?: FieldType | undefined; // Add undefined explicitly
    suggestedConstraints?: Partial<ValidationConstraints> | undefined; // Add undefined explicitly
    relatedFields: string[];
  } {
    let bestSemantic: string | undefined;
    let highestConfidence = 0;
    let suggestedType: FieldType | undefined;
    let suggestedConstraints: Partial<ValidationConstraints> | undefined;
    const relatedFields: string[] = [];

    for (const semantic of this.semantics) {
      const confidence = semantic.scoringFn(fieldName.toLowerCase(), fieldType);

      if (confidence > highestConfidence && confidence > 0.5) {
        highestConfidence = confidence;
        bestSemantic = semantic.name;

        if (semantic.compatibleTypes.length > 0) {
          suggestedType = semantic.compatibleTypes[0];
        }

        suggestedConstraints = semantic.constraints;

        if (semantic.related) {
          relatedFields.push(...semantic.related);
        }
      }
    }

    return {
      semantic: bestSemantic,
      confidence: highestConfidence,
      suggestedType,
      suggestedConstraints,
      relatedFields,
    };
  }
  /**
   * Extract validation constraints from schema type
   */
  extractConstraints(schemaType: SchemaType): ValidationConstraints {
    const options = (schemaType as any).options || {};
    const validators = (schemaType as any).validators || [];

    const constraints: ValidationConstraints = {
      required: this.extractRequired(schemaType),
      unique: options.unique || false,
      default: options.default,
    };

    // Extract numeric constraints
    if (typeof options.min !== "undefined") {
      constraints.min = options.min;
    }
    if (typeof options.max !== "undefined") {
      constraints.max = options.max;
    }

    // Extract string constraints
    if (
      typeof options.minLength !== "undefined" ||
      typeof options.minlength !== "undefined"
    ) {
      constraints.minLength = options.minLength || options.minlength;
    }
    if (
      typeof options.maxLength !== "undefined" ||
      typeof options.maxlength !== "undefined"
    ) {
      constraints.maxLength = options.maxLength || options.maxlength;
    }

    // Extract regex pattern
    if (options.match) {
      constraints.match = options.match;
    }

    // Extract enum values
    if (options.enum) {
      constraints.enum = Array.isArray(options.enum)
        ? options.enum
        : Object.values(options.enum);
    }

    // Extract custom validators
    const customValidator = validators.find(
      (v: any) => typeof v.validator === "function"
    );
    if (customValidator) {
      constraints.validate = {
        validator: customValidator.validator,
        message: customValidator.message || "Custom validation failed",
      };
    }

    return constraints;
  }

  /**
   * Detect relationships from schema type
   */
  detectRelationships(
    schemaType: SchemaType,
    path: string
  ): FieldRelationship | undefined {
    const options = (schemaType as any).options || {};

    // Check for ObjectId references
    if (options.ref) {
      return {
        type: "ref",
        model: options.ref,
        path,
        isArray: this.isArrayField(schemaType),
      };
    }

    // Check for embedded documents
    if (schemaType instanceof Schema) {
      return {
        type: "embedded",
        path,
        isArray: this.isArrayField(schemaType),
      };
    }

    // Check for subdocuments
    if (this.hasNestedSchema(schemaType)) {
      return {
        type: "subdocument",
        path,
        isArray: this.isArrayField(schemaType),
      };
    }

    return undefined;
  }

  /**
   * Analyze fields in the schema
   */
  private analyzeFields(
    schema: Schema,
    result: SchemaAnalysisResult,
    options: AnalysisOptions
  ): void {
    schema.eachPath((path, schemaType) => {
      // Skip internal MongoDB fields
      if (path === "_id" || path === "__v") {
        return;
      }

      const fieldAnalysis = this.analyzeField(schemaType, path, options);
      result.fields.set(path, fieldAnalysis);

      // Update field lists
      if (fieldAnalysis.required) {
        result.requiredFields.push(path);
      }
      if (fieldAnalysis.unique) {
        result.uniqueFields.push(path);
      }
      if (fieldAnalysis.relationship) {
        result.relationshipFields.push(path);
      }

      // Store nested schemas
      if (fieldAnalysis.nestedSchema) {
        result.nestedSchemas.set(path, fieldAnalysis.nestedSchema.schema);
      }
    });
  }

  /**
   * Get field type from schema type
   */
  private getFieldType(schemaType: SchemaType): FieldType {
    const instance = (schemaType as any).instance;

    switch (instance) {
      case "String":
        return FieldType.STRING;
      case "Number":
        return FieldType.NUMBER;
      case "Boolean":
        return FieldType.BOOLEAN;
      case "Date":
        return FieldType.DATE;
      case "ObjectID":
        return FieldType.OBJECTID;
      case "Array":
        return FieldType.ARRAY;
      case "Buffer":
        return FieldType.BUFFER;
      case "Map":
        return FieldType.MAP;
      case "Decimal128":
        return FieldType.DECIMAL128;
      case "Mixed":
        return FieldType.MIXED;
      default:
        return FieldType.MIXED;
    }
  }

  /**
   * Check if field is an array
   */
  private isArrayField(schemaType: SchemaType): boolean {
    return (
      (schemaType as any).instance === "Array" ||
      Array.isArray((schemaType as any).options?.type)
    );
  }

  /**
   * Check if schema type has nested schema
   */
  private hasNestedSchema(schemaType: SchemaType): boolean {
    return (
      schemaType instanceof Schema ||
      (schemaType as any).schema instanceof Schema
    );
  }

  /**
   * Analyze nested schema
   */
  private analyzeNestedSchema(
    schemaType: SchemaType,
    options: AnalysisOptions
  ): SchemaAnalysisResult {
    const nestedSchema =
      schemaType instanceof Schema ? schemaType : (schemaType as any).schema;

    return this.analyze(nestedSchema, undefined, {
      ...options,
      maxDepth: (options.maxDepth || 5) - 1,
    });
  }

  /**
   * Extract required field information
   */
  private extractRequired(schemaType: SchemaType): boolean {
    const options = (schemaType as any).options || {};
    const validators = (schemaType as any).validators || [];

    // Check options.required
    if (options.required === true) {
      return true;
    }

    // Check for required validator
    return validators.some((v: any) => v.type === "required");
  }

  /**
   * Calculate pattern confidence
   */
  private calculatePatternConfidence(
    fieldName: string,
    pattern: FieldPattern
  ): number {
    let confidence = pattern.weight || 0.5; // Fixed: Use default if weight doesn't exist

    // Boost confidence for exact matches
    if (fieldName.toLowerCase() === pattern.name.toLowerCase()) {
      confidence *= 1.5;
    }

    // Additional validation if provided
    if (pattern.validation && !pattern.validation(fieldName)) {
      confidence *= 0.5;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get generator hint based on analysis
   */
  private getGeneratorHint(
    fieldType: FieldType,
    patterns: FieldPattern[],
    semantic?: string
  ): string | undefined {
    // Use pattern generator if available
    const patternWithGenerator = patterns.find((p) => p.generator);
    if (patternWithGenerator?.generator) {
      return patternWithGenerator.generator;
    }

    // Use semantic-based generator
    if (semantic) {
      return `semantic:${semantic}`;
    }

    // Use default type-based generator
    return `type:${fieldType.toLowerCase()}`;
  }

  /**
   * Determine if field should be auto-generated
   */
  private shouldAutoGenerate(
    path: string,
    constraints: ValidationConstraints,
    relationship?: FieldRelationship
  ): boolean {
    // Don't generate if has default value
    if (constraints.default !== undefined) {
      return false;
    }

    // Always generate required fields
    if (constraints.required) {
      return true;
    }

    // Generate relationship fields
    if (relationship) {
      return true;
    }

    // Skip MongoDB internal fields
    if (path === "_id" || path === "__v") {
      return false;
    }

    return true;
  }

  /**
   * Get field description from schema
   */
  private getFieldDescription(schemaType: SchemaType): string | undefined {
    const options = (schemaType as any).options || {};
    return options.description || options.desc;
  }

  /**
   * Get field examples from schema
   */
  private getFieldExamples(schemaType: SchemaType): any[] | undefined {
    const options = (schemaType as any).options || {};
    return options.examples || options.example ? [options.example] : undefined;
  }

  /**
   * Infer business domain from field and semantic info
   */
  private inferDomain(
    fieldName: string,
    semantic?: string
  ): string | undefined {
    const userFields = ["username", "email", "password", "profile", "avatar"];
    const productFields = ["price", "sku", "inventory", "category", "brand"];
    const orderFields = ["total", "quantity", "shipping", "payment", "status"];

    if (userFields.some((f) => fieldName.includes(f))) {
      return "user";
    }
    if (productFields.some((f) => fieldName.includes(f))) {
      return "product";
    }
    if (orderFields.some((f) => fieldName.includes(f))) {
      return "order";
    }

    return "custom";
  }

  /**
   * Extract schema hooks
   */
  private extractHooks(schema: Schema, type: "pre" | "post"): string[] {
    // This would extract actual hooks from the schema
    // Implementation depends on Mongoose internals
    return [];
  }

  /**
   * Extract schema indexes - FIXED: Use indexes() instead of getIndexes()
   */
  private extractIndexes(
    schema: Schema
  ): Array<{ fields: Record<string, 1 | -1>; options?: Record<string, any> }> {
    const indexes = schema.indexes(); // Fixed: Use indexes() instead of getIndexes()
    return indexes.map((index: any) => ({
      // Added type annotation
      fields: index[0],
      options: index[1],
    }));
  }

  /**
   * Extract schema plugins
   */
  private extractPlugins(
    schema: Schema
  ): Array<{ name: string; options?: any }> {
    // This would extract plugins from the schema
    // Implementation depends on Mongoose internals
    return [];
  }

  /**
   * Extract virtual fields
   */
  private extractVirtuals(schema: Schema): string[] {
    return Object.keys(schema.virtuals || {});
  }

  /**
   * Extract schema methods
   */
  private extractMethods(schema: Schema): string[] {
    return Object.keys(schema.methods || {});
  }

  /**
   * Extract schema statics
   */
  private extractStatics(schema: Schema): string[] {
    return Object.keys(schema.statics || {});
  }

  /**
   * Calculate analysis metadata
   */
  private calculateMetadata(result: SchemaAnalysisResult): void {
    result.metadata.fieldCount = result.fields.size;
    result.metadata.relationshipCount = result.relationshipFields.length;
    result.metadata.depth = this.calculateSchemaDepth(result);
    result.metadata.complexity = this.calculateComplexity(result);
  }

  /**
   * Calculate schema depth
   */
  private calculateSchemaDepth(result: SchemaAnalysisResult): number {
    let maxDepth = 1;

    for (const nested of result.nestedSchemas.values()) {
      const nestedAnalysis = this.analyze(nested); // Fixed: Analyze the nested schema first
      const nestedDepth = 1 + this.calculateSchemaDepth(nestedAnalysis);
      maxDepth = Math.max(maxDepth, nestedDepth);
    }

    return maxDepth;
  }

  /**
   * Calculate schema complexity
   */
  private calculateComplexity(
    result: SchemaAnalysisResult
  ): "simple" | "moderate" | "complex" {
    const fieldCount = result.metadata.fieldCount || 0;
    const relationshipCount = result.metadata.relationshipCount || 0;
    const depth = result.metadata.depth || 1;

    if (fieldCount <= 5 && relationshipCount <= 1 && depth <= 2) {
      return "simple";
    }
    if (fieldCount <= 15 && relationshipCount <= 5 && depth <= 4) {
      return "moderate";
    }
    return "complex";
  }

  /**
   * Generate cache key for analysis
   */
  private generateCacheKey(
    schema: Schema,
    modelName?: string,
    options?: AnalysisOptions
  ): string {
    return `${modelName || "unknown"}_${JSON.stringify(options || {})}`;
  }

  /**
   * Get default field patterns for recognition
   */

  private getDefaultPatterns(): FieldPattern[] {
    return [
      {
        name: "email",
        regex: /^(email|e_mail|emailaddress|email_address)$/i,
        type: "email",
        confidence: 0.9, // Add confidence property
        weight: 0.9,
        generator: "faker.internet.email",
      },
      {
        name: "phone",
        regex: /^(phone|telephone|tel|mobile|cell|phoneNumber|phone_number)$/i,
        type: "phone",
        confidence: 0.9, // Add confidence property
        weight: 0.9,
        generator: "faker.phone.number",
      },
      {
        name: "url",
        regex: /^(url|website|site|link|homepage)$/i,
        type: "url",
        confidence: 0.8, // Add confidence property
        weight: 0.8,
        generator: "faker.internet.url",
      },
      {
        name: "name",
        regex:
          /^(name|title|label|firstName|lastName|fullName|first_name|last_name|full_name)$/i,
        type: "name",
        confidence: 0.8, // Add confidence property
        weight: 0.8,
        generator: "faker.person.fullName",
      },
      {
        name: "address",
        regex: /^(address|street|city|state|country|zip|postal|location)$/i,
        type: "address",
        confidence: 0.7, // Add confidence property
        weight: 0.7,
        generator: "faker.location.streetAddress",
      },
      {
        name: "date",
        regex: /^(date|time|created|updated|birth|born|at|on)$/i,
        type: "date",
        confidence: 0.7, // Add confidence property
        weight: 0.7,
        generator: "faker.date.recent",
      },
      {
        name: "currency",
        regex: /^(price|cost|amount|total|fee|charge|payment|salary|wage)$/i,
        type: "currency",
        confidence: 0.8, // Add confidence property
        weight: 0.8,
        generator: "faker.finance.amount",
      },
    ];
  }

  /**
   * Get default semantic definitions
   */
  private getDefaultSemantics(): SemanticDefinition[] {
    return [
      {
        name: "identifier",
        keywords: ["id", "uuid", "guid", "key", "ref"],
        compatibleTypes: [FieldType.STRING, FieldType.OBJECTID],
        scoringFn: (name: string, type: FieldType) => {
          if (name.includes("id") || name.includes("key")) return 0.8;
          if (type === FieldType.OBJECTID) return 0.9;
          return 0;
        },
        domain: "system",
      },
      {
        name: "personal_info",
        keywords: ["name", "email", "phone", "address", "age", "birth"],
        compatibleTypes: [FieldType.STRING, FieldType.NUMBER, FieldType.DATE],
        scoringFn: (name: string, type: FieldType) => {
          const personalKeywords = [
            "name",
            "email",
            "phone",
            "address",
            "age",
            "birth",
          ];
          return personalKeywords.some((k) => name.includes(k)) ? 0.8 : 0;
        },
        domain: "user",
      },
      {
        name: "content",
        keywords: [
          "title",
          "description",
          "content",
          "text",
          "message",
          "comment",
        ],
        compatibleTypes: [FieldType.STRING],
        scoringFn: (name: string, type: FieldType) => {
          const contentKeywords = [
            "title",
            "description",
            "content",
            "text",
            "message",
          ];
          return contentKeywords.some((k) => name.includes(k)) ? 0.7 : 0;
        },
        domain: "content",
      },
      {
        name: "financial",
        keywords: [
          "price",
          "cost",
          "amount",
          "total",
          "fee",
          "payment",
          "salary",
        ],
        compatibleTypes: [FieldType.NUMBER, FieldType.DECIMAL128],
        scoringFn: (name: string, type: FieldType) => {
          const financialKeywords = [
            "price",
            "cost",
            "amount",
            "total",
            "fee",
            "payment",
          ];
          return financialKeywords.some((k) => name.includes(k)) ? 0.8 : 0;
        },
        domain: "finance",
      },
    ];
  }
}
