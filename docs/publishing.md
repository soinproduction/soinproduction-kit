# Publishing

## Preflight

```bash
cd "/Users/soinp/Documents/My plugins/soinproduction-kit"
node --check src/content-switcher/contentSwitcher.js
node --check src/drawers/drawers.js
node --check src/modals/modals.js
npm run build
npm pack --dry-run --cache /private/tmp/soinproduction-kit-npm-cache
```

Check that the tarball contains:

- `dist`
- `docs`
- `package.json`
- `readme.md`

It must not contain local secrets such as recovery codes.

## Login

```bash
npm login
npm whoami
```

Expected account:

```txt
soinproduction
```

## Publish

```bash
npm publish --access public --cache /private/tmp/soinproduction-kit-npm-cache
```

## Update a Project

From the project folder that owns `package.json`:

```bash
npm install @soinproduction/kit@latest
npm run build
```

For a fixed version:

```bash
npm install @soinproduction/kit@1.1.9
```

