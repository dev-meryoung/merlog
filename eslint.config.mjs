import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import eslintPluginPrettier from 'eslint-plugin-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,jsx,ts,tsx,d.ts}'],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-useless-rename': 'error',
      eqeqeq: 'error',
      camelcase: ['error', { properties: 'never' }],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-destructuring': ['error', { array: false, object: true }],

      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-pascal-case': 'error',
      'react/jsx-handler-names': [
        'error',
        { eventHandlerPropPrefix: 'handle' },
      ],
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'import/no-default-export': 'off',
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  globalIgnores([
    'node_modules/**',
    'public/**',
    'build/**',
    'dist/**',
    '.next/**',
    '.cache/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
