import { cosmiconfigSync } from 'cosmiconfig';
import Pocketbase from 'pocketbase';
import * as fs from 'node:fs/promises';
import JsonToTs from 'json-to-ts';
import { cwd, exit } from 'node:process';
import * as path from 'node:path';
import { defaultsDeep } from 'lodash-es';

const explorer = cosmiconfigSync('pocketbase-schema');

const result = explorer.search();

if (!result) {
  console.error(`config not found`);
  exit(1);
}

const config = generateSchema(result.config);

function getType(type: string) {
  switch (type) {
    case 'bool':
      return true;
    default:
      return '';
  }
}

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

function pascalCase(text: string): string {
  if (typeof text !== 'string') return text;
  return text.split('_').filter(Boolean).map(capitalize).join('');
}

async function main() {
  const pb = await new Pocketbase(config.url);

  await pb.collection('_superusers').authWithPassword(config.email, config.password);

  const pageResults = await pb.collections.getFullList();

  const schema = pageResults.reduce((result, next) => {
    const { name, fields } = next;

    result[pascalCase(name)] = fields.reduce((result, next) => {
      result[next.name] = getType(next.type);
      return result;
    }, {});
    return result;
  }, {});

  console.dir(pageResults, { depth: 3 });

  const types = JsonToTs(schema).map(type => `export ${type}`);
  types[0] = types[0].replace('RootObject', 'CollectionSchemas');
  types.unshift('');

  await ensureDirExists(config.schema.outputPath);
  await fs.writeFile(config.schema.outputPath, JSON.stringify(pageResults, null, 2));
  console.log(`generated schema at ${path.relative(cwd(), config.schema.outputPath)}`);

  await ensureDirExists(config.types.outputPath);
  await fs.writeFile(config.types.outputPath, types.join('\n\n'));
  console.log(`added types for schema to ${path.relative(cwd(), config.types.outputPath)}`);
}

main();

async function ensureDirExists(filepath: string) {
  const dir = path.dirname(filepath);
  return fs.mkdir(dir, { recursive: true });
}

interface RequiredConfig {
  email: string;
  password: string;
  url: string;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Config extends RequiredConfig {
  schema: {
    outputPath: string;
  };
  types: { outputPath: string };
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type CustomConfig = Expand<DeepPartial<Config> & RequiredConfig>;
type CustomConfigCallback = (defaults: Expand<Omit<Config, keyof RequiredConfig>>) => CustomConfig;

export default function generateSchema(
  customSchemaCallback: CustomConfig | CustomConfigCallback = {} as any
) {
  const DEFAULT_BASE_PATH = 'src/lib';
  const defaultConfig = {
    schema: {
      outputPath: path.join(cwd(), path.join(DEFAULT_BASE_PATH, 'pb.schema.json')),
    },
    types: {
      outputPath: path.join(cwd(), path.join(DEFAULT_BASE_PATH, 'pb.types.ts')),
    },
  };
  let customConfig = customSchemaCallback;
  if (typeof customSchemaCallback === 'function') {
    customConfig = customSchemaCallback(defaultConfig);
  }

  return defaultsDeep({}, customConfig, defaultConfig);
}
