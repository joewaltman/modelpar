// Minimal inline formatting for copy strings: escapes HTML and turns `code` into <code>.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function rich(text: string) {
  return esc(text).replace(/`([^`]+)`/g, '<code class="code">$1</code>');
}
