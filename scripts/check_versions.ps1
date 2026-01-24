Write-Host "=== KRAFT Dev Environment Check ==="

# Git
try {
  $git = git --version
  Write-Host "[OK]  $git"
} catch {
  Write-Host "[ERR] Git not found. Install Git from https://git-scm.com/downloads"
}

# Python (Windows launcher)
try {
  $py = py -V
  Write-Host "[OK]  $py"
} catch {
  Write-Host "[ERR] Python not found (py launcher missing). Install Python 3.11+ from python.org"
}

# Node
try {
  $node = node -v
  Write-Host "[OK]  Node $node"
} catch {
  Write-Host "[ERR] Node not found. Install Node.js (LTS recommended)."
}

# npm
try {
  $npm = npm -v
  Write-Host "[OK]  npm $npm"
} catch {
  Write-Host "[ERR] npm not found (usually installed with Node)."
}

Write-Host ""
Write-Host "Recommended versions for this repo:"
Write-Host "- Python: 3.11.x (backend compatibility)"
Write-Host "- Node: 18+"
Write-Host "==================================="
