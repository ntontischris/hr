Plan the implementation of: $ARGUMENTS

Use the planner agent approach:

1. **Research Phase** — Read the relevant codebase areas:
   - Identify all files that will be affected
   - Understand current patterns and conventions
   - Check docs/decisions/ for related ADRs

2. **Design Phase** — Create a step-by-step implementation plan:
   - Break into subtasks (each 5-10 minutes of work)
   - Number them in order of execution
   - Note dependencies between steps
   - Identify potential risks

3. **Output the Plan** in this format:
   ```
   ## Feature: [name]
   
   ### Steps
   1. [Step] — File(s): path/to/file — Risk: low/med/high
   2. [Step] — File(s): path/to/file — Risk: low/med/high
   ...
   
   ### Testing Strategy
   - Unit tests for: ...
   - Integration tests for: ...
   
   ### Risks & Mitigations
   - Risk 1 → Mitigation
   ```

4. **Wait for my approval** before any implementation

DO NOT write any code yet. Only plan.
