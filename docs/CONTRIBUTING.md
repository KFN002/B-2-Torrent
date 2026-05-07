# Contributing to B-2-Torrent

Thank you for considering contributing to B-2-Torrent! We welcome contributions from the community.

## Before You Start

**Important**: B-2-Torrent is licensed for **personal use only**. Commercial use requires a separate license. By contributing, you agree that your contributions will be licensed under the same terms.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/b-2-torrent.git
   cd b-2-torrent
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Go 1.21+
- Node.js 18+
- PostgreSQL 15+

### Local Setup
```bash
# Start services
docker-compose up -d

# Backend
cd backend
go mod download
go run cmd/server/main.go

# Frontend
cd frontend
npm install
npm run dev
```

## Contribution Guidelines

### Code Style

**Backend (Go)**
- Follow Go conventions and use `gofmt`
- Use meaningful variable names
- Add comments for complex logic
- Write table-driven tests

**Frontend (TypeScript/React)**
- Use TypeScript for type safety
- Follow React best practices
- Use functional components and hooks
- Keep components small and focused

### Commit Messages

Format:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(security): add MAC address randomization

Implements MAC randomization to prevent device tracking.
Adds new security setting in the UI.

Closes #123
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
   ```bash
   # Backend tests
   cd backend && go test ./...
   
   # Frontend tests
   cd frontend && npm test
   ```
4. **Update CHANGELOG.md** with your changes
5. **Submit PR** with clear description

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

## What to Contribute

### High Priority
- Bug fixes
- Security improvements
- Performance optimizations
- Documentation improvements
- Test coverage

### Feature Requests
- Security features
- Privacy enhancements
- Network tools
- UI/UX improvements
- Additional mini-apps

### Not Accepted
- Features that compromise security
- Telemetry or tracking
- Commercial features
- Breaking changes without discussion

## Security Vulnerabilities

**DO NOT** report security issues publicly. Email: security@b2torrent.example.com

## Code of Conduct

### Our Pledge
We pledge to make participation a harassment-free experience for everyone.

### Our Standards
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information
- Other unprofessional conduct

## Questions?

- Open an issue for bugs
- Use Discussions for questions
- Email: support@b2torrent.example.com

## License

By contributing, you agree that your contributions will be licensed under the Personal Use License. See [LICENSE.md](LICENSE.md) for details.

---

**Thank you for contributing to B-2-Torrent!**
