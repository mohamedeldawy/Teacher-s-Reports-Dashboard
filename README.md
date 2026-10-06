# Teacher Lecture Report Dashboard

An academic lecture tracking and report analysis dashboard for managing and visualizing teacher lecture updates, grade levels, and spreadsheet reports.

## Dashboard data

The initial dashboard data is a snapshot of the [teacher reports Google Sheet](https://docs.google.com/spreadsheets/d/1PeUsRcrft0Cmu0G5z3xy8UCryJdOGuFg_UcBbLhgmAw/edit?usp=sharing). It contains repeating `Lectures, Teacher, Grade, Report` column groups; lecture rows are shown for each teacher section and report cells contain the submitted update or file name.

The dashboard does not sync edits from Google Sheets automatically. To load later sheet changes, export the sheet as CSV and use **Update / Import Sheet**. Imported data and dashboard edits are saved in this browser; **Reset** restores the bundled snapshot.

## Why GitHub Shows Source Code (And How to Publish the Live App)

When you sync Google AI Studio with GitHub, GitHub stores the **source code files** (`.tsx`, `.ts`, `package.json`, `index.html`). GitHub does not automatically run web servers or execute Node/React apps on its repository page.

To view and use the working application directly from GitHub, you have two quick options:

---

### Option 1: Enable GitHub Pages (Free, 1 Click)

An automated deployment file (`.github/workflows/deploy.yml`) is already configured in this repository.

1. Open your repository on **[GitHub.com](https://github.com)**.
2. Click on the **Settings** tab at the top of your repository.
3. In the left sidebar under "Code and automation", click **Pages**.
4. Under **Build and deployment** $\rightarrow$ **Source**:
   - Change from "Deploy from a branch" to **GitHub Actions**.
5. Go to the **Actions** tab at the top of your repository:
   - You will see the **Deploy to GitHub Pages** workflow running.
   - Once it completes (usually 1-2 minutes), it will give you your live URL:
     `https://<your-username>.github.io/<your-repo-name>/`

---

### Option 2: Run It Locally on Your Computer

If you cloned or downloaded the code from GitHub to your computer:

```bash
# 1. Install project dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

To create a production build locally:
```bash
npm run build
npm run preview
```

---

### Option 3: Deploy to Vercel or Netlify (Zero-Config)

1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com).
2. Click **Add New** $\rightarrow$ **Project** $\rightarrow$ Import your GitHub repository.
3. Framework preset will automatically detect **Vite**.
4. Click **Deploy**. Your app will be live with a free custom HTTPS link.
