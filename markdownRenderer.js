<!-- Marked library for Markdown parsing -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script type="module">
import { getHighlighter } from 'https://cdn.jsdelivr.net/npm/shiki@0.12.0/dist/index.js';

window.MarkdownRenderer = {
  highlighter: null,

  async init(theme = 'nord') {
    if (!this.highlighter) {
      this.highlighter = await getHighlighter({ theme });
    }

    // Configure marked renderer
    this.renderer = new marked.Renderer();

    // Override code block rendering
    this.renderer.code = (code, lang) => {
      try {
        const highlighted = this.highlighter.codeToHtml(code, { lang: lang || 'text' });
        return `<div class="kr-codeblock">${highlighted}</div>`;
      } catch {
        return `<pre><code>${code}</code></pre>`;
      }
    };

    // Inline code
    this.renderer.codespan = (code) => {
      return `<code class="kr-inline">${code}</code>`;
    };
  },

  render(markdownText) {
    if (!this.renderer) return markdownText;
    return marked(markdownText, { renderer: this.renderer, gfm: true, breaks: true });
  }
};
</script>

<style>
/* Code blocks */
.kr-codeblock {
  background-color: #1e1e2f;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  margin: 6px 0;
  overflow-x: auto;
}

/* Inline code */
.kr-inline {
  background-color: #2a2a3f;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

/* General markdown */
.kr-markdown strong { font-weight: bold; }
.kr-markdown em { font-style: italic; }
.kr-markdown u { text-decoration: underline; }
.kr-markdown del { text-decoration: line-through; }
.kr-markdown blockquote {
  border-left: 3px solid #555;
  margin-left: 0;
  padding-left: 8px;
  color: #ccc;
}
.kr-markdown ul, .kr-markdown ol { padding-left: 20px; }
.kr-markdown a { color: #4ea3ff; text-decoration: none; }
.kr-markdown a:hover { text-decoration: underline; }
.kr-markdown hr { border: none; border-top: 1px solid #555; margin: 10px 0; }
.kr-markdown img { max-width: 100%; border-radius: 6px; }
.kr-markdown h1 { font-size: 1.6em; font-weight: bold; }
.kr-markdown h2 { font-size: 1.4em; font-weight: bold; }
.kr-markdown h3 { font-size: 1.2em; font-weight: bold; }
.kr-markdown h4 { font-size: 1.1em; font-weight: bold; }
.kr-markdown h5 { font-size: 1em; font-weight: bold; }
.kr-markdown h6 { font-size: 0.9em; font-weight: bold; }

/* Task lists */
.kr-markdown input[type=checkbox] { transform: scale(1.2); margin-right: 6px; }
</style>
