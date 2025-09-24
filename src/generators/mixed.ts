/**
 * Mixed type generators for mongoose-test-factory
 *
 * Generates data for Mixed/Schema.Types.Mixed fields which can contain any value type.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { FieldType, ValidationConstraints } from "../types/common";
import { GenerationContext } from "../types/common";

/**
 * Base Mixed generator that generates various data types for Mixed fields
 *
 * Mixed fields in Mongoose can contain any type of data, so this generator
 * creates diverse, realistic mixed content including objects, arrays, primitives.
 */
export class MixedGenerator extends AbstractBaseGenerator<any> {
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
    return fieldType === FieldType.MIXED;
  }

  /**
   * Generate mixed data
   */
  async generate(context: GenerationContext): Promise<any> {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // If there are specific constraints, respect them
    if (constraints?.enum) {
      return faker.helpers.arrayElement(constraints.enum);
    }

    // Generate based on field name patterns
    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Common metadata patterns
      if (lowerFieldName.includes('metadata') || lowerFieldName.includes('meta')) {
        return this.generateMetadata();
      }

      // Settings/config patterns
      if (lowerFieldName.includes('settings') || lowerFieldName.includes('config')) {
        return this.generateSettings();
      }

      // Attributes/properties patterns
      if (lowerFieldName.includes('attributes') || lowerFieldName.includes('props')) {
        return this.generateAttributes();
      }

      // Content patterns
      if (lowerFieldName.includes('content') || lowerFieldName.includes('data')) {
        return this.generateContent();
      }
    }

    // Default: generate a random mixed value
    return this.generateRandomMixed();
  }

  /**
   * Generate mixed data synchronously
   */
  override generateSync(context: GenerationContext): any {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // If there are specific constraints, respect them
    if (constraints?.enum) {
      return faker.helpers.arrayElement(constraints.enum);
    }

    // Generate based on field name patterns
    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Common metadata patterns
      if (lowerFieldName.includes('metadata') || lowerFieldName.includes('meta')) {
        return this.generateMetadata();
      }

      // Settings/config patterns
      if (lowerFieldName.includes('settings') || lowerFieldName.includes('config')) {
        return this.generateSettings();
      }

      // Attributes/properties patterns
      if (lowerFieldName.includes('attributes') || lowerFieldName.includes('props')) {
        return this.generateAttributes();
      }

      // Content patterns
      if (lowerFieldName.includes('content') || lowerFieldName.includes('data')) {
        return this.generateContent();
      }
    }

    // Default: generate a random mixed value
    return this.generateRandomMixed();
  }

  /**
   * Generate metadata object
   */
  private generateMetadata(): any {
    return {
      version: faker.system.semver(),
      createdBy: faker.person.fullName(),
      tags: faker.helpers.arrayElements(
        ['important', 'draft', 'published', 'archived', 'featured'],
        { min: 1, max: 3 }
      ),
      lastModified: faker.date.recent(),
      source: faker.helpers.arrayElement(['user', 'system', 'import', 'api'])
    };
  }

  /**
   * Generate settings object
   */
  private generateSettings(): any {
    return {
      notifications: faker.datatype.boolean(),
      theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
      language: faker.helpers.arrayElement(['en', 'fr', 'es', 'de', 'ja']),
      timezone: faker.location.timeZone(),
      privacy: {
        public: faker.datatype.boolean(),
        searchable: faker.datatype.boolean(),
        showEmail: faker.datatype.boolean()
      }
    };
  }

  /**
   * Generate attributes object
   */
  private generateAttributes(): any {
    const attributes: any = {};
    const attrCount = faker.number.int({ min: 2, max: 6 });

    for (let i = 0; i < attrCount; i++) {
      const key = faker.lorem.word();
      const valueType = faker.helpers.arrayElement(['string', 'number', 'boolean', 'array']);

      switch (valueType) {
        case 'string':
          attributes[key] = faker.lorem.words({ min: 1, max: 3 });
          break;
        case 'number':
          attributes[key] = faker.number.int({ min: 1, max: 1000 });
          break;
        case 'boolean':
          attributes[key] = faker.datatype.boolean();
          break;
        case 'array':
          attributes[key] = faker.helpers.arrayElements(
            faker.lorem.words(10).split(' '),
            { min: 1, max: 4 }
          );
          break;
      }
    }

    return attributes;
  }

  /**
   * Generate content object
   */
  private generateContent(): any {
    const contentType = faker.helpers.arrayElement(['text', 'rich', 'structured']);

    switch (contentType) {
      case 'text':
        return {
          type: 'text',
          value: faker.lorem.paragraphs({ min: 1, max: 3 })
        };
      case 'rich':
        return {
          type: 'rich',
          html: `<p>${faker.lorem.paragraph()}</p>`,
          plain: faker.lorem.paragraph(),
          wordCount: faker.number.int({ min: 50, max: 300 })
        };
      case 'structured':
        return {
          type: 'structured',
          sections: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () => ({
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraph(),
            order: faker.number.int({ min: 1, max: 10 })
          }))
        };
      default:
        return faker.lorem.paragraph();
    }
  }

  /**
   * Generate a random mixed value
   */
  private generateRandomMixed(): any {
    const types = ['string', 'number', 'boolean', 'object', 'array', 'null'];
    const selectedType = faker.helpers.arrayElement(types);

    switch (selectedType) {
      case 'string':
        return faker.lorem.sentence();
      case 'number':
        return faker.number.float({ min: -1000, max: 1000, fractionDigits: 2 });
      case 'boolean':
        return faker.datatype.boolean();
      case 'object':
        return {
          id: faker.string.uuid(),
          name: faker.lorem.words({ min: 1, max: 3 }),
          value: faker.number.int({ min: 1, max: 100 }),
          active: faker.datatype.boolean()
        };
      case 'array':
        return faker.helpers.arrayElements(
          [
            faker.lorem.word(),
            faker.number.int({ min: 1, max: 100 }),
            faker.datatype.boolean(),
            { key: faker.lorem.word(), value: faker.lorem.word() }
          ],
          { min: 1, max: 4 }
        );
      case 'null':
        return null;
      default:
        return faker.lorem.word();
    }
  }

  /**
   * Get constraints from generation context
   */
  private getConstraintsFromContext(
    _context: GenerationContext
  ): ValidationConstraints | undefined {
    // This would extract constraints from the context
    // Implementation depends on how context is structured
    return undefined;
  }

  /**
   * Validate generated value
   */
  override validate(value: any, constraints?: ValidationConstraints): boolean {
    // Mixed fields accept any value, but check constraints if provided
    if (constraints?.enum) {
      return constraints.enum.includes(value);
    }

    // Mixed fields are always valid unless specifically constrained
    return true;
  }
}