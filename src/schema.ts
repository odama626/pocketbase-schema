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

interface TextField extends BaseField {
  type: 'text';
  autogeneratePattern: string;
  max: number;
  min: number;
  pattern: string;
  primaryKey: boolean;
  required: boolean;
}

interface NumberField extends BaseField {
  type: 'number';
  max: number | null;
  min: number | null;
  onlyInt: boolean;
  required: boolean;
}

interface PasswordField extends BaseField {
  type: 'password';
  cost: number;
  max: number;
  min: number;
  pattern: string;
  required: boolean;
}

interface BooleanField extends BaseField {
  type: 'bool';
  required: boolean;
}

interface AutodateField extends BaseField {
  type: 'autodate';
  onCreate: boolean;
  onUpdate: boolean;
}

interface EmailField extends BaseField {
  type: 'email';
  exceptDomains: any;
  onlyDomains: any;
  required: boolean;
}

interface FileField extends BaseField {
  type: 'file';
  maxSelect: number;
  maxSize: number;
  mimeTypes: string[] | null;
  protected: boolean;
  required: boolean;
  thumbs: any;
}

interface DateField extends BaseField {
  type: 'date';
  max: string;
  min: string;
  required: boolean;
}

interface RelationField extends BaseField {
  type: 'relation';
  cascadeDelete: boolean;
  collectionId: string;
  maxSelect: number;
  minSelect: number;
  required: boolean;
}

interface SelectField extends BaseField {
  type: 'select';
  values: string[];
  maxSelect: number;
  required: boolean;
}

interface JSONField extends BaseField {
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

type Field =
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
  | JSONField;

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

  const staticTypes = `export enum Collections {
  ${Array.from(map)
    .map(([_, entry]) => `${entry.interface.name} =  "${entry.collection.name}",`)
    .join('\n')}
}

export interface CollectionRecord {
  collectionId: string;
  collectionName: string;
}
`;

  let output = [staticTypes, ...collectionInterfaces, ...appendedTypes].join('\n\n');
  return format(output, { parser: 'typescript' });
}

export function generateCollectionInterface(id: string, api: API) {
  let collection = api.map.get(id);
  let output = `export interface ${collection.interface.name} extends CollectionRecord {
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

const FIELD_TYPES: Record<FieldType, (field: unknown, api: FieldAPI) => string> = {
  text(field: TextField) {
    return 'string';
  },
  number() {
    return 'number';
  },
  email(field: EmailField) {
    return 'string';
  },
  autodate(field: AutodateField) {
    return 'string';
  },
  date(field: DateField) {
    return 'string';
  },
  password(field: PasswordField) {
    return 'string';
  },
  bool() {
    return 'boolean';
  },
  json(field: JSONField) {
    return 'string';
  },
  relation(field: RelationField, api) {
    const referencedCollection = api.map.get((field as RelationField).collectionId);
    return ['string', !field.required && ' | undefined'].filter(Boolean).join('');
  },
  file(field: FileField) {
    let optional = !field.required;
    let multiple = field.maxSelect > 1;
    return [`string`, multiple && '[]', optional && ' | undefined'].filter(Boolean).join('');
  },
  select(field: SelectField, api) {
    let enumName = api.collection.interface.name + pascalCase(field.name);
    api.appendTypeDefinition(
      `export enum ${enumName}  { ${field.values.map(value => `${pascalCase(value)} = "${value}"`).join(', ')} }`,
    );
    return enumName;
  },
};
