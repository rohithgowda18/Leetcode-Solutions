# LeetCode Solutions

A minimal, fast, and secure local application designed specifically for organizing and revising **Java** LeetCode solutions.

When you solve a problem on LeetCode in Java, save your code locally and use this tool to automatically organize it into a structured, revision-ready repository.

---

## 1. What the Application Does

- Takes a **LeetCode Problem Number** (e.g., `1`, `121`) and your **Java Solution** (`Solution.java`).
- Automatically retrieves public problem metadata (Title, Difficulty, Topics, Description, URL) without requiring authentication.
- Converts problem descriptions into clean, formatted GitHub-ready Markdown.
- Automatically creates a normalized 4-digit zero-padded folder (e.g. `0001-two-sum/`).
- Generates `README.md` containing the problem details and references `Solution.java`.
- Stores your Java solution as `Solution.java` inside the folder.
- Detects existing problems and prevents accidental overwrites.
- Provides an **offline revision explorer** to review problems and solutions side-by-side without opening LeetCode.
- Displays copyable manual Git commands for your repository workflow.

---

## 2. Security & Privacy

> **IMPORTANT SECURITY NOTE:**  
> **This application does not require your LeetCode session cookie or CSRF token. Never paste those credentials into this application.**

- **No Cookies or Sessions:** Does not ask for `LEETCODE_SESSION`, CSRF tokens, or passwords.
- **No GitHub API Tokens:** Does not connect to GitHub API or execute automated pushes.
- **Local Only:** All files and code remain 100% on your local machine.
- **No AI Processing:** Does not transmit your solution code to external AI services.

---

## 3. Repository File Structure

Organized solutions are stored in `dsa/` and `database/`:

```
.
├── database/
│   ├── 0180-consecutive-numbers/
│   │   ├── README.md
│   │   └── Solution.sql
│   └── 0610-triangle-judgement/
│       ├── README.md
│       └── Solution.sql
└── dsa/
    ├── 0001-two-sum/
    │   ├── README.md
    │   └── Solution.java
    └── 0207-course-schedule/
        ├── README.md
        └── Solution.java
```

### Example `README.md`:

```markdown
# 1. Two Sum

**Difficulty:** Easy

**LeetCode:** https://leetcode.com/problems/two-sum/

## Description

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

### Example 1:

```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

### Constraints:

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`
- Only one valid answer exists.

## Topics

- Array
- Hash Table

## Java Solution

See `Solution.java`.
```

---

## 4. Installation & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 5. Usage Example (Problem #1: Two Sum)

1. Open the application in your browser.
2. Enter `1` in the **Problem Number** field. The tool will automatically fetch public metadata for *Two Sum*.
3. Click **Choose File** to select your `Solution.java`, or drop the file / paste your Java code into the editor.
4. Click **[ ADD PROBLEM ]**.
5. The folder `leetcode-solutions/0001-two-sum/` is created immediately containing `README.md` and `Solution.java`.
6. Copy the provided Git commands to push manually.

---

## 6. Supported Language

This tool is strictly dedicated to **Java**:
- All solution files are saved with the standard Java name: `Solution.java`.
- No language dropdowns or unrelated language syntax overhead.

---

## 7. Metadata Source & Local Caching

- **Public Endpoint:** Uses public, unauthenticated LeetCode GraphQL endpoints to retrieve question titles, topics, difficulty, and HTML content.
- **Local Disk Cache:** Fetched problem metadata is stored in `data/problems-cache.json`. Subsequent requests for the same problem load instantly from disk without hitting the network.
- **Offline Fallback:** If offline and a problem is in cache or built-in fixtures, it loads seamlessly.

---

## 8. Duplicate Handling

If `0001-two-sum/` already exists in your local folder:
- The tool alerts you: `"Problem #1 already exists."`
- Offers **[ Cancel ]** or **[ Replace Solution ]**.
- If replacing, only `Solution.java` is updated; the existing `README.md` is preserved.

---

## 9. Manual Git Workflow

The application does not touch your Git remote. After adding problems, run in your terminal:

```bash
git add .
git commit -m "Add Two Sum"
git push
```

---

## 10. Troubleshooting

- **Problem metadata not loading?**
  Ensure your network connection is active, or verify that the problem number is valid. If offline, cached problems will continue to work.
- **Replacing a solution?**
  Click **Replace Solution** in the duplicate confirmation dialog to overwrite `Solution.java` with your updated code.
