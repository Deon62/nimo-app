import type { LucideIcon } from 'lucide-react-native';
import { Bell, CircleHelp, Info, PhoneCall, ShieldCheck, UserRound, AudioLines } from 'lucide-react-native';

export type SettingsSectionId = 'account' | 'calling' | 'voice' | 'privacy' | 'notifications' | 'help' | 'about';

export type SettingsItem =
  | { kind: 'toggle'; id: string; label: string; detail?: string; defaultValue: boolean }
  | { kind: 'choice'; id: string; label: string; options: string[]; defaultValue: string }
  | { kind: 'info'; id: string; label: string; value: string }
  | { kind: 'link'; id: string; label: string; detail?: string; destructive?: boolean };

export interface SettingsGroup {
  title?: string;
  footer?: string;
  items: SettingsItem[];
}

export interface SettingsSection {
  id: SettingsSectionId;
  title: string;
  icon: LucideIcon;
  groups: SettingsGroup[];
}

export const settingsSections: SettingsSection[] = [
  {
    id: 'account',
    title: 'Account details',
    icon: UserRound,
    groups: [
      {
        items: [
          { kind: 'info', id: 'name', label: 'Name', value: 'Deon Mensah' },
          { kind: 'info', id: 'email', label: 'Email', value: 'deon@example.com' },
          { kind: 'info', id: 'phone', label: 'Phone', value: '+44 7700 900123' },
        ],
      },
      {
        title: 'Plan',
        items: [
          { kind: 'info', id: 'plan', label: 'Current plan', value: 'Free' },
          { kind: 'link', id: 'upgrade', label: 'Explore Nimo Plus' },
        ],
      },
    ],
  },
  {
    id: 'calling',
    title: 'Calling preferences',
    icon: PhoneCall,
    groups: [
      {
        items: [
          { kind: 'toggle', id: 'speaker', label: 'Start calls on speaker', defaultValue: false },
          { kind: 'toggle', id: 'haptics', label: 'Haptic feedback', defaultValue: true },
          { kind: 'toggle', id: 'captions', label: 'Show live captions', defaultValue: true },
        ],
      },
      {
        title: 'Limits',
        items: [
          {
            kind: 'choice',
            id: 'reminder',
            label: 'Call length reminder',
            options: ['Off', '10 min', '20 min', '30 min'],
            defaultValue: '20 min',
          },
        ],
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice preferences',
    icon: AudioLines,
    groups: [
      {
        items: [
          {
            kind: 'choice',
            id: 'pace',
            label: 'Speaking pace',
            options: ['Relaxed', 'Natural', 'Brisk'],
            defaultValue: 'Natural',
          },
          {
            kind: 'choice',
            id: 'language',
            label: 'Language',
            options: ['English (UK)', 'English (US)'],
            defaultValue: 'English (UK)',
          },
        ],
      },
      {
        items: [{ kind: 'toggle', id: 'fillers', label: 'Natural pauses', defaultValue: true }],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and data',
    icon: ShieldCheck,
    groups: [
      {
        items: [
          { kind: 'toggle', id: 'transcripts', label: 'Save call transcripts', defaultValue: true },
          { kind: 'toggle', id: 'improve', label: 'Help improve Nimo', defaultValue: false },
        ],
      },
      {
        items: [
          { kind: 'link', id: 'export', label: 'Download my data' },
          { kind: 'link', id: 'delete', label: 'Delete call history', destructive: true },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    groups: [
      {
        items: [
          { kind: 'toggle', id: 'summaries', label: 'Call summaries', defaultValue: true },
          { kind: 'toggle', id: 'reminders', label: 'Scheduled call reminders', defaultValue: true },
          { kind: 'toggle', id: 'news', label: 'New agents', defaultValue: false },
        ],
      },
    ],
  },
  {
    id: 'help',
    title: 'Help and support',
    icon: CircleHelp,
    groups: [
      {
        items: [
          { kind: 'link', id: 'guide', label: 'Getting started with Nimo' },
          { kind: 'link', id: 'faq', label: 'Frequently asked questions' },
          { kind: 'link', id: 'contact', label: 'Contact support' },
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'About Nimo',
    icon: Info,
    groups: [
      {
        items: [
          { kind: 'info', id: 'version', label: 'Version', value: '1.0' },
          { kind: 'link', id: 'terms', label: 'Terms of service' },
          { kind: 'link', id: 'privacy-policy', label: 'Privacy policy' },
        ],
      },
    ],
  },
];

export function getSettingsSection(id: string | undefined): SettingsSection | undefined {
  return settingsSections.find((section) => section.id === id);
}
