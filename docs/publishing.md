# Публикация

## Preflight

Проверь версию:

```bash
npm view @soinproduction/kit version
node -p "require('./package.json').version"
```

Если текущая версия уже опубликована, подними patch/minor/major:

```bash
npm version patch --no-git-tag-version
```

Собери пакет:

```bash
npm run build
```

Проверь tarball:

```bash
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

В списке должны быть `dist`, `docs`, `package.json` и `readme.md`.

## Login

```bash
npm login
npm whoami
```

Если включен 2FA на publish, npm попросит OTP из authenticator.

## Publish

```bash
npm publish --access public --cache /private/tmp/soinproduction-kit-npm-cache
```

С OTP:

```bash
npm publish --access public --otp=123456 --cache /private/tmp/soinproduction-kit-npm-cache
```

## Обновление проекта

После публикации в downstream-проекте:

```bash
npm install @soinproduction/kit@latest
npm run build
```

Для точной версии:

```bash
npm install @soinproduction/kit@1.1.10
```
