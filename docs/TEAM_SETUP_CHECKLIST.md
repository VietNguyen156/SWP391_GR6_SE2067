# TEAM SETUP CHECKLIST

## Team lead

- [ ] Create GitHub repository.
- [ ] Push this starter to `main`.
- [ ] Create `develop` from `main`.
- [ ] Protect `main` and `develop` from direct pushes.
- [ ] Require at least one Pull Request approval.
- [ ] Replace DEV 1–DEV 5 with member names in the task document.
- [ ] Assign one integration lead.
- [ ] Confirm API contract with the whole team.

## Every developer

- [ ] Install Java 17, Maven, Node.js, MySQL, Git, and VS Code extensions.
- [ ] Clone the repository.
- [ ] Copy `.env.example` to `.env`.
- [ ] Create local `toeic_learning` database.
- [ ] Run backend health endpoint.
- [ ] Run frontend homepage.
- [ ] Create the assigned feature branch.
- [ ] Read project rules and file ownership.

## First team smoke test

- [ ] `GET /api/v1/health` returns success.
- [ ] `GET /api/v1/public/courses` returns two seeded courses.
- [ ] Frontend displays the course cards.
- [ ] Backend tests pass.
- [ ] Frontend build passes.
- [ ] No `.env`, `node_modules`, or `target` files appear in `git status`.

