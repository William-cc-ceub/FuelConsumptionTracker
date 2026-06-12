param(
  [string]$RepoName = "FuelConsumptionTracker",
  [string]$Visibility = "public",
  [string]$Remote = "origin"
)

function Check-Command($cmd) {
  try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

if (-not (Check-Command git)) { Write-Error "Git não está instalado. Instale Git antes de continuar."; exit 1 }

if (-not (Check-Command gh)) {
  Write-Host "A GitHub CLI (gh) não foi encontrada. O script criará o repositório manualmente com instruções."
  Write-Host "Siga estes passos manualmente:"
  Write-Host "1) Crie o repositório no GitHub (https://github.com/new)"
  Write-Host "2) Execute: git remote add origin https://github.com/YOUR_USER/$RepoName.git"
  Write-Host "3) git branch -M main"
  Write-Host "4) git push -u origin main"
  exit 0
}

# Initialize git if necessary
if (-not (Test-Path .git)) {
  git init
  git checkout -b main
}

git add .
if (-not (git rev-parse --verify HEAD 2>$null)) {
  git commit -m "chore: initial commit"
} else {
  git commit -m "chore: update site" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or commit failed." -ForegroundColor Yellow
  }
}

# Create repo using gh and push
$created = gh repo create $RepoName --$Visibility --source=. --remote=$Remote --push 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Falha ao criar o repositório com gh. Verifique permissões e execução do gh auth login."
  exit 1
}

Write-Host "Repositório criado e código enviado. No GitHub Pages o deploy será feito automaticamente pelo workflow (pode levar alguns minutos)."
Write-Host "Verifique em: https://github.com/$(gh repo view --json owner -q .owner)/$RepoName"
