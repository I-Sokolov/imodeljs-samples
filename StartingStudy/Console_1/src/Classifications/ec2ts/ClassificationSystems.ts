import { ClassRegistry, Schema, Schemas } from "@bentley/imodeljs-backend";
import * as elementsModule from "./ClassificationSystemsElements";

export class ClassificationSystems extends Schema {
  public static get schemaName(): string { return "ClassificationSystems"; }

  public static registerSchema() {
    if (!Schemas.getRegisteredSchema(ClassificationSystems.name))
      Schemas.registerSchema(ClassificationSystems);
  }

  protected constructor() {
    super();
    ClassRegistry.registerModule(elementsModule, ClassificationSystems);
  }
}

