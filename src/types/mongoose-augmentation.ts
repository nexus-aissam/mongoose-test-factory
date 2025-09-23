import { FactoryBuilder, BaseDocument } from "./common";

// Extend Mongoose types with factory method
declare global {
  namespace mongoose {
    interface Model<T> {
      /**
       * Create a factory for generating test data for this model
       * @param count - Number of documents to generate (optional)
       * @returns A factory builder instance
       */
      factory(count?: number): FactoryBuilder<T & BaseDocument>;
    }

    interface Document {
      /**
       * Create a factory for generating test data for this document type
       * @param count - Number of documents to generate (optional)
       * @returns A factory builder instance
       */
      factory(count?: number): FactoryBuilder<BaseDocument>;
    }
  }
}

export {};
