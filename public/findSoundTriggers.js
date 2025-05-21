import { soundMap } from './soundMap.js';

export function findSoundTriggers(segments) {
  const triggers = [];
  for (const seg of segments) {
    for (const key in soundMap) {
      if (seg.text.toLowerCase().includes(key)) {
        triggers.push({
          word: key,
          file: soundMap[key], // soundMap[key] è il path del file
          time: seg.start,
        });
      }
    }
  }
  return triggers;
}

