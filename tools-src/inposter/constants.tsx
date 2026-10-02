
import React from 'react';
import { SocialPlatform, PostGoal } from './types';

export const PLATFORMS_CONFIG = [
  {
    id: SocialPlatform.TWITTER,
    color: 'bg-[#000000]',
    brandColor: '#000000',
    baseUrl: 'https://twitter.com/compose/post',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>
  },
  {
    id: SocialPlatform.BLUESKY,
    color: 'bg-[#0085ff]',
    brandColor: '#0085ff',
    baseUrl: 'https://bsky.app',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.32-2.4-3.96-5.4-6.6-5.4C2.4 5.4 0 7.8 0 10.8c0 3 2.4 7.2 6.6 9 4.2 1.8 5.4 1.8 5.4 1.8s1.2 0 5.4-1.8c4.2-1.8 6.6-6 6.6-9 0-3-2.4-5.4-5.4-5.4-2.64 0-5.28 3-6.6 5.4z"/></svg>
  },
  {
    id: SocialPlatform.YOUTUBE,
    color: 'bg-[#ff0000]',
    brandColor: '#ff0000',
    baseUrl: 'https://www.youtube.com',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  },
  {
    id: SocialPlatform.INSTAGRAM,
    color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    brandColor: '#ee2a7b',
    baseUrl: 'https://www.instagram.com',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849s-.011 3.585-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.849-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849s.012-3.584.07-4.849c.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.196 4.354 2.617 6.78 6.979 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.196 6.781-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.058-1.69-.072-4.949-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  },
  {
    id: SocialPlatform.FACEBOOK,
    color: 'bg-[#1877f2]',
    brandColor: '#1877f2',
    baseUrl: 'https://www.facebook.com',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  },
  {
    id: SocialPlatform.THREADS,
    color: 'bg-[#000000]',
    brandColor: '#000000',
    baseUrl: 'https://www.threads.net',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.5c-3.584 0-6.5-2.916-6.5-6.5s2.916-6.5 6.5-6.5 6.5 2.916 6.5 6.5-2.916 6.5-6.5 6.5z"/></svg>
  },
  {
    id: SocialPlatform.KOFI,
    color: 'bg-[#29abe0]',
    brandColor: '#29abe0',
    baseUrl: 'https://ko-fi.com/manage/posts',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.933-.708-.939-1.05-1.48-.912-2.112.137-.633.72-1.077 1.256-1.077.536 0 1.096.19 1.631.95.14.19.14.19.14.19s1.428-1.14 2.193-1.14c.765 0 1.256.405 1.256 1.14.001.733-.311 1.291-1.111 2.083z"/></svg>
  },
  {
    id: SocialPlatform.PATREON,
    color: 'bg-[#f96854]',
    brandColor: '#f96854',
    baseUrl: 'https://www.patreon.com/posts/new',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M0 .48v23.04h4.22V.48H0zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.636 8.641 8.636 4.75 0 8.615-3.881 8.615-8.636 0-4.77-3.865-8.65-8.615-8.65z"/></svg>
  },
  {
    id: SocialPlatform.KICKSTARTER,
    color: 'bg-[#05ce78]',
    brandColor: '#05ce78',
    baseUrl: 'https://www.kickstarter.com',
    icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M4.64 12.01l4.78-4.78L4.64 2.45v9.56zm10.23 0l4.78 4.78V7.23l-4.78 4.78zM12 2.45l-4.78 4.78h9.56L12 2.45zm0 19.1l4.78-4.78H7.22l4.78 4.78z"/></svg>
  },
];



export const GOALS_LIST: PostGoal[] = [
  PostGoal.FAN_SERVICE,
  PostGoal.ATTRACT,
  PostGoal.FUNDING,
  PostGoal.NEWS,
  PostGoal.STORYTELLING,
  PostGoal.PROMOTION
];
