/**
 * Array type generators for mongoose-test-factory
 *
 * Generates data for Array fields which can contain multiple values of any type.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { FieldType, ValidationConstraints } from "../types/common";
import { GenerationContext } from "../types/common";

/**
 * Base Array generator that generates arrays of various data types
 *
 * Array fields in Mongoose can contain multiple values, so this generator
 * creates realistic arrays with appropriate content based on field names and constraints.
 */
export class ArrayGenerator extends AbstractBaseGenerator<any[]> {
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
    _constraints?: ValidationConstraints
  ): boolean {
    return fieldType === FieldType.ARRAY;
  }

  /**
   * Generate array data
   */
  async generate(context: GenerationContext): Promise<any[]> {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // If there are specific constraints, respect them
    if (constraints?.enum) {
      return faker.helpers.arrayElements(constraints.enum, {
        min: 1,
        max: Math.min(constraints.enum.length, 5)
      });
    }

    // Generate based on field name patterns
    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Tags/categories patterns
      if (lowerFieldName.includes('tag') || lowerFieldName.includes('label')) {
        return this.generateTags();
      }

      // Skills/abilities patterns
      if (lowerFieldName.includes('skill') || lowerFieldName.includes('abilit')) {
        return this.generateSkills();
      }

      // Email/phone arrays
      if (lowerFieldName.includes('email')) {
        return this.generateEmails();
      }

      if (lowerFieldName.includes('phone')) {
        return this.generatePhones();
      }

      // URL/link arrays
      if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
        return this.generateUrls();
      }

      // Name arrays (authors, contributors, etc.)
      if (lowerFieldName.includes('name') || lowerFieldName.includes('author') ||
          lowerFieldName.includes('contributor')) {
        return this.generateNames();
      }

      // Category/type arrays
      if (lowerFieldName.includes('categor') || lowerFieldName.includes('type')) {
        return this.generateCategories();
      }

      // Role/permission arrays
      if (lowerFieldName.includes('role') || lowerFieldName.includes('permission')) {
        return this.generateRoles();
      }

      // Language arrays
      if (lowerFieldName.includes('language') || lowerFieldName.includes('locale')) {
        return this.generateLanguages();
      }

      // Image/file arrays
      if (lowerFieldName.includes('image') || lowerFieldName.includes('file') ||
          lowerFieldName.includes('photo')) {
        return this.generateImageUrls();
      }

      // Comment/review arrays
      if (lowerFieldName.includes('comment') || lowerFieldName.includes('review')) {
        return this.generateComments();
      }

      // Number arrays (scores, ratings, etc.)
      if (lowerFieldName.includes('score') || lowerFieldName.includes('rating') ||
          lowerFieldName.includes('price')) {
        return this.generateNumbers();
      }
    }

    // Default: generate a mixed array
    return this.generateMixedArray();
  }

  /**
   * Generate tag array
   */
  private generateTags(): string[] {
    const tags = [
      'javascript', 'typescript', 'nodejs', 'react', 'vue', 'angular',
      'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'git', 'github', 'gitlab', 'jenkins',
      'testing', 'ci-cd', 'devops', 'microservices', 'api', 'rest',
      'graphql', 'websocket', 'security', 'performance', 'optimization'
    ];
    return faker.helpers.arrayElements(tags, { min: 1, max: 5 });
  }

  /**
   * Generate skills array
   */
  private generateSkills(): string[] {
    const skills = [
      'Frontend Development', 'Backend Development', 'Full Stack Development',
      'Mobile Development', 'DevOps', 'Data Analysis', 'Machine Learning',
      'UI/UX Design', 'Project Management', 'Team Leadership',
      'Problem Solving', 'Communication', 'Agile Methodologies',
      'Database Design', 'System Architecture', 'API Development',
      'Testing', 'Code Review', 'Mentoring', 'Technical Writing'
    ];
    return faker.helpers.arrayElements(skills, { min: 2, max: 6 });
  }

  /**
   * Generate email array
   */
  private generateEmails(): string[] {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, () => faker.internet.email());
  }

  /**
   * Generate phone array
   */
  private generatePhones(): string[] {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, () => faker.phone.number());
  }

  /**
   * Generate URL array
   */
  private generateUrls(): string[] {
    const count = faker.number.int({ min: 1, max: 4 });
    return Array.from({ length: count }, () => faker.internet.url());
  }

  /**
   * Generate names array
   */
  private generateNames(): string[] {
    const count = faker.number.int({ min: 1, max: 5 });
    return Array.from({ length: count }, () => faker.person.fullName());
  }

  /**
   * Generate categories array
   */
  private generateCategories(): string[] {
    const categories = [
      'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports',
      'Automotive', 'Health & Beauty', 'Toys & Games', 'Music',
      'Movies & TV', 'Food & Beverage', 'Travel', 'Education',
      'Business', 'Technology', 'Arts & Crafts', 'Pet Supplies'
    ];
    return faker.helpers.arrayElements(categories, { min: 1, max: 4 });
  }

  /**
   * Generate roles array
   */
  private generateRoles(): string[] {
    const roles = [
      'admin', 'user', 'moderator', 'editor', 'viewer', 'contributor',
      'manager', 'developer', 'designer', 'analyst', 'support'
    ];
    return faker.helpers.arrayElements(roles, { min: 1, max: 3 });
  }

  /**
   * Generate languages array
   */
  private generateLanguages(): string[] {
    const languages = [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ];
    return faker.helpers.arrayElements(languages, { min: 1, max: 4 });
  }

  /**
   * Generate image URLs array
   */
  private generateImageUrls(): string[] {
    const count = faker.number.int({ min: 1, max: 6 });
    return Array.from({ length: count }, () =>
      faker.image.url({ width: 800, height: 600 })
    );
  }

  /**
   * Generate comments array
   */
  private generateComments(): any[] {
    const count = faker.number.int({ min: 0, max: 5 });
    return Array.from({ length: count }, () => ({
      author: faker.person.fullName(),
      text: faker.lorem.sentences({ min: 1, max: 3 }),
      date: faker.date.recent(),
      rating: faker.number.int({ min: 1, max: 5 })
    }));
  }

  /**
   * Generate numbers array
   */
  private generateNumbers(): number[] {
    const count = faker.number.int({ min: 1, max: 8 });
    return Array.from({ length: count }, () =>
      faker.number.float({ min: 0, max: 100, fractionDigits: 2 })
    );
  }

  /**
   * Generate a mixed array with various data types
   */
  private generateMixedArray(): any[] {
    const count = faker.number.int({ min: 1, max: 6 });
    const types = ['string', 'number', 'boolean', 'object'];

    return Array.from({ length: count }, () => {
      const type = faker.helpers.arrayElement(types);

      switch (type) {
        case 'string':
          return faker.lorem.word();
        case 'number':
          return faker.number.int({ min: 1, max: 1000 });
        case 'boolean':
          return faker.datatype.boolean();
        case 'object':
          return {
            id: faker.string.uuid(),
            name: faker.lorem.words({ min: 1, max: 3 }),
            value: faker.number.int({ min: 1, max: 100 })
          };
        default:
          return faker.lorem.word();
      }
    });
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
  override validate(value: any[], constraints?: ValidationConstraints): boolean {
    if (!Array.isArray(value)) {
      return false;
    }

    // Check array length constraints
    if (constraints?.minLength !== undefined && value.length < constraints.minLength) {
      return false;
    }

    if (constraints?.maxLength !== undefined && value.length > constraints.maxLength) {
      return false;
    }

    // Check enum constraints - all values must be from enum
    if (constraints?.enum) {
      return value.every(item => constraints.enum!.includes(item));
    }

    return true;
  }
}