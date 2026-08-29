const allowedTypes = [
  'feat',
  'docs',
  'config',
  'design',
  'style',
  'refactor',
  'test',
  'chore',
  'fix',
  'hotfix',
  'build',
  'ci',
  'perf',
];

module.exports = {
  extends: ['@commitlint/config-conventional'],

  plugins: [
    {
      rules: {
        'subject-has-reference': ({ subject }) => {
          if (!subject) {
            return [false, '커밋 메시지의 설명이 없습니다.'];
          }

          const referencePattern = / #(?:0|[1-9]\d*)$/;

          if (!referencePattern.test(subject.trim())) {
            return [
              false,
              '커밋 메시지 끝에 "#참조번호"를 적어야 합니다. 예: feat: 포스트 검색 구현 #7 또는 docs: 새 포스트 작성 #0',
            ];
          }

          return [true];
        },
      },
    },
  ],

  rules: {
    'type-enum': [2, 'always', allowedTypes],
    'type-case': [2, 'always', 'lower-case'],
    'scope-empty': [2, 'always'],
    'subject-empty': [2, 'never'],
    'subject-has-reference': [2, 'always'],
    'subject-case': [0],
  },
};
