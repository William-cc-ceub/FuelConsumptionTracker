# Deploy — Fuel Consumption Tracker

Este documento mostra opções e passos para publicar o site estático em GitHub Pages.

Pré-requisitos
- Git instalado
- (Opcional, recomendado) GitHub CLI `gh` autenticado (`gh auth login`)

Opção A — Publicar usando GitHub Pages (recomendado)

1) Crie (ou entre) em uma conta GitHub.
2) Crie um novo repositório (nome sugerido: `FuelConsumptionTracker`).
   - Se preferir, execute o script `create_repo_and_push.ps1` para criar e enviar automaticamente (requer `gh`).

3) Estrutura recomendada no repositório:

```
/ 
  README.md
  site/              # pasta com os arquivos públicos (index.html, styles.css...)
  standalone.html    # versão all-in-one (opcional)
  .github/workflows/deploy_pages.yml
```

4) Workflow GitHub Actions
- Já incluí um workflow em `.github/workflows/deploy_pages.yml` que faz deploy automático a cada push na branch `main`.
- O fluxo usa `actions/upload-pages-artifact` + `actions/deploy-pages` e publica o conteúdo da pasta `site/`.

5) Passos para publicar manualmente (sem `gh`):

```powershell
git init
git add .
git commit -m "Site inicial"
git branch -M main
# No GitHub: crie o repositório e copie a URL remota
git remote add origin https://github.com/YOUR_USER/FuelConsumptionTracker.git
git push -u origin main
```

Após o push, o workflow fará deploy automaticamente (pode levar alguns minutos). Então ative GitHub Pages em Settings → Pages caso seja necessário, escolhendo a opção "GitHub Actions".

Opção B — Netlify / Vercel
- Faça upload da pasta `site/` ou conecte o repositório à plataforma e aponte o diretório de publicação para `site/`.

Opção C — Docker
- Caso prefira rodar via Docker (imagem Nginx já incluída):

```powershell
docker-compose up -d --build
```

Opção D — Servidor local (Windows)
- Execute `start-server.bat` ou `server.ps1` para um servidor HTTP simples (porta 8080).

Scripts úteis
- `create_repo_and_push.ps1` — automatiza a criação do repositório via `gh` e faz o push inicial.

Suporte
- Se quiser, posso (1) criar o repositório remoto para você (preciso de acesso via `gh`/token), ou (2) gerar um arquivo ZIP do pacote pronto para upload.

---

Publicado por gerador automático — siga os passos acima para publicar em GitHub Pages.
