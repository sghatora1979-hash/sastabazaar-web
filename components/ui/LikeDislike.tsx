'use client';
import { Heart, ThumbsDown } from 'lucide-react';
import { useInteraction } from '@/lib/interactions';
import { motion } from 'framer-motion';

export function LikeDislike({ productId, compact }: { productId: string; compact?: boolean }) {
  const { isLiked, isDisliked, like, dislike } = useInteraction(productId);

  return (
    <div className={`flex gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); like(); }}
        className={`flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition ${
          compact ? 'py-1.5' : 'py-2'
        } ${
          isLiked
            ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Like"
      >
        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        {!compact && <span>Like</span>}
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); dislike(); }}
        className={`flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition ${
          compact ? 'py-1.5' : 'py-2'
        } ${
          isDisliked
            ? 'bg-gray-200 text-gray-900 ring-1 ring-gray-300'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Not for me"
      >
        <ThumbsDown size={14} fill={isDisliked ? 'currentColor' : 'none'} />
        {!compact && <span>Not for me</span>}
      </motion.button>
    </div>
  );
}
