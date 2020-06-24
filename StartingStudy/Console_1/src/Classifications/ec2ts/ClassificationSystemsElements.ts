import { DefinitionElement, IModelDb, GroupInformationElement } from "@bentley/imodeljs-backend";
import { ClassificationProps, ClassificationGroupProps, ClassificationSystemProps, ClassificationTableProps } from "./ClassificationSystemsElementProps";
import { ClassificationSystems } from "./ClassificationSystems"

/**
 * An element that represents a single entry in a classification system
 */
export class Classification extends DefinitionElement implements ClassificationProps {
  public static get className(): string { return "Classification"; }
  public static get classFullName(): string { return ClassificationSystems.schemaName + ":" + Classification.className; }

  public constructor (props: ClassificationProps, iModel: IModelDb) {
    super(props, iModel);
      
  }

  description? : string;
}

/**
 * ClassificationGroup groups classifications
 */
export class ClassificationGroup extends GroupInformationElement implements ClassificationGroupProps {
  public static get className(): string { return "ClassificationGroup"; }
  public static get classFullName(): string { return ClassificationSystems.schemaName + ":" + ClassificationGroup.className; }

  public constructor (props: ClassificationGroupProps, iModel: IModelDb) {
    super(props, iModel);
  }
  
  description?: string;
}

/**
 * An element used to represent a classification system
 */
export class ClassificationSystem extends DefinitionElement implements ClassificationSystemProps {
  public static get className(): string { return "ClassificationSystem"; }
  public static get classFullName(): string { return ClassificationSystems.schemaName + ":" + ClassificationSystem.className; }

  public constructor (props: ClassificationSystemProps, iModel: IModelDb) {
    super(props, iModel);
  }

  source?: string;
  edition?: string;
  location?: string;
  description?: string;

}

/**
 * An element used to represent a table in a classification system
 */
export class ClassificationTable extends DefinitionElement implements ClassificationTableProps {
  public static get className(): string { return "ClassificationTable"; }
  public static get classFullName(): string { return ClassificationSystems.schemaName + ":" + ClassificationTable.className; }

  public constructor (props: ClassificationTableProps, iModel: IModelDb) {
    super(props, iModel);
  }

  description?: string;
}
