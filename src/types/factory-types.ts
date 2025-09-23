/**
 * Factory type definitions for explicit type specification
 *
 * This module defines all available factory types that users can specify
 * in their schema options to control data generation.
 */

/**
 * Available factory types for string fields
 */
export type StringFactoryType =
  | 'email'          // Email addresses
  | 'phone'          // Phone numbers
  | 'name'           // Full person names
  | 'firstName'      // First names only
  | 'lastName'       // Last names only
  | 'username'       // Usernames
  | 'password'       // Passwords
  | 'url'            // URLs
  | 'slug'           // URL slugs
  | 'address'        // Street addresses
  | 'city'           // City names
  | 'country'        // Country names
  | 'company'        // Company names
  | 'description'    // Text descriptions
  | 'title'          // Titles/headlines
  | 'uuid'           // UUID strings
  | 'random';        // Random strings

/**
 * Available factory types for number fields
 */
export type NumberFactoryType =
  | 'price'          // Monetary values
  | 'age'            // Human ages
  | 'rating'         // Rating scores (1-5)
  | 'percentage'     // Percentages (0-100)
  | 'quantity'       // Product quantities
  | 'year'           // Years
  | 'random';        // Random numbers

/**
 * Available factory types for date fields
 */
export type DateFactoryType =
  | 'timestamp'      // Current timestamps
  | 'birthdate'      // Birth dates
  | 'futuredate'     // Future dates
  | 'pastdate'       // Past dates
  | 'random';        // Random dates

/**
 * Available factory types for boolean fields
 */
export type BooleanFactoryType =
  | 'active'         // Usually true (80%)
  | 'verified'       // Often true (70%)
  | 'premium'        // Rarely true (25%)
  | 'public'         // Usually true (85%)
  | 'random';        // 50/50 chance

/**
 * Available factory types for array fields
 */
export type ArrayFactoryType =
  | 'tags'           // Technology/category tags
  | 'skills'         // Professional skills
  | 'emails'         // Array of emails
  | 'phones'         // Array of phone numbers
  | 'names'          // Array of names
  | 'categories'     // Product categories
  | 'languages'      // Language codes
  | 'urls'           // Array of URLs
  | 'random';        // Mixed array content

/**
 * Available factory types for object/special fields
 */
export type SpecialFactoryType =
  | 'objectid'       // MongoDB ObjectIds
  | 'uuid'           // UUIDs
  | 'random';        // Type-appropriate random data

/**
 * Union of all factory types
 */
export type FactoryType =
  | StringFactoryType
  | NumberFactoryType
  | DateFactoryType
  | BooleanFactoryType
  | ArrayFactoryType
  | SpecialFactoryType;

/**
 * Factory type categories for organization
 */
export enum FactoryTypeCategory {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  SPECIAL = 'special'
}

/**
 * Factory type metadata for each type
 */
export interface FactoryTypeInfo {
  type: FactoryType;
  category: FactoryTypeCategory;
  description: string;
  examples: any[];
  supportedFieldTypes: string[];
}

/**
 * Complete factory type registry with metadata
 */
export const FACTORY_TYPE_REGISTRY: Record<FactoryType, FactoryTypeInfo> = {
  // String types
  email: {
    type: 'email',
    category: FactoryTypeCategory.STRING,
    description: 'Email addresses',
    examples: ['user@example.com', 'john.doe@company.org'],
    supportedFieldTypes: ['String']
  },
  phone: {
    type: 'phone',
    category: FactoryTypeCategory.STRING,
    description: 'Phone numbers',
    examples: ['+1-555-123-4567', '(555) 987-6543'],
    supportedFieldTypes: ['String']
  },
  name: {
    type: 'name',
    category: FactoryTypeCategory.STRING,
    description: 'Full person names',
    examples: ['John Doe', 'Jane Smith'],
    supportedFieldTypes: ['String']
  },
  firstName: {
    type: 'firstName',
    category: FactoryTypeCategory.STRING,
    description: 'First names only',
    examples: ['John', 'Jane', 'Michael'],
    supportedFieldTypes: ['String']
  },
  lastName: {
    type: 'lastName',
    category: FactoryTypeCategory.STRING,
    description: 'Last names only',
    examples: ['Doe', 'Smith', 'Johnson'],
    supportedFieldTypes: ['String']
  },
  username: {
    type: 'username',
    category: FactoryTypeCategory.STRING,
    description: 'Usernames',
    examples: ['john_doe', 'user123', 'jane.smith'],
    supportedFieldTypes: ['String']
  },
  password: {
    type: 'password',
    category: FactoryTypeCategory.STRING,
    description: 'Passwords',
    examples: ['Str0ng!Pass', 'MyP@ssw0rd123'],
    supportedFieldTypes: ['String']
  },
  url: {
    type: 'url',
    category: FactoryTypeCategory.STRING,
    description: 'URLs',
    examples: ['https://example.com', 'https://www.company.org'],
    supportedFieldTypes: ['String']
  },
  slug: {
    type: 'slug',
    category: FactoryTypeCategory.STRING,
    description: 'URL slugs',
    examples: ['my-blog-post', 'product-name'],
    supportedFieldTypes: ['String']
  },
  address: {
    type: 'address',
    category: FactoryTypeCategory.STRING,
    description: 'Street addresses',
    examples: ['123 Main St', '456 Oak Avenue'],
    supportedFieldTypes: ['String']
  },
  city: {
    type: 'city',
    category: FactoryTypeCategory.STRING,
    description: 'City names',
    examples: ['New York', 'Los Angeles', 'Chicago'],
    supportedFieldTypes: ['String']
  },
  country: {
    type: 'country',
    category: FactoryTypeCategory.STRING,
    description: 'Country names',
    examples: ['United States', 'Canada', 'United Kingdom'],
    supportedFieldTypes: ['String']
  },
  company: {
    type: 'company',
    category: FactoryTypeCategory.STRING,
    description: 'Company names',
    examples: ['Tech Corp', 'Global Industries', 'Innovate LLC'],
    supportedFieldTypes: ['String']
  },
  description: {
    type: 'description',
    category: FactoryTypeCategory.STRING,
    description: 'Text descriptions',
    examples: ['Lorem ipsum dolor sit amet...', 'A comprehensive solution for...'],
    supportedFieldTypes: ['String']
  },
  title: {
    type: 'title',
    category: FactoryTypeCategory.STRING,
    description: 'Titles/headlines',
    examples: ['Amazing Product Launch', 'Breaking News Today'],
    supportedFieldTypes: ['String']
  },
  uuid: {
    type: 'uuid',
    category: FactoryTypeCategory.SPECIAL,
    description: 'UUID strings',
    examples: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
    supportedFieldTypes: ['String', 'UUID']
  },

  // Number types
  price: {
    type: 'price',
    category: FactoryTypeCategory.NUMBER,
    description: 'Monetary values',
    examples: ['19.99', '1299.00', '5.50'],
    supportedFieldTypes: ['Number', 'Decimal128']
  },
  age: {
    type: 'age',
    category: FactoryTypeCategory.NUMBER,
    description: 'Human ages',
    examples: ['25', '34', '67'],
    supportedFieldTypes: ['Number']
  },
  rating: {
    type: 'rating',
    category: FactoryTypeCategory.NUMBER,
    description: 'Rating scores (1-5)',
    examples: ['4.5', '3.8', '5.0'],
    supportedFieldTypes: ['Number']
  },
  percentage: {
    type: 'percentage',
    category: FactoryTypeCategory.NUMBER,
    description: 'Percentages (0-100)',
    examples: ['75', '23.5', '100'],
    supportedFieldTypes: ['Number']
  },
  quantity: {
    type: 'quantity',
    category: FactoryTypeCategory.NUMBER,
    description: 'Product quantities',
    examples: ['10', '250', '1'],
    supportedFieldTypes: ['Number']
  },
  year: {
    type: 'year',
    category: FactoryTypeCategory.NUMBER,
    description: 'Years',
    examples: ['2023', '1995', '2024'],
    supportedFieldTypes: ['Number']
  },

  // Date types
  timestamp: {
    type: 'timestamp',
    category: FactoryTypeCategory.DATE,
    description: 'Current timestamps',
    examples: ['2024-01-15T10:30:00Z'],
    supportedFieldTypes: ['Date']
  },
  birthdate: {
    type: 'birthdate',
    category: FactoryTypeCategory.DATE,
    description: 'Birth dates',
    examples: ['1990-05-15', '1985-12-03'],
    supportedFieldTypes: ['Date']
  },
  futuredate: {
    type: 'futuredate',
    category: FactoryTypeCategory.DATE,
    description: 'Future dates',
    examples: ['2025-06-20', '2024-12-31'],
    supportedFieldTypes: ['Date']
  },
  pastdate: {
    type: 'pastdate',
    category: FactoryTypeCategory.DATE,
    description: 'Past dates',
    examples: ['2023-01-10', '2022-08-15'],
    supportedFieldTypes: ['Date']
  },

  // Boolean types
  active: {
    type: 'active',
    category: FactoryTypeCategory.BOOLEAN,
    description: 'Usually true (80%)',
    examples: ['true', 'false'],
    supportedFieldTypes: ['Boolean']
  },
  verified: {
    type: 'verified',
    category: FactoryTypeCategory.BOOLEAN,
    description: 'Often true (70%)',
    examples: ['true', 'false'],
    supportedFieldTypes: ['Boolean']
  },
  premium: {
    type: 'premium',
    category: FactoryTypeCategory.BOOLEAN,
    description: 'Rarely true (25%)',
    examples: ['true', 'false'],
    supportedFieldTypes: ['Boolean']
  },
  public: {
    type: 'public',
    category: FactoryTypeCategory.BOOLEAN,
    description: 'Usually true (85%)',
    examples: ['true', 'false'],
    supportedFieldTypes: ['Boolean']
  },

  // Array types
  tags: {
    type: 'tags',
    category: FactoryTypeCategory.ARRAY,
    description: 'Technology/category tags',
    examples: [['javascript', 'nodejs'], ['react', 'typescript']],
    supportedFieldTypes: ['Array']
  },
  skills: {
    type: 'skills',
    category: FactoryTypeCategory.ARRAY,
    description: 'Professional skills',
    examples: [['Frontend Development', 'React'], ['Backend Development', 'Node.js']],
    supportedFieldTypes: ['Array']
  },
  emails: {
    type: 'emails',
    category: FactoryTypeCategory.ARRAY,
    description: 'Array of emails',
    examples: [['user@example.com', 'admin@company.org']],
    supportedFieldTypes: ['Array']
  },
  phones: {
    type: 'phones',
    category: FactoryTypeCategory.ARRAY,
    description: 'Array of phone numbers',
    examples: [['555-123-4567', '555-987-6543']],
    supportedFieldTypes: ['Array']
  },
  names: {
    type: 'names',
    category: FactoryTypeCategory.ARRAY,
    description: 'Array of names',
    examples: [['John Doe', 'Jane Smith']],
    supportedFieldTypes: ['Array']
  },
  categories: {
    type: 'categories',
    category: FactoryTypeCategory.ARRAY,
    description: 'Product categories',
    examples: [['Electronics', 'Computers'], ['Clothing', 'Accessories']],
    supportedFieldTypes: ['Array']
  },
  languages: {
    type: 'languages',
    category: FactoryTypeCategory.ARRAY,
    description: 'Language codes',
    examples: [['en', 'es', 'fr'], ['de', 'it']],
    supportedFieldTypes: ['Array']
  },
  urls: {
    type: 'urls',
    category: FactoryTypeCategory.ARRAY,
    description: 'Array of URLs',
    examples: [['https://example.com', 'https://company.org']],
    supportedFieldTypes: ['Array']
  },

  // Special types
  objectid: {
    type: 'objectid',
    category: FactoryTypeCategory.SPECIAL,
    description: 'MongoDB ObjectIds',
    examples: ['507f1f77bcf86cd799439011'],
    supportedFieldTypes: ['ObjectId']
  },

  // Random types (catch-all for each category)
  random: {
    type: 'random',
    category: FactoryTypeCategory.SPECIAL,
    description: 'Type-appropriate random data',
    examples: ['Varies by field type'],
    supportedFieldTypes: ['String', 'Number', 'Date', 'Boolean', 'Array', 'Mixed']
  }
};

/**
 * Get factory type info by type
 */
export function getFactoryTypeInfo(factoryType: FactoryType): FactoryTypeInfo | undefined {
  return FACTORY_TYPE_REGISTRY[factoryType];
}

/**
 * Get all factory types for a specific category
 */
export function getFactoryTypesByCategory(category: FactoryTypeCategory): FactoryType[] {
  return Object.values(FACTORY_TYPE_REGISTRY)
    .filter(info => info.category === category)
    .map(info => info.type);
}

/**
 * Check if a factory type is valid for a field type
 */
export function isFactoryTypeValidForField(factoryType: FactoryType, fieldType: string): boolean {
  const info = getFactoryTypeInfo(factoryType);
  return info ? info.supportedFieldTypes.includes(fieldType) : false;
}