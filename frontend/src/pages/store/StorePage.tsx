import { motion } from 'motion/react';
import StoreTab from '../../domains/store/products/ui/StoreTab';

interface StorePageProps {
  openCart: () => void;
}

export default function StorePage({ openCart }: StorePageProps) {
  return (
    <motion.div key="store-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <StoreTab openCart={openCart} />
    </motion.div>
  );
}
