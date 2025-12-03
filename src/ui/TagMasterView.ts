import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TAGMASTER_VIEW_TYPE } from '../constants';
import type TagMasterPlugin from '../../main';

export class TagMasterView extends ItemView {
    plugin: TagMasterPlugin;
    private updateHandler: () => void;

    constructor(leaf: WorkspaceLeaf, plugin: TagMasterPlugin) {
        super(leaf);
        this.plugin = plugin;
        
        // Handler para atualizar a view quando o catálogo mudar
        this.updateHandler = () => {
            this.renderTagList();
        };
    }

    getViewType(): string {
        return TAGMASTER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'TagMaster';
    }

    getIcon(): string {
        return 'tags';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('tagmaster-view');

        // Registrar listener para atualizações do catálogo
        this.plugin.indexer.on('catalog-updated', this.updateHandler);

        // Header
        const header = container.createEl('div', { cls: 'tagmaster-header' });
        header.createEl('h3', { text: 'Tag Catalog' });

        const buttonContainer = header.createEl('div', { cls: 'tagmaster-buttons' });
        
        const scanButton = buttonContainer.createEl('button', { text: 'Scan Vault', cls: 'mod-cta' });
        scanButton.addEventListener('click', async () => {
            scanButton.disabled = true;
            scanButton.textContent = 'Scanning...';
            
            await this.plugin.indexer.indexVault((current, total) => {
                scanButton.textContent = `Scanning ${current}/${total}`;
            });

            scanButton.textContent = 'Scan Vault';
            scanButton.disabled = false;
            this.renderTagList();
        });

        const suggestButton = buttonContainer.createEl('button', { text: 'Find Similar' });
        suggestButton.addEventListener('click', () => {
            this.showSuggestions();
        });

        // Stats
        const stats = container.createEl('div', { cls: 'tagmaster-stats' });
        this.renderStats(stats);

        // Tag list
        const listContainer = container.createEl('div', { cls: 'tagmaster-list' });
        this.renderTagList(listContainer);
    }

    private renderStats(container: HTMLElement) {
        container.empty();
        const tagCount = this.plugin.indexer.getTagCount();
        container.createEl('p', { text: `Total tags: ${tagCount}` });
    }

    private renderTagList(container?: HTMLElement) {
        const listEl = container || this.containerEl.querySelector('.tagmaster-list');
        if (!listEl) return;

        listEl.empty();

        const catalog = this.plugin.indexer.getCatalog();
        const sortedTags = Array.from(catalog.entries())
            .sort((a, b) => b[1].count - a[1].count);

        sortedTags.forEach(([tag, info]) => {
            const tagItem = listEl.createEl('div', { cls: 'tagmaster-tag-item' });
            
            const tagName = tagItem.createEl('span', { 
                cls: 'tagmaster-tag-name',
                text: tag 
            });
            
            const tagCount = tagItem.createEl('span', { 
                cls: 'tagmaster-tag-count',
                text: `${info.count}` 
            });

            tagItem.addEventListener('click', () => {
                this.showTagDetails(tag, info);
            });
        });

        // Update stats
        const statsEl = this.containerEl.querySelector('.tagmaster-stats');
        if (statsEl) {
            this.renderStats(statsEl as HTMLElement);
        }
    }

    private showTagDetails(tag: string, info: any) {
        console.log('Tag details:', tag, info);
        // TODO: Implement modal with tag details and actions
    }

    private showSuggestions() {
        const catalog = this.plugin.indexer.getCatalog();
        if (catalog.size === 0) {
            return;
        }

        const suggestions = this.plugin.matcher.findSimilarTags(catalog);
        
        // Find or create suggestions container
        let suggestionsContainer = this.containerEl.querySelector('.tagmaster-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = this.containerEl.children[1].createEl('div', { 
                cls: 'tagmaster-suggestions' 
            });
        } else {
            suggestionsContainer.empty();
        }

        if (suggestions.length === 0) {
            suggestionsContainer.createEl('p', { 
                text: 'Nenhuma tag similar encontrada.',
                cls: 'tagmaster-no-suggestions'
            });
            return;
        }

        suggestionsContainer.createEl('h4', { text: `${suggestions.length} Sugestões de Merge` });

        suggestions.forEach(suggestion => {
            const suggestionEl = suggestionsContainer.createEl('div', { 
                cls: 'tagmaster-suggestion-item' 
            });

            const header = suggestionEl.createEl('div', { cls: 'tagmaster-suggestion-header' });
            
            header.createEl('span', { 
                text: `${suggestion.sourceTag} → ${suggestion.targetTag}`,
                cls: 'tagmaster-suggestion-tags'
            });
            
            header.createEl('span', { 
                text: `${Math.round(suggestion.similarity * 100)}%`,
                cls: 'tagmaster-suggestion-score'
            });

            suggestionEl.createEl('p', { 
                text: suggestion.reason,
                cls: 'tagmaster-suggestion-reason'
            });

            suggestionEl.createEl('p', { 
                text: `${suggestion.affectedFiles.length} arquivo(s) afetado(s)`,
                cls: 'tagmaster-suggestion-files'
            });

            const actions = suggestionEl.createEl('div', { cls: 'tagmaster-suggestion-actions' });
            
            const applyBtn = actions.createEl('button', { 
                text: 'Aplicar',
                cls: 'mod-cta'
            });
            applyBtn.addEventListener('click', () => {
                console.log('Apply suggestion:', suggestion);
                // TODO: Implement merge operation
            });

            const ignoreBtn = actions.createEl('button', { text: 'Ignorar' });
            ignoreBtn.addEventListener('click', () => {
                suggestionEl.remove();
            });
        });
    }

    async onClose() {
        // Remover listener
        this.plugin.indexer.off('catalog-updated', this.updateHandler);
    }
}
