import React, { memo, useEffect, useState } from 'react';

import { imageCacheService } from '../../services/imageCache.service';
import { Image, ImageProps } from 'expo-image';

type CachedImageProps = Omit<ImageProps, 'source'> & {
  uri: string;
};

function CachedImageComponent({ uri, ...props }: CachedImageProps) {
  const [resolvedUri, setResolvedUri] = useState(() => imageCacheService.peekCachedUri(uri) || uri);

  useEffect(() => {
    let active = true;
    const initialUri = imageCacheService.peekCachedUri(uri) || uri;
    setResolvedUri(initialUri);

    if (!uri) {
      return () => undefined;
    }

    imageCacheService.getCachedUri(uri, { background: true }).then((localUri) => {
      if (active && localUri) {
        setResolvedUri(localUri);
      }
    });

    return () => {
      active = false;
    };
  }, [uri]);

  return <Image {...props} source={{ uri: resolvedUri }} />;
}

export const CachedImage = memo(CachedImageComponent);