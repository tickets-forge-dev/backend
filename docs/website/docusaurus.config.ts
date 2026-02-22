import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';

const config: Config = {
  title: 'Forge Documentation',
  tagline: 'From intent to execution-ready tickets',
  favicon: 'img/logo.svg',
  url: 'https://forge-docs.local',
  baseUrl: '/',
  organizationName: 'forge',
  projectName: 'forge-docs',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Forge',
      logo: {
        alt: 'Forge logo',
        src: 'img/logo.svg',
      },
      items: [
        {type: 'doc', docId: 'introduction', position: 'left', label: 'Introduction'},
        {type: 'doc', docId: 'getting-started', position: 'left', label: 'Getting Started'},
        {type: 'doc', docId: 'what-is-forge', position: 'left', label: 'What is Forge'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/'},
            {label: 'Getting Started', to: '/getting-started'},
            {label: 'What is Forge', to: '/what-is-forge'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Forge.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
