import React from 'react';
import { Composition } from 'remotion';
import { ProgressVideo } from './ProgressVideo';
import updatesData from '../data/updates.json';

export const RemotionRoot: React.FC = () => {
  const updates = updatesData as any[];
  const totalFrames = 90 + Math.max(1, updates.length) * 150;

  return (
    <>
      <Composition
        id="ProgressReel"
        component={ProgressVideo as React.FC<any>}
        durationInFrames={totalFrames}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          updates: updates,
        }}
      />
    </>
  );
};
