param(
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Servidor rodando em http://localhost:$Port"
Write-Host "Pressione Ctrl+C para parar"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $filePath = $request.RawUrl.TrimStart('/')
        if ([string]::IsNullOrEmpty($filePath) -or $filePath -eq '') {
            $filePath = 'index.html'
        }
        
        $fullPath = Join-Path $ScriptDir $filePath
        
        if (Test-Path $fullPath) {
            $file = Get-Item $fullPath
            $buffer = [System.IO.File]::ReadAllBytes($file.FullName)
            
            $contentType = switch ($file.Extension) {
                '.html' { 'text/html; charset=utf-8' }
                '.js' { 'application/javascript; charset=utf-8' }
                '.css' { 'text/css; charset=utf-8' }
                '.json' { 'application/json; charset=utf-8' }
                '.png' { 'image/png' }
                '.jpg' { 'image/jpeg' }
                '.gif' { 'image/gif' }
                default { 'application/octet-stream' }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "GET $($request.RawUrl) - 200 OK" -ForegroundColor Green
        } else {
            $response.StatusCode = 404
            $errorMsg = "Arquivo não encontrado: $filePath"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            Write-Host "GET $($request.RawUrl) - 404 Not Found" -ForegroundColor Red
        }
        
        $response.OutputStream.Close()
    } catch {
        Write-Host "Erro: $_" -ForegroundColor Red
    }
}

$listener.Stop()
$listener.Close()
