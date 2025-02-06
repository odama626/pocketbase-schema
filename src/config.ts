import { cosmiconfigSync } from 'cosmiconfig';
import { cwd } from 'node:process';
import * as path from 'node:path';
import { defaultsDeep } from 'lodash-es';

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
  customSchemaCallback: CustomConfig | CustomConfigCallback = {} as any,
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
