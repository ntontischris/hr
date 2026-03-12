---
name: refactor
description: Code refactoring patterns and safety checklist. Use when refactoring, simplifying, or restructuring code.
---

# Refactoring Skill

## Golden Rules
1. **Never refactor and add features at the same time**
2. **Tests must pass before AND after refactoring**
3. **Small, incremental changes** — each should be independently committable

## Process
1. Ensure tests exist for the code being refactored
2. Make one small change
3. Run tests
4. Commit if green
5. Repeat

## Common Refactorings
- **Extract Function**: When a block of code has a clear purpose
- **Extract Component**: When JSX block is reused or > 50 lines
- **Move to Module**: When utility is used across multiple files
- **Replace Magic Numbers**: Named constants
- **Simplify Conditionals**: Early returns, guard clauses
- **Remove Dead Code**: If git has it, you don't need it commented out

## Smell → Refactoring Map
- Long function (>50 lines) → Extract Function
- Duplicate code → Extract shared utility
- Deep nesting (>3 levels) → Early returns / guard clauses
- God component (>200 lines) → Split into sub-components
- Primitive obsession → Create value object / type
