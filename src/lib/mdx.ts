import fs from 'fs/promises';
import path from 'path';
import { ReactElement } from 'react';
import type { Element, Root, RootContent } from 'hast';
import { notFound } from 'next/navigation';
import { compileMDX, MDXRemoteProps } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { visit } from 'unist-util-visit';
import createMDXComponents from '@/components/MDXComponents';
import type { PostData, Heading } from '@/types/post';
import { parseMdxFrontmatter } from './frontmatter';
import { getAllPosts } from './posts';

const getNodeText = (node: RootContent): string => {
  if (node.type === 'text') {
    return node.value;
  }

  if ('children' in node) {
    return node.children.map(getNodeText).join('');
  }

  return '';
};

const createHeadingId = (text: string, fallback: string): string => {
  const normalized = text
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return normalized || fallback;
};

function rehypeExtractHeadings(options: { headings: Heading[] }) {
  const headingCounts = new Map<string, number>();

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (['h1', 'h2', 'h3'].includes(node.tagName)) {
        if (node.tagName === 'h1') {
          node.tagName = 'h2';
        }

        const textContent = node.children.map(getNodeText).join('').trim();
        const baseId = createHeadingId(
          textContent,
          `section-${options.headings.length + 1}`
        );
        const duplicateCount = headingCounts.get(baseId) || 0;
        const id =
          duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount + 1}`;

        headingCounts.set(baseId, duplicateCount + 1);

        node.properties = node.properties || {};
        node.properties.id = id;

        options.headings.push({
          level: Number(node.tagName.substring(1)),
          text: textContent,
          id,
        });
      }
    });
  };
}

export const getPost = async (slug: string): Promise<PostData> => {
  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((post) => post.slug === slug);

  if (currentIndex === -1) {
    notFound();
  }

  const cachedPost = allPosts[currentIndex];
  const previousPost = allPosts[currentIndex + 1] || null;
  const nextPost = allPosts[currentIndex - 1] || null;

  const postDirectory = path.join(process.cwd(), 'public', 'posts', slug);
  const filePath = path.join(postDirectory, 'index.mdx');

  let fileContents: string;

  try {
    fileContents = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      notFound();
    }

    throw error;
  }

  const { content } = parseMdxFrontmatter(fileContents);
  const headings: Heading[] = [];

  const { content: mdxSource } = await compileMDX<MDXRemoteProps>({
    source: content,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        rehypePlugins: [
          [rehypeExtractHeadings, { headings }],
          [
            rehypePrettyCode,
            {
              theme: {
                light: 'github-light',
                dark: 'one-dark-pro',
              },
              keepBackground: false,
              lineNumbers: true,
            },
          ],
        ],
      },
    },
    components: createMDXComponents(slug),
  });

  return {
    postInfo: cachedPost,
    mdxSource: mdxSource as ReactElement<MDXRemoteProps>,
    headings,
    previousPost,
    nextPost,
  };
};
