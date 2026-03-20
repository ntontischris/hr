// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './prompts';

describe('buildSystemPrompt', () => {
  it('should generate Greek prompt for employee', () => {
    const prompt = buildSystemPrompt({ role: 'employee', language: 'el' });
    expect(prompt).toContain('HR Assistant');
    expect(prompt).toContain('ΜΟΝΟ');
    expect(prompt).toContain('employee');
    expect(prompt).not.toContain('μισθοδοσία');
  });

  it('should generate Greek prompt for hr_manager', () => {
    const prompt = buildSystemPrompt({ role: 'hr_manager', language: 'el' });
    expect(prompt).toContain('HR Assistant');
    expect(prompt).toContain('μισθοδοσία');
    expect(prompt).toContain('αξιολόγηση');
  });

  it('should include role in the prompt', () => {
    const prompt = buildSystemPrompt({ role: 'admin', language: 'el' });
    expect(prompt).toContain('admin');
  });

  it('should generate English prompt when language is en', () => {
    const prompt = buildSystemPrompt({ role: 'employee', language: 'en' });
    expect(prompt).toContain('HR Assistant');
    expect(prompt).toContain('ONLY');
  });
});
