import { DefinitionElementProps, ElementProps } from "@bentley/imodeljs-common";

export interface ClassificationProps extends DefinitionElementProps {
  description?: string;
}

export interface ClassificationGroupProps extends ElementProps {
  description?: string;
}

export interface ClassificationSystemProps extends DefinitionElementProps {
  source?: string;
  edition?: string;
  location?: string;
  description?: string;
}

export interface ClassificationTableProps extends DefinitionElementProps {
  description?: string;
}

