import React from 'react';
import {Composition, staticFile} from 'remotion';
import {Reel, TOTAL} from './Reel';
import pos from '../public/shots/pos.json';

export const Root: React.FC = () => (
  <>
    <Composition id="ReelCliente" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{variant: 'cliente' as const, pos}} />
    <Composition id="ReelLoja" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{variant: 'loja' as const, pos}} />
  </>
);
