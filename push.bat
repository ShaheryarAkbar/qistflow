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
echo ========================================================
echo  Successfully pushed to GitHub!
echo  GitHub Actions is now updating your live website link:
echo  https://shaheryarakbar.github.io/qistflow/
echo ========================================================
pause
