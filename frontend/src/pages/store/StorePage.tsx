import { motion } from 'motion/react';
import StoreTab from '@/src/domains/store/products/ui/StoreTab';

export default function StorePage() {
  return (
    <motion.div
      key="store-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StoreTab />
    </motion.div>
  );
}
