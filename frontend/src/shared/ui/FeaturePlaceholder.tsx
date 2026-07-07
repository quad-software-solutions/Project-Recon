import { motion } from 'motion/react';
import { Card } from './Card';

interface FeaturePlaceholderProps {
  name: string;
  description?: string;
  icon?: string;
  className?: string;
}

const ICONS: Record<string, string> = {
  store: '🏪',
  programs: '📚',
  competition: '🏆',
  community: '💬',
  notifications: '🔔',
  analytics: '📊',
  certificates: '🎓',
  vex: '🤖',
  consultancy: '💡',
  referrals: '🔗',
  leaderboard: '🏅',
  video: '🎬',
  simulator: '🛠️',
  cart: '🛒',
  teacher: '👨‍🏫',
  parent: '👪',
  search: '🔍',
  registration: '📝',
  settings: '⚙️',
  sponsors: '🤝',
  schools: '🏫',
  media: '📸',
  payments: '💳',
  events: '📅',
  branding: '🎨',
  achievements: '⭐',
  resources: '📖',
  attendance: '✅',
  default: '🚀',
};

export function FeaturePlaceholder({ name, description, icon, className = '' }: FeaturePlaceholderProps) {
  const emoji = icon ? (ICONS[icon] || ICONS.default) : ICONS.default;

  return (
    <Card className={`flex flex-col items-center justify-center text-center py-16 px-8 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <span className="text-6xl block mb-6">{emoji}</span>
        <h3 className="text-2xl font-bold text-brand-ink mb-3">{name} — Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto text-base leading-relaxed">
          {description || `This feature is under development and will be available in a future update.`}
        </p>
      </motion.div>
    </Card>
  );
}
