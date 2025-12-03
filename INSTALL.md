# Instalação do TagMaster

## Método 1: Download do Release (Recomendado)

1. Acesse [GitHub Releases](https://github.com/ncalvin/tagmaster/releases)
2. Baixe o arquivo `tagmaster-0.1.0.zip` da versão mais recente
3. Extraia o conteúdo do arquivo ZIP
4. Copie os arquivos extraídos (`main.js`, `manifest.json`, `styles.css`) para a pasta:
   ```
   <seu-vault>/.obsidian/plugins/tagmaster/
   ```
5. Recarregue o Obsidian (Ctrl/Cmd + R)
6. Vá em Configurações → Plugins da comunidade → TagMaster e ative o plugin

## Método 2: Instalação Manual (Desenvolvimento)

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Git

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/ncalvin/tagmaster.git
   cd tagmaster
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Compile o plugin:
   ```bash
   npm run build
   ```

4. Copie os arquivos para o seu vault:
   ```bash
   # Substitua <caminho-do-seu-vault> pelo caminho real
   cp main.js manifest.json styles.css <caminho-do-seu-vault>/.obsidian/plugins/tagmaster/
   ```

5. Recarregue o Obsidian

6. Ative o plugin em Configurações → Plugins da comunidade

## Método 3: Desenvolvimento com Auto-reload

Para desenvolvimento ativo com recompilação automática:

1. Siga os passos 1-2 do Método 2

2. Execute em modo watch:
   ```bash
   npm run dev
   ```

3. Configure um link simbólico para o seu vault:
   ```bash
   ln -s $(pwd) <caminho-do-seu-vault>/.obsidian/plugins/tagmaster
   ```

4. Use o plugin [Hot Reload](https://github.com/pjeby/hot-reload) no Obsidian para recarregar automaticamente durante o desenvolvimento

## Verificação da Instalação

1. Abra o Obsidian
2. Procure o ícone de tags na barra lateral esquerda
3. Ou abra a Paleta de Comandos (Ctrl/Cmd + P) e digite "TagMaster"
4. Você deve ver os comandos do TagMaster disponíveis

## Solução de Problemas

### Plugin não aparece na lista
- Verifique se a pasta `.obsidian/plugins/tagmaster` existe
- Confirme que os três arquivos estão presentes: `main.js`, `manifest.json`, `styles.css`
- Recarregue completamente o Obsidian

### Erros ao executar npm install
- Atualize o Node.js para a versão mais recente
- Limpe o cache do npm: `npm cache clean --force`
- Delete `node_modules` e `package-lock.json`, depois execute `npm install` novamente

### Plugin carrega mas não funciona
- Abra o Console de Desenvolvimento (Ctrl/Cmd + Shift + I)
- Procure por erros relacionados ao "TagMaster"
- Reporte problemas em [GitHub Issues](https://github.com/ncalvin/tagmaster/issues)

## Desinstalação

1. Desative o plugin em Configurações → Plugins da comunidade
2. Delete a pasta `<vault>/.obsidian/plugins/tagmaster/`
3. Recarregue o Obsidian

## Próximos Passos

Após a instalação, consulte o [README.md](README.md) para instruções de uso e configuração.
