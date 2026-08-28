# 🚀 LeetCode Solutions (Automation & Development Branch)

Welcome to the **`develop`** branch of [Leetcode-Solutions](https://github.com/rohithgowda18/Leetcode-Solutions).

This branch contains the automation engine, GitHub Actions workflows, CLI scripts, and local web tools for automatically organizing **Java (DSA)** and **MySQL (Database)** solutions into revision-ready folders with LeetCode-styled READMEs.

---

## ⚡ 3 Ways to Organize Your Solutions

### 1. ☁️ GitHub Cloud Automation (Zero Local Setup)
You can add solutions directly inside GitHub in your browser without running any code locally:
1. Switch to the **`develop`** branch on GitHub.
2. Upload or create your solution file in:
   - **`input-solutions/dsa/`** $\rightarrow$ for Java problems (e.g., `1.java`, `121.java`, `207.java`)
   - **`input-solutions/database/`** $\rightarrow$ for SQL problems (e.g., `180.sql`, `610.sql`)
3. Click **Commit Changes**.
4. **GitHub Actions** (`.github/workflows/organize.yml`) will automatically trigger:
   - Fetches official LeetCode problem titles, difficulty badges, tags, and descriptions.
   - Generates the LeetCode-styled `README.md` and `Solution.java` / `Solution.sql`.
   - Moves them into `dsa/` or `database/`.
   - Cleans up the `input-solutions/` folder automatically.

---

### 2. 💻 Local Terminal CLI (Fastest for Many Files)
When you have multiple solution files on your computer:
1. Drop your `.java` and `.sql` files into `input-solutions/dsa/` and `input-solutions/database/`.
2. Run in your terminal:
   ```bash
   npm run organize:push
   ```
3. This command will:
   - Scan and process all files.
   - Fetch metadata from LeetCode.
   - Create organized folders with READMEs.
   - Delete temporary loose source files.
   - Automatically run `git add`, `git commit`, and `git push`.

> **Tip:** If you only want to organize locally without pushing, run:
> ```bash
> npm run organize
> ```

---

### 3. 🌐 Local Web App & Offline Revision Explorer
If you prefer a visual interface:
1. Start the local server:
   ```bash
   npm run dev
   ```
2. Open **`http://localhost:3000`** in your browser.
3. Features available:
   - **Add Solution**: Enter problem number, paste code, or select multiple files.
   - **Revision Explorer**: Browse all solved problems offline, view descriptions, topics, and your code side-by-side.

---

## 📂 Repository File Structure

```
.
├── .github/
│   └── workflows/
│       └── organize.yml     # Automated cloud organizer workflow
│
├── database/                # Organized LeetCode Database (SQL) solutions
│   ├── 0180-consecutive-numbers/
│   │   ├── README.md
│   │   └── Solution.sql
│   └── 0610-triangle-judgement/
│       ├── README.md
│       └── Solution.sql
│
├── dsa/                     # Organized LeetCode Data Structures & Algorithms solutions
│   └── 0207-course-schedule/
│       ├── README.md
│       └── Solution.java
│
├── input-solutions/         # Drop raw solution files here
│   ├── database/            # (.sql files e.g. 180.sql, 610.sql)
│   └── dsa/                 # (.java files e.g. 1.java, 207.java)
│
├── scripts/
│   └── organize.ts          # Core automation script
├── src/                     # Web application source code
└── server/                  # Backend API and LeetCode GraphQL fetcher
```
