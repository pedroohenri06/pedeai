import React from 'react';
import {Composition} from 'remotion';
import {Film, TOTAL} from './Film';
import pos from '../public/shots/pos.json';

export const Root: React.FC = () => (
  <>
    <Composition id="ReelCliente" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{variant: 'cliente' as const, pos}} />
    <Composition id="ReelLoja" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920} defaultProps={{variant: 'loja' as const, pos}} />
  </>
);
