export interface Skill {
  id: string;
  name: string;
  description: string;
  expandedDescription: string;
  icon: string;
  category: 'architecture' | 'testing' | 'security' | 'quality' | 'tooling';
  version: string;
  pluginDirName: string;
  enabled: boolean;
  order: number;
}
