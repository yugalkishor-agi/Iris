import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type LikeContentType = 'post' | 'glimpse';

export type LikeLookupItem = {
  type: LikeContentType;
  id: string;
};

export type LikedContentIndexDoc = {
  contentType: LikeContentType;
  contentId: string;
  likedAt: any;
  updatedAt: any;
};

const LIKE_INDEX_BATCH_SIZE = 30;

const toIndexDocId = (type: LikeContentType, id: string): string => `${type}_${id}`;
const toLookupKey = (type: LikeContentType, id: string): string => `${type}:${id}`;

class LikeService {
  getIndexDocId(type: LikeContentType, contentId: string): string {
    return toIndexDocId(type, contentId);
  }

  toLookupKey(type: LikeContentType, contentId: string): string {
    return toLookupKey(type, contentId);
  }

  async getLikedMap(userId: string, items: LikeLookupItem[]): Promise<Record<string, boolean>> {
    const likedMap: Record<string, boolean> = {};
    if (!userId || !Array.isArray(items) || items.length === 0) return likedMap;

    const normalized = Array.from(
      new Set(
        items
          .filter((item) => !!item?.id && (item.type === 'post' || item.type === 'glimpse'))
          .map((item) => toIndexDocId(item.type, item.id))
      )
    );
    if (normalized.length === 0) return likedMap;

    const likedContentRef = collection(db, 'users', userId, 'likedContent');
    const requestedEntries = items
      .filter((item) => !!item?.id && (item.type === 'post' || item.type === 'glimpse'))
      .map((item) => ({ type: item.type, id: String(item.id) }));

    for (let i = 0; i < normalized.length; i += LIKE_INDEX_BATCH_SIZE) {
      const chunk = normalized.slice(i, i + LIKE_INDEX_BATCH_SIZE);
      const snapshot = await getDocs(query(likedContentRef, where(documentId(), 'in', chunk)));
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Partial<LikedContentIndexDoc>;
        const id = String(data?.contentId || '').trim();
        const type = data?.contentType === 'glimpse' ? 'glimpse' : data?.contentType === 'post' ? 'post' : null;
        if (id && type) {
          likedMap[toLookupKey(type, id)] = true;
          return;
        }

        const rawId = String(docSnap.id || '');
        const split = rawId.indexOf('_');
        if (split <= 0) return;
        const parsedType = rawId.slice(0, split);
        const parsedId = rawId.slice(split + 1);
        if ((parsedType === 'post' || parsedType === 'glimpse') && parsedId) {
          likedMap[toLookupKey(parsedType, parsedId)] = true;
        }
      });
    }

    const missingEntries = requestedEntries.filter(
      (entry) => !likedMap[toLookupKey(entry.type, entry.id)]
    );

    if (missingEntries.length > 0) {
      await Promise.all(
        missingEntries.map(async (entry) => {
          try {
            const likeRef = doc(db, entry.type === 'post' ? 'posts' : 'glimpses', entry.id, 'likes', userId);
            const likeSnap = await getDoc(likeRef);
            if (!likeSnap.exists()) return;

            likedMap[toLookupKey(entry.type, entry.id)] = true;

            const likeIndexRef = doc(db, 'users', userId, 'likedContent', toIndexDocId(entry.type, entry.id));
            await setDoc(
              likeIndexRef,
              {
                contentType: entry.type,
                contentId: entry.id,
                likedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch {
            // Keep hydration resilient; fallback miss should not break UI.
          }
        })
      );
    }

    return likedMap;
  }
}

export const likeService = new LikeService();
