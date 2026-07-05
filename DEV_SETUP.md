# Development setup and troubleshooting

This document contains quick commands to fix common developer issues encountered in this repository: detached HEAD when pulling, and failing or non-interactive npm installs.

## Fix a detached HEAD ("You are not currently on a branch")

If you see:

  Command failed: git pull You are not currently on a branch. Please specify which branch you want to merge with.

Do this:

1. Check where you are:

```
git status
git rev-parse --abbrev-ref HEAD
```

If the second command prints `HEAD` you're detached.

2. Save any local work:

- Commit: `git add -A && git commit -m "WIP: save local changes"`
- Or stash: `git stash push -m "WIP"`

3. Create a branch using the current state (keeps your work):

```
git switch -c fix/detached-HEAD
```

4. Track and pull from the remote default branch (replace `main` if your repo uses a different default):

```
git fetch origin
git branch --set-upstream-to=origin/main fix/detached-HEAD
git pull --ff-only
```

If you want to discard local changes and match remote `main` exactly (use with caution):

```
git fetch origin
git reset --hard origin/main
```

## Clean npm install (recommended)

1. Ensure Node & npm versions are correct:

```
node -v
npm -v
```

Use nvm if you need to switch versions (recommended for development):

```
nvm install 18
nvm use 18
```

2. Clean and reinstall dependencies:

```
rm -rf node_modules package-lock.json
npm cache clean --force
npm ci --prefer-offline --no-audit --progress=true
```

3. Capture verbose install logs if things still fail and share them for diagnosis:

```
npm install --verbose 2>&1 | tee npm-install.log
```

## Why `.npmrc` was added

The repository includes an `.npmrc` file with `progress=true` to ensure npm's progress output (animation) is enabled in interactive terminals. Note that npm disables progress when it detects a CI environment (`CI=true`) or if stdout is not a TTY. If you still don't see progress, check your terminal settings and `CI` env var.

## If you want me to make further repo changes

I can open a PR with additional automation (CI job to validate installs, pre-commit hooks, or a `scripts/` helper) — tell me which changes you want and I'll create the branch and PR.
