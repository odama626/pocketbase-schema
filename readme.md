# PocketBase Schema Generator

`@odama626/pocketbase-schema` is an open-source utility to generate TypeScript typings from [PocketBase](https://pocketbase.io/) schemas, enabling type-safe development with PocketBase APIs.

## Features

- Automatically generate TypeScript definitions from your PocketBase schema.
- Supports modular usage as a CLI tool or a Node.js module.
- Compatible with modern JavaScript and TypeScript projects.
- Local-first and flexible configuration using [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).

## Installation

Install the package using npm:

```bash
npm install @odama626/pocketbase-schema --save-dev
```

Or with yarn:

```bash
yarn add @odama626/pocketbase-schema --dev
```

Or with pnpm:

```bash
pnpm add @odama626/pocketbase-schema --save-dev
```

## Usage

### CLI

You can use the tool directly from the command line to generate typings from a PocketBase instance:

```bash
pocketbase-schema
```

### Configuration

The package supports configuration using a configuration file. Supported file formats include `.json`, `.yaml`, `.js`, or `.ts`. The default configuration file name is `.pocketbase-schema.config.ts`

**Be sure to add your configuration file to `.gitignore` to prevent leaking credentials.**

Example `.pocketbase-schema.config.ts`:

```javascript
export default {
  email: 'admin@example.com', // Admin email for authentication
  password: 'yourpassword', // Admin password for authentication
  url: 'http://127.0.0.1:8090', // URL of the PocketBase instance
  schema: {
    outputPath: 'src/lib/pb.schema.json', // Path to save schema JSON
  },
  collections: {
    outputPath: 'src/lib/collections.json', // Path to save collections JSON
  },
  types: {
    outputPath: 'src/lib/pb.types.ts', // Path to save TypeScript definitions
  },
};
```

### Required Configuration Fields

- `email`: Admin email for authentication.
- `password`: Admin password for authentication.
- `url`: The URL of the PocketBase instance.

### Optional Configuration Fields

- `schema.outputPath`: Path to save the generated schema JSON.
- `collections.outputPath`: Path to save the generated collections JSON.
- `types.outputPath`: Path to save the generated TypeScript definitions.

## Development

### Scripts

- `pnpm run build`: Build the package using `microbundle`.
- `pnpm run dev`: Watch for changes and rebuild automatically.

### Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to enhance the functionality.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- [PocketBase](https://pocketbase.io/)
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
- [json-to-ts](https://github.com/MariusAlch/json-to-ts)

---

For more details and updates, visit the [repository](https://github.com/odama626/pocketbase-schema).
