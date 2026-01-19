# Contributing to AccountSafe

Thank you for considering contributing to AccountSafe! This document outlines the process and guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **Python** 3.10 or higher
- **Git** for version control
- Code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/accountsafe.git
   cd accountsafe
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/accountsafe.git
   ```

### Local Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work. Use descriptive branch names:

```bash
git checkout -b feature/add-password-generator
git checkout -b fix/mobile-menu-overflow
git checkout -b refactor/improve-encryption-performance
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Adding or updating tests

### 2. Make Your Changes

- Write clean, readable code
- Follow the project's code standards (see below)
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

#### Frontend Testing
```bash
cd frontend
npm test
npm run build  # Ensure production build works
```

#### Backend Testing
```bash
cd backend
python manage.py test
```

### 4. Commit Your Changes

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Standards

### Frontend (React/TypeScript)

#### Component Structure
- Use **functional components** with hooks (no class components)
- One component per file
- Component files should use PascalCase: `ProfileCard.tsx`

#### Styling
- Use **Tailwind CSS** for all styling
- No raw CSS files or inline styles (except for dynamic values)
- Follow the existing design system (colors, spacing, typography)

#### TypeScript
- Use proper type annotations
- Avoid `any` type unless absolutely necessary
- Define interfaces for all props and data structures

**Example:**
```typescript
interface ProfileCardProps {
  profile: Profile;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEdit, onDelete }) => {
  return (
    <div className="as-card p-4 rounded-lg">
      <h3 className="text-lg font-semibold">{profile.title}</h3>
      {/* ... */}
    </div>
  );
};
```

#### Code Organization
- Group related functionality together
- Extract reusable logic into custom hooks
- Use meaningful variable and function names
- Add comments for complex logic

### Backend (Django/Python)

#### Python Standards
- Follow **PEP 8** style guide
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black formatter standard)
- Use docstrings for all functions and classes

**Example:**
```python
def encrypt_data(plain_text: str) -> str:
    """
    Encrypts sensitive data using AES-256-CBC via Fernet.
    
    Args:
        plain_text: The plaintext string to encrypt
        
    Returns:
        The encrypted string in base64 encoding
        
    Raises:
        ValueError: If plain_text is empty
    """
    if not plain_text:
        raise ValueError("Plain text cannot be empty")
    
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet = Fernet(base64.urlsafe_b64encode(key))
    return fernet.encrypt(plain_text.encode()).decode()
```

#### Django Best Practices
- Use Django ORM for all database operations
- Validate all user inputs in serializers
- Use DRF's permission classes for access control
- Add proper error handling and logging

#### Security Guidelines
- Never log sensitive data (passwords, tokens, etc.)
- Always use environment variables for secrets
- Sanitize all user inputs
- Use parameterized queries (ORM handles this)

## Commit Message Guidelines

We follow the **Conventional Commits** specification for clear and semantic commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring (no functional changes)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)

### Examples

```bash
feat: add password strength indicator to credential form

fix: resolve mobile menu overflow issue on small screens

refactor: extract encryption logic into separate service

docs: update installation instructions for Windows users

perf: optimize credential search query with database indexing

test: add unit tests for encryption module
```

### Additional Guidelines

- Use the imperative mood ("add feature" not "added feature")
- Keep the subject line under 50 characters
- Capitalize the subject line
- No period at the end of the subject line
- Add a blank line between subject and body
- Wrap the body at 72 characters
- Use the body to explain *what* and *why*, not *how*

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] No console errors or warnings
- [ ] Commits follow the commit message guidelines

### Submitting a PR

1. **Use a clear title** following the same format as commit messages:
   ```
   feat: add two-factor authentication support
   ```

2. **Fill out the PR template** with:
   - Description of changes
   - Related issue number (e.g., "Closes #123")
   - Screenshots for UI changes
   - Testing steps

3. **Request review** from maintainers

4. **Respond to feedback** promptly and professionally

### After Submission

- Be patient - reviews may take a few days
- Be open to suggestions and feedback
- Make requested changes in new commits (don't force-push)
- Update your branch if main has moved forward:
  ```bash
  git fetch upstream
  git rebase upstream/main
  ```

## Issue Reporting

### Before Creating an Issue

- **Search existing issues** to avoid duplicates
- Check if it's already fixed in the latest version
- Verify it's not a configuration issue

### Creating a Bug Report

Use the bug report template and include:

1. **Clear title**: "Mobile: Credential menu not clickable on iOS Safari"
2. **Description**: What happened and what you expected
3. **Steps to reproduce**:
   ```
   1. Open AccountSafe on iPhone
   2. Navigate to a credential
   3. Click the kebab menu (three dots)
   4. Menu appears but buttons are not clickable
   ```
4. **Environment**:
   - OS: iOS 16.5
   - Browser: Safari 16.5
   - App version: 1.2.0
5. **Screenshots/Logs**: Attach relevant images or console errors

### Creating a Feature Request

Use the feature request template and include:

1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: What other approaches did you think about?
4. **Additional context**: Mockups, examples from other apps, etc.

---

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub Discussions
- Ask in the issue comments
- Contact the maintainers directly

Thank you for contributing to AccountSafe! 🎉
