# Установка БАЗА. Ё. 2.3

Накопительный архив поверх 2.2 (содержит также прежние файлы патча 2.2). Экспортируйте прогресс, закройте приложение, остановите сервер, сохраните резервную копию папки и распакуйте архив с заменой файлов в существующий репозиторий. Не удаляйте .git и оригинальный портрет Пушкина. Генерируемые sw.js и runtime-index.json необходимо пересобрать в рабочей копии. Три размера текста сохраняются локально отдельно от экспортируемого прогресса.

Запускайте каждую команду отдельно в PowerShell:

```powershell
cd "D:\Users\User\Desktop\baza-russian"
```

```powershell
npm.cmd run pwa:build
```

```powershell
npm.cmd test
```

```powershell
node scripts/audit-quality.mjs --strict
```

```powershell
.\start.bat
```

После локальной приёмки и остановки сервера:

```powershell
git status
```

```powershell
git add -A
```

```powershell
git commit -m "v2.3 - Learning prerequisites, skill steps and responsive diagrams"
```

```powershell
git push
```

В локальной среде подтверждены 7 целевых тестов и 700 состояний автономного HTML. Полный репозиторий, PWA и все прежние тесты требуют проверки в рабочей копии.
