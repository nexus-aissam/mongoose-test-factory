/**
 * Unit tests for Schema Analyzer
 */

import mongoose, { Schema } from 'mongoose';
import { SchemaAnalyzer } from '../../src/utils/schema-analyzer';
import { FieldType } from '../../src/types/common';

describe('SchemaAnalyzer', () => {
  let analyzer: SchemaAnalyzer;

  beforeEach(() => {
    analyzer = new SchemaAnalyzer();
  });

  describe('Constructor', () => {
    it('should create analyzer instance', () => {
      expect(analyzer).toBeDefined();
      expect(typeof analyzer.analyze).toBe('function');
      expect(typeof analyzer.analyzeField).toBe('function');
    });
  });

  describe('Schema Analysis', () => {
    it('should analyze simple schema', () => {
      const schema = new Schema({
        name: String,
        age: Number,
        isActive: Boolean,
        createdAt: Date
      });

      const result = analyzer.analyze(schema, 'TestModel');

      expect(result).toBeDefined();
      expect(result.modelName).toBe('TestModel');
      expect(result.fields.size).toBe(4);
      expect(result.metadata.fieldCount).toBe(4);
    });

    it('should identify field types correctly', () => {
      const schema = new Schema({
        stringField: String,
        numberField: Number,
        booleanField: Boolean,
        dateField: Date,
        objectIdField: { type: Schema.Types.ObjectId, ref: 'User' },
        arrayField: [String],
        mixedField: Schema.Types.Mixed
      });

      const result = analyzer.analyze(schema);

      const stringField = result.fields.get('stringField');
      expect(stringField?.type).toBe(FieldType.STRING);

      const numberField = result.fields.get('numberField');
      expect(numberField?.type).toBe(FieldType.NUMBER);

      const booleanField = result.fields.get('booleanField');
      expect(booleanField?.type).toBe(FieldType.BOOLEAN);

      const dateField = result.fields.get('dateField');
      expect(dateField?.type).toBe(FieldType.DATE);

      const objectIdField = result.fields.get('objectIdField');
      expect(objectIdField?.type).toBe(FieldType.OBJECTID);

      const arrayField = result.fields.get('arrayField');
      expect(arrayField?.type).toBe(FieldType.ARRAY);
      expect(arrayField?.isArray).toBe(true);
    });

    it('should extract validation constraints', () => {
      const schema = new Schema({
        requiredField: { type: String, required: true },
        uniqueField: { type: String, unique: true },
        minMaxField: { type: Number, min: 0, max: 100 },
        lengthField: { type: String, minLength: 5, maxLength: 50 },
        enumField: { type: String, enum: ['a', 'b', 'c'] },
        defaultField: { type: Boolean, default: true }
      });

      const result = analyzer.analyze(schema);

      const requiredField = result.fields.get('requiredField');
      expect(requiredField?.required).toBe(true);
      expect(requiredField?.constraints.required).toBe(true);

      const uniqueField = result.fields.get('uniqueField');
      expect(uniqueField?.unique).toBe(true);
      expect(uniqueField?.constraints.unique).toBe(true);

      const minMaxField = result.fields.get('minMaxField');
      expect(minMaxField?.constraints.min).toBe(0);
      expect(minMaxField?.constraints.max).toBe(100);

      const lengthField = result.fields.get('lengthField');
      expect(lengthField?.constraints.minLength).toBe(5);
      expect(lengthField?.constraints.maxLength).toBe(50);

      const enumField = result.fields.get('enumField');
      expect(enumField?.constraints.enum).toEqual(['a', 'b', 'c']);

      const defaultField = result.fields.get('defaultField');
      expect(defaultField?.defaultValue).toBe(true);
      expect(defaultField?.constraints.default).toBe(true);
    });

    it('should detect relationships', () => {
      const schema = new Schema({
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        profile: {
          name: String,
          avatar: String
        }
      });

      const result = analyzer.analyze(schema);

      const userField = result.fields.get('user');
      expect(userField?.relationship).toBeDefined();
      expect(userField?.relationship?.type).toBe('ref');
      expect(userField?.relationship?.model).toBe('User');

      const tagsField = result.fields.get('tags');
      expect(tagsField?.relationship).toBeDefined();
      expect(tagsField?.relationship?.type).toBe('ref');
      expect(tagsField?.relationship?.model).toBe('Tag');
      expect(tagsField?.relationship?.isArray).toBe(true);
    });

    it('should identify required and unique fields', () => {
      const schema = new Schema({
        requiredField1: { type: String, required: true },
        requiredField2: { type: Number, required: true },
        uniqueField1: { type: String, unique: true },
        uniqueField2: { type: String, unique: true },
        normalField: String
      });

      const result = analyzer.analyze(schema);

      expect(result.requiredFields).toContain('requiredField1');
      expect(result.requiredFields).toContain('requiredField2');
      expect(result.requiredFields).not.toContain('normalField');

      expect(result.uniqueFields).toContain('uniqueField1');
      expect(result.uniqueFields).toContain('uniqueField2');
      expect(result.uniqueFields).not.toContain('normalField');
    });

    it('should calculate schema complexity', () => {
      // Simple schema
      const simpleSchema = new Schema({
        name: String,
        age: Number
      });

      const simpleResult = analyzer.analyze(simpleSchema);
      expect(simpleResult.metadata.complexity).toBe('simple');

      // Moderate schema
      const moderateSchema = new Schema({
        name: String,
        email: String,
        age: Number,
        profile: {
          bio: String,
          avatar: String
        },
        posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        settings: {
          theme: String,
          notifications: Boolean
        }
      });

      const moderateResult = analyzer.analyze(moderateSchema);
      expect(['moderate', 'complex']).toContain(moderateResult.metadata.complexity);
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize email patterns', () => {
      const result = analyzer.recognizePatterns('email');
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns[0].type).toBe('email');
    });

    it('should recognize name patterns', () => {
      const result = analyzer.recognizePatterns('firstName');
      expect(result.patterns.some(p => p.type === 'name')).toBe(true);
    });

    it('should recognize phone patterns', () => {
      const result = analyzer.recognizePatterns('phoneNumber');
      expect(result.patterns.some(p => p.type === 'phone')).toBe(true);
    });

    it('should recognize url patterns', () => {
      const result = analyzer.recognizePatterns('website');
      expect(result.patterns.some(p => p.type === 'url')).toBe(true);
    });

    it('should return best match', () => {
      const result = analyzer.recognizePatterns('email');
      expect(result.bestMatch).toBeDefined();
      expect(result.bestMatch?.type).toBe('email');
      expect(result.bestMatch?.confidence).toBeGreaterThan(0);
    });

    it('should handle unrecognized patterns', () => {
      const result = analyzer.recognizePatterns('unknownFieldName');
      expect(result.patterns).toHaveLength(0);
      expect(result.bestMatch).toBeUndefined();
    });
  });

  describe('Semantic Analysis', () => {
    it('should analyze semantic meaning', () => {
      const result = analyzer.analyzeSemantics('userEmail', FieldType.STRING);
      expect(result.semantic).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should suggest appropriate types', () => {
      const result = analyzer.analyzeSemantics('userId', FieldType.OBJECTID);
      expect(result.suggestedType).toBeDefined();
    });

    it('should infer business domain', () => {
      const userResult = analyzer.analyzeSemantics('username', FieldType.STRING);
      expect(userResult.domain).toBe('user');

      const priceResult = analyzer.analyzeSemantics('productPrice', FieldType.NUMBER);
      expect(priceResult.domain).toBe('product');
    });
  });

  describe('Field Analysis', () => {
    it('should analyze individual field', () => {
      const schema = new Schema({
        email: { type: String, required: true, unique: true }
      });

      let emailSchemaType: any;
      schema.eachPath((path, schemaType) => {
        if (path === 'email') {
          emailSchemaType = schemaType;
        }
      });

      const result = analyzer.analyzeField(emailSchemaType, 'email');

      expect(result.path).toBe('email');
      expect(result.type).toBe(FieldType.STRING);
      expect(result.required).toBe(true);
      expect(result.unique).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('should determine auto-generation capability', () => {
      const schema = new Schema({
        autoField: String,
        defaultField: { type: String, default: 'default' },
        idField: { type: String, default: () => 'id' }
      });

      const result = analyzer.analyze(schema);

      const autoField = result.fields.get('autoField');
      expect(autoField?.autoGenerate).toBe(true);

      const defaultField = result.fields.get('defaultField');
      expect(defaultField?.autoGenerate).toBe(false); // Has default value
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid schema gracefully', () => {
      const emptySchema = new Schema({});
      const result = analyzer.analyze(emptySchema);
      
      expect(result).toBeDefined();
      expect(result.fields.size).toBe(0);
    });

    it('should handle malformed field definitions', () => {
      // This should not throw
      expect(() => {
        const schema = new Schema({
          normalField: String
        });
        analyzer.analyze(schema);
      }).not.toThrow();
    });
  });

  describe('Caching', () => {
    it('should cache analysis results when enabled', () => {
      const schema = new Schema({
        name: String,
        email: String
      });

      const options = { enableCaching: true };
      
      const result1 = analyzer.analyze(schema, 'TestModel', options);
      const result2 = analyzer.analyze(schema, 'TestModel', options);

      // Results should be identical (cached)
      expect(result1).toBe(result2);
    });
  });
});