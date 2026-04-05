@echo off
chcp 65001 > nul
echo 💾 備份水晶進銷存資料...

:: 從 .env 讀取密碼（Windows 的 for /f 語法）
for /f "tokens=2 delims==" %%a in ('findstr /i "DB_PASSWORD=" .env') do set DB_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr /i "DB_USER=" .env') do set DB_USER=%%a

:: 建立備份資料夾
if not exist backups mkdir backups

:: 產生時間戳記
set YYYY=%date:~0,4%
set MM=%date:~5,2%
set DD=%date:~8,2%
set HH=%time:~0,2%
set MI=%time:~3,2%
set HH=%HH: =0%
set BACKUP_NAME=crystal_erp_%YYYY%%MM%%DD%_%HH%%MI%

:: 備份資料庫
echo 備份資料庫...
docker compose exec -T db mysqldump -u %DB_USER% -p%DB_PASSWORD% crystal_erp > backups\%BACKUP_NAME%.sql
if %errorlevel% == 0 (
    echo ✅ 資料庫備份完成：backups\%BACKUP_NAME%.sql
) else (
    echo ❌ 資料庫備份失敗，請確認系統正在運行
    pause
    exit /b 1
)

:: 備份相片（只複製新增或變更的檔案）
echo 備份相片...
if not exist backups\photos mkdir backups\photos
xcopy /E /I /Y /D storage\photos backups\photos\%BACKUP_NAME% > nul
echo ✅ 相片備份完成：backups\photos\%BACKUP_NAME%

echo.
echo 💡 提示：建議將 backups\ 資料夾同步到 OneDrive 或 Google Drive！
echo.
pause
