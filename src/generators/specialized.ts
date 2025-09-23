/**
 * Specialized type generators for mongoose-test-factory
 *
 * Generates data for specialized MongoDB field types like Buffer, Map, UUID, etc.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { FieldType, ValidationConstraints } from "../types/common";
import { GenerationContext } from "../types/common";

/**
 * Object/Subdocument generator for nested objects
 */
export class ObjectGenerator extends AbstractBaseGenerator<any> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.OBJECT;
  }

  async generate(context: GenerationContext): Promise<any> {
    const fieldName = context.fieldPath;

    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Address objects
      if (lowerFieldName.includes('address')) {
        return {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        };
      }

      // Contact objects
      if (lowerFieldName.includes('contact')) {
        return {
          email: faker.internet.email(),
          phone: faker.phone.number(),
          website: faker.internet.url()
        };
      }

      // Profile objects
      if (lowerFieldName.includes('profile')) {
        return {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          avatar: faker.image.avatar(),
          bio: faker.lorem.paragraph()
        };
      }

      // Settings objects
      if (lowerFieldName.includes('settings') || lowerFieldName.includes('config')) {
        return {
          theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
          notifications: faker.datatype.boolean(),
          language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
          timezone: faker.location.timeZone()
        };
      }
    }

    // Default generic object
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words({ min: 1, max: 3 }),
      value: faker.lorem.sentence(),
      createdAt: faker.date.recent()
    };
  }

  override validate(value: any, constraints?: ValidationConstraints): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

/**
 * Buffer generator for binary data
 */
export class BufferGenerator extends AbstractBaseGenerator<Buffer> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.BUFFER;
  }

  async generate(context: GenerationContext): Promise<Buffer> {
    const fieldName = context.fieldPath;

    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Image buffers
      if (lowerFieldName.includes('image') || lowerFieldName.includes('photo')) {
        // Generate fake image data (JPEG header + random data)
        const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
        const randomData = Buffer.from(faker.string.alphanumeric(100), 'ascii');
        return Buffer.concat([jpegHeader, randomData]);
      }

      // File buffers
      if (lowerFieldName.includes('file') || lowerFieldName.includes('document')) {
        return Buffer.from(faker.lorem.paragraphs(3), 'utf8');
      }
    }

    // Default: random binary data
    const size = faker.number.int({ min: 10, max: 500 });
    return Buffer.from(faker.string.alphanumeric(size), 'ascii');
  }

  override validate(value: Buffer, constraints?: ValidationConstraints): boolean {
    return Buffer.isBuffer(value);
  }
}

/**
 * Map generator for key-value pairs
 */
export class MapGenerator extends AbstractBaseGenerator<Map<string, any>> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.MAP;
  }

  async generate(context: GenerationContext): Promise<Map<string, any>> {
    const fieldName = context.fieldPath;
    const map = new Map<string, any>();

    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Settings/preferences maps
      if (lowerFieldName.includes('settings') || lowerFieldName.includes('preferences')) {
        map.set('theme', faker.helpers.arrayElement(['light', 'dark']));
        map.set('language', faker.helpers.arrayElement(['en', 'es', 'fr']));
        map.set('notifications', faker.datatype.boolean());
        return map;
      }

      // Metadata maps
      if (lowerFieldName.includes('metadata') || lowerFieldName.includes('meta')) {
        map.set('version', faker.system.semver());
        map.set('author', faker.person.fullName());
        map.set('created', faker.date.recent().toISOString());
        return map;
      }

      // Attributes/properties maps
      if (lowerFieldName.includes('attributes') || lowerFieldName.includes('properties')) {
        map.set('color', faker.color.human());
        map.set('size', faker.helpers.arrayElement(['small', 'medium', 'large']));
        map.set('weight', faker.number.float({ min: 0.1, max: 10 }));
        return map;
      }
    }

    // Default: generic key-value pairs
    const keyCount = faker.number.int({ min: 2, max: 6 });
    for (let i = 0; i < keyCount; i++) {
      const key = faker.lorem.word();
      const valueType = faker.helpers.arrayElement(['string', 'number', 'boolean']);

      switch (valueType) {
        case 'string':
          map.set(key, faker.lorem.words({ min: 1, max: 3 }));
          break;
        case 'number':
          map.set(key, faker.number.float({ min: 0, max: 1000 }));
          break;
        case 'boolean':
          map.set(key, faker.datatype.boolean());
          break;
      }
    }

    return map;
  }

  override validate(value: Map<string, any>, constraints?: ValidationConstraints): boolean {
    return value instanceof Map;
  }
}

/**
 * UUID generator for universally unique identifiers
 */
export class UuidGenerator extends AbstractBaseGenerator<string> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.UUID;
  }

  async generate(context: GenerationContext): Promise<string> {
    return faker.string.uuid();
  }

  override validate(value: string, constraints?: ValidationConstraints): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}

/**
 * Decimal128 generator for high-precision decimal numbers
 */
export class Decimal128Generator extends AbstractBaseGenerator<string> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.DECIMAL128;
  }

  async generate(context: GenerationContext): Promise<string> {
    const fieldName = context.fieldPath;

    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // Financial/price fields - higher precision
      if (lowerFieldName.includes('price') || lowerFieldName.includes('amount') ||
          lowerFieldName.includes('cost') || lowerFieldName.includes('fee')) {
        return faker.number.float({ min: 0.01, max: 99999.99, fractionDigits: 4 }).toString();
      }

      // Scientific/measurement fields - very high precision
      if (lowerFieldName.includes('measurement') || lowerFieldName.includes('scientific') ||
          lowerFieldName.includes('precision') || lowerFieldName.includes('calculation')) {
        return faker.number.float({ min: 0.000001, max: 9999999.999999, fractionDigits: 8 }).toString();
      }
    }

    // Default: moderate precision decimal
    return faker.number.float({ min: 0.01, max: 9999.99, fractionDigits: 6 }).toString();
  }

  override validate(value: string, constraints?: ValidationConstraints): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // Check if it's a valid decimal number
    const decimalRegex = /^-?\d+(\.\d+)?$/;
    return decimalRegex.test(value);
  }
}

/**
 * BigInt generator for large integer values
 */
export class BigIntGenerator extends AbstractBaseGenerator<bigint> {
  constructor() {
    super({
      priority: 50,
      enabled: true,
    });
  }

  canHandle(fieldType: FieldType, constraints?: ValidationConstraints): boolean {
    return fieldType === FieldType.BIGINT;
  }

  async generate(context: GenerationContext): Promise<bigint> {
    const fieldName = context.fieldPath;

    if (fieldName) {
      const lowerFieldName = fieldName.toLowerCase();

      // ID fields - very large numbers
      if (lowerFieldName.includes('id') || lowerFieldName.includes('identifier')) {
        return BigInt(faker.number.int({ min: 1000000000000, max: 9999999999999999 }));
      }

      // Timestamp fields - milliseconds since epoch
      if (lowerFieldName.includes('timestamp') || lowerFieldName.includes('time')) {
        return BigInt(Date.now() + faker.number.int({ min: -86400000, max: 86400000 }));
      }

      // Size/bytes fields
      if (lowerFieldName.includes('size') || lowerFieldName.includes('bytes') ||
          lowerFieldName.includes('length')) {
        return BigInt(faker.number.int({ min: 1024, max: 10737418240 })); // 1KB to 10GB
      }
    }

    // Default: random large integer
    return BigInt(faker.number.int({ min: 1000000, max: Number.MAX_SAFE_INTEGER }));
  }

  override validate(value: bigint, constraints?: ValidationConstraints): boolean {
    return typeof value === 'bigint';
  }
}