@echo off
echo Installing project dependencies...
npm install
if errorlevel 1 (
  echo npm install failed. Check that Node.js and npm are installed.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env
echo.
echo Setup complete. Edit .env and set MONGODB_URI and JWT_SECRET.
echo Then run: npm run dev
pause
