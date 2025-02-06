import { camelCase, pascalCase } from './utils/string';
import { format } from 'prettier';

export interface Collection {
  id: string;
  name: string;
  type: string;
  listRule: string | null;
  viewRule: string | null;
  createRule: string | null;
  deleteRule: string | null;
  updateRule: string | null;
  fields: Field[];
  indexes: string[];
  created: string;
  updated: string;
  system: boolean;
  [x: string]: any;
}

interface BaseField {
  hidden: boolean;
  name: string;
  presentable: boolean;
  type: string;
  system: boolean;
  id: string;
}

interface TextField {
  type: 'text';
  autogeneratePattern: string;
  max: number;
  min: number;
  pattern: string;
  primaryKey: boolean;
  required: boolean;
}

interface NumberField {
  type: 'number';
  max: number | null;
  min: number | null;
  onlyInt: boolean;
  required: boolean;
}

interface PasswordField {
  type: 'password';
  cost: number;
  max: number;
  min: number;
  pattern: string;
  required: boolean;
}

interface BooleanField {
  type: 'bool';
  required: boolean;
}

interface AutodateField {
  type: 'autodate';
  onCreate: boolean;
  onUpdate: boolean;
}

interface EmailField {
  type: 'email';
  exceptDomains: any;
  onlyDomains: any;
  required: boolean;
}

interface FileField {
  type: 'file';
  maxSelect: number;
  maxSize: number;
  mimeTypes: string[] | null;
  protected: boolean;
  required: boolean;
  thumbs: any;
}

interface DateField {
  type: 'date';
  max: string;
  min: string;
  required: boolean;
}

interface RelationField {
  type: 'relation';
  cascadeDelete: boolean;
  collectionId: string;
  maxSelect: number;
  minSelect: number;
  required: boolean;
}

interface SelectField {
  type: 'select';
  values: string[];
  maxSelect: number;
  required: boolean;
}

interface JSONField {
  type: 'json';
  maxSize: number;
  required: boolean;
}

export enum FieldType {
  Text = 'text',
  Number = 'number',
  Password = 'password',
  Boolean = 'bool',
  Autodate = 'autodate',
  Email = 'email',
  File = 'file',
  Date = 'date',
  Relation = 'relation',
  Select = 'select',
  JSON = 'json',
}

type Field = BaseField &
  (
    | TextField
    | NumberField
    | PasswordField
    | BooleanField
    | AutodateField
    | DateField
    | EmailField
    | FileField
    | RelationField
    | SelectField
    | JSONField
  );

interface CollectionInterface {
  name: string;
}

interface CollectionMapValue {
  collection: Collection;
  interface: CollectionInterface;
}

export interface API {
  map: Map<string, CollectionMapValue>;
  appendTypeDefinition(definition: string): void;
}

export interface FieldAPI extends API {
  collection: CollectionMapValue;
}

export function getCollectionMap(collections: Collection[]) {
  let collectionMap = new Map<string, CollectionMapValue>();
  collections.forEach(collection => {
    const collectionInterface = {
      name: pascalCase(collection.name),
    };
    collectionMap.set(collection.id, { collection, interface: collectionInterface });
  });
  return collectionMap;
}

export function generateTypes(collections: Collection[]) {
  let map = getCollectionMap(collections);
  let appendedTypes: string[] = [];

  function appendTypeDefinition(definition: string) {
    appendedTypes.push(definition);
  }

  let api: API = {
    map,
    appendTypeDefinition,
  };

  let collectionInterfaces = collections.map(collection =>
    generateCollectionInterface(collection.id, api),
  );

  const collectionsInterface = `export enum Collections {
  ${Array.from(map)
    .map(([_, entry]) => `${entry.interface.name} =  "${entry.collection.name}",`)
    .join('\n')}
}\n`;

  let output = [collectionsInterface, ...collectionInterfaces, ...appendedTypes].join('\n\n');
  return format(output, { parser: 'typescript' });
}

export function generateCollectionInterface(id: string, api: API) {
  let collection = api.map.get(id);
  let output = `export interface ${collection.interface.name} {
  ${collection.collection.fields.map(field => generateFieldType(field, { ...api, collection })).join('\n')}
}`;
  return output;
}

export function generateFieldType(field: Field, api: FieldAPI) {
  let name = camelCase(field.name);
  if (!FIELD_TYPES[field.type]) throw new Error(`${field.type} not found`);
  let type = FIELD_TYPES[field.type](field, api);
  return `${name}: ${type};`;
}

const FIELD_TYPES: Record<FieldType, (field: Field, api: FieldAPI) => string> = {
  text() {
    return 'string';
  },
  number() {
    return 'number';
  },
  email() {
    return 'string';
  },
  autodate() {
    return 'string';
  },
  date() {
    return 'string';
  },
  password() {
    return 'string';
  },
  bool() {
    return 'boolean';
  },
  json() {
    return 'string';
  },
  relation(field, api) {
    const referencedCollection = api.map.get((field as RelationField).collectionId);
    return 'string'; //referencedCollection.interface.name;
  },
  file() {
    return 'string';
  },
  select(field, api) {
    let selectField = field as SelectField;
    let enumName = api.collection.interface.name + pascalCase(field.name);
    api.appendTypeDefinition(
      `enum ${enumName}  { ${selectField.values.map(value => `${pascalCase(value)} = "${value}"`).join(', ')} }`,
    );
    return enumName;
  },
};
