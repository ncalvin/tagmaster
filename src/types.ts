export interface TagOccurrence {
    file: string;
    line: number;
    context: string;
    isFrontmatter: boolean;
    startIndex: number;
    endIndex: number;
}

export interface TagInfo {
    tag: string;
    normalizedTag: string;
    count: number;
    occurrences: TagOccurrence[];
}

export interface TagSuggestion {
    type: 'merge' | 'rename' | 'hierarchy';
    sourceTag: string;
    targetTag: string;
    similarity: number;
    occurrenceCount: number;
    affectedFiles: string[];
    reason: string;
}

export interface TagMergeOperation {
    id: string;
    timestamp: number;
    sourceTags: string[];
    targetTag: string;
    affectedFiles: string[];
    preview: TagOperationPreview[];
    status: 'pending' | 'applied' | 'reverted';
}

export interface TagOperationPreview {
    file: string;
    before: string;
    after: string;
    line: number;
}

export interface BackupSnapshot {
    id: string;
    timestamp: number;
    operationId: string;
    files: Map<string, string>;
}

export interface TagMasterSettings {
    normalizationRules: {
        caseFolding: boolean;
        removeDiacritics: boolean;
        underscoresToDashes: boolean;
        stripPunctuation: boolean;
    };
    similarityThreshold: number;
    similarityAlgorithms: {
        levenshtein: boolean;
        jaroWinkler: boolean;
        tokenOverlap: boolean;
    };
    similarityThresholds: {
        levenshtein: number;
        jaroWinkler: number;
        tokenOverlap: number;
    };
    previewSettings: {
        maxExamples: number;
        contextLines: number;
    };
    safeMode: boolean;
    enableUndo: boolean;
    maxBackups: number;
    enableEmbeddings: boolean;
    embeddingsApiKey?: string;
}

export const DEFAULT_SETTINGS: TagMasterSettings = {
    normalizationRules: {
        caseFolding: true,
        removeDiacritics: true,
        underscoresToDashes: true,
        stripPunctuation: true
    },
    similarityThreshold: 0.75,
    similarityAlgorithms: {
        levenshtein: true,
        jaroWinkler: true,
        tokenOverlap: true
    },
    similarityThresholds: {
        levenshtein: 0.8,
        jaroWinkler: 0.85,
        tokenOverlap: 0.7
    },
    previewSettings: {
        maxExamples: 5,
        contextLines: 2
    },
    safeMode: true,
    enableUndo: true,
    maxBackups: 10,
    enableEmbeddings: false
};
