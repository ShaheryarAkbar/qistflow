@echo off
echo ========================================================
echo  QistFlow - Push Updates to GitHub & Auto Deploy
echo ========================================================
echo.
git add -A
git commit -m "feat: update QistFlow application"
git push origin master
git push origin main
echo.
echo Building production assets for live link...
set VITE_BASE_PATH=/qistflow/
call npm.cmd run build
copy /y dist\index.html dist\404.html >nul
type nul > dist\.nojekyll
set GIT_INDEX_FILE=temp-index
git --work-tree=dist add --all .
for /f "tokens=*" %%i in ('git write-tree') do set TREE=%%i
for /f "tokens=*" %%i in ('git commit-tree %TREE% -m "Deploy production build to GitHub Pages"') do set COMMIT=%%i
git push origin %COMMIT%:refs/heads/gh-pages --force
if exist temp-index del temp-index
set GIT_INDEX_FILE=
echo.
echo ========================================================
echo  Successfully pushed to GitHub!
echo  Live website link:
echo  https://shaheryarakbar.github.io/qistflow/
echo ========================================================
pause
