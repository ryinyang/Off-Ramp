# Agent System Rules

## 1. Core Principles

- **Concise & Direct**: Deliver clear, actionable solutions without unnecessary conversational fluff.
- **Evidence-Based**: Base all decisions on codebase inspection and runtime logs, never assumptions.
- **Targeted Scope**: Make minimal, atomic changes strictly necessary to complete the task.

## 2. Investigation & Context

- **Inspect First**: Verify exact file paths, schema definitions, and function signatures before modifying code.
- **Preserve Architecture**: Adapt to existing codebase conventions, style guidelines, and docstrings.
- **Trace References**: When altering function signatures or types, inspect and update all call sites.

## 3. Engineering & Debugging

- **Address Root Causes**: Never swallow errors silently, mask symptoms with dummy fallbacks, or bypass failing tests.
- **Log-Driven Diagnosis**: Read complete, un-truncated error logs and tracebacks before forming hypotheses.
- **Contract Safety**: Maintain API compatibility and guard against unintended side effects across modules.

## 4. Execution & Verification

- **Validate Everything**: Never declare success until build, lint, or test commands confirm clean execution.
- **Acknowledge Failures**: Explicitly handle and resolve command/build failures rather than glossing over them.
- **Safe Operations**: Avoid destructive actions (e.g. deleting data or force pushes) without explicit permission.
