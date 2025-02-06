import { expect, test } from 'vitest';
import { collections } from '../raw-output';
import { API, generateCollectionInterface, generateTypes, getCollectionMap } from './schema';

test('getCollectionMap', () => {
  expect(Array.from(getCollectionMap(collections).keys())).toMatchSnapshot();
});

test('generateCollectionInterface', () => {
  const collectionMap = getCollectionMap(collections);

  expect(
    generateCollectionInterface(collections[0].id, { map: collectionMap } as API),
  ).toMatchSnapshot();
});

test('generateTypes', async () => {
  expect(await generateTypes(collections)).toMatchSnapshot();
});
