'use client';
import { useEffect, useState, useCallback } from 'react';

type InteractionStore = {
  likes: string[];
  dislikes: string[];
  views: Record<string, number>;
};

const KEY = 'sastabazaar-interactions';

function read(): InteractionStore {
  if (typeof window === 'undefined') return { likes: [], dislikes: [], views: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { likes: [], dislikes: [], views: {} };
    return JSON.parse(raw);
  } catch {
    return { likes: [], dislikes: [], views: {} };
  }
}

function write(store: InteractionStore) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent('sb-interactions'));
}

export function useInteraction(productId: string) {
  const [state, setState] = useState<{ isLiked: boolean; isDisliked: boolean }>({
    isLiked: false,
    isDisliked: false
  });

  useEffect(() => {
    const update = () => {
      const store = read();
      setState({
        isLiked: store.likes.includes(productId),
        isDisliked: store.dislikes.includes(productId)
      });
    };
    update();
    window.addEventListener('sb-interactions', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('sb-interactions', update);
      window.removeEventListener('storage', update);
    };
  }, [productId]);

  const like = useCallback(() => {
    const store = read();
    if (store.likes.includes(productId)) {
      store.likes = store.likes.filter(id => id !== productId);
    } else {
      store.likes = [...store.likes, productId];
      store.dislikes = store.dislikes.filter(id => id !== productId);
    }
    write(store);
  }, [productId]);

  const dislike = useCallback(() => {
    const store = read();
    if (store.dislikes.includes(productId)) {
      store.dislikes = store.dislikes.filter(id => id !== productId);
    } else {
      store.dislikes = [...store.dislikes, productId];
      store.likes = store.likes.filter(id => id !== productId);
    }
    write(store);
  }, [productId]);

  return { ...state, like, dislike };
}

export function getInteractions(): InteractionStore {
  return read();
}

export function trackView(productId: string) {
  const store = read();
  store.views[productId] = (store.views[productId] || 0) + 1;
  write(store);
}
