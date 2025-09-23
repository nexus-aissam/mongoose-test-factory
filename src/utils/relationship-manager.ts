/**
 * Relationship Manager for mongoose-test-factory
 * 
 * Handles generation and management of relationships between documents,
 * maintaining referential integrity and supporting various relationship types.
 */

import { Model, Types } from 'mongoose';
import { GenerationContext, RelationshipError } from '../types/common';

/**
 * Relationship manager for handling document relationships
 */
export class RelationshipManager {
  private relationshipCache = new Map<string, any[]>();
  private pendingRelationships = new Map<string, PendingRelationship[]>();

  /**
   * Generate a relationship for a document
   * 
   * @param document - Document to add relationship to
   * @param fieldName - Relationship field name
   * @param count - Number of related documents
   * @param context - Generation context
   */
  async generateRelationship(
    document: any,
    fieldName: string,
    count: number,
    context: GenerationContext
  ): Promise<void> {
    const fieldAnalysis = this.getFieldAnalysis(context, fieldName);
    
    if (!fieldAnalysis?.relationship) {
      throw new RelationshipError(
        `No relationship found for field: ${fieldName}`,
        fieldName
      );
    }

    const { relationship } = fieldAnalysis;
    
    try {
      switch (relationship.type) {
        case 'ref':
          await this.generateReference(document, fieldName, count, relationship, context);
          break;
        case 'embedded':
          await this.generateEmbedded(document, fieldName, count, relationship, context);
          break;
        case 'subdocument':
          await this.generateSubdocument(document, fieldName, count, relationship, context);
          break;
        default:
          throw new RelationshipError(
            `Unsupported relationship type: ${relationship.type}`,
            fieldName
          );
      }
    } catch (error) {
      throw new RelationshipError(
        `Failed to generate relationship for field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fieldName
      );
    }
  }

  /**
   * Generate reference relationship (ObjectId refs)
   * 
   * @param document - Parent document
   * @param fieldName - Field name
   * @param count - Number of references
   * @param relationship - Relationship info
   * @param context - Generation context
   */
  private async generateReference(
    document: any,
    fieldName: string,
    count: number,
    relationship: any,
    context: GenerationContext
  ): Promise<void> {
    const { model: modelName, isArray } = relationship;
    
    if (!modelName) {
      throw new RelationshipError(
        `Model name not specified for reference field: ${fieldName}`,
        fieldName
      );
    }

    // Get referenced model
    const referencedModel = this.getReferencedModel(modelName, context);
    
    if (!referencedModel) {
      throw new RelationshipError(
        `Referenced model not found: ${modelName}`,
        fieldName
      );
    }

    // Get or create referenced documents
    const referencedDocs = await this.getReferencedDocuments(
      referencedModel,
      count,
      fieldName,
      context
    );

    // Set reference(s) in document
    if (isArray) {
      document[fieldName] = referencedDocs.map(doc => doc._id);
    } else {
      document[fieldName] = referencedDocs[0]?._id;
    }

    // Update context relationships
    if (!context.relationships) {
      context.relationships = new Map();
    }
    context.relationships.set(fieldName, referencedDocs);
  }

  /**
   * Generate embedded document relationship
   * 
   * @param document - Parent document
   * @param fieldName - Field name
   * @param count - Number of embedded docs
   * @param relationship - Relationship info
   * @param context - Generation context
   */
  private async generateEmbedded(
    document: any,
    fieldName: string,
    count: number,
    relationship: any,
    context: GenerationContext
  ): Promise<void> {
    const { isArray } = relationship;
    
    // Generate embedded documents
    const embeddedDocs = [];
    
    for (let i = 0; i < count; i++) {
      const embeddedDoc = await this.generateEmbeddedDocument(
        fieldName,
        context,
        i
      );
      embeddedDocs.push(embeddedDoc);
    }

    // Set embedded document(s) in parent
    if (isArray) {
      document[fieldName] = embeddedDocs;
    } else {
      document[fieldName] = embeddedDocs[0];
    }
  }

  /**
   * Generate subdocument relationship
   * 
   * @param document - Parent document
   * @param fieldName - Field name
   * @param count - Number of subdocs
   * @param relationship - Relationship info
   * @param context - Generation context
   */
  private async generateSubdocument(
    document: any,
    fieldName: string,
    count: number,
    relationship: any,
    context: GenerationContext
  ): Promise<void> {
    // Subdocuments are similar to embedded documents
    // but have their own schema and _id
    await this.generateEmbedded(document, fieldName, count, relationship, context);
  }

  /**
   * Get referenced documents, creating if necessary
   * 
   * @param model - Referenced model
   * @param count - Number of documents needed
   * @param fieldName - Field name for caching
   * @param context - Generation context
   * @returns Referenced documents
   */
  private async getReferencedDocuments(
    model: Model<any, {}, {}, {}, any, any>,
    count: number,
    fieldName: string,
    context: GenerationContext
  ): Promise<any[]> {
    const cacheKey = `${model.modelName}_${fieldName}`;
    
    // Check cache first
    if (this.relationshipCache.has(cacheKey)) {
      const cached = this.relationshipCache.get(cacheKey)!;
      if (cached.length >= count) {
        return cached.slice(0, count);
      }
    }

    // Try to find existing documents
    let existingDocs: any[] = [];
    try {
      existingDocs = await model.find().limit(count * 2).exec();
    } catch (error) {
      // Ignore errors when finding existing documents
    }

    // Use existing if we have enough
    if (existingDocs.length >= count) {
      const selected = this.selectRandomDocuments(existingDocs, count);
      this.relationshipCache.set(cacheKey, selected);
      return selected;
    }

    // Create new documents if needed
    const needed = count - existingDocs.length;
    const newDocs = await this.createReferencedDocuments(model, needed, context);
    
    const allDocs = [...existingDocs, ...newDocs];
    const selected = this.selectRandomDocuments(allDocs, count);
    
    this.relationshipCache.set(cacheKey, selected);
    return selected;
  }

  /**
   * Create new referenced documents
   * 
   * @param model - Model to create documents for
   * @param count - Number of documents to create
   * @param context - Generation context
   * @returns Created documents
   */
  private async createReferencedDocuments(
    model: Model<any, {}, {}, {}, any, any>,
    count: number,
    context: GenerationContext
  ): Promise<any[]> {
    // Check if model has factory method
    if (typeof (model as any).factory === 'function') {
      return await (model as any).factory(count).create();
    }

    // Fallback to creating minimal documents
    const documents = [];
    for (let i = 0; i < count; i++) {
      const doc = await this.createMinimalDocument(model, context);
      documents.push(doc);
    }

    return documents;
  }

  /**
   * Create a minimal document for referencing
   * 
   * @param model - Model to create document for
   * @param context - Generation context
   * @returns Created document
   */
  private async createMinimalDocument(model: Model<any, {}, {}, {}, any, any>, context: GenerationContext): Promise<any> {
    const schema = model.schema;
    const document: any = {};

    // Only set required fields
    schema.eachPath((path: string, schemaType: any) => {
      if (path === '_id' || path === '__v') return;
      
      const options = (schemaType as any).options || {};
      const isRequired = this.isFieldRequired(schemaType);
      
      if (isRequired && !options.default) {
        document[path] = this.generateMinimalValue(schemaType, path);
      }
    });

    return await model.create(document);
  }

  /**
   * Generate an embedded document
   * 
   * @param fieldName - Field name
   * @param context - Generation context
   * @param index - Document index
   * @returns Generated embedded document
   */
  private async generateEmbeddedDocument(
    fieldName: string,
    context: GenerationContext,
    index: number
  ): Promise<any> {
    // This would use the factory system to generate embedded documents
    // For now, return a placeholder
    return {
      _id: new Types.ObjectId(),
      name: `Embedded ${fieldName} ${index}`,
      createdAt: new Date()
    };
  }

  /**
   * Get field analysis from context
   * 
   * @param context - Generation context
   * @param fieldName - Field name
   * @returns Field analysis or undefined
   */
  private getFieldAnalysis(context: GenerationContext, fieldName: string): any {
    // This would extract field analysis from the schema analyzer
    // For now, return a placeholder
    return {
      relationship: {
        type: 'ref',
        model: 'User',
        isArray: false
      }
    };
  }

  /**
   * Get referenced model from context
   * 
   * @param modelName - Model name
   * @param context - Generation context
   * @returns Referenced model or undefined
   */
  private getReferencedModel(modelName: string, context: GenerationContext): Model<any, {}, {}, {}, any, any> | undefined {
    // Try to get model from mongoose
    try {
      const mongoose = require('mongoose');
      return mongoose.model(modelName);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Select random documents from array
   * 
   * @param documents - Documents to select from
   * @param count - Number to select
   * @returns Selected documents
   */
  private selectRandomDocuments(documents: any[], count: number): any[] {
    if (documents.length <= count) {
      return documents;
    }

    const selected = [];
    const used = new Set<number>();
    
    while (selected.length < count && used.size < documents.length) {
      const index = Math.floor(Math.random() * documents.length);
      if (!used.has(index)) {
        used.add(index);
        selected.push(documents[index]);
      }
    }

    return selected;
  }

  /**
   * Check if field is required
   * 
   * @param schemaType - Schema type
   * @returns Whether field is required
   */
  private isFieldRequired(schemaType: any): boolean {
    const options = schemaType.options || {};
    const validators = schemaType.validators || [];
    
    return options.required === true || 
           validators.some((v: any) => v.type === 'required');
  }

  /**
   * Generate minimal value for field type
   * 
   * @param schemaType - Schema type
   * @param path - Field path
   * @returns Generated value
   */
  private generateMinimalValue(schemaType: any, path: string): any {
    const instance = schemaType.instance;
    
    switch (instance) {
      case 'String':
        return `${path}_${Math.random().toString(36).substring(7)}`;
      case 'Number':
        return Math.floor(Math.random() * 100);
      case 'Boolean':
        return Math.random() > 0.5;
      case 'Date':
        return new Date();
      case 'ObjectID':
        return new Types.ObjectId();
      case 'Array':
        return [];
      default:
        return null;
    }
  }

  /**
   * Clear relationship cache
   */
  clearCache(): void {
    this.relationshipCache.clear();
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.relationshipCache.size,
      keys: Array.from(this.relationshipCache.keys())
    };
  }
}

/**
 * Pending relationship interface
 */
interface PendingRelationship {
  document: any;
  fieldName: string;
  targetModel: string;
  count: number;
  isArray: boolean;
}