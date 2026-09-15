import { useEffect, useState } from 'react';
import { Image } from 'react-native';

export default function BoomerangPreview({ frames = [], style }) {
  const [index, setIndex] = useState(0);
  const list = Array.isArray(frames) ? frames.filter(Boolean) : [];

  useEffect(() => {
    if (list.length < 2) return undefined;
    let i = 0;
    let dir = 1;
    const t = setInterval(() => {
      i += dir;
      if (i >= list.length - 1) dir = -1;
      if (i <= 0) dir = 1;
      setIndex(i);
    }, 90);
    return () => clearInterval(t);
  }, [list.length, list[0]]);

  if (!list.length) return null;
  return <Image source={{ uri: list[index] || list[0] }} style={style} resizeMode="cover" />;
}
