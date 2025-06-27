import { motion } from "framer-motion";

  // FlashCardHeader component
  function FlashCardHeader({ title, performance }: { title: string; performance: any }) {
    return (
      <motion.div
        className="text-center space-y-6 relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg font-medium text-primary">{performance.level} {performance.emoji}</p>
      </motion.div>
    );
  }


export default FlashCardHeader;