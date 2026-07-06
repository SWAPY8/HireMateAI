import React from 'react';
import { motion } from 'framer-motion';
import styles from './Layout.module.css';

const PageWrapper = ({ title, subtitle, actions, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="main-content"
    >
      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actionArea}>{actions}</div>}
      </header>
      
      <main className={styles.contentBody}>
        {children}
      </main>
    </motion.div>
  );
};

export default PageWrapper;
