@echo off
chcp 65001 > nul

:: Must run as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 請以「系統管理員」身份執行此腳本！
    echo 右鍵點擊此檔案 → 以系統管理員身份執行
    pause
    exit /b 1
)

:: Get full path of backup.bat
set SCRIPT_DIR=%~dp0
set BACKUP_SCRIPT=%SCRIPT_DIR%backup.bat

echo 設定自動備份排程...
echo 備份腳本路徑：%BACKUP_SCRIPT%
echo.

:: Delete existing task if present
schtasks /delete /tn "CrystalERP_AutoBackup" /f >nul 2>&1

:: Create new scheduled task — runs daily at 2:00 AM
schtasks /create ^
  /tn "CrystalERP_AutoBackup" ^
  /tr "cmd /c \"%BACKUP_SCRIPT%\"" ^
  /sc DAILY ^
  /st 02:00 ^
  /ru "%USERNAME%" ^
  /rl HIGHEST ^
  /f

if %errorlevel% == 0 (
    echo.
    echo ✅ 自動備份排程設定成功！
    echo    每天凌晨 2:00 電腦開著時會自動備份。
    echo.
    echo 💡 提示：
    echo    - 備份檔案儲存於 backups\ 資料夾
    echo    - 建議將 backups\ 放入 OneDrive 或 Google Drive 同步資料夾
    echo    - 可在「工作排程器」中查看或停用此排程
) else (
    echo.
    echo ❌ 設定失敗，請確認以系統管理員身份執行。
)

echo.
pause
