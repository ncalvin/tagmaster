import { TFile, Vault, MetadataCache, Events } from 'obsidian';
import { parseAllDocuments } from 'yaml';
import type { TagOccurrence, TagInfo, TagMasterSettings } from '../types';
import { TAG_WITH_BOUNDARY } from '../constants';

export class TagIndexer extends Events {
    private vault: Vault;
    private metadataCache: MetadataCache;
    private settings: TagMasterSettings;
    private tagCatalog: Map<string, TagInfo>;
    private isIndexing: boolean = false;

    constructor(vault: Vault, metadataCache: MetadataCache, settings: TagMasterSettings) {
        super();
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.settings = settings;
        this.tagCatalog = new Map();
    }

    async indexVault(onProgress?: (current: number, total: number) => void): Promise<void> {
        if (this.isIndexing) {
            console.warn('TagMaster: Indexing already in progress');
            return;
        }

        this.isIndexing = true;
        this.tagCatalog.clear();

        const files = this.vault.getMarkdownFiles();
        const total = files.length;

        for (let i = 0; i < total; i++) {
            const file = files[i];
            await this.indexFile(file);
            
            if (onProgress) {
                onProgress(i + 1, total);
            }
        }

        this.isIndexing = false;
        this.trigger('catalog-updated');
    }

    async indexFile(file: TFile): Promise<void> {
        // Remove existing occurrences for this file first
        this.removeFileFromIndex(file.path);

        const content = await this.vault.cachedRead(file);
        const lines = content.split('\n');

        // Index frontmatter tags
        const frontmatter = this.metadataCache.getFileCache(file)?.frontmatter;
        if (frontmatter?.tags) {
            this.indexFrontmatterTags(file, frontmatter.tags, content);
        }

        // Index inline tags
        lines.forEach((line, lineNumber) => {
            this.indexInlineTags(file, line, lineNumber);
        });

        this.trigger('catalog-updated');
    }

    private indexFrontmatterTags(file: TFile, tags: string | string[], content: string): void {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        const lines = content.split('\n');

        tagArray.forEach(tag => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            
            // Find the line where this tag appears in frontmatter
            let lineNumber = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(tag)) {
                    lineNumber = i;
                    break;
                }
            }

            const occurrence: TagOccurrence = {
                file: file.path,
                line: lineNumber,
                context: lines[lineNumber] || '',
                isFrontmatter: true,
                startIndex: 0,
                endIndex: tag.length
            };

            this.addOccurrence(cleanTag, occurrence);
        });
    }

    private indexInlineTags(file: TFile, line: string, lineNumber: number): void {
        const matches = [...line.matchAll(TAG_WITH_BOUNDARY)];

        matches.forEach(match => {
            if (match[1]) {
                const tag = `#${match[1]}`;
                const occurrence: TagOccurrence = {
                    file: file.path,
                    line: lineNumber,
                    context: line,
                    isFrontmatter: false,
                    startIndex: match.index || 0,
                    endIndex: (match.index || 0) + tag.length
                };

                this.addOccurrence(tag, occurrence);
            }
        });
    }

    private addOccurrence(tag: string, occurrence: TagOccurrence): void {
        const normalizedTag = this.normalizeTag(tag);
        
        let tagInfo = this.tagCatalog.get(tag);
        if (!tagInfo) {
            tagInfo = {
                tag,
                normalizedTag,
                count: 0,
                occurrences: []
            };
            this.tagCatalog.set(tag, tagInfo);
        }

        tagInfo.occurrences.push(occurrence);
        tagInfo.count = tagInfo.occurrences.length;
    }

    private normalizeTag(tag: string): string {
        let normalized = tag.toLowerCase();

        if (this.settings.normalizationRules.removeDiacritics) {
            normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        if (this.settings.normalizationRules.underscoresToDashes) {
            normalized = normalized.replace(/_/g, '-');
        }

        if (this.settings.normalizationRules.stripPunctuation) {
            normalized = normalized.replace(/[^\w\s\-\/]/g, '');
        }

        return normalized;
    }

    getCatalog(): Map<string, TagInfo> {
        return this.tagCatalog;
    }

    getTagInfo(tag: string): TagInfo | undefined {
        return this.tagCatalog.get(tag);
    }

    getAllTags(): string[] {
        return Array.from(this.tagCatalog.keys());
    }

    getTagCount(): number {
        return this.tagCatalog.size;
    }

    removeFileFromIndex(filePath: string): void {
        for (const [tag, info] of this.tagCatalog.entries()) {
            info.occurrences = info.occurrences.filter(occ => occ.file !== filePath);
            info.count = info.occurrences.length;

            if (info.count === 0) {
                this.tagCatalog.delete(tag);
            }
        }
        this.trigger('catalog-updated');
    }
}
