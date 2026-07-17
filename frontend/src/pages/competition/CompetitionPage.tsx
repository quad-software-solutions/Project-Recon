import { motion } from 'motion/react';
import { UserProfile } from '../../shared/types';
import PublicEventsRouter from '../../domains/competition/public/ui/PublicEventsRouter';

interface CompetitionPageProps {
  currentUser: UserProfile | null;
  onNavigateLogin?: () => void;
}

export default function CompetitionPage({ currentUser, onNavigateLogin }: CompetitionPageProps) {
  return (
    <motion.div key="competitions-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-white via-brand-paper to-white relative overflow-x-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(37, 51, 141, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37, 51, 141, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-red/[0.03] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-blue/[0.03] blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1800px] mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <PublicEventsRouter currentUser={currentUser} onNavigateLogin={onNavigateLogin} />
        </div>
      </div>
    </motion.div>
  );
}
