# capstone-project

A capstone project for the AI-assisted development track. This repository tracks setup, tooling, and iterative build work using Claude Code and Cursor.

## Tech Stack

- **Frontend:** React (functional components and hooks)
- **Backend:** Express REST API
- **Database:** MongoDB

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [MongoDB](https://www.mongodb.com/) (local install or [Atlas](https://www.mongodb.com/cloud/atlas))
- Git

### Setup

Application code is not scaffolded yet. Once it is, setup will look like this:

```bash
git clone https://github.com/hareemshakeel/capstone-project.git
cd capstone-project
cp .env.example .env   # fill in values before running
npm install            # exact commands TBD once project structure is added
```

## Contributing

- Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.
- Use `camelCase` for variables/functions and `PascalCase` for React components.
- Store secrets in `.env` — never commit environment files.
- Prefer explicit error handling over silent failures.

## License

MIT — see [LICENSE](LICENSE).
