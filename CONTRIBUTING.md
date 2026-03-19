# Contributing

Thanks for contributing to `@acvil-tiptap/react`.

## Toolchain

This project uses Vite+ (`vp`) as the unified workflow. Please use `vp` commands instead of calling package managers directly.

## Local Setup

```bash
vp install
```

## Quality Gates

```bash
vp check
vp test
vp pack
```

Before publishing, run:

```bash
vp run release:check
```

## Example App

```bash
vp run example
```

If you only want the collaboration server:

```bash
vp run example:server
```
