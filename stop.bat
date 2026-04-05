@echo off
chcp 65001 > nul
echo 🛑 停止水晶進銷存系統...

docker compose down

echo.
echo ✅ 系統已停止。
pause
