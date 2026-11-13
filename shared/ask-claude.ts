// "Ask Claude" from a plugin panel: a new terminal tab running Claude Code
// with a prompt. The prompt goes on a shell command line inside double
// quotes, so only text that the shell reads literally there may go in it:
// anything else (a check's name, a problem's text) is left for Claude to read
// from the source itself.

/** Characters the shell takes literally inside double quotes, and nothing
 *  that could end the quotes or start an expansion. */
const SAFE = /^[A-Za-z0-9 _.,:;/()\[\]=?#&%@+-]*$/;

export function shellSafe(text: string): boolean {
  return SAFE.test(text);
}

/** The command line, or null when the prompt has a character the shell
 *  could read as something else. */
export function claudeCommand(prompt: string): string | null {
  const p = prompt.replace(/\s+/g, " ").trim();
  return p && shellSafe(p) ? `claude "${p}"` : null;
}
