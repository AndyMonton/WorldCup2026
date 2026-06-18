<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contrast and Color Readability Rule
- **Never use hardcoded `text-white`** (or other absolute light colors) for key text elements without a dark fallback class or specifying dark/light specific utility classes (e.g. `text-slate-900 dark:text-white`).
- When designing UI elements, **always ensure that colors adapt dynamically to light and dark modes**. A color that is readable in dark mode (e.g. white scores) will be completely invisible on light mode backgrounds.
- Always use semantic theme colors like `text-foreground` or responsive classes to avoid recurring contrast issues.
