import type { Heading } from '@/types/post';

export type HeadingNode = Heading & {
  children: HeadingNode[];
};

export const buildHeadingTree = (headings: Heading[]): HeadingNode[] => {
  const roots: HeadingNode[] = [];
  const ancestors: HeadingNode[] = [];

  headings.forEach((heading) => {
    const node: HeadingNode = { ...heading, children: [] };

    while (
      ancestors.length > 0 &&
      ancestors[ancestors.length - 1].level >= node.level
    ) {
      ancestors.pop();
    }

    const parent = ancestors[ancestors.length - 1];

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    ancestors.push(node);
  });

  return roots;
};
