import { motion } from 'motion/react';
import CommunityForum from '../../domains/forum/posts/ui/CommunityForum';
import type { UserProfile } from '../../shared/types';

interface CommunityPageProps {
  currentUser: UserProfile;
}

export default function CommunityPage({ currentUser }: CommunityPageProps) {
  return (
    <motion.div
      key="community-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <CommunityForum currentUser={currentUser} />
    </motion.div>
  );
}
