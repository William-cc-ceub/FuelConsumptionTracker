# Fuel Consumption Tracker - Rodando a Aplicação

## Opção 1: Servidor PowerShell (Sem dependências)

### Windows
Execute o arquivo `start-server.bat` ou rode no PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\server.ps1 -Port 8080
```

A aplicação estará disponível em: `http://localhost:8080`

---

## Opção 2: Docker (Recomendado para Produção)

Se você tiver Docker instalado:

```bash
docker-compose up -d
```

A aplicação estará disponível em: `http://localhost:8080`

### Parar o contêiner:
```bash
docker-compose down
```

---

## Opção 3: Node.js (se instalado)

```bash
npx http-server -p 8080
```

---

## Dados Persistentes

Os dados da aplicação são armazenados no `localStorage` do navegador, então:
- Os dados persistem entre recarregamentos
- Para limpar: Abra o DevTools (F12) → Console → `localStorage.clear()`

---

## Estrutura de Arquivos

```
├── index.html              # Página principal
├── new_entry.html          # Página de novo registro
├── vehicles.html           # Página de gerenciar veículos
├── script.js               # Lógica JavaScript
├── styles.css              # Estilos
├── Dockerfile              # Configuração Docker
├── docker-compose.yml      # Orquestração Docker
├── nginx.conf              # Configuração Nginx
├── server.ps1              # Servidor PowerShell
└── start-server.bat        # Script de inicialização
```
