$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pulpoNode = Get-Command node -ErrorAction SilentlyContinue
if (-not $pulpoNode) {
    $bundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
    if (Test-Path -LiteralPath $bundledNode) { $nodePath = $bundledNode }
    else { throw 'Instala Node.js 24 o posterior y vuelve a ejecutar este archivo.' }
} else { $nodePath = $pulpoNode.Source }
if (-not (Test-Path -LiteralPath 'node_modules')) { throw 'Primero instala las dependencias con npm install o pnpm install. Consulta README.md.' }
Write-Host 'Abre http://localhost:3210 para entrar a Pulpo. Ctrl+C detiene la oficina.'
& $nodePath --experimental-strip-types server/index.ts
