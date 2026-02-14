@echo off
chcp 65001 >nul
echo ========================================
echo מפעיל את שרת הפיתוח של האתר
echo ========================================
echo.

echo בודק אם התלויות מותקנות...
if not exist "node_modules" (
    echo מתקין תלויות... זה עלול לקחת כמה דקות...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [שגיאה] התקנת התלויות נכשלה!
        echo אנא בדוק שיש לך Node.js מותקן.
        pause
        exit /b 1
    )
    echo.
    echo התלויות הותקנו בהצלחה!
    echo.
)

echo מפעיל את שרת הפיתוח...
echo.
echo ========================================
echo השרת מתחיל...
echo הקישור יהיה: http://localhost:5173
echo ========================================
echo.
echo פתח חלון טרמינל חדש אם צריך
echo.

start cmd /k "npm run dev"

echo ממתין שהשרת יעלה...

:check
timeout /t 3 /nobreak >nul
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo [הצלחה] השרת עלה בהצלחה!
    echo ========================================
    echo.
    echo פותח את האתר בדפדפן...
    start http://localhost:5173
    echo.
    echo האתר נפתח בדפדפן!
    echo אם הדפדפן לא נפתח, פתח ידנית: http://localhost:5173
    echo.
    pause
    exit
) else (
    echo עדיין ממתין שהשרת יעלה... (נסה שוב בעוד 3 שניות)
    goto check
)
