import {
  sqliteTable,
  integer,
  text,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { relations as drizzleRelations } from "drizzle-orm";

// Metadata storage
const tableMetadata = new Map<Function, TableMetadata>();
const columnMetadata = new Map<Function, Map<string, ColumnMetadata>>();
const relationMetadata = new Map<Function, Map<string, RelationMetadata>>();

interface TableMetadata {
  tableName: string;
}

interface ColumnMetadata {
  columnName: string;
  type: "integer" | "text" | "boolean" | "timestamp";
  isPrimaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  defaultValue?: any;
  references?: {
    entity: Function;
    field: string;
  };
}

interface RelationMetadata {
  relationType: "oneToMany" | "manyToOne" | "oneToOne";
  targetEntity: Function;
  mappedBy?: string;
  relationName?: string;
  fields?: string[];
  references?: string[];
}

// Decoradores de tabla
export function Entity(tableName: string) {
  return function (target: Function) {
    tableMetadata.set(target, { tableName });
  };
}

// Decoradores de columna
export function PrimaryKey(options?: { autoIncrement?: boolean }) {
  return function (target: any, propertyKey: string) {
    const columnMap = columnMetadata.get(target.constructor) || new Map();
    const existing = columnMap.get(propertyKey) || ({} as ColumnMetadata);

    columnMap.set(propertyKey, {
      ...existing,
      columnName: toSnakeCase(propertyKey),
      type: "integer",
      isPrimaryKey: true,
      autoIncrement: options?.autoIncrement ?? true,
    });

    columnMetadata.set(target.constructor, columnMap);
  };
}

export function Column(options?: {
  name?: string;
  type?: "integer" | "text" | "boolean" | "timestamp";
  notNull?: boolean;
  default?: any;
}) {
  return function (target: any, propertyKey: string) {
    const columnMap = columnMetadata.get(target.constructor) || new Map();
    const existing = columnMap.get(propertyKey) || ({} as ColumnMetadata);

    columnMap.set(propertyKey, {
      ...existing,
      columnName: options?.name || toSnakeCase(propertyKey),
      type: options?.type || "text",
      notNull: options?.notNull ?? false,
      defaultValue: options?.default,
    });

    columnMetadata.set(target.constructor, columnMap);
  };
}

export function ManyToOne(
  targetEntity: () => Function,
  options?: {
    fieldName?: string;
    onDelete?: "cascade" | "set null";
  }
) {
  return function (target: any, propertyKey: string) {
    const relationMap = relationMetadata.get(target.constructor) || new Map();
    const entity = targetEntity();

    relationMap.set(propertyKey, {
      relationType: "manyToOne",
      targetEntity: entity,
      fields: [options?.fieldName || `${propertyKey}Id`],
      references: ["id"],
    });

    relationMetadata.set(target.constructor, relationMap);

    // También crear la columna FK automáticamente
    const columnMap = columnMetadata.get(target.constructor) || new Map();
    const fkFieldName = options?.fieldName || `${propertyKey}Id`;

    columnMap.set(fkFieldName, {
      columnName: toSnakeCase(fkFieldName),
      type: "integer",
      references: {
        entity,
        field: "id",
      },
    });

    columnMetadata.set(target.constructor, columnMap);
  };
}

export function OneToMany(
  targetEntity: () => Function,
  options?: {
    mappedBy: string;
    relationName?: string;
  }
) {
  return function (target: any, propertyKey: string) {
    const relationMap = relationMetadata.get(target.constructor) || new Map();

    relationMap.set(propertyKey, {
      relationType: "oneToMany",
      targetEntity: targetEntity(),
      mappedBy: options?.mappedBy,
      relationName: options?.relationName,
    });

    relationMetadata.set(target.constructor, relationMap);
  };
}

export function OneToOne(
  targetEntity: () => Function,
  options?: {
    fields?: string[];
    references?: string[];
  }
) {
  return function (target: any, propertyKey: string) {
    const relationMap = relationMetadata.get(target.constructor) || new Map();

    relationMap.set(propertyKey, {
      relationType: "oneToOne",
      targetEntity: targetEntity(),
      fields: options?.fields,
      references: options?.references,
    });

    relationMetadata.set(target.constructor, relationMap);
  };
}

// Utilidad para convertir camelCase a snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Sistema de construcción de esquemas
const builtTables = new Map<Function, any>();
const builtRelations = new Map<Function, any>();

export function buildSchema(entities: Function[]) {
  // Primera pasada: construir todas las tablas
  for (const entity of entities) {
    buildTable(entity);
  }

  // Segunda pasada: construir relaciones
  for (const entity of entities) {
    buildRelations(entity);
  }

  return {
    tables: Object.fromEntries(
      Array.from(builtTables.entries()).map(([entity, table]) => {
        const metadata = tableMetadata.get(entity);
        return [metadata?.tableName || entity.name.toLowerCase(), table];
      })
    ),
    relations: Object.fromEntries(
      Array.from(builtRelations.entries()).map(([entity, relation]) => {
        const metadata = tableMetadata.get(entity);
        return [
          `${metadata?.tableName || entity.name.toLowerCase()}Relations`,
          relation,
        ];
      })
    ),
  };
}

function buildTable(entity: Function) {
  if (builtTables.has(entity)) {
    return builtTables.get(entity);
  }

  const metadata = tableMetadata.get(entity);
  if (!metadata) {
    throw new Error(`No @Entity decorator found on ${entity.name}`);
  }

  const columns = columnMetadata.get(entity) || new Map();
  const columnDefinitions: Record<string, any> = {};

  for (const [fieldName, columnMeta] of columns.entries()) {
    let column: any;

    switch (columnMeta.type) {
      case "integer":
        column = integer(columnMeta.columnName);
        break;
      case "text":
        column = text(columnMeta.columnName);
        break;
      case "boolean":
        column = integer(columnMeta.columnName, { mode: "boolean" });
        break;
      case "timestamp":
        column = integer(columnMeta.columnName, { mode: "timestamp" });
        break;
      default:
        column = text(columnMeta.columnName);
    }

    if (columnMeta.isPrimaryKey) {
      column = column.primaryKey({ autoIncrement: columnMeta.autoIncrement });
    }

    if (columnMeta.notNull) {
      column = column.notNull();
    }

    if (columnMeta.defaultValue !== undefined) {
      column = column.default(columnMeta.defaultValue);
    }

    if (columnMeta.references) {
      const refTable = builtTables.get(columnMeta.references.entity);
      if (refTable) {
        column = column.references(() => refTable.id);
      }
    }

    columnDefinitions[fieldName] = column;
  }

  const table = sqliteTable(metadata.tableName, columnDefinitions);
  builtTables.set(entity, table);

  return table;
}

function buildRelations(entity: Function) {
  const entityRelations = relationMetadata.get(entity);
  if (!entityRelations || entityRelations.size === 0) {
    return null;
  }

  const table = builtTables.get(entity);
  if (!table) {
    throw new Error(`Table not built for ${entity.name}`);
  }

  const relationCallbacks: Record<string, any> = {};

  for (const [fieldName, relationMeta] of entityRelations.entries()) {
    if (relationMeta.relationType === "oneToMany") {
      relationCallbacks[fieldName] = ({ many }: any) => {
        const targetTable = builtTables.get(relationMeta.targetEntity);
        const config: any = {};

        if (relationMeta.relationName) {
          config.relationName = relationMeta.relationName;
        }

        return many(targetTable, config);
      };
    } else if (
      relationMeta.relationType === "manyToOne" ||
      relationMeta.relationType === "oneToOne"
    ) {
      relationCallbacks[fieldName] = ({ one }: any) => {
        const targetTable = builtTables.get(relationMeta.targetEntity);
        const config: any = {};

        if (relationMeta.fields && relationMeta.references) {
          config.fields = relationMeta.fields.map((f: string) => {
            const columns = columnMetadata.get(entity);
            return table[f];
          });
          config.references = relationMeta.references.map(
            (r: string) => targetTable[r]
          );
        }

        if (relationMeta.relationName) {
          config.relationName = relationMeta.relationName;
        }

        return one(targetTable, config);
      };
    }
  }

  const builtRelation = drizzleRelations(table, (helpers: any) => {
    const result: Record<string, any> = {};
    for (const [fieldName, callback] of Object.entries(relationCallbacks)) {
      result[fieldName] = callback(helpers);
    }
    return result;
  });

  builtRelations.set(entity, builtRelation);

  return builtRelation;
}

export function getTable(entity: Function) {
  return builtTables.get(entity);
}

export function getTableMetadata(entity: Function) {
  return tableMetadata.get(entity);
}
