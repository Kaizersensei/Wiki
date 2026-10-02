
export enum SocialPlatform {
  TWITTER = 'Twitter/X',
  BLUESKY = 'Bluesky',
  YOUTUBE = 'YouTube Community',
  INSTAGRAM = 'Instagram',
  FACEBOOK = 'Facebook',
  THREADS = 'Threads',
  KOFI = 'Ko-fi',
  PATREON = 'Patreon',
  KICKSTARTER = 'Kickstarter'
}

export enum PostGoal {
  FAN_SERVICE = 'Fan Service',
  ATTRACT = 'Attract New Audience',
  FUNDING = 'Funding/Donation',
  NEWS = 'News/Update',
  STORYTELLING = 'Storytelling',
  PROMOTION = 'Product Promotion'
}

export interface PostVariant {
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  charCount: number;
  status: 'draft' | 'optimized' | 'generating';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  baseDraft: string;
  variants: PostVariant[];
  mediaUrl?: string;
  goals: PostGoal[];
  category: string;
}

export interface AppState {
  baseDraft: string;
  variants: PostVariant[];
  isGenerating: boolean;
  selectedPlatforms: SocialPlatform[];
  selectedGoals: PostGoal[];
  mediaUrl?: string;
  history: HistoryItem[];
  view: 'planner' | 'history';
}
