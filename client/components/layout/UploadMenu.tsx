import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Image, Video, PlayCircle, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function UploadMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'post',
      label: 'Post',
      icon: Image,
      color: 'from-purple-500 to-pink-500',
      route: '/post/new',
    },
    {
      id: 'story',
      label: 'Story',
      icon: PlayCircle,
      color: 'from-orange-500 to-red-500',
      route: '/story-create',
    },
    {
      id: 'glimpse',
      label: 'Glimpse',
      icon: Video,
      color: 'from-blue-500 to-cyan-500',
      route: '/glimpse-create-new',
    },
    {
      id: 'live',
      label: 'Live',
      icon: Radio,
      color: 'from-pink-500 to-rose-500',
      route: '/live',
      comingSoon: true,
    },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.comingSoon) {
      return;
    }
    setIsOpen(false);
    setTimeout(() => navigate(item.route), 300);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1,
                    transition: { 
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }
                  }}
                  exit={{ 
                    scale: 0, 
                    y: 20, 
                    opacity: 0,
                    transition: { delay: (menuItems.length - index - 1) * 0.05 }
                  }}
                  onClick={() => handleItemClick(item)}
                  disabled={item.comingSoon}
                  className="relative group"
                >
                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap"
                  >
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                      {item.comingSoon && (
                        <span className="ml-2 text-xs text-gray-500">Soon</span>
                      )}
                    </div>
                  </motion.div>

                  {/* Icon Button */}
                  <div
                    className={`
                      w-14 h-14 rounded-full bg-gradient-to-br ${item.color}
                      flex items-center justify-center shadow-lg
                      ${item.comingSoon ? 'opacity-50' : 'hover:scale-110 active:scale-95'}
                      transition-transform duration-200
                    `}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`
            w-16 h-16 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300
            ${isOpen 
              ? 'bg-gray-800 dark:bg-gray-700' 
              : 'bg-gradient-to-br from-purple-600 via-pink-600 to-red-600'
            }
          `}
        >
          {isOpen ? (
            <X className="h-7 w-7 text-white" />
          ) : (
            <Plus className="h-7 w-7 text-white" />
          )}
        </motion.div>

        {/* Pulse Animation when closed */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-red-600"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>
    </>
  );
}
