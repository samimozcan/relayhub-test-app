# Folder Reader App

A Node.js TypeScript application that reads a directory and logs the names of all folders (subdirectories) within it.

## Features

- Reads any directory path (current directory by default)
- Lists all subdirectories/folders within the specified path
- Provides detailed console output with folder count
- Includes proper error handling for invalid paths
- Built with TypeScript for type safety

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode (with TypeScript)
```bash
# Run with default directory (current directory)
npm run dev

# Run with specific directory path
npm run dev /path/to/directory
```

### Production Mode (compiled JavaScript)
```bash
# Build the project first
npm run build

# Run with default directory (current directory)
npm start

# Run with specific directory path
npm start /path/to/directory
```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run the compiled JavaScript version
- `npm run clean` - Remove the dist directory

## Project Structure

```
├── src/
│   └── index.ts          # Main application file
├── dist/                 # Compiled JavaScript (after build)
├── .github/
│   └── copilot-instructions.md
├── package.json
├── tsconfig.json
└── README.md
```

## Example Output

```
Reading folders from: /Users/username/Documents
Folders found in "/Users/username/Documents":
==================================================
1. Projects
2. Photos
3. Downloads
4. Archive
==================================================
Total folders: 4
```

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- ES2020 target
- Strict type checking
- Source maps for debugging
- Declaration files generation

## Error Handling

The application includes comprehensive error handling for:
- Non-existent directories
- Permission errors
- File system access issues
- Invalid paths
