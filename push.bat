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
echo.
echo Deploying to live GitHub Pages...
call npx.cmd gh-pages -d dist -b gh-pages --dotfiles
echo.
echo ========================================================
echo  Successfully pushed to GitHub and deployed!
echo  Live website link:
echo  https://shaheryarakbar.github.io/qistflow/
echo ========================================================
pause
