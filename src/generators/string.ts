/**
 * String Generator for mongoose-test-factory
 *
 * Generates realistic string values with pattern recognition,
 * faker.js integration, and intelligent semantic analysis.
 */

import { faker } from "@faker-js/faker";
import { AbstractBaseGenerator } from "./base";
import { StringGenerator } from "../types/generator";
import {
  FieldType,
  GenerationContext,
  ValidationConstraints,
} from "../types/common";

/**
 * String generator implementation
 */
export class MongooseStringGenerator
  extends AbstractBaseGenerator<string>
  implements StringGenerator
{
  private emailPatterns = [
    /^(email|e_mail|emailaddress|email_address)$/i,
    /^.*email.*$/i,
  ];

  private namePatterns = [
    /^(name|title|label)$/i,
    /^(firstName|first_name|lastname|last_name|fullname|full_name)$/i,
    /^.*name$/i,
  ];

  private urlPatterns = [/^(url|website|site|link|homepage)$/i, /^.*url$/i];

  private phonePatterns = [
    /^(phone|telephone|tel|mobile|cell)$/i,
    /^(phoneNumber|phone_number)$/i,
  ];

  private addressPatterns = [
    /^(address|street|city|state|country|zip|postal)$/i,
    /^.*address$/i,
  ];

  private descriptionPatterns = [
    /^(description|desc|content|text|message|comment|body)$/i,
    /^.*description$/i,
  ];

  constructor() {
    super({
      priority: 10,
      enabled: true,
      fieldTypes: [FieldType.STRING],
      options: {
        minLength: 1,
        maxLength: 255,
        enableFaker: true,
        locale: "en",
      },
    });
  }

  /**
   * Check if this generator can handle the field type
   */
  canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    return fieldType === FieldType.STRING;
  }

  /**
   * Generate string value
   */
  async generate(context: GenerationContext): Promise<string> {
    const fieldName = context.fieldPath;
    const constraints = this.getConstraintsFromContext(context);

    // Try pattern-based generation first
    const patternValue = this.generateByPattern(fieldName, context);
    if (patternValue) {
      return this.applyConstraints(patternValue, constraints);
    }

    // Try semantic-based generation
    const semanticValue = this.generateBySemantic(fieldName, context);
    if (semanticValue) {
      return this.applyConstraints(semanticValue, constraints);
    }

    // Try enum values
    if (constraints?.enum && constraints.enum.length > 0) {
      return this.generateFromEnum(constraints.enum, context);
    }

    // Try regex pattern
    if (constraints?.match) {
      return this.generateByRegex(constraints.match, context);
    }

    // Fallback to generic string
    return this.generateGenericString(constraints);
  }

  /**
   * Generate string based on field name patterns
   */
  generateByPattern(fieldName: string, context: GenerationContext): string {
    const lowerFieldName = fieldName.toLowerCase();

    // Email patterns
    if (this.matchesAnyPattern(lowerFieldName, this.emailPatterns)) {
      return faker.internet.email();
    }

    // Name patterns
    if (this.matchesAnyPattern(lowerFieldName, this.namePatterns)) {
      if (lowerFieldName.includes("first")) {
        return faker.person.firstName();
      }
      if (lowerFieldName.includes("last")) {
        return faker.person.lastName();
      }
      return faker.person.fullName();
    }

    // URL patterns
    if (this.matchesAnyPattern(lowerFieldName, this.urlPatterns)) {
      return faker.internet.url();
    }

    // Phone patterns
    if (this.matchesAnyPattern(lowerFieldName, this.phonePatterns)) {
      return faker.phone.number();
    }

    // Address patterns
    if (this.matchesAnyPattern(lowerFieldName, this.addressPatterns)) {
      if (lowerFieldName.includes("street")) {
        return faker.location.streetAddress();
      }
      if (lowerFieldName.includes("city")) {
        return faker.location.city();
      }
      if (lowerFieldName.includes("state")) {
        return faker.location.state();
      }
      if (lowerFieldName.includes("country")) {
        return faker.location.country();
      }
      if (lowerFieldName.includes("zip") || lowerFieldName.includes("postal")) {
        return faker.location.zipCode();
      }
      return faker.location.streetAddress();
    }

    // Description patterns
    if (this.matchesAnyPattern(lowerFieldName, this.descriptionPatterns)) {
      return faker.lorem.paragraph();
    }

    return "";
  }

  /**
   * Generate string matching regex
   */
  generateByRegex(pattern: RegExp, context: GenerationContext): string {
    // Simple regex pattern matching
    // In a full implementation, would use a proper regex reverse generator
    const patternStr = pattern.toString();

    if (patternStr.includes("@")) {
      return faker.internet.email();
    }

    if (patternStr.includes("\\d")) {
      return faker.phone.number();
    }

    if (patternStr.includes("http")) {
      return faker.internet.url();
    }

    // Fallback to lorem text
    return faker.lorem.word();
  }

  /**
   * Generate from enum values
   */
  generateFromEnum(values: string[], context: GenerationContext): string {
    return this.getRandomElement(values);
  }

  /**
   * Generate string based on semantic analysis
   */
  private generateBySemantic(
    fieldName: string,
    context: GenerationContext
  ): string | null {
    const semantic = this.inferSemantic(fieldName);

    switch (semantic) {
      case "username":
        return faker.internet.userName();
      case "password":
        return faker.internet.password();
      case "slug":
        return faker.helpers.slugify(faker.lorem.words(3));
      case "uuid":
        return faker.string.uuid();
      case "color":
        return faker.color.human();
      case "company":
        return faker.company.name();
      case "product":
        return faker.commerce.productName();
      case "category":
        return faker.commerce.department();
      case "tag":
        return faker.lorem.word();
      case "status":
        return this.getRandomElement([
          "active",
          "inactive",
          "pending",
          "archived",
        ]);
      case "currency":
        return faker.finance.currencyCode();
      case "language":
        return faker.location.countryCode();
      case "timezone":
        return faker.location.timeZone();
      default:
        return null;
    }
  }

  /**
   * Infer semantic meaning from field name
   */
  private inferSemantic(fieldName: string): string | null {
    const lower = fieldName.toLowerCase();

    if (lower.includes("username") || lower.includes("user_name"))
      return "username";
    if (lower.includes("password") || lower.includes("pwd")) return "password";
    if (lower.includes("slug")) return "slug";
    if (lower.includes("uuid") || lower.includes("guid")) return "uuid";
    if (lower.includes("color") || lower.includes("colour")) return "color";
    if (lower.includes("company") || lower.includes("organization"))
      return "company";
    if (lower.includes("product")) return "product";
    if (lower.includes("category") || lower.includes("type")) return "category";
    if (lower.includes("tag")) return "tag";
    if (lower.includes("status") || lower.includes("state")) return "status";
    if (lower.includes("currency")) return "currency";
    if (lower.includes("language") || lower.includes("lang")) return "language";
    if (lower.includes("timezone") || lower.includes("tz")) return "timezone";

    return null;
  }

  /**
   * Generate generic string
   */
  private generateGenericString(constraints?: ValidationConstraints): string {
    const minLength = constraints?.minLength ?? this.getOption("minLength", 5);
    const maxLength = constraints?.maxLength ?? this.getOption("maxLength", 50);

    const targetLength = this.getRandomNumber(minLength, maxLength);

    // Generate words that approximately match target length
    let result = "";
    while (result.length < targetLength) {
      const word = faker.lorem.word();
      if (result.length + word.length + 1 <= targetLength) {
        result += (result ? " " : "") + word;
      } else {
        break;
      }
    }

    // Ensure minimum length
    if (result.length < minLength) {
      result = faker.lorem.words(Math.ceil(minLength / 5));
    }

    // Truncate if too long
    if (result.length > maxLength) {
      result = result.substring(0, maxLength);
    }

    return result;
  }

  /**
   * Apply string constraints to generated value
   */
  private applyConstraints(
    value: string,
    constraints?: ValidationConstraints
  ): string {
    if (!constraints) {
      return value;
    }

    let result = value;

    // Apply length constraints
    if (constraints.minLength && result.length < constraints.minLength) {
      // Pad with lorem words
      while (result.length < constraints.minLength) {
        result += " " + faker.lorem.word();
      }
    }

    if (constraints.maxLength && result.length > constraints.maxLength) {
      result = result.substring(0, constraints.maxLength);
    }

    // Validate against regex
    if (constraints.match && !constraints.match.test(result)) {
      // Try to generate a new value that matches
      try {
        result = this.generateByRegex(
          constraints.match,
          {} as GenerationContext
        );
      } catch (error) {
        // Fallback to original value
      }
    }

    return result;
  }

  /**
   * Check if field name matches any of the given patterns
   */
  private matchesAnyPattern(fieldName: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Get constraints from generation context
   */
  private getConstraintsFromContext(
    context: GenerationContext
  ): ValidationConstraints | undefined {
    // This would extract constraints from the context
    // Implementation depends on how context is structured
    return undefined;
  }

  /**
   * Type-specific validation for strings
   */
  protected override validateTypeSpecific(
    value: string,
    constraints: ValidationConstraints
  ): boolean {
    // Length validation
    if (constraints.minLength && value.length < constraints.minLength) {
      return false;
    }

    if (constraints.maxLength && value.length > constraints.maxLength) {
      return false;
    }

    // Regex validation
    if (constraints.match && !constraints.match.test(value)) {
      return false;
    }

    return true;
  }
}

/**
 * Specialized generators for specific string types
 */
export class EmailStringGenerator extends MongooseStringGenerator {
  constructor() {
    super();
    this.priority = 50; // Higher priority for email fields
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    return (
      fieldType === FieldType.STRING &&
      (constraints?.match?.toString().includes("@") || false) // Would check field name patterns in full implementation
    );
  }

  override async generate(context: GenerationContext): Promise<string> {
    return faker.internet.email();
  }
}

export class PasswordStringGenerator extends MongooseStringGenerator {
  constructor() {
    super();
    this.priority = 50;
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.STRING &&
      fieldName.toLowerCase().includes("password")
    );
  }

  override async generate(context: GenerationContext): Promise<string> {
    return faker.internet.password({
      length: 12,
      memorable: false,
      pattern: /[A-Za-z0-9!@#$%^&*]/,
    });
  }
}

export class SlugStringGenerator extends MongooseStringGenerator {
  constructor() {
    super();
    this.priority = 40;
  }

  override canHandle(
    fieldType: FieldType,
    constraints?: ValidationConstraints
  ): boolean {
    const fieldName = ""; // Would get from context
    return (
      fieldType === FieldType.STRING && fieldName.toLowerCase().includes("slug")
    );
  }

  override async generate(context: GenerationContext): Promise<string> {
    return faker.helpers.slugify(faker.lorem.words(3));
  }
}
