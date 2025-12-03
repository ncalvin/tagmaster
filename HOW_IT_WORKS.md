# Como o TagMaster Funciona

Este documento explica a arquitetura e funcionamento interno do plugin TagMaster.

## Visão Geral

O **TagMaster** é um plugin para Obsidian que gerencia tags de forma inteligente através de indexação automática, detecção de similaridade e operações em lote com preview e undo.

## Arquitetura Principal

### 1. Indexação de Tags (TagIndexer)

Quando você abre o Obsidian ou clica em "Scan Vault":

- **Escaneia todos os arquivos Markdown** do seu vault
- **Detecta tags em dois lugares:**
  - **Frontmatter YAML**: `tags: [projeto, reunião]`
  - **Inline no texto**: `#projeto #reunião`
- **Cria um catálogo** que mapeia cada tag para:
  - Arquivo onde aparece
  - Linha específica
  - Contexto (texto ao redor)
  - Se é frontmatter ou inline
  - Posição exata (início/fim)

**Implementação:**
```typescript
// src/core/TagIndexer.ts
class TagIndexer {
  private tagCatalog: Map<string, TagInfo>;
  
  async indexFile(file: TFile) {
    // Detecta tags no frontmatter
    // Detecta tags inline com regex
    // Adiciona ao catálogo com localização exata
  }
}
```

### 2. Normalização de Tags

O plugin compara tags de forma inteligente usando regras configuráveis:

- **Case folding**: `#Projeto` = `#projeto`
- **Remove diacríticos**: `#reunião` = `#reuniao`
- **Underscores → dashes**: `#meu_projeto` = `#meu-projeto`
- **Remove pontuação**: `#projeto!` = `#projeto`

Isso permite detectar que `#Meeting`, `#meeting`, `#meetings` são variantes similares.

**Exemplo:**
```typescript
normalizeTag("#Reunião_Importante!") 
// → "#reuniao-importante"
```

### 3. Atualização Incremental

O plugin escuta eventos do Obsidian para manter o índice sempre atualizado:

- **Arquivo modificado** → Re-indexa apenas esse arquivo
- **Arquivo deletado** → Remove tags desse arquivo do catálogo
- Não precisa escanear tudo novamente a cada mudança

**Implementação:**
```typescript
// main.ts
this.registerEvent(
  this.app.vault.on('modify', (file) => {
    if (file instanceof TFile && file.extension === 'md') {
      this.indexer.indexFile(file); // Atualização incremental
    }
  })
);
```

### 4. Interface de Usuário

**Painel Lateral:**
- Lista todas as tags encontradas
- Mostra contagem de ocorrências
- Ordenadas por frequência (mais usadas primeiro)
- Clique na tag → mostra detalhes (em desenvolvimento)

**Configurações:**
- Regras de normalização (ativar/desativar cada uma)
- Thresholds de similaridade (0-1, mais alto = mais rigoroso)
- Quantos exemplos mostrar em previews
- Safe mode, undo, backups

### 5. Comandos

Disponíveis na Command Palette (Ctrl/Cmd + P):

- `TagMaster: Scan vault for tags` - Força re-indexação completa
- `TagMaster: Open TagMaster panel` - Abre o painel lateral

## Fluxo de Dados

```
Arquivos Markdown
       ↓
[TagIndexer] ← Regex: /#([a-zA-Z0-9_\-\/]+)/g
       ↓
[Normalização] ← Aplica regras configuradas
       ↓
[Catálogo] → Map<tag, TagInfo[]>
       ↓
[UI View] ← Renderiza lista ordenada por count
```

## Estrutura de Dados

### TagOccurrence
```typescript
interface TagOccurrence {
  file: string;           // Caminho do arquivo
  line: number;           // Número da linha
  context: string;        // Texto da linha
  isFrontmatter: boolean; // Frontmatter ou inline
  startIndex: number;     // Posição inicial
  endIndex: number;       // Posição final
}
```

### TagInfo
```typescript
interface TagInfo {
  tag: string;            // Tag original (#projeto)
  normalizedTag: string;  // Tag normalizada (#projeto)
  count: number;          // Total de ocorrências
  occurrences: TagOccurrence[]; // Lista de todas as ocorrências
}
```

## Recursos em Desenvolvimento

### TagMatcher (Detecção de Similaridade)

Algoritmos para detectar tags similares:

**Levenshtein Distance:**
- Mede número de edições necessárias
- `#meeting` vs `#meetings` → 88% similar

**Jaro-Winkler:**
- Favorece prefixos comuns
- `#project` vs `#projeto` → 85% similar

**Token Overlap:**
- Compara palavras/tokens
- `#my-project` vs `#my_project` → 100% overlap

**Implementação (planejada):**
```typescript
// src/core/TagMatcher.ts
class TagMatcher {
  findSimilarTags(tag: string): TagSuggestion[] {
    // Calcula similaridade com todas as outras tags
    // Retorna sugestões acima do threshold
    // Ordena por score de similaridade
  }
}
```

### TagOperations (Operações em Lote)

**Merge (Fusão):**
```
#reunião + #reuniões → #reuniao
- Preview: mostra 15 ocorrências em 8 arquivos
- Dry-run: simula sem modificar
- Apply: executa mudanças
```

**Rename (Renomeação):**
```
#old-tag → #new-tag
- Atualiza frontmatter YAML
- Atualiza tags inline
- Preserva hierarquias (#parent/child)
```

**Hierarchy (Hierarquia):**
```
#project/web + #project/mobile → parent: #project
- Detecta estruturas hierárquicas
- Sugere criação de tags pai
```

### BackupManager (Sistema de Undo)

**Snapshots:**
- Captura estado dos arquivos antes de modificar
- Armazena em `.obsidian/plugins/tagmaster/backups/<timestamp>/`
- Mantém até N backups (configurável)

**Histórico:**
```typescript
interface TagMergeOperation {
  id: string;
  timestamp: number;
  sourceTags: string[];
  targetTag: string;
  affectedFiles: string[];
  status: 'pending' | 'applied' | 'reverted';
}
```

**Undo:**
- Restaura arquivos do snapshot
- Marca operação como 'reverted'
- Permite undo múltiplo (last-in, first-out)

## Exemplo Prático Completo

### Cenário Inicial

Você tem um vault com:
```markdown
# nota1.md
---
tags: [Projeto, reunião]
---
Discussão sobre o #Projeto

# nota2.md
tags: [projeto, meeting]

# nota3.md
Falei no #Meeting sobre o #projeto
```

### Após Scan

TagMaster detecta:
```
#Projeto     → 2 ocorrências (nota1.md x2)
#projeto     → 2 ocorrências (nota2.md, nota3.md)
#reunião     → 1 ocorrência  (nota1.md)
#meeting     → 1 ocorrência  (nota2.md)
#Meeting     → 1 ocorrência  (nota3.md)
```

### Normalização

Com case folding e remove diacritics:
```
#projeto     → 3 ocorrências normalizadas
#reuniao     → 1 ocorrência
#meeting     → 2 ocorrências
```

### Sugestões (quando implementado)

TagMatcher sugere:
```
1. Merge #Projeto + #projeto → #projeto
   Score: 100% (idênticos após normalização)
   
2. Merge #meeting + #Meeting → #meeting
   Score: 100%
   
3. Merge #reunião + #meeting → #reuniao
   Score: 45% (baixo, pode ignorar)
```

### Preview

Antes de aplicar merge #Projeto → #projeto:
```diff
nota1.md (linha 2):
- tags: [Projeto, reunião]
+ tags: [projeto, reunião]

nota1.md (linha 5):
- Discussão sobre o #Projeto
+ Discussão sobre o #projeto
```

### Apply

Após confirmar:
1. Cria backup em `.obsidian/plugins/tagmaster/backups/2025-12-02-14-30/`
2. Modifica os 2 arquivos afetados
3. Atualiza o catálogo
4. Registra operação no histórico

### Undo

Se necessário:
1. Seleciona operação no histórico
2. Restaura arquivos do backup
3. Re-indexa vault
4. Marca operação como 'reverted'

## Otimizações de Performance

### Para Vaults Grandes (10k+ notas)

**Indexação com Progress:**
```typescript
await this.indexer.indexVault((current, total) => {
  console.log(`Indexing: ${current}/${total}`);
  // Atualiza UI com progresso
});
```

**Web Workers (planejado):**
- Executa algoritmos pesados em background
- Não bloqueia UI durante scan
- Paraleliza cálculos de similaridade

**Debouncing:**
- Aguarda 500ms após edição antes de re-indexar
- Evita múltiplas indexações em edições rápidas

**Indexação Incremental:**
- Re-indexa apenas arquivos modificados
- Mantém cache do catálogo em memória
- Persiste em `.tagmaster-cache.json` (opcional)

## Segurança e Validação

### Proteções Implementadas

**Regex com Boundary:**
```typescript
// Evita match em meio de palavras
TAG_WITH_BOUNDARY = /(?:^|[^a-zA-Z0-9_\-\/])#([a-zA-Z0-9_\-\/]+)(?:[^a-zA-Z0-9_\-\/]|$)/g
// "start" não match "st#art"
```

**Safe Mode:**
- Dry-run obrigatório antes de apply
- Preview com exemplos e contagem
- Confirmação explícita do usuário

**Validação de Colisões:**
```typescript
// Antes de merge, verifica se tag destino já existe
if (targetExists && sourceExists) {
  // Não cria duplicatas na mesma nota
}
```

**Preservação de YAML:**
```typescript
// Usa parseAllDocuments() para manter estrutura
// Converte string → array se necessário
// Mantém comentários e formatação
```

## Estado Atual (v0.1.0)

### ✅ Implementado
- Indexação de tags (frontmatter + inline)
- Normalização configurável
- Interface básica (painel + settings)
- Atualização incremental
- Comandos do Command Palette

### 🚧 Em Desenvolvimento
- Algoritmos de similaridade (TagMatcher)
- Operações de merge/rename (TagOperations)
- Sistema de backup/undo (BackupManager)
- Modais de preview
- Detecção de hierarquias

### 📋 Planejado
- Sugestões automáticas de merge
- Batch operations
- Export/import de configurações
- Embeddings/ML (opcional)
- Estatísticas e relatórios

## Contribuindo

O código está organizado em:
```
src/
├── core/          # Lógica principal
│   ├── TagIndexer.ts
│   ├── TagMatcher.ts (TODO)
│   └── TagOperations.ts (TODO)
├── ui/            # Interface
│   ├── TagMasterView.ts
│   ├── SettingsTab.ts
│   └── PreviewModal.ts (TODO)
├── services/      # Serviços auxiliares
│   └── BackupManager.ts (TODO)
├── types.ts       # Definições de tipos
└── constants.ts   # Constantes globais
```

Para adicionar funcionalidades, consulte os TODO markers e a todo list no README.

## Referências

- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [Jaro-Winkler](https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance)
- [YAML Spec](https://yaml.org/spec/1.2/spec.html)
