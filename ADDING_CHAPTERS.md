# Adding New Chapters

This site is intentionally data-driven. To add a new chapter, you only need to add a notes file and register it in one data file.

## 1. Add The Markdown Notes

Create a Markdown summary file in the project root, for example:

```text
consistency-and-consensus-summary.md
```

The existing notes files are good templates:

```text
transactions-chapter-summary.md
trouble-with-distributed-systems-summary.md
```

## 2. Register The Chapter

Open:

```text
data/chapters.js
```

Add one new object to the `window.DDIA_CHAPTERS` array:

```js
{
  id: "consistency-consensus",
  title: "Consistency and Consensus",
  subtitle: "Linearizability, ordering, consensus, and distributed transactions",
  notesPath: "./consistency-and-consensus-summary.md",
  flashcards: [
    {
      front: "What is linearizability?",
      back: "A recency guarantee where operations appear to take effect atomically at some point between invocation and response."
    }
  ],
  questions: [
    {
      prompt: "Linearizability is mainly about:",
      options: ["Compression", "Recency guarantees", "Disk layout", "Schema migration"],
      answer: 1,
      explanation: "Linearizability makes a system behave as if there is a single up-to-date copy of the data."
    }
  ],
  weakAreas: [
    {
      title: "Linearizability vs Serializability",
      text: "Linearizability is a recency guarantee for individual objects; serializability is an isolation guarantee for transactions."
    }
  ],
  cheatSheet: [
    ["Linearizability vs Serializability", "Linearizability is about freshness/recency; serializability is about transaction isolation."]
  ]
}
```

## 3. Keep These Rules

- `id` must be unique.
- `notesPath` must point to the Markdown file.
- `questions[].answer` is zero-based, so `0` means the first option.
- `flashcards`, `questions`, `weakAreas`, and `cheatSheet` can be empty arrays if you only have notes for now.
- After editing, refresh the browser.

## 4. Minimal Chapter Template

Use this when you want to add notes first and practice data later:

```js
{
  id: "chapter-id",
  title: "Chapter Title",
  subtitle: "One-line description",
  notesPath: "./chapter-summary.md",
  flashcards: [],
  questions: [],
  weakAreas: [],
  cheatSheet: []
}
```

## 5. Hosting

This is still a static site. Any host that serves HTML, CSS, JS, and Markdown files will work:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

Make sure the new Markdown file and `data/chapters.js` are committed and pushed.
