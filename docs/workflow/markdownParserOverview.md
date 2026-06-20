# Markdown Feature Overview & Agent Guidelines

> [!IMPORTANT]
> **Target Audience:** This document is explicitly written for AI coding assistants and agents tasked with maintaining, modifying, or interacting with the `screen-markdown` component in the `pdf-to-json-processor` project. Read this completely before proposing any changes to `screen-markdown.component.ts`.

## 1. Agent Behavioral Rules (Kapathy Skill Integration)
When modifying the markdown parsing logic or its component, you **MUST** adhere to the following principles based on the `kapathy skill`:

1. **Think Before Coding**: Do not assume the intent behind existing regex or string manipulations. If multiple interpretations exist for how to parse a markdown edge-case, stop and ask the user. Surface tradeoffs explicitly.
2. **Simplicity First**: Write the minimum code necessary. Do not add "flexible" abstractions or generic markdown parsers if not explicitly requested.
3. **Surgical Changes**: Touch only what you must. When fixing a bug in the `Ctrl+D` logic, **do not** refactor adjacent code, change formatting, or "improve" the `markdown-it` configuration unless it is broken. Match the existing style.
4. **Goal-Driven Execution**: Define verifiable success criteria before editing the code. (e.g., "Write a test/check for toggling `Ctrl+B` on existing yellow text, then make it pass").

## 2. Technical Stack & Core Pipeline
The markdown feature is encapsulated in `src/components/screen-markdown/screen-markdown.component.ts`. 
It processes text using a strict, secure pipeline:
- **Parser**: `markdown-it` (with `html: true`, `linkify: true`, `typographer: true`).
- **Plugins**: `markdown-it-highlightjs` (code syntax) and `markdown-it-mark` (text highlighting).
- **Sanitization**: `DOMPurify.sanitize()` is MANDATORY to prevent XSS.
- **Angular Integration**: The sanitized HTML is trusted via `$sce.trustAsHtml()` before rendering in the view via `ng-bind-html`.

## 3. Deep Dive: Custom Hotkey & Highlighting Logic
> [!WARNING]
> The most complex and brittle part of this component is the `handleKeydown` method. It implements custom highlighting using `Ctrl+D` (Yellow) and `Ctrl+B` (Red) by manipulating the raw markdown string directly within a `<textarea>`.

### String Manipulation Constraints
Since the editor is a raw `<textarea>`, we cannot use standard DOM `document.execCommand`. Instead, we manipulate the raw string using exact character offsets:
- **Yellow Highlight (`Ctrl+D`)**: Wraps text in `<mark>...</mark>`.
- **Red Highlight (`Ctrl+B`)**: Wraps text in `<mark class="red-mark">...</mark>`.

**Agent Modding Instructions for `handleKeydown`:**
- **Exact Offsets**: The logic uses hardcoded string slices (e.g., `slice(0, -6)` to remove `<mark>`, `slice(0, -23)` to remove `<mark class="red-mark">`). If you ever change the CSS class name or tag structure, you **must** update these offset numbers.
- **Toggle Logic**: The code handles toggling. If the user presses `Ctrl+D` on text that is *already* yellow, it strips the tags. If they press `Ctrl+B` on text that is yellow, it overrides it to red.
- **DOM Sync**: After manipulating `this.rawMarkdownString`, you must call `this.onRawMarkdownChange()` to trigger re-rendering, AND you must use `this.$timeout(...)` to restore the `<textarea>` cursor selection to the new offset positions.

## 4. AngularJS & TypeScript Global Guidelines
When modifying this component, you must also adhere to the project's global conventions:
- **Strict Typing**: Avoid `any`. If you must use it due to external libraries, add a `// TODO: refactor type` comment. Use `unknown` and type-guard it where possible.
- **Safe Binding**: Bindings are one-way (`item: '<'`). Do not use `=`.
- **Dependency Injection**: Always use `static $inject = [...]` to prevent minification issues.
- **Outside Angular Context**: If you introduce any external asynchronous operations (like standard `fetch` or `Promise`), you must wrap the state mutation in `this.$timeout(() => { ... })` to trigger the AngularJS digest cycle.

> [!TIP]
> **Summary for Agents**: Make surgical string-manipulation changes, respect the `$timeout` digest cycle, keep it simple, and always run changes through `DOMPurify`.
