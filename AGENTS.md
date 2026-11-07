# Ticket tracking

Track tickets in local Markdown files under `.scratch/`. Each feature or bug
gets its own ticket directory:

```text
sample-project/.scratch/
├── sample-ticket-a/
│   ├── issues/
│   │   ├── 01-sample-task.md
│   │   ├── 02-sample-task.md
│   │   └── 03-sample-task.md
│   ├── map.md
│   └── spec.md
└── sample-ticket-b/
    ├── issues/
    │   └── 01-sample-task.md
    └── spec.md
```

- Create tickets when specifically asked to write a plan or spec.
- Do not create tickets for every single change request.
- Use a descriptive ticket directory name for each feature or bug.
- Write the technical design document in `spec.md`.
- Add an optional `map.md` to define scope when needed.
- Track tasks in `issues/` as numbered Markdown files, such as
  `01-sample-task.md`.
- Each task must be testable and fit within a single context window.
- Keep ticket files local; `.scratch/` is ignored by Git.
