import { App, PluginSettingTab, Setting } from 'obsidian';
import type TagMasterPlugin from '../../main';

export class TagMasterSettingsTab extends PluginSettingTab {
    plugin: TagMasterPlugin;

    constructor(app: App, plugin: TagMasterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'TagMaster Settings' });

        // Normalization Rules
        containerEl.createEl('h3', { text: 'Normalization Rules' });

        new Setting(containerEl)
            .setName('Case folding')
            .setDesc('Convert tags to lowercase for comparison')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.normalizationRules.caseFolding)
                .onChange(async (value) => {
                    this.plugin.settings.normalizationRules.caseFolding = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Remove diacritics')
            .setDesc('Remove accents and diacritical marks (é → e)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.normalizationRules.removeDiacritics)
                .onChange(async (value) => {
                    this.plugin.settings.normalizationRules.removeDiacritics = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Underscores to dashes')
            .setDesc('Treat underscores as dashes (#tag_name → #tag-name)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.normalizationRules.underscoresToDashes)
                .onChange(async (value) => {
                    this.plugin.settings.normalizationRules.underscoresToDashes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Strip punctuation')
            .setDesc('Remove punctuation from tags')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.normalizationRules.stripPunctuation)
                .onChange(async (value) => {
                    this.plugin.settings.normalizationRules.stripPunctuation = value;
                    await this.plugin.saveSettings();
                }));

        // Similarity Thresholds
        containerEl.createEl('h3', { text: 'Similarity Thresholds (0-1)' });

        new Setting(containerEl)
            .setName('Levenshtein threshold')
            .setDesc('Minimum similarity for Levenshtein distance (higher = more strict)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.05)
                .setValue(this.plugin.settings.similarityThresholds.levenshtein)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.similarityThresholds.levenshtein = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Jaro-Winkler threshold')
            .setDesc('Minimum similarity for Jaro-Winkler distance')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.05)
                .setValue(this.plugin.settings.similarityThresholds.jaroWinkler)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.similarityThresholds.jaroWinkler = value;
                    await this.plugin.saveSettings();
                }));

        // Preview Settings
        containerEl.createEl('h3', { text: 'Preview Settings' });

        new Setting(containerEl)
            .setName('Max preview examples')
            .setDesc('Number of examples to show in preview')
            .addText(text => text
                .setValue(String(this.plugin.settings.previewSettings.maxExamples))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.previewSettings.maxExamples = num;
                        await this.plugin.saveSettings();
                    }
                }));

        // Safety
        containerEl.createEl('h3', { text: 'Safety' });

        new Setting(containerEl)
            .setName('Safe mode')
            .setDesc('Require dry-run before applying changes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.safeMode)
                .onChange(async (value) => {
                    this.plugin.settings.safeMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable undo')
            .setDesc('Keep backup snapshots for undo operations')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableUndo)
                .onChange(async (value) => {
                    this.plugin.settings.enableUndo = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max backups')
            .setDesc('Maximum number of backup snapshots to keep')
            .addText(text => text
                .setValue(String(this.plugin.settings.maxBackups))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.maxBackups = num;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}
