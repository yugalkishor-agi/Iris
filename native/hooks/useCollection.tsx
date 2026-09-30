import { useState, useEffect } from 'react';
import { collectionService, Collection } from '../services/collection.service';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types/database';

export const useCollections = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const loadCollections = async () => {
      try {
        setLoading(true);
        const data = await collectionService.getUserCollections(currentUserId);
        setCollections(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [currentUserId]);

  const createCollection = async (name: string, isPrivate = false) => {
    if (!user) return;

    try {
      const collectionId = await collectionService.createCollection(user.userId, name, isPrivate);
      
      // Reload collections
      const updated = await collectionService.getUserCollections(user.userId);
      setCollections(updated);
      
      return collectionId;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!user) return;

    try {
      await collectionService.deleteCollection(user.userId, collectionId);
      setCollections((prev) => prev.filter((c) => c.collectionId !== collectionId));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const updateCollection = async (
    collectionId: string,
    updates: { name?: string; isPrivate?: boolean }
  ) => {
    if (!user) return;

    try {
      await collectionService.updateCollection(user.userId, collectionId, updates);
      setCollections((prev) =>
        prev.map((c) =>
          c.collectionId === collectionId ? { ...c, ...updates } : c
        )
      );
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return {
    collections,
    loading,
    error,
    createCollection,
    deleteCollection,
    updateCollection,
  };
};

export const useCollectionPosts = (collectionId?: string) => {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !collectionId) return;

    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await collectionService.getCollectionPosts(currentUserId, collectionId);
        setPosts(data);
      } catch (err) {
        console.error('Failed to load collection posts', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [currentUserId, collectionId]);

  return { posts, loading };
};

export const useSavedPosts = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const loadSaved = async () => {
      try {
        setLoading(true);
        const posts = await collectionService.getAllSavedPosts(currentUserId);
        setSavedPosts(posts);
      } catch (err) {
        console.error('Failed to load saved posts', err);
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [currentUserId]);

  const savePost = async (postId: string, collectionId?: string) => {
    if (!user) return;

    try {
      await collectionService.savePost(user.userId, postId, collectionId);
      
      // Reload saved posts
      const updated = await collectionService.getAllSavedPosts(user.userId);
      setSavedPosts(updated);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const unsavePost = async (postId: string, collectionId: string) => {
    if (!user) return;

    try {
      await collectionService.unsavePost(user.userId, postId, collectionId);
      setSavedPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const isPostSaved = async (postId: string): Promise<boolean> => {
    if (!user) return false;
    return await collectionService.isPostSaved(user.userId, postId);
  };

  return {
    savedPosts,
    loading,
    savePost,
    unsavePost,
    isPostSaved,
  };
};
