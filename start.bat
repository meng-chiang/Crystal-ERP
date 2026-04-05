@echo off
chcp 65001 > nul
echo 🔮 水晶進銷存系統 啟動中...

docker compose up -d

echo.
echo 請稍候約 15 秒讓服務完全啟動...
timeout /t 15 /nobreak > nul

echo.
echo ✅ 系統已啟動！正在開啟瀏覽器...
start http://localhost:3000

echo.
echo 若無法開啟，請手動前往：http://localhost:3000
pause
