import { cosmiconfigSync } from 'cosmiconfig';
import Pocketbase from 'pocketbase';
import * as fs from 'node:fs/promises';
import { cwd, exit } from 'node:process';
import * as path from 'node:path';
import generateSchema from './config';
import { Collection, generateTypes } from './schema';

const explorer = cosmiconfigSync('pocketbase-schema');

const result = explorer.search();

if (!result) {
  console.error(`config not found`);
  exit(1);
}

const config = generateSchema(result.config);

async function main() {
  const pb = new Pocketbase(config.url);

  await pb.collection('_superusers').authWithPassword(config.email, config.password);
  const pageResults = await pb.collections.getFullList<Collection>();

  const types = await generateTypes(pageResults);

  await ensureDirExists(config.schema.outputPath);
  await fs.writeFile(config.schema.outputPath, JSON.stringify(pageResults, null, 2));
  console.log(`generated schema at ${path.relative(cwd(), config.schema.outputPath)}`);

  await ensureDirExists(config.types.outputPath);
  await fs.writeFile(config.types.outputPath, types);
  console.log(`added types for schema to ${path.relative(cwd(), config.types.outputPath)}`);
}

main();

async function ensureDirExists(filepath: string) {
  const dir = path.dirname(filepath);
  return fs.mkdir(dir, { recursive: true });
}
