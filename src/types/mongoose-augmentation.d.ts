import { FactoryBuilder } from "./common";
import { Document, Model } from "mongoose";

declare module "mongoose" {
  interface Model<T = any> {
    factory(count?: number): FactoryBuilder<T>;
  }

  interface Document {
    factory(count?: number): FactoryBuilder<this>;
  }
}

// Fallback for CommonJS/older versions
declare module "mongoose" {
  namespace mongoose {
    interface Model<T = any> {
      factory(count?: number): FactoryBuilder<T>;
    }

    interface Document {
      factory(count?: number): FactoryBuilder<any>;
    }
  }
}
