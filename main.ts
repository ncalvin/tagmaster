import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { TagIndexer } from './src/core/TagIndexer';
import { TagMatcher } from './src/core/TagMatcher';
import { TagMasterSettingsTab } from './src/ui/SettingsTab';
import { TagMasterView } from './src/ui/TagMasterView';
import { TAGMASTER_VIEW_TYPE } from './src/constants';
import { DEFAULT_SETTINGS, type TagMasterSettings } from './src/types';

export default class TagMasterPlugin extends Plugin {
    settings: TagMasterSettings;
    indexer: TagIndexer;
    matcher: TagMatcher;

    async onload() {
        console.log('Loading TagMaster Plugin');

        await this.loadSettings();

        this.indexer = new TagIndexer(
            this.app.vault,
            this.app.metadataCache,
            this.settings
        );

        this.matcher = new TagMatcher(this.settings);

        // Register view
        this.registerView(
            TAGMASTER_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new TagMasterView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('tags', 'Open TagMaster', () => {
            this.activateView();
        });

        // Register commands
        this.addCommand({
            id: 'scan-vault',
            name: 'Scan vault for tags',
            callback: async () => {
                await this.indexer.indexVault((current, total) => {
                    console.log(`Indexing: ${current}/${total}`);
                });
                console.log(`TagMaster: Indexed ${this.indexer.getTagCount()} tags`);
            }
        });

        this.addCommand({
            id: 'open-tagmaster',
            name: 'Open TagMaster panel',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'find-similar-tags',
            name: 'Find similar tags',
            callback: async () => {
                const catalog = this.indexer.getCatalog();
                if (catalog.size === 0) {
                    new Notice('No tags found. Run "Scan vault for tags" first.');
                    return;
                }

                const suggestions = this.matcher.findSimilarTags(catalog);
                if (suggestions.length === 0) {
                    new Notice('No similar tags found.');
                    return;
                }

                new Notice(`Found ${suggestions.length} similar tag pairs`);
                console.log('TagMaster: Similar tags found:', suggestions);
                
                // TODO: Show suggestions in a modal
                // For now, log to console
                suggestions.forEach(suggestion => {
                    console.log(`${suggestion.sourceTag} → ${suggestion.targetTag} (${Math.round(suggestion.similarity * 100)}%)`);
                    console.log(`  Reason: ${suggestion.reason}`);
                    console.log(`  Affects ${suggestion.affectedFiles.length} files`);
                });
            }
        });

        // Settings tab
        this.addSettingTab(new TagMasterSettingsTab(this.app, this));

        // File event listeners for incremental indexing
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.indexer.indexFile(file);
                }
            })
        );

        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.indexer.removeFileFromIndex(file.path);
                }
            })
        );

        // Initial scan
        await this.indexer.indexVault();
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(TAGMASTER_VIEW_TYPE);

        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({
                type: TAGMASTER_VIEW_TYPE,
                active: true
            });
            this.app.workspace.revealLeaf(leaf);
        }
    }

    onunload() {
        console.log('Unloading TagMaster Plugin');
        this.app.workspace.detachLeavesOfType(TAGMASTER_VIEW_TYPE);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
