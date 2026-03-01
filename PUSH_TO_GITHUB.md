# Push Peripartner to GitHub

The project is committed locally. To push to GitHub:

## 1. Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `Peripartner` (or `peripartner`)
3. Choose **Public**
4. Do **not** add a README, .gitignore, or license (the project already has them)
5. Click **Create repository**

## 2. Add the remote and push

In a terminal, from the project folder (`c:\projects\Peripartner`), run (replace **YOUR_USERNAME** with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/Peripartner.git
git branch -M main
git push -u origin main
```

If your default branch is already `master` and you want to keep it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Peripartner.git
git push -u origin master
```

## 3. If you use SSH instead of HTTPS

```bash
git remote add origin git@github.com:YOUR_USERNAME/Peripartner.git
git push -u origin main
```

After this, the project will be on GitHub under the name **Peripartner**.
