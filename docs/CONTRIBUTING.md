# Contributing to PMInsight

Thank you for your interest in contributing to PMInsight! 🎉

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/yourusername/pminsight.git
cd PMInsight
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes

- Follow existing code style
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and descriptive

### 4. Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add risk probability calculator"
git commit -m "fix: resolve stakeholder duplicate issue"
git commit -m "docs: update API documentation"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Development Guidelines

### Backend (.NET)

- Follow Clean Architecture principles
- Use MediatR for CQRS
- Validate with FluentValidation
- Write unit tests for business logic
- Add integration tests for API endpoints

### Frontend (React)

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript strictly (no `any`)
- Style with Tailwind classes
- Test components with React Testing Library

### General

- Run linters before committing: `pnpm lint`
- Run tests: `pnpm test`
- Format code: `pnpm format`
- Check for type errors

## Questions?

Feel free to open an issue or discussion!
