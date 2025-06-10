# Complete Git Repository Setup and Push Guide

This guide will help you set up your Git repository from scratch and push it to GitHub.

## 1. Initial Setup Check

First, let's check if Git is already initialized in your folder:

```bash
cd c:\Users\Reform\Desktop\EduPlanner-master
git status
```

If you see an error like "fatal: not a git repository", continue to step 2.
If Git is already initialized, skip to step 3.

## 2. Initialize Git Repository

```bash
git init
```

## 3. Check Current Branch Name

Let's verify what branch you're on:

```bash
git branch
```

If you don't see any output or see an error, you likely don't have any commits yet, which is normal for a new repo.

## 4. Create .gitignore File

Create a .gitignore file to avoid committing unnecessary files:

```bash
# Create .gitignore file
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo build/ >> .gitignore
echo dist/ >> .gitignore
echo .DS_Store >> .gitignore
echo npm-debug.log* >> .gitignore
echo .vscode/ >> .gitignore
echo *.log >> .gitignore
```

## 5. Connect to Remote Repository

Set up the connection to your GitHub repository:

```bash
git remote add origin https://github.com/AbrahamGyamfi/EduPlanner2.git
```

To verify the remote repository was added:

```bash
git remote -v
```

## 6. Add Your Files

Stage all your files:

```bash
git add .
```

## 7. Commit Your Changes

Create your first commit:

```bash
git commit -m "Initial commit of EduPlanner project"
```

## 8. Set Default Branch Name

```bash
git branch -M main
```

This renames your default branch to "main" regardless of what it was before.

## 9. Push to GitHub

Push your code to GitHub:

```bash
git push -u origin main
```

## 10. Verify on GitHub

Visit https://github.com/AbrahamGyamfi/EduPlanner2 to confirm your code has been pushed.

## Troubleshooting

### If push fails with "updates were rejected"

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### If asked for GitHub credentials

If prompted for credentials, enter your GitHub username and your personal access token (not your password).

### If authentication fails

You may need to set up a personal access token:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate a new token with "repo" permissions
3. Use this token as your password when prompted

### If you want to use a different branch name

```bash
# Replace "your-branch-name" with your desired name
git branch -M your-branch-name
git push -u origin your-branch-name
```
