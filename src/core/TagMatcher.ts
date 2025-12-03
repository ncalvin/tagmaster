import * as levenshteinLib from 'fast-levenshtein';
import type { TagInfo, TagSuggestion, TagMasterSettings } from '../types';

export class TagMatcher {
    private settings: TagMasterSettings;

    constructor(settings: TagMasterSettings) {
        this.settings = settings;
    }

    /**
     * Find similar tags in the catalog
     */
    findSimilarTags(catalog: Map<string, TagInfo>): TagSuggestion[] {
        const suggestions: TagSuggestion[] = [];
        const tags = Array.from(catalog.keys());

        // Compare each tag with all others
        for (let i = 0; i < tags.length; i++) {
            for (let j = i + 1; j < tags.length; j++) {
                const tag1 = tags[i];
                const tag2 = tags[j];
                const info1 = catalog.get(tag1)!;
                const info2 = catalog.get(tag2)!;

                const similarity = this.calculateSimilarity(
                    info1.normalizedTag,
                    info2.normalizedTag
                );

                if (similarity >= this.settings.similarityThreshold) {
                    suggestions.push(this.createSuggestion(tag1, tag2, info1, info2, similarity));
                }
            }
        }

        // Sort by similarity score (highest first)
        return suggestions.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Find tags similar to a specific tag
     */
    findSimilarTo(targetTag: string, catalog: Map<string, TagInfo>): TagSuggestion[] {
        const suggestions: TagSuggestion[] = [];
        const targetInfo = catalog.get(targetTag);
        
        if (!targetInfo) return suggestions;

        for (const [tag, info] of catalog.entries()) {
            if (tag === targetTag) continue;

            const similarity = this.calculateSimilarity(
                targetInfo.normalizedTag,
                info.normalizedTag
            );

            if (similarity >= this.settings.similarityThreshold) {
                suggestions.push(this.createSuggestion(targetTag, tag, targetInfo, info, similarity));
            }
        }

        return suggestions.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Calculate similarity between two normalized tags
     */
    private calculateSimilarity(tag1: string, tag2: string): number {
        // Remove # prefix for comparison
        const str1 = tag1.replace(/^#/, '');
        const str2 = tag2.replace(/^#/, '');

        if (str1 === str2) return 1.0;

        let totalScore = 0;
        let weights = 0;

        // 1. Levenshtein distance similarity
        if (this.settings.similarityAlgorithms.levenshtein) {
            const levScore = this.levenshteinSimilarity(str1, str2);
            totalScore += levScore * 0.4; // 40% weight
            weights += 0.4;
        }

        // 2. Jaro-Winkler similarity
        if (this.settings.similarityAlgorithms.jaroWinkler) {
            const jaroScore = this.jaroWinklerSimilarity(str1, str2);
            totalScore += jaroScore * 0.3; // 30% weight
            weights += 0.3;
        }

        // 3. Token overlap (for hierarchical tags like project/backend and project/frontend)
        if (this.settings.similarityAlgorithms.tokenOverlap) {
            const tokenScore = this.tokenOverlapSimilarity(str1, str2);
            totalScore += tokenScore * 0.3; // 30% weight
            weights += 0.3;
        }

        return weights > 0 ? totalScore / weights : 0;
    }

    /**
     * Levenshtein distance based similarity (0-1 scale)
     */
    private levenshteinSimilarity(str1: string, str2: string): number {
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1.0;
        
        const dist = levenshteinLib.get(str1, str2);
        return 1 - (dist / maxLen);
    }

    /**
     * Jaro-Winkler similarity algorithm
     */
    private jaroWinklerSimilarity(str1: string, str2: string): number {
        const jaroScore = this.jaroSimilarity(str1, str2);
        
        // Calculate common prefix length (up to 4 characters)
        let prefixLen = 0;
        for (let i = 0; i < Math.min(4, str1.length, str2.length); i++) {
            if (str1[i] === str2[i]) {
                prefixLen++;
            } else {
                break;
            }
        }

        // Jaro-Winkler = Jaro + (prefix_length * 0.1 * (1 - Jaro))
        return jaroScore + (prefixLen * 0.1 * (1 - jaroScore));
    }

    /**
     * Jaro similarity algorithm
     */
    private jaroSimilarity(str1: string, str2: string): number {
        if (str1 === str2) return 1.0;
        if (str1.length === 0 || str2.length === 0) return 0.0;

        const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
        const str1Matches = new Array(str1.length).fill(false);
        const str2Matches = new Array(str2.length).fill(false);

        let matches = 0;
        let transpositions = 0;

        // Find matches
        for (let i = 0; i < str1.length; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, str2.length);

            for (let j = start; j < end; j++) {
                if (str2Matches[j] || str1[i] !== str2[j]) continue;
                str1Matches[i] = true;
                str2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches === 0) return 0.0;

        // Find transpositions
        let k = 0;
        for (let i = 0; i < str1.length; i++) {
            if (!str1Matches[i]) continue;
            while (!str2Matches[k]) k++;
            if (str1[i] !== str2[k]) transpositions++;
            k++;
        }

        return (
            (matches / str1.length +
             matches / str2.length +
             (matches - transpositions / 2) / matches) / 3
        );
    }

    /**
     * Token overlap similarity (for hierarchical tags)
     */
    private tokenOverlapSimilarity(str1: string, str2: string): number {
        // Split by / for hierarchical tags, or by common separators
        const tokens1 = this.tokenize(str1);
        const tokens2 = this.tokenize(str2);

        if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
        if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

        // Find common tokens
        const commonTokens = tokens1.filter(token => tokens2.includes(token));
        const totalTokens = new Set([...tokens1, ...tokens2]).size;

        return commonTokens.length / totalTokens;
    }

    /**
     * Tokenize a tag string
     */
    private tokenize(str: string): string[] {
        // Split by /, -, _, or camelCase
        let tokens = str.split(/[\/\-_]/);
        
        // Further split camelCase
        tokens = tokens.flatMap(token => {
            return token.split(/(?=[A-Z])/).filter(t => t.length > 0);
        });

        return tokens.map(t => t.toLowerCase()).filter(t => t.length > 0);
    }

    /**
     * Create a suggestion object
     */
    private createSuggestion(
        tag1: string,
        tag2: string,
        info1: TagInfo,
        info2: TagInfo,
        similarity: number
    ): TagSuggestion {
        // Suggest merging the less common tag into the more common one
        const [sourceTag, targetTag] = info1.count >= info2.count 
            ? [tag2, tag1] 
            : [tag1, tag2];

        const sourceInfo = info1.count >= info2.count ? info2 : info1;
        const targetInfo = info1.count >= info2.count ? info1 : info2;

        return {
            type: 'merge',
            sourceTag,
            targetTag,
            similarity,
            reason: this.generateReason(sourceTag, targetTag, similarity),
            affectedFiles: sourceInfo.occurrences.map(occ => occ.file),
            occurrenceCount: sourceInfo.count
        };
    }

    /**
     * Generate a human-readable reason for the suggestion
     */
    private generateReason(sourceTag: string, targetTag: string, similarity: number): string {
        const percentage = Math.round(similarity * 100);
        
        if (similarity > 0.95) {
            return `Quase idênticas (${percentage}% similar). Provavelmente variações de escrita.`;
        } else if (similarity > 0.85) {
            return `Muito similares (${percentage}% similar). Podem representar o mesmo conceito.`;
        } else if (similarity > 0.75) {
            return `Similares (${percentage}% similar). Considere unificar.`;
        } else {
            return `Possivelmente relacionadas (${percentage}% similar).`;
        }
    }
}
