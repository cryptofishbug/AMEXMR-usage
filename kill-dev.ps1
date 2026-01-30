# MR_usage 개발 서버 종료 (Vite 기본 포트 5173, 5174 사용 중인 프로세스)
$ports = @(5173, 5174)
foreach ($port in $ports) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    $pid = $conn.OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "포트 $port 사용 중이던 프로세스(PID $pid)를 종료했습니다." -ForegroundColor Green
  }
}
Write-Host "완료." -ForegroundColor Green
