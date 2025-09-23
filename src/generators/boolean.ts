/**
 * Boolean type generators for mongoose-test-factory
 *
 * Generates data for Boolean fields with intelligent defaults based on field names.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { FieldType, ValidationConstraints } from "../types/common";
import { GenerationContext } from "../types/common";

/**
 * Boolean generator that generates true/false values with smart defaults
 *
 * This generator analyzes field names to provide contextually appropriate
 * boolean values with realistic distributions.
 */
export class BooleanGenerator extends AbstractBaseGenerator<boolean> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  /**
   * Check if this generator can handle the field type
   */
  canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    return fieldType === FieldType.BOOLEAN;
  }

  /**
   * Generate boolean data
   */
  async generate(context: GenerationContext): Promise<boolean> {
    const fieldName = context.fieldPath;

    // Generate based on field name patterns with realistic distributions
    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Active/enabled fields - usually true (80% chance)
      if (lowerFieldName.includes('active') || lowerFieldName.includes('enabled') ||
          lowerFieldName.includes('visible') || lowerFieldName.includes('published')) {
        return faker.datatype.boolean({ probability: 0.8 });
      }

      // Verified/confirmed fields - moderately true (70% chance)
      if (lowerFieldName.includes('verified') || lowerFieldName.includes('confirmed') ||
          lowerFieldName.includes('approved') || lowerFieldName.includes('validated')) {
        return faker.datatype.boolean({ probability: 0.7 });
      }

      // Premium/paid features - less common (25% chance)
      if (lowerFieldName.includes('premium') || lowerFieldName.includes('paid') ||
          lowerFieldName.includes('pro') || lowerFieldName.includes('vip')) {
        return faker.datatype.boolean({ probability: 0.25 });
      }

      // Admin/staff privileges - rare (10% chance)
      if (lowerFieldName.includes('admin') || lowerFieldName.includes('staff') ||
          lowerFieldName.includes('moderator') || lowerFieldName.includes('superuser')) {
        return faker.datatype.boolean({ probability: 0.1 });
      }

      // Notification preferences - often true (75% chance)
      if (lowerFieldName.includes('notification') || lowerFieldName.includes('alert') ||
          lowerFieldName.includes('email') || lowerFieldName.includes('sms')) {
        return faker.datatype.boolean({ probability: 0.75 });
      }

      // Privacy settings - mixed (50% chance)
      if (lowerFieldName.includes('private') || lowerFieldName.includes('hidden') ||
          lowerFieldName.includes('secret') || lowerFieldName.includes('confidential')) {
        return faker.datatype.boolean({ probability: 0.5 });
      }

      // Public/open settings - usually true (85% chance)
      if (lowerFieldName.includes('public') || lowerFieldName.includes('open') ||
          lowerFieldName.includes('searchable') || lowerFieldName.includes('discoverable')) {
        return faker.datatype.boolean({ probability: 0.85 });
      }

      // Deleted/banned/blocked - usually false (15% chance)
      if (lowerFieldName.includes('deleted') || lowerFieldName.includes('banned') ||
          lowerFieldName.includes('blocked') || lowerFieldName.includes('suspended')) {
        return faker.datatype.boolean({ probability: 0.15 });
      }

      // Featured/highlighted - less common (30% chance)
      if (lowerFieldName.includes('featured') || lowerFieldName.includes('highlighted') ||
          lowerFieldName.includes('promoted') || lowerFieldName.includes('sticky')) {
        return faker.datatype.boolean({ probability: 0.3 });
      }

      // Terms/agreements - usually true (90% chance)
      if (lowerFieldName.includes('terms') || lowerFieldName.includes('agreement') ||
          lowerFieldName.includes('consent') || lowerFieldName.includes('accepted')) {
        return faker.datatype.boolean({ probability: 0.9 });
      }

      // Beta/experimental features - mixed (40% chance)
      if (lowerFieldName.includes('beta') || lowerFieldName.includes('experimental') ||
          lowerFieldName.includes('preview') || lowerFieldName.includes('testing')) {
        return faker.datatype.boolean({ probability: 0.4 });
      }

      // Online/available status - usually true (80% chance)
      if (lowerFieldName.includes('online') || lowerFieldName.includes('available') ||
          lowerFieldName.includes('connected') || lowerFieldName.includes('status')) {
        return faker.datatype.boolean({ probability: 0.8 });
      }
    }

    // Default: 50/50 chance
    return faker.datatype.boolean();
  }

  /**
   * Validate generated value
   */
  override validate(value: boolean, constraints?: ValidationConstraints): boolean {
    // Boolean fields accept any boolean value
    return typeof value === 'boolean';
  }
}