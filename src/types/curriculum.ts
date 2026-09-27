export type ResourceType =
  | 'youtube'
  | 'youtube-short'
  | 'google-drive'
  | 'google-docs'
  | 'gemini';

export interface Material {
  id: string;
  order: number;
  title: string;
  resourceType: ResourceType;
  url: string;
}

export interface Module {
  id: string;
  order: number;
  title: string;
  materials: Material[];
}

export interface Curriculum {
  id: string;
  title: string;
  author: string;
  date: string;
  modules: Module[];
}
