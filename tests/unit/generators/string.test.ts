/**
 * Unit tests for String Generator
 */

import { MongooseStringGenerator } from '../../../src/generators/string';
import { FieldType, GenerationContext } from '../../../src/types/common';
import mongoose from 'mongoose';

describe('MongooseStringGenerator', () => {
  let generator: MongooseStringGenerator;
  let mockContext: GenerationContext;

  beforeEach(() => {
    generator = new MongooseStringGenerator();
    
    // Create mock context
    const mockSchema = new mongoose.Schema({});
    const mockModel = mongoose.model('MockModel', mockSchema);
    
    mockContext = {
      schema: mockSchema,
      model: mockModel,
      fieldPath: 'testField',
      index: 0,
      totalCount: 1,
      existingValues: new Set(),
      relationships: new Map()
    };
  });

  describe('Constructor', () => {
    it('should create generator with default config', () => {
      expect(generator).toBeDefined();
      expect(generator.getPriority()).toBe(10);
      expect(generator.isEnabled()).toBe(true);
    });
  });

  describe('canHandle', () => {
    it('should handle STRING field type', () => {
      expect(generator.canHandle(FieldType.STRING)).toBe(true);
    });

    it('should not handle other field types', () => {
      expect(generator.canHandle(FieldType.NUMBER)).toBe(false);
      expect(generator.canHandle(FieldType.DATE)).toBe(false);
      expect(generator.canHandle(FieldType.BOOLEAN)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate string value', async () => {
      const result = await generator.generate(mockContext);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate different values on multiple calls', async () => {
      const results = await Promise.all([
        generator.generate(mockContext),
        generator.generate(mockContext),
        generator.generate(mockContext)
      ]);

      // At least one should be different (very high probability)
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('generateByPattern', () => {
    it('should generate email for email patterns', () => {
      mockContext.fieldPath = 'email';
      const result = generator.generateByPattern('email', mockContext);
      
      expect(result).toMatch(/@/);
      expect(result).toMatch(/\./);
    });

    it('should generate email for emailAddress', () => {
      const result = generator.generateByPattern('emailAddress', mockContext);
      expect(result).toMatch(/@/);
    });

    it('should generate name for name patterns', () => {
      const result = generator.generateByPattern('name', mockContext);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate firstName for firstName pattern', () => {
      const result = generator.generateByPattern('firstName', mockContext);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate lastName for lastName pattern', () => {
      const result = generator.generateByPattern('lastName', mockContext);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate URL for url patterns', () => {
      const result = generator.generateByPattern('website', mockContext);
      expect(result).toMatch(/^https?:\/\//);
    });

    it('should generate phone for phone patterns', () => {
      const result = generator.generateByPattern('phone', mockContext);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return null for unrecognized patterns', () => {
      const result = generator.generateByPattern('unknownField', mockContext);
      expect(result).toBeNull();
    });
  });

  describe('generateByRegex', () => {
    it('should generate email-like string for email regex', () => {
      const emailRegex = /@/;
      const result = generator.generateByRegex(emailRegex, mockContext);
      expect(result).toMatch(/@/);
    });

    it('should generate phone-like string for phone regex', () => {
      const phoneRegex = /\d/;
      const result = generator.generateByRegex(phoneRegex, mockContext);
      expect(typeof result).toBe('string');
    });

    it('should generate URL-like string for URL regex', () => {
      const urlRegex = /http/;
      const result = generator.generateByRegex(urlRegex, mockContext);
      expect(result).toMatch(/^https?:\/\//);
    });
  });

  describe('generateFromEnum', () => {
    it('should return value from enum array', () => {
      const enumValues = ['active', 'inactive', 'pending'];
      const result = generator.generateFromEnum(enumValues, mockContext);
      
      expect(enumValues).toContain(result);
    });

    it('should handle single value enum', () => {
      const enumValues = ['only-value'];
      const result = generator.generateFromEnum(enumValues, mockContext);
      
      expect(result).toBe('only-value');
    });

    it('should generate different values from large enum', () => {
      const enumValues = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
      const results = Array.from({ length: 10 }, () => 
        generator.generateFromEnum(enumValues, mockContext)
      );

      // Should have some variety
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('validation', () => {
    it('should validate generated values', () => {
      const value = 'test string';
      const isValid = generator.validate(value);
      expect(isValid).toBe(true);
    });

    it('should validate with length constraints', () => {
      const value = 'test';
      
      // Valid length
      expect(generator.validate(value, { minLength: 3, maxLength: 10 })).toBe(true);
      
      // Too short
      expect(generator.validate(value, { minLength: 10 })).toBe(false);
      
      // Too long
      expect(generator.validate(value, { maxLength: 2 })).toBe(false);
    });

    it('should validate with regex constraints', () => {
      const emailValue = 'test@example.com';
      const emailRegex = /@/;
      
      expect(generator.validate(emailValue, { match: emailRegex })).toBe(true);
      
      const nonEmailValue = 'not-an-email';
      expect(generator.validate(nonEmailValue, { match: emailRegex })).toBe(false);
    });

    it('should validate with enum constraints', () => {
      const value = 'active';
      const enumValues = ['active', 'inactive'];
      
      expect(generator.validate(value, { enum: enumValues })).toBe(true);
      
      const invalidValue = 'unknown';
      expect(generator.validate(invalidValue, { enum: enumValues })).toBe(false);
    });

    it('should validate required constraint', () => {
      expect(generator.validate('value', { required: true })).toBe(true);
      expect(generator.validate('', { required: true })).toBe(true); // Empty string is valid
      expect(generator.validate(null, { required: true })).toBe(false);
      expect(generator.validate(undefined, { required: true })).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = { priority: 20, enabled: false };
      generator.updateConfig(newConfig);
      
      expect(generator.getPriority()).toBe(20);
      expect(generator.isEnabled()).toBe(false);
    });

    it('should enable/disable generator', () => {
      generator.setEnabled(false);
      expect(generator.isEnabled()).toBe(false);
      
      generator.setEnabled(true);
      expect(generator.isEnabled()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', async () => {
      // Mock a context that might cause errors
      const errorContext = {
        ...mockContext,
        fieldPath: 'errorField'
      };

      // Should not throw, but generate a fallback value
      const result = await generator.generate(errorContext);
      expect(typeof result).toBe('string');
    });
  });
});