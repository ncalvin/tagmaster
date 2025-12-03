import { Plugin, WorkspaceLeaf, TFile } from 'obsidian';
import { TagIndexer } from './src/core/TagIndexer';
import { TagMasterSettingsTab } from './src/ui/SettingsTab';
import { TagMasterView } from './src/ui/TagMasterView';
import { TAGMASTER_VIEW_TYPE } from './src/constants';
import { DEFAULT_SETTINGS, type TagMasterSettings } from './src/types';

export default class TagMasterPlugin extends Plugin {
    settings: TagMasterSettings;
    indexer: TagIndexer;

    async onload() {
        console.log('Loading TagMaster Plugin');

        await this.loadSettings();

        this.indexer = new TagIndexer(
            this.app.vault,
            this.app.metadataCache,
            this.settings
        );

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
