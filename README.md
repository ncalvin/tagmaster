# TagMaster

Intelligent tag management plugin for Obsidian with similarity detection, merge suggestions, batch operations, and undo support.

## Features

- **Automatic Tag Indexing**: Scans your entire vault and catalogs all tags (frontmatter and inline)
- **Tag Catalog**: View all tags with occurrence counts in a dedicated sidebar panel
- **Smart Normalization**: Configure rules for case folding, diacritics removal, and punctuation handling
- **Incremental Updates**: Automatically re-indexes files as you edit them
- **Configurable Thresholds**: Fine-tune similarity detection algorithms
- **Safe Mode**: Preview changes before applying them (coming soon)
- **Undo Support**: Revert tag operations with backup snapshots (coming soon)

## Installation

### From GitHub Releases

1. Download the latest release from [GitHub Releases](https://github.com/ncalvin/tagmaster/releases)
2. Extract the `tagmaster` folder from the zip file
3. Copy the folder to your vault's plugins folder: `<vault>/.obsidian/plugins/`
4. Reload Obsidian
5. Enable the plugin in Settings → Community plugins

### Manual Installation

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder: `<vault>/.obsidian/plugins/tagmaster/`
5. Reload Obsidian
6. Enable the plugin in Settings → Community plugins

## Usage

### Opening TagMaster

- Click the tags icon in the left ribbon, or
- Use Command Palette: `TagMaster: Open TagMaster panel`

### Scanning Your Vault

The plugin automatically scans your vault on startup. To manually trigger a scan:

- Click the "Scan Vault" button in the TagMaster panel, or
- Use Command Palette: `TagMaster: Scan vault for tags`

### Settings

Configure TagMaster in Settings → TagMaster:

#### Normalization Rules
- **Case folding**: Convert tags to lowercase for comparison
- **Remove diacritics**: Strip accents (é → e)
- **Underscores to dashes**: Treat `_` as `-`
- **Strip punctuation**: Remove special characters

#### Similarity Thresholds
- **Levenshtein threshold**: String distance similarity (0-1)
- **Jaro-Winkler threshold**: Alternative similarity metric (0-1)

#### Preview Settings
- **Max preview examples**: Number of examples shown in previews

#### Safety
- **Safe mode**: Require dry-run before applying changes
- **Enable undo**: Keep backup snapshots
- **Max backups**: Maximum number of snapshots to retain

## Roadmap

- [x] Tag indexing and catalog
- [x] Basic UI and settings
- [ ] Similarity detection algorithms
- [ ] Tag merge operations
- [ ] Dry-run preview
- [ ] Backup and undo system
- [ ] Tag hierarchy management
- [ ] Batch renaming
- [ ] Conflict detection

## Development

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch mode for development
npm run dev
```

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/ncalvin/tagmaster/issues) on GitHub.

## License

MIT License - see LICENSE file for details.

## Credits

Developed by Calvin (@ncalvin)
