import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {files: ['**/*.{js,mjs,cjs,ts}']},
  {languageOptions: { 
    globals: {
      ...globals.browser,
      angular: 'readonly',
      $: 'readonly',
      jQuery: 'readonly'
    } 
  }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
