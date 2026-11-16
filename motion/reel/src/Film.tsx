import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing, random,
} from 'remotion';
import fpos from '../public/shots/flow/pos.json';

/* =====================================================================================
   PedeAi · Filme de lançamento (Reels 1080×1920, 30 fps, 24,5 s)
   Sistema visual único: palco preto, luz volumétrica vermelha vinda do alto, grão de filme,
   poeira em 3 profundidades, tipografia Montserrat 900 em caixa alta alinhada à esquerda
   com marcador (kicker) em DM Sans espaçada. Telas: capturas reais da plataforma (3×).
   ===================================================================================== */

const RED = '#e51b2b', HOT = '#ff2b3d', WINE = '#7d1019', INK = '#0a0203', GREEN = '#3ddc84';
const SW = 1170, SH = 2532;               // tela do iPhone: 390×844 pt @3× (barra de status 54 pt + página 790 pt)
const SB = 54;                            // altura da barra de status (pt); as capturas da página começam abaixo dela
const PW = 560;                           // largura da tela do celular no quadro
const K = PW / SW, CSS = 3 * K, PH = SH * K;
const BZ = 12, FR = 9, RS = 78;           // borda preta, moldura de titânio e raio da tela
const BEZ = BZ + FR;
const CREAM = '#f9f5ef', SHEET = '#867d7b', WA = '#1d2b24';
const PCX = 540, PCY = 1175;              // centro do celular no quadro (camera neutra)
const cl = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const OUT = Easing.bezier(0.16, 1, 0.3, 1);       // chegada suave
const IO = Easing.bezier(0.76, 0, 0.24, 1);       // movimento de câmera
const IN = Easing.bezier(0.7, 0, 0.84, 0);        // saída acelerada
const shot = (n: string) => staticFile('shots/' + n);
const img = (n: string) => staticFile('img/' + n);
const lerp = (f: number, a: number[], b: number[], e: any = OUT) => interpolate(f, a, b, {...cl, easing: e});
const mix = (c1: string, c2: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

export const fontFaces = `
@font-face{font-family:'Montserrat';font-weight:600 900;src:url(${staticFile('fonts/montserrat-latin.woff2')}) format('woff2')}
@font-face{font-family:'DM Sans';font-weight:400 700;src:url(${staticFile('fonts/dm-sans-latin.woff2')}) format('woff2')}`;

/* ---------------- Som ---------------- */
const Sfx: React.FC<{at: number; s: string; v?: number}> = ({at, s, v = 1}) => (
  <Sequence from={at} layout="none"><Audio src={staticFile('sfx/' + s + '.wav')} volume={v} /></Sequence>
);

/* ---------------- Atmosfera: a assinatura visual do filme ---------------- */
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.22}}>
      <Img src={staticFile('grain/g' + (f % 8) + '.png')} style={{width: 1080, height: 1920, imageRendering: 'pixelated'}} />
    </AbsoluteFill>
  );
};

const Dust: React.FC<{camX?: number; camY?: number; tint?: string; amount?: number}> = ({camX = 0, camY = 0, tint = '255,120,110', amount = 1}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(46).fill(0).map((_, i) => {
        const depth = 0.3 + random('d' + i) * 1.2;
        const x = (random('x' + i) * 1180 - 50 + f * 0.25 * depth - camX * depth * 0.4) % 1180;
        const y = ((random('y' + i) * 2100 - f * 0.9 * depth - camY * depth * 0.4) % 2100 + 2100) % 2100 - 90;
        const s = 2 + depth * 5;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (14 + i) + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: `rgba(${tint},${0.5 * tw * amount})`, filter: `blur(${depth > 1.1 ? 3 : depth < 0.5 ? 2 : 0.6}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

/* Palco: preto com feixes volumétricos vermelhos vindos do alto e brilho no chão. */
const Stage: React.FC<{beam?: number; hue?: string; floor?: number; sway?: number}> = ({beam = 1, hue = RED, floor = 1, sway = 0}) => {
  const f = useCurrentFrame();
  const b = (x: number, w: number, o: number, sk: number) => (
    <div style={{position: 'absolute', left: x + Math.sin(f / 60 + x) * 20 + sway, top: -200, width: w, height: 1700, transform: `skewX(${sk}deg)`, filter: 'blur(46px)', opacity: o * beam,
      background: `linear-gradient(180deg, ${hue} 0%, ${hue}99 35%, transparent 85%)`, mixBlendMode: 'screen'}} />
  );
  return (
    <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(90% 55% at 50% 0%, ${WINE} 0%, #2a050b 45%, transparent 75%)`}} />
      {b(250, 150, 0.28, -14)}{b(520, 220, 0.34, 6)}{b(760, 120, 0.22, 16)}
      <div style={{position: 'absolute', left: 140, right: 140, bottom: 120, height: 380, borderRadius: '50%', background: `radial-gradient(closest-side, ${hue}66, transparent)`, filter: 'blur(30px)', opacity: floor}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 420px 80px rgba(0,0,0,.92)'}} />
    </AbsoluteFill>
  );
};

/* ---------------- Tipografia da campanha ---------------- */
type Line = {t: string; c?: string};
const Headline: React.FC<{kicker?: string; lines: Line[]; at: number; out?: number; y?: number; size?: number}> = ({kicker, lines, at, out = 99999, y = 250, size = 98}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = lerp(f, [out, out + 10], [0, 1], IN);
  const bar = lerp(f, [at, at + 14], [0, 1]);
  return (
    <div style={{position: 'absolute', left: 84, right: 60, top: y, opacity: 1 - exit, transform: `translateY(${-exit * 60}px)`, filter: `blur(${exit * 8}px)`}}>
      {kicker && bar > 0.01 && (
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, font: '700 25px DM Sans', letterSpacing: '0.34em', color: '#ff8f97', textTransform: 'uppercase'}}>
          <span style={{width: 64 * bar, height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`}} />
          <span style={{opacity: bar, transform: `translateX(${(1 - bar) * -20}px)`}}>{kicker}</span>
        </div>
      )}
      {lines.map((l, i) => {
        const s = spring({frame: f - at - 3 - i * 4, fps, config: {damping: 200, mass: 0.7}, durationInFrames: 18});
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
            <div style={{font: `900 ${size}px/0.94 Montserrat`, letterSpacing: '-0.045em', color: l.c || '#fff', textTransform: 'uppercase',
              transform: `translateY(${(1 - s) * 135}%) skewY(${(1 - s) * 6}deg)`, opacity: s < 0.02 ? 0 : 1, textShadow: l.c ? `0 0 50px ${l.c}66` : '0 10px 40px rgba(0,0,0,.6)'}}>
              {l.t}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- iPhone realista ----------------
   Moldura de titânio escovado com reflexo que acompanha a rotação, bandas de antena, botões laterais,
   borda preta, Dynamic Island com lente, barra de status do iOS, indicador de início, vidro com reflexo
   e sombra de contato. A página (captura real) começa abaixo da barra de status, como no aparelho. */
const StatusBar: React.FC<{bg: string; dark?: boolean}> = ({bg, dark}) => {
  const c = dark ? '#fff' : '#111';
  const u = CSS; // 1 pt
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: SB * u, background: bg, zIndex: 5}}>
      <div style={{position: 'absolute', left: 52 * u, top: 18 * u, font: `600 ${17 * u}px DM Sans`, letterSpacing: '-0.01em', color: c}}>20:30</div>
      <svg style={{position: 'absolute', right: 26 * u, top: 20 * u}} width={78 * u} height={14 * u} viewBox="0 0 78 14">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 5.2} y={9 - i * 2.6} width={3.4} height={3.4 + i * 2.6} rx={0.9} fill={c} />)}
        <path d="M30.5 4.2a9.5 9.5 0 0 1 13 0l-1.5 1.6a7.3 7.3 0 0 0-10 0Z M33.2 7a5.6 5.6 0 0 1 7.6 0l-1.6 1.6a3.3 3.3 0 0 0-4.4 0Z M35.6 9.8a2 2 0 0 1 2.8 0L37 11.3Z" fill={c} />
        <rect x={51} y={1.5} width={23} height={11} rx={3.4} fill="none" stroke={c} strokeOpacity={0.4} strokeWidth={1} />
        <rect x={53} y={3.5} width={17} height={7} rx={1.8} fill={c} />
        <path d="M75.4 5.3v3.4a1.8 1.8 0 0 0 0-3.4Z" fill={c} fillOpacity={0.45} />
      </svg>
    </div>
  );
};
const Phone: React.FC<{children: React.ReactNode; rx?: number; ry?: number; rz?: number; s?: number; x?: number; y?: number; glare?: number; dim?: number; blur?: number; rim?: string; bar?: string; darkBar?: boolean; frameO?: number}> =
  ({children, rx = 0, ry = 0, rz = 0, s = 1, x = 0, y = 0, glare = -1, dim = 0, blur = 0, rim = RED, bar = CREAM, darkBar = false, frameO = 1}) => {
  const W = PW + BEZ * 2, H = PH + BEZ * 2;
  const la = 118 + ry * 2.2; // o reflexo do titânio corre com a rotação
  const ti = `linear-gradient(${la}deg, #2b2b2e 0%, #a9a9ae 7%, #5b5b60 13%, #1f1f22 26%, #6d6d72 44%, #e3e3e6 50%, #6a6a6f 56%, #232326 72%, #8e8e93 88%, #3a3a3e 100%)`;
  const btn = (side: 'l' | 'r', top: number, h: number) => (
    <div style={{position: 'absolute', [side === 'l' ? 'left' : 'right']: -5, top: H * top, width: 8, height: H * h, borderRadius: 3,
      background: `linear-gradient(${side === 'l' ? 90 : 270}deg, #1c1c1e, #8e8e93 45%, #3a3a3c)`, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,.25)', opacity: frameO}} />
  );
  const band = (side: 'l' | 'r', top: number) => (
    <div style={{position: 'absolute', [side === 'l' ? 'left' : 'right']: 0, top: H * top, width: FR, height: 7, background: '#3a3a3e', opacity: 0.9 * frameO}} />
  );
  return (
    <div style={{position: 'absolute', left: PCX - W / 2, top: PCY - H / 2, perspective: 2600, filter: blur ? `blur(${blur}px)` : undefined}}>
      <div style={{transform: `translate(${x}px, ${y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`, transformOrigin: '50% 50%'}}>
        <div style={{position: 'relative', width: W, height: H}}>
          {/* sombra de contato e ambiente */}
          <div style={{position: 'absolute', left: '8%', right: '8%', bottom: -40, height: 80, borderRadius: '50%', background: 'rgba(0,0,0,.75)', filter: 'blur(30px)', opacity: frameO}} />
          {btn('l', 0.175, 0.04)}{btn('l', 0.245, 0.075)}{btn('l', 0.335, 0.075)}{btn('r', 0.27, 0.115)}
          {/* moldura de titânio */}
          <div style={{position: 'absolute', inset: 0, borderRadius: RS + BEZ, background: ti, opacity: frameO,
            boxShadow: `0 70px 140px -40px rgba(0,0,0,.95), 0 24px 50px -16px rgba(0,0,0,.7), 0 0 120px -30px ${rim}aa, ${-ry * 1.4}px 0 50px -26px ${rim}, inset 0 0 0 1px rgba(255,255,255,.35), inset 0 0 0 2.5px rgba(0,0,0,.45), inset 0 2px 3px rgba(255,255,255,.4)`}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: RS + BEZ, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)', mixBlendMode: 'overlay'}} />
            {band('l', 0.1)}{band('r', 0.1)}{band('l', 0.9)}{band('r', 0.9)}
          </div>
          {/* borda preta */}
          <div style={{position: 'absolute', inset: FR, borderRadius: RS + BZ, background: '#050506', boxShadow: 'inset 0 0 0 1.5px #1d1d20', opacity: frameO}} />
          {/* tela */}
          <div style={{position: 'absolute', left: BEZ, top: BEZ, width: PW, height: PH, borderRadius: RS, overflow: 'hidden', background: bar}}>
            <StatusBar bg={bar} dark={darkBar} />
            <div style={{position: 'absolute', left: 0, top: SB * CSS, width: PW, height: PH - SB * CSS, overflow: 'hidden'}}>
              {children}
            </div>
            <div style={{position: 'absolute', inset: 0, background: `rgba(10,2,3,${dim})`, zIndex: 6}} />
            {/* indicador de início */}
            <div style={{position: 'absolute', left: '50%', bottom: 8 * CSS, width: 134 * CSS, height: 5 * CSS, marginLeft: -67 * CSS, borderRadius: 3 * CSS, background: darkBar ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.82)', zIndex: 7}} />
            {/* Dynamic Island com lente */}
            <div style={{position: 'absolute', top: 11 * CSS, left: '50%', width: 125 * CSS, height: 36 * CSS, marginLeft: -62.5 * CSS, borderRadius: 18 * CSS, background: '#000', zIndex: 8, boxShadow: '0 0 0 0.5px rgba(255,255,255,.06)'}}>
              <div style={{position: 'absolute', right: 11 * CSS, top: 9 * CSS, width: 18 * CSS, height: 18 * CSS, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #3b4a6b 0%, #121826 35%, #05070c 70%)', boxShadow: 'inset 0 0 0 1.5px #0d0f14'}}>
                <div style={{position: 'absolute', left: '28%', top: '26%', width: '18%', height: '18%', borderRadius: '50%', background: 'rgba(150,180,255,.55)', filter: 'blur(0.6px)'}} />
              </div>
            </div>
            {/* vidro: reflexo fixo + reflexo que passa */}
            <div style={{position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none', background: 'linear-gradient(160deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 78%, rgba(255,255,255,.05) 100%)'}} />
            <div style={{position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none', background: `linear-gradient(118deg, transparent ${glare * 100 - 26}%, rgba(255,255,255,.22) ${glare * 100 - 10}%, rgba(255,255,255,.04) ${glare * 100}%, transparent ${glare * 100 + 8}%)`}} />
            <div style={{position: 'absolute', inset: 0, zIndex: 9, borderRadius: RS, boxShadow: 'inset 0 0 18px rgba(0,0,0,.22)'}} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Screen: React.FC<{src: string; o?: number; y?: number; x?: number}> = ({src, o = 1, y = 0, x = 0}) => (
  <Img src={src} style={{position: 'absolute', left: x, top: y, width: PW, opacity: o}} />
);

/* Câmera: move o "mundo" (celular e o que estiver preso a ele) para enquadrar uma região da tela. */
const Cam: React.FC<{children: React.ReactNode; s: number; fx: number; fy: number}> = ({children, s, fx, fy}) => (
  // fx/fy: ponto da tela (css da página) que fica no centro óptico (540, 1000)
  <AbsoluteFill style={{transform: `translate(${540 - (PCX + (fx - 195) * CSS) * s}px, ${PCY - (PCY + (fy + SB - 422) * CSS) * s}px) scale(${s})`, transformOrigin: '0 0'}}>
    {children}
  </AbsoluteFill>
);

/* Toque na tela (coordenadas css da página) */
const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  if (f < at - 5 || f > at + 16) return null;
  const press = lerp(f, [at - 5, at], [0, 1]);
  const ring = lerp(f, [at, at + 16], [0, 1]);
  return (
    <>
      <div style={{position: 'absolute', left: x * CSS - 30, top: y * CSS - 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.6)', border: '2px solid #fff', transform: `scale(${1.2 - press * 0.25 + ring * 0.1})`, opacity: (1 - ring) * press, boxShadow: '0 8px 24px rgba(0,0,0,.3)'}} />
      <div style={{position: 'absolute', left: x * CSS - 30, top: y * CSS - 30, width: 60, height: 60, borderRadius: '50%', border: `3px solid ${HOT}`, transform: `scale(${1 + ring * 1.8})`, opacity: 1 - ring}} />
    </>
  );
};

/* Fotografia de comida emergindo do escuro (bordas dissolvidas no preto) */
const Dish: React.FC<{src: string; w: number; h?: number; x: number; y: number; s?: number; r?: number; blur?: number; o?: number; sweep?: number; steam?: number}> =
  ({src, w, h, x, y, s = 1, r = 0, blur = 0, o = 1, sweep = -1, steam = 0}) => {
  const f = useCurrentFrame();
  const hh = h || w;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - hh / 2, width: w, height: hh, transform: `scale(${s}) rotate(${r}deg)`, opacity: o, filter: `blur(${blur}px)`}}>
      <div style={{position: 'absolute', inset: 0, WebkitMaskImage: 'radial-gradient(closest-side, #000 62%, transparent 100%)', maskImage: 'radial-gradient(closest-side, #000 62%, transparent 100%)'}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(1.18) brightness(.95)'}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(112deg, transparent ${sweep * 100 - 22}%, rgba(255,214,170,.55) ${sweep * 100 - 4}%, transparent ${sweep * 100 + 14}%)`, mixBlendMode: 'screen'}} />
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(70% 60% at 50% 20%, rgba(255,90,60,.25), transparent 70%)`, mixBlendMode: 'screen'}} />
      </div>
      {steam > 0 && new Array(5).fill(0).map((_, i) => {
        const p = ((f * 0.9 + i * 22) % 110) / 110;
        return <div key={i} style={{position: 'absolute', left: w * (0.32 + i * 0.09) + Math.sin(f / 9 + i) * 14, top: hh * 0.18 - p * hh * 0.45, width: 70, height: 150, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,240,230,.5), transparent)', filter: 'blur(14px)', opacity: steam * Math.sin(p * Math.PI) * 0.55}} />;
      })}
    </div>
  );
};

/* Rastro de luz anamórfico: só nos dois impactos do filme (abertura e marca) */
const Streak: React.FC<{y: number; o: number}> = ({y, o}) => o <= 0 ? null : (
  <>
    <div style={{position: 'absolute', left: -200, right: -200, top: y - 3, height: 6, background: `linear-gradient(90deg, transparent, ${HOT} 30%, #fff 50%, ${HOT} 70%, transparent)`, opacity: o, filter: 'blur(1.5px)', transform: `scaleX(${0.3 + o * 0.9})`, mixBlendMode: 'screen'}} />
    <div style={{position: 'absolute', left: -200, right: -200, top: y - 60, height: 120, background: `radial-gradient(50% 50% at 50% 50%, ${HOT}aa, transparent)`, opacity: o * 0.8, filter: 'blur(16px)', mixBlendMode: 'screen'}} />
  </>
);

/* ================================== CENAS ================================== */

/* 01 · Abertura: a montagem do lanche (filmagem autorizada, public/motim — 132 quadros a 25 qps).
   Cada quadro do filme escolhe o instante exato da filmagem (remapeamento de tempo): o stop motion é
   reordenado como montagem (molho → folhas → carne → carne dupla), a espátula pousa as carnes, a cebola
   crispy cai em câmera lenta com farelos em primeiro plano, a mão pressiona o pão e sai. Então a câmera
   mergulha na cúpula do pão; o dourado vira o vermelho do PedeAi e "BATEU A FOME?" nasce no campo
   vermelho com o próprio hambúrguer dentro das letras, encolhe até a posição da manchete e assume as cores
   da marca. */
const mo = (i: number) => staticFile('motim/' + String(Math.max(1, Math.min(132, i))).padStart(3, '0') + '.jpg');
// tempo da filmagem (em quadros de origem, fracionário) para cada quadro do filme
const srcAt = (f: number) => {
  const stop = [15, 13, 10, 7, 30];                       // stop motion reordenado, 4 quadros cada
  if (f < 20) return stop[Math.floor(f / 4)];
  if (f < 40) return interpolate(f, [20, 40], [32, 46]);  // espátula
  if (f < 75) return interpolate(f, [40, 75], [47, 66], {easing: Easing.bezier(0.3, 0, 0.6, 1)}); // cebola caindo, desacelerando
  if (f < 105) return interpolate(f, [75, 105], [67, 100], {easing: Easing.bezier(0.2, 0.6, 0.4, 1)}); // mão pressiona: rápido e assenta
  if (f < 117) return interpolate(f, [105, 117], [112, 121], {easing: Easing.bezier(0.5, 0, 0.8, 0.6)}); // mão sai
  return Math.min(131, interpolate(f, [117, 135], [122, 131]));
};
// quadro da filmagem com mistura do quadro seguinte (desfoque de movimento entre quadros)
const Footage: React.FC<{t: number; blend?: boolean}> = ({t, blend = true}) => {
  const a = Math.floor(t), k = t - a;
  const st: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, objectFit: 'cover', filter: 'contrast(1.12) saturate(1.06) brightness(.97)'};
  return (
    <>
      <Img src={mo(a)} style={st} />
      {blend && k > 0.02 && <Img src={mo(a + 1)} style={{...st, opacity: k}} />}
    </>
  );
};
// farelos em primeiro plano durante a queda da cebola (profundidade, gravidade, desfoque de movimento)
const Crumbs: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 20) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {new Array(16).fill(0).map((_, i) => {
        const d = 0.6 + random('cd' + i) * 1.6;           // profundidade: >1 = mais perto da câmera
        const t0 = from + random('ct' + i) * (to - from);
        const tt = (f - t0) / 30;
        if (tt < 0) return null;
        const y = -60 + 0.5 * 2600 * tt * tt * d * 0.55 + 300 * tt;
        if (y > 2000) return null;
        const x = 380 + random('cx' + i) * 380 + Math.sin(tt * 3 + i) * 12 * d;
        const sz = (5 + random('cs' + i) * 9) * d;
        const vel = (2600 * tt * d * 0.55 + 300) / 30;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz + Math.min(40, vel * 0.5), borderRadius: sz,
          background: 'linear-gradient(180deg, rgba(196,120,60,0), #c97a3c 60%, #8a4a22)', opacity: 0.85, filter: `blur(${d > 1.4 ? 4 : d < 0.9 ? 1.5 : 0.6}px)`}} />;
      })}
    </AbsoluteFill>
  );
};
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const H = 150;                                      // impacto: a tela vira vermelho
  const t = srcAt(f);
  // câmera digital: cada trecho com seu movimento, sempre com curva
  const cam = (() => {
    if (f < 20) return {s: interpolate(f, [0, 20], [1.16, 1.1]), x: 0, y: 40};
    if (f < 40) return {s: interpolate(f, [20, 40], [1.12, 1.18], {easing: OUT}), x: interpolate(f, [20, 40], [-30, 10]), y: 60};
    if (f < 75) return {s: interpolate(f, [40, 75], [1.3, 1.22], {easing: OUT}), x: 0, y: interpolate(f, [40, 75], [260, 80], {easing: IO})};
    if (f < 105) return {s: interpolate(f, [75, 105], [1.08, 1.16], {easing: OUT}), x: 0, y: interpolate(f, [75, 105], [-30, 10], {easing: OUT})};
    if (f < 125) return {s: interpolate(f, [105, 125], [1.16, 1.2]), x: 0, y: 10};
    // mergulho na cúpula do pão, acelerando
    const k = interpolate(f, [125, H], [0, 1], {...cl, easing: Easing.bezier(0.6, 0, 0.9, 0.4)});
    return {s: 1.2 + k * 5.2, x: 0, y: 10 - k * 40};
  })();
  const FX = 540, FY = 700;                           // centro da cúpula do pão no quadro
  // impacto da mão no pão
  const press = lerp(f, [77, 80, 90], [0, 1, 0], Easing.linear);
  // virada de cor: dourado do pão → vermelho PedeAi
  const toRed = lerp(f, [133, H], [0, 1], Easing.inOut(Easing.cubic));
  const redOut = lerp(f, [178, 192], [1, 0], Easing.inOut(Easing.cubic));
  const showRed = f >= 133 ? (f < 178 ? toRed : redOut) : 0;
  // texto: nasce enorme com o hambúrguer dentro das letras e assenta na posição da manchete
  const tk = spring({frame: f - (H + 2), fps, config: {damping: 15, stiffness: 95, mass: 0.9}});
  const fill = lerp(f, [176, 190], [0, 1], Easing.inOut(Easing.cubic));   // imagem → cores da marca
  const whip = lerp(f, [198, 210], [0, 1], IN);
  const line = (txt: string, red: boolean, i: number) => {
    const sp = spring({frame: f - (H + 2 + i * 3), fps, config: {damping: 200, mass: 0.6}, durationInFrames: 14});
    const base: React.CSSProperties = {font: '900 132px/0.94 Montserrat', letterSpacing: '-0.045em', textTransform: 'uppercase', display: 'block', transform: `translateY(${(1 - sp) * 60}%)`};
    return (
      <div key={i} style={{position: 'relative', paddingBottom: 6}}>
        {/* letras preenchidas com o hambúrguer */}
        <span style={{...base, backgroundImage: `url(${mo(131)})`, backgroundSize: '520px 924px', backgroundPosition: `${-60 - i * 40}px ${-420 - i * 120}px`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: 1 - fill, filter: 'contrast(1.25) saturate(1.2) brightness(1.15)'}}>{txt}</span>
        {/* letras nas cores da marca */}
        <span style={{...base, position: 'absolute', left: 0, top: 0, color: red ? HOT : '#fff', opacity: fill, textShadow: red ? `0 0 50px ${HOT}66` : '0 10px 40px rgba(0,0,0,.6)'}}>{txt}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Stage beam={lerp(f, [176, 192], [0, 1])} floor={lerp(f, [176, 192], [0, 0.8])} />
      <AbsoluteFill style={{transform: `translateY(${-whip * 1500}px)`, filter: `blur(${whip * 18}px)`}}>
        {/* filmagem */}
        {f < 178 && (
          <AbsoluteFill style={{opacity: f < 176 ? 1 : 0}}>
            <AbsoluteFill style={{transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`, transformOrigin: `${FX}px ${FY}px`, filter: `blur(${lerp(f, [140, H], [0, 10], IN)}px)`}}>
              <Footage t={t} blend={f >= 20} />
            </AbsoluteFill>
            {/* luz vermelha de recorte nas bordas + vinheta */}
            <AbsoluteFill style={{background: `radial-gradient(60% 45% at 0% 55%, ${RED}55, transparent 70%), radial-gradient(60% 45% at 100% 45%, ${RED}44, transparent 70%)`, mixBlendMode: 'screen'}} />
            <AbsoluteFill style={{boxShadow: 'inset 0 0 360px 60px rgba(0,0,0,.85)'}} />
            {/* brilho do impacto da mão */}
            <AbsoluteFill style={{background: `radial-gradient(40% 25% at 50% 58%, rgba(255,190,140,.55), transparent 70%)`, opacity: press * 0.6, mixBlendMode: 'screen'}} />
          </AbsoluteFill>
        )}
        <Crumbs from={40} to={70} />
        {/* o dourado do pão vira o vermelho da marca */}
        <AbsoluteFill style={{background: RED, opacity: showRed}} />
        <AbsoluteFill style={{background: `radial-gradient(70% 50% at 50% 50%, ${HOT}, ${RED} 45%, ${WINE} 100%)`, opacity: showRed * lerp(f, [H, H + 10], [0, 1])}} />
        {/* manchete */}
        {f >= H && (
          <div style={{position: 'absolute', left: 84, width: 760, top: 230, transformOrigin: '330px 190px', transform: `translate(${interpolate(tk, [0, 1], [126, 0])}px, ${interpolate(tk, [0, 1], [580, 0])}px) scale(${interpolate(tk, [0, 1], [1.75, 1])})`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, font: '700 25px DM Sans', letterSpacing: '0.34em', color: '#ff8f97', textTransform: 'uppercase', opacity: lerp(f, [184, 194], [0, 1])}}>
              <span style={{width: 64 * lerp(f, [184, 196], [0, 1]), height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`}} />PedeAi Delivery
            </div>
            {line('Bateu a', false, 0)}
            {line('fome?', true, 1)}
          </div>
        )}
      </AbsoluteFill>
      <Dust amount={lerp(f, [176, 192], [0, 1])} />
      <AbsoluteFill style={{background: '#000', opacity: lerp(f, [0, 3], [1, 0])}} />
      {/* clarão do impacto */}
      <AbsoluteFill style={{background: '#fff', opacity: lerp(f, [H, H + 1, H + 6], [0, 0.35, 0], Easing.linear), mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

/* 02 · Descoberta, com a navegação real da plataforma (capturas em public/shots/flow):
   o celular chega → toque na cidade → a folha de cidades sobe → a lista rola até Barra do Garças →
   a página rola até "O que bateu vontade?" → toque em Hambúrguer → rolagem até a Dantes → toque e mergulho na loja. */
const flow = (n: string) => staticFile('shots/flow/' + n);
// Página rolando: conteúdo alto deslocado + cabeçalho e barra inferior fixos por cima (como no celular).
const ScrollPage: React.FC<{tall: string; y: number; y0?: number; v?: number; header?: string}> = ({tall, y, y0 = 0, v = 0, header = 'home_barra.png'}) => {
  const top = -(y - y0) * CSS;
  return (
    <AbsoluteFill style={{background: '#f7f1ea'}}>
      <Img src={flow(tall)} style={{position: 'absolute', left: 0, top, width: PW}} />
      {v > 6 && [1, 2, 3].map((i) => <Img key={i} src={flow(tall)} style={{position: 'absolute', left: 0, top: top + i * v * 0.3, width: PW, opacity: 0.14}} />)}
      <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: fpos.header.h * CSS, overflow: 'hidden'}}>
        <Img src={flow(header)} style={{position: 'absolute', left: 0, top: 0, width: PW}} />
      </div>
      <div style={{position: 'absolute', left: fpos.nav.x * CSS, top: fpos.nav.y * CSS, width: fpos.nav.w * CSS, height: fpos.nav.h * CSS, overflow: 'hidden', borderRadius: 22 * CSS}}>
        <Img src={flow(header)} style={{position: 'absolute', left: -fpos.nav.x * CSS, top: -fpos.nav.y * CSS, width: PW}} />
      </div>
    </AbsoluteFill>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f - 2, fps, config: {damping: 18, stiffness: 60, mass: 1.1}});
  // linha do tempo da navegação (quadros locais)
  const T = {pill: 44, open: 48, list0: 70, list1: 96, barra: 104, close: 110, home: 124, sc0: 132, sc1: 160, hamb: 170, au0: 176, au1: 200, dantes: 208, dive: 212};
  const sheet = f < T.close ? lerp(f, [T.open, T.open + 14], [0, 1], OUT) : lerp(f, [T.close, T.close + 12], [1, 0], IN);
  const listV = lerp(f, [T.list0, T.list1], [0, fpos.listParts[2]], IO);
  const listVel = Math.abs(lerp(f + 1, [T.list0, T.list1], [0, fpos.listParts[2]], IO) - listV) * CSS;
  const sc = f < T.hamb ? lerp(f, [T.sc0, T.sc1], [0, fpos.scrollCats], IO) : lerp(f, [T.au0, T.au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const scN = f < T.hamb ? lerp(f + 1, [T.sc0, T.sc1], [0, fpos.scrollCats], IO) : lerp(f + 1, [T.au0, T.au1], [fpos.scrollCats, fpos.scrollHamb], IO);
  const vel = Math.abs(scN - sc) * CSS;
  // câmera: aproxima onde o dedo está agindo, sempre com a mesma curva
  const keys = [0, 56, 70, 100, 116, 140, 158, 172, 196, 206, T.dive, 225];
  const cs = interpolate(f, keys, [1, 1, 1.24, 1.24, 1, 1, 1.22, 1.22, 1.16, 1.16, 1.16, 2.9], {...cl, easing: IO});
  const cfy = interpolate(f, keys, [422, 422, 600, 640, 422, 422, 380, 380, 380, 380, 380, 356], {...cl, easing: IO});
  const cfx = interpolate(f, keys, [195, 195, 195, 195, 195, 195, 195, 195, 195, 195, 195, 102], {...cl, easing: IO});
  const dive = lerp(f, [T.dive, 225], [0, 1], IN);
  // posição do toque em Barra do Garças (lista rolada até o fim)
  const barraY = fpos.list.y + fpos.barraInList.y + fpos.barraInList.h / 2 - fpos.listParts[2];
  const dY = fpos.dantes.y + fpos.dantes.h / 2 + (fpos.scrollDantes - fpos.scrollHamb);
  const press = lerp(f, [T.dantes - 3, T.dantes, T.dantes + 6], [1, 0.965, 1], Easing.linear);
  return (
    <AbsoluteFill>
      <Stage sway={lerp(f, [0, 225], [-40, 20], Easing.linear)} />
      <Dust camY={enter * 200} />
      <Cam s={cs} fx={cfx} fy={cfy}>
        <Phone rx={interpolate(enter, [0, 1], [24, 0])} ry={interpolate(enter, [0, 1], [-34, 0])} rz={interpolate(enter, [0, 1], [-8, 0])}
          y={interpolate(enter, [0, 1], [1300, 0])} glare={lerp(f, [14, 56], [-0.3, 1.4], IO)} blur={dive * 8} bar={mix(CREAM, '#8a7f7d', sheet)}>
          {/* 1 · início em Nova Xavantina, até a folha cobrir a tela */}
          {f < T.barra && <Screen src={flow('home_nx.png')} />}
          {/* 2 · depois da escolha: página de Barra do Garças rolando (antes e depois do toque em Hambúrguer) */}
          {f >= T.barra && f < T.hamb + 2 && <ScrollPage tall="home_tall.jpg" y={sc} v={vel} />}
          {f >= T.hamb && <AbsoluteFill style={{opacity: lerp(f, [T.hamb, T.hamb + 3], [0, 1], Easing.linear)}}><ScrollPage tall="hamb_tall.jpg" y={sc} y0={fpos.hambTall.y0} v={vel} header="hamb.png" /></AbsoluteFill>}
          {/* cartão da Dantes afundando no toque */}
          {f >= T.dantes - 3 && (
            <div style={{position: 'absolute', left: fpos.dantes.x * CSS, top: (dY - fpos.dantes.h / 2) * CSS, width: fpos.dantes.w * CSS, height: fpos.dantes.h * CSS, overflow: 'hidden', borderRadius: 18 * CSS, transform: `scale(${press})`, boxShadow: press < 1 ? '0 0 0 3px rgba(229,27,43,.35)' : 'none'}}>
              <Img src={flow('hamb_tall.jpg')} style={{position: 'absolute', width: PW, left: -fpos.dantes.x * CSS, top: -(dY - fpos.dantes.h / 2 + fpos.scrollHamb - fpos.hambTall.y0) * CSS}} />
            </div>
          )}
          {/* toast real de confirmação da cidade */}
          {f >= T.home - 2 && f < T.home + 28 && (
            <div style={{position: 'absolute', left: fpos.toast.x * CSS, top: fpos.toast.y * CSS, width: fpos.toast.w * CSS, height: fpos.toast.h * CSS, overflow: 'hidden', borderRadius: 12 * CSS,
              opacity: lerp(f, [T.home - 2, T.home + 2, T.home + 22, T.home + 28], [0, 1, 1, 0], Easing.linear), transform: `translateY(${lerp(f, [T.home - 2, T.home + 4], [10, 0])}px)`}}>
              <Img src={flow('home_barra_toast.png')} style={{position: 'absolute', width: PW, left: -fpos.toast.x * CSS, top: -fpos.toast.y * CSS}} />
            </div>
          )}
          {/* folha de cidades: fundo escurecido real + folha subindo; a lista rola dentro dela */}
          {sheet > 0 && (
            <>
              <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: fpos.menu.y * CSS, overflow: 'hidden', opacity: sheet}}>
                <Img src={flow('menu.png')} style={{position: 'absolute', left: 0, top: 0, width: PW}} />
              </div>
              <AbsoluteFill style={{background: 'rgba(30,8,10,.35)', opacity: sheet, clipPath: `inset(${fpos.menu.y * CSS}px 0 0 0)`}} />
              <div style={{position: 'absolute', left: 0, top: (fpos.menu.y - 6) * CSS + (1 - sheet) * (PH * 0.9), width: PW, height: PH, overflow: 'hidden'}}>
                <Img src={flow('menu.png')} style={{position: 'absolute', left: 0, top: -(fpos.menu.y - 6) * CSS, width: PW}} />
                <div style={{position: 'absolute', left: fpos.list.x * CSS, top: (fpos.list.y - fpos.menu.y + 6) * CSS, width: fpos.list.w * CSS, height: fpos.list.h * CSS, overflow: 'hidden', background: '#fff'}}>
                  <Img src={flow('list_tall.png')} style={{position: 'absolute', left: 0, top: -listV * CSS, width: fpos.list.w * CSS}} />
                  {listVel > 6 && [1, 2].map((i) => <Img key={i} src={flow('list_tall.png')} style={{position: 'absolute', left: 0, top: -listV * CSS + i * listVel * 0.3, width: fpos.list.w * CSS, opacity: 0.15}} />)}
                </div>
              </div>
            </>
          )}
          <Tap x={fpos.locationBtn.x + fpos.locationBtn.w / 2} y={fpos.locationBtn.y + fpos.locationBtn.h / 2} at={T.pill} />
          <Tap x={fpos.barra.x + fpos.barra.w / 2} y={barraY} at={T.barra} />
          <Tap x={fpos.hamb.x + fpos.hamb.w / 2} y={fpos.hamb.y + fpos.hamb.h / 2 - 12} at={T.hamb} />
          <Tap x={fpos.dantes.x + fpos.dantes.w / 2} y={dY} at={T.dantes} />
          <AbsoluteFill style={{background: '#7a0f18', opacity: lerp(f, [218, 225], [0, 1], Easing.linear)}} />
        </Phone>
      </Cam>
      {/* faixa de leitura para as legendas quando a câmera aproxima */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.96) 0%, rgba(10,2,3,.88) 22%, transparent 31%)', opacity: lerp(f, [56, 70], [0, 1])}} />
      <Headline kicker="Chegou ao Vale do Araguaia" lines={[{t: 'Todo o delivery'}, {t: 'da sua cidade.', c: HOT}]} at={10} out={54} y={230} size={92} />
      <Headline kicker="01 · Cidade" lines={[{t: 'Escolha'}, {t: 'sua cidade.', c: HOT}]} at={66} out={118} y={230} size={92} />
      <Headline kicker="02 · Categoria" lines={[{t: 'O que bateu'}, {t: 'vontade?', c: HOT}]} at={126} out={174} y={230} size={92} />
      <Headline kicker="03 · Restaurante" lines={[{t: 'Escolha onde'}, {t: 'pedir.', c: HOT}]} at={180} out={214} y={230} size={92} />
    </AbsoluteFill>
  );
};

/* 03 · Descoberta: a loja abre, o cardápio rola e os pratos saltam da tela */
const S3: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const pull = lerp(f, [0, 18], [2.25, 1], OUT);
  const scroll = lerp(f, [22, 60], [0, 3928], IO);
  const v = Math.abs(lerp(f + 1, [22, 60], [0, 3928], IO) - scroll);
  const lift = lerp(f, [66, 92], [0, 1], OUT);
  const ids = ['maromba', 'tropical', 'old-school'];
  const fan = [{dx: -30, dy: -170, r: -6}, {dx: 50, dy: 10, r: 4}, {dx: -20, dy: 190, r: -3}];
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Phone s={pull} y={60 * (pull - 1)} glare={lerp(f, [8, 40], [-0.3, 1.4], IO)} dim={lift * 0.55} blur={lift * 5 + Math.max(0, pull - 1) * 6} ry={-4 * (1 - lift)} rx={3 * (1 - lift)}>
        <div style={{position: 'absolute', inset: 0}}>
          {f < 62 && <Img src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS, width: PW}} />}
          {f < 62 && v > 8 && [1, 2, 3].map(i => <Img key={i} src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS + i * v * 0.35, width: PW, opacity: 0.16}} />)}
          {f >= 58 && <Screen src={shot('store_menu.png')} o={lerp(f, [58, 62], [0, 1])} />}
        </div>
        <AbsoluteFill style={{background: '#7a0f18', opacity: lerp(f, [0, 8], [1, 0])}} />
      </Phone>
      {/* cartões reais do cardápio saindo da tela em profundidade */}
      {lift > 0 && ids.map((id, i) => {
        const c = pos['card_' + id];
        const cx = PCX + (c.x + c.w / 2 - 195) * CSS, cy = PCY + (c.y + c.h / 2 + SB - 422) * CSS;
        const l = lerp(f, [66 + i * 4, 92 + i * 4], [0, 1], OUT);
        const sc = 1 + l * 0.32;
        return (
          <div key={id} style={{position: 'absolute', left: cx - c.w * CSS / 2, top: cy - c.h * CSS / 2, width: c.w * CSS, height: c.h * CSS, borderRadius: 26, overflow: 'hidden',
            transform: `translate(${fan[i].dx * l}px, ${fan[i].dy * l}px) rotate(${fan[i].r * l}deg) scale(${sc})`,
            boxShadow: `0 ${30 + l * 50}px ${60 + l * 60}px -20px rgba(0,0,0,.85), 0 0 ${l * 60}px -10px ${RED}`}}>
            <Img src={shot('card_' + id + '.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
          </div>
        );
      })}
      <Headline kicker="04 · Cardápio" lines={[{t: 'Cardápios que'}, {t: 'dão vontade.', c: HOT}]} at={64} y={230} size={96} />
    </AbsoluteFill>
  );
};

/* 04 · Compra: os pratos voltam ao lugar e três toques montam o pedido */
const S4: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const ids = ['maromba', 'tropical', 'old-school'];
  const fan = [{dx: -30, dy: -170, r: -6}, {dx: 50, dy: 10, r: 4}, {dx: -20, dy: 190, r: -3}];
  const back = lerp(f, [0, 16], [1, 0], IO);
  const taps = [{id: 'maromba', at: 24}, {id: 'tropical', at: 40}, {id: 'old-school', at: 56}];
  let src = 'store_menu.png';
  taps.forEach(t => { if (f >= t.at + 1) src = 'store_menu_' + t.id + '.png'; });
  const s = lerp(f, [14, 86], [1, 1.07], Easing.linear);
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Cam s={s} fx={195} fy={470}>
        <Phone glare={-1} dim={back * 0.55} blur={back * 5}>
          <Screen src={shot(src)} />
          {taps.map(t => <Tap key={t.id} x={pos['add_' + t.id].x} y={pos['add_' + t.id].y} at={t.at} />)}
          {taps.map(t => f >= t.at && f < t.at + 22 ? (
            <div key={'p' + t.id} style={{position: 'absolute', left: pos['add_' + t.id].x * CSS - 120, top: pos['add_' + t.id].y * CSS - 40 - lerp(f, [t.at, t.at + 22], [0, 70]), padding: '8px 16px', borderRadius: 99, background: HOT, color: '#fff', font: '800 26px Montserrat', opacity: lerp(f, [t.at, t.at + 4, t.at + 16, t.at + 22], [0, 1, 1, 0]), boxShadow: `0 8px 24px ${RED}88`}}>
              + adicionado
            </div>
          ) : null)}
          <Tap x={pos.cartBar.x} y={pos.cartBar.y} at={80} />
        </Phone>
        {back > 0 && ids.map((id, i) => {
          const c = pos['card_' + id];
          const cx = PCX + (c.x + c.w / 2 - 195) * CSS, cy = PCY + (c.y + c.h / 2 + SB - 422) * CSS;
          return (
            <div key={id} style={{position: 'absolute', left: cx - c.w * CSS / 2, top: cy - c.h * CSS / 2, width: c.w * CSS, height: c.h * CSS, borderRadius: 26, overflow: 'hidden',
              transform: `translate(${fan[i].dx * back}px, ${fan[i].dy * back}px) rotate(${fan[i].r * back}deg) scale(${1 + back * 0.32})`, opacity: Math.min(1, back * 4),
              boxShadow: `0 ${30 + back * 50}px ${60 + back * 60}px -20px rgba(0,0,0,.85)`}}>
              <Img src={shot('card_' + id + '.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
            </div>
          );
        })}
      </Cam>
      <Headline kicker="05 · Pedido" lines={[{t: 'Um toque.'}, {t: 'Já está no pedido.', c: HOT}]} at={-30} out={78} y={230} size={84} />
    </AbsoluteFill>
  );
};

/* 05 · Finalização: a câmera acompanha cada etapa; legenda vira um indicador tipográfico */
const S5: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const T = {s1: 0, go1: 26, s2: 32, fill: [44, 54, 64, 74], go2: 88, s3: 94, pix: 106, end: 118};
  let src = 'step1.png';
  if (f >= T.s2) src = 'step2_empty.png';
  if (f >= T.s3) src = 'step3_empty.png';
  if (f >= T.pix + 1) src = 'step3_pix.png';
  // enquadramentos (centro óptico em css da página) e escala da câmera
  const keys = [0, 14, 24, 32, 42, 82, 92, 100, 114, 135];
  const fy = interpolate(f, keys, [520, 380, 760, 720, 520, 520, 760, 400, 640, 640], {...cl, easing: IO});
  const sc = interpolate(f, keys, [1.0, 1.18, 1.12, 1.12, 1.3, 1.3, 1.12, 1.28, 1.12, 1.1], {...cl, easing: IO});
  const slide = (at: number) => lerp(f, [at, at + 9], [PW, 0], OUT);
  const offX = f >= T.s3 ? slide(T.s3) : f >= T.s2 ? slide(T.s2) : slide(T.s1 - 9);
  const fields = ['cartName', 'cartStreet', 'cartDistrict', 'cartRef'];
  const steps = ['Pedido', 'Entrega', 'Pagamento'];
  const cur = f >= T.s3 ? 2 : f >= T.s2 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Stage />
      <Dust />
      <Cam s={sc} fx={195} fy={fy}>
        <Phone glare={lerp(f, [T.s2, T.s2 + 30], [-0.3, 1.4], IO)} bar={SHEET}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${offX}px)`}}>
            <Screen src={shot(src)} />
            {f >= T.s2 && f < T.s3 && fields.map((k, i) => {
              const b = pos[k], m = lerp(f, [T.fill[i], T.fill[i] + 9], [0, 1], Easing.linear);
              return (
                <div key={k} style={{position: 'absolute', left: (b.x - b.w / 2) * CSS, top: (b.y - b.h / 2) * CSS, width: b.w * CSS * m, height: b.h * CSS, overflow: 'hidden'}}>
                  <Img src={shot('step2_filled.png')} style={{position: 'absolute', width: PW, left: -(b.x - b.w / 2) * CSS, top: -(b.y - b.h / 2) * CSS}} />
                </div>
              );
            })}
          </div>
          <Tap x={pos.send.x} y={pos.send.y} at={T.go1} />
          <Tap x={pos.send.x} y={pos.send.y} at={T.go2} />
          <Tap x={pos.pix.x} y={pos.pix.y} at={T.pix} />
        </Phone>
      </Cam>
      {/* faixa escura para a legenda ficar legível sobre o celular aproximado */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.97) 0%, rgba(10,2,3,.93) 29%, transparent 37%)'}} />
      <div style={{position: 'absolute', left: 84, top: 236, font: '700 25px DM Sans', letterSpacing: '0.34em', color: '#ff8f97', display: 'flex', alignItems: 'center', gap: 18}}>
        <span style={{width: 64, height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`}} />06 · FINALIZE
      </div>
      <div style={{position: 'absolute', left: 84, top: 290, display: 'flex', flexDirection: 'column', gap: 4}}>
        {steps.map((s, i) => {
          const done = i < cur, on = i === cur;
          const o = lerp(f, [i * 8, i * 8 + 10], [0, 1]);
          return (
            <div key={s} style={{font: '900 84px/0.98 Montserrat', letterSpacing: '-0.045em', textTransform: 'uppercase', opacity: o * (done || on ? 1 : 0.22),
              color: done ? HOT : '#fff', transform: `translateX(${(1 - o) * -30}px)`, display: 'flex', alignItems: 'center', gap: 18}}>
              {s}.{done && <span style={{font: '900 54px Montserrat', color: HOT}}>✓</span>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 06 · Confirmação: o botão vira a mensagem pronta na conversa da loja */
const LINES = [
  'Olá, Dantes! Gostaria de fazer um pedido pelo PedeAi Delivery:', '',
  '*Pedido*', '1x Maromba — R$ 29,90', '1x Tropical — R$ 29,90', '1x Old School — R$ 29,90', '',
  'Subtotal: R$ 89,70', 'Taxa de entrega: R$ 7,00', '*Total: R$ 96,70*', '',
  '*Entrega*', 'Nome: Maria', 'Endereço: Rua das Flores, 120, Bairro Centro', 'Referência: Casa azul', '',
  '*Pagamento:* Pix',
];
const fmt = (t: string) => t.split('*').map((p, i) => i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>);
const Chat: React.FC<{start?: number; full?: boolean}> = ({start = 0, full}) => {
  const f = useCurrentFrame();
  const n = full ? LINES.length : Math.floor(lerp(f, [start + 4, start + 44], [0, LINES.length], Easing.linear));
  const pop = full ? 1 : spring({frame: f - start, fps: 30, config: {damping: 14, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: '#ece5dc'}}>
      <div style={{height: 100, background: WA, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 16}}>
        <Img src={img('dantes-logo.webp')} style={{width: 70, height: 70, borderRadius: '50%'}} />
        <div style={{color: '#fff', font: '700 32px DM Sans', lineHeight: 1.1}}>Dantes<div style={{font: '400 21px DM Sans', opacity: 0.75}}>online</div></div>
      </div>
      {f >= start && (
        <div style={{position: 'absolute', right: 20, top: 128, width: PW - 80, background: '#dcf5e3', borderRadius: '28px 28px 8px 28px', padding: '20px 24px 30px', font: '400 23px/1.36 DM Sans', color: '#16241b',
          transform: `scale(${0.6 + pop * 0.4})`, opacity: Math.min(1, pop * 1.5), transformOrigin: '100% 100%', boxShadow: '0 6px 16px rgba(0,0,0,.1)'}}>
          {LINES.slice(0, Math.max(1, n)).map((l, i) => <div key={i} style={{minHeight: l ? 0 : 12}}>{fmt(l)}</div>)}
          <div style={{position: 'absolute', right: 16, bottom: 8, font: '400 17px DM Sans', color: '#5d7a66'}}>19:42 ✓✓</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
const S6: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const whip = lerp(f, [8, 20], [0, 1], IO);
  const trail = Math.sin(whip * Math.PI);
  const bloom = lerp(f, [14, 18, 34], [0, 0.32, 0], Easing.linear);
  const push = lerp(f, [30, 100], [1.0, 1.16], IO);
  const fy = lerp(f, [0, 22, 60], [700, 420, 360], IO);
  return (
    <AbsoluteFill>
      <Stage hue={f > 16 ? '#1f9e57' : RED} />
      <Dust tint={f > 16 ? '140,255,190' : '255,120,110'} />
      <Cam s={push} fx={195} fy={fy}>
        <Phone ry={lerp(f, [8, 20, 105], [0, 10, 4], IO)} rim={f > 16 ? GREEN : RED} glare={lerp(f, [22, 56], [-0.3, 1.4], IO)} bar={f < 14 ? SHEET : WA} darkBar={f >= 14}>
          {f < 20 && [0, 1, 2, 3].map(i => (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${-whip * PW * 1.1 + i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Screen src={shot('step3_pix.png')} />
              {i === 0 && <div style={{position: 'absolute', left: (pos.send.x - pos.send.w / 2) * CSS, top: (pos.send.y - pos.send.h / 2) * CSS, width: pos.send.w * CSS, height: pos.send.h * CSS, borderRadius: 18, background: '#fff', opacity: lerp(f, [2, 6, 12], [0, 0.45, 0], Easing.linear)}} />}
            </div>
          ))}
          {f >= 8 && [0, 1, 2, 3].map(i => (
            <div key={'c' + i} style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - whip) * PW * 1.1 - i * trail * 50}px)`, opacity: i ? 0.2 : 1}}>
              <Chat start={18} />
            </div>
          ))}
          <Tap x={pos.send.x} y={pos.send.y} at={4} />
        </Phone>
      </Cam>
      <AbsoluteFill style={{background: '#7dffb0', opacity: bloom, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,3,.95) 0%, rgba(10,2,3,.85) 20%, transparent 28%)'}} />
      <Headline kicker="07 · WhatsApp" lines={[{t: 'Chega pronto'}, {t: 'no WhatsApp.', c: GREEN}]} at={20} y={230} size={92} />
    </AbsoluteFill>
  );
};

/* 07 · Assinatura: a tela vira a marca (ui-to-brand-morph).
   O celular volta ao centro, a conversa se apaga e a tela fica vermelha; a moldura sai e o retângulo vermelho
   da tela se contrai, com uma única mola, até virar o ícone oficial (raio 32%, marca a 82%, como no site).
   No impacto a marca branca entra por varredura; o ícone abre espaço e o nome "PedeAi" pousa letra a letra
   (escala + desfoque), "DELIVERY" fecha o espaçamento. Linhas de velocidade, tiradas do próprio símbolo,
   atravessam o fundo como grafismo de marca. Depois a mensagem, a data em destaque e o endereço. */
const SpeedLines: React.FC<{o: number}> = ({o}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: o, overflow: 'hidden'}}>
      {new Array(9).fill(0).map((_, i) => {
        const y = 180 + random('sy' + i) * 1500, w = 260 + random('sw' + i) * 520, h = 6 + Math.round(random('sh' + i) * 3) * 4;
        const sp = 9 + random('sv' + i) * 14;
        const x = 1300 - ((f * sp + random('sx' + i) * 2400) % 2600);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: h, background: `linear-gradient(90deg, transparent, rgba(255,70,85,${0.18 + random('so' + i) * 0.22}) 40%, rgba(255,255,255,${0.10 + random('sq' + i) * 0.12}))`, filter: 'blur(1px)'}} />;
      })}
    </AbsoluteFill>
  );
};
const S7: React.FC<{variant: 'cliente' | 'loja'}> = ({variant}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = 45;                       // impacto da marca (cai na batida da trilha)
  const T = 236, TR = T * 11 / 34;    // ícone: proporção do site (34 px, raio 11)
  const LY = 560;                     // linha central do lockup
  // 1 · a conversa some e a tela fica vermelha
  const red = lerp(f, [6, 18], [0, 1], Easing.inOut(Easing.quad));
  const frameO = 1 - lerp(f, [12, 22], [0, 1], IN);
  // 2 · a tela vira o ícone: uma única mola para x, y, largura, altura e raio
  const m = spring({frame: f - 22, fps, config: {damping: 15, stiffness: 120, mass: 0.9}, durationInFrames: L - 22});
  const brake = f >= L ? Math.sin(Math.min(1, (f - L) / 8) * Math.PI) * 0.06 : 0;
  // 3 · o ícone abre espaço para o nome
  const shift = lerp(f, [L + 6, L + 22], [0, 1], IO);
  const word = 'PedeAi';
  const wordW = 530, gap = 34, lockW = T + gap + wordW;
  const tileCx = interpolate(shift, [0, 1], [540, 540 - lockW / 2 + T / 2]);
  const w = interpolate(m, [0, 1], [PW, T]), h = interpolate(m, [0, 1], [PH, T]);
  const cx = interpolate(m, [0, 1], [PCX, tileCx]), cy = interpolate(m, [0, 1], [PCY, LY]);
  const r = interpolate(m, [0, 1], [RS, TR]);
  const sc = 1 + brake + (f > L + 60 ? Math.sin((f - L - 60) / 16) * 0.012 : 0);
  const wipe = lerp(f, [L, L + 9], [0, 100], OUT);
  const sweep = lerp(f, [L + 70, L + 96], [-0.4, 1.4], IO);
  const field = lerp(f, [L - 2, L + 3, L + 40], [0, 1, 0.55]);
  const loja = variant === 'loja';
  const reveal = (at: number) => spring({frame: f - at, fps, config: {damping: 200}, durationInFrames: 16});
  return (
    <AbsoluteFill>
      <Stage beam={lerp(f, [L - 14, L + 4], [0.5, 1.5], OUT)} floor={1.2} sway={(1 - lerp(f, [0, L], [0, 1], IN)) * -60} />
      {/* campo de cor da marca que se abre no impacto */}
      <AbsoluteFill style={{background: `radial-gradient(70% 38% at 50% ${LY / 19.2}%, ${RED}cc 0%, ${WINE}88 45%, transparent 75%)`, opacity: field, mixBlendMode: 'screen'}} />
      <SpeedLines o={lerp(f, [L, L + 20], [0, 1])} />
      <Dust amount={1.2} />
      {/* celular da cena anterior, voltando ao centro e sumindo */}
      {f < 23 && (
        <Phone ry={lerp(f, [0, 16], [4, 0], IO)} rim={GREEN} bar={mix(WA, RED, red)} darkBar frameO={frameO}>
          <Chat full />
          <AbsoluteFill style={{background: RED, opacity: red}} />
        </Phone>
      )}
      {/* o retângulo vermelho da tela vira o ícone oficial */}
      {f >= 22 && (
        <div style={{position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, background: RED, overflow: 'hidden', transform: `scale(${sc})`,
          boxShadow: `0 ${30 + 20 * m}px ${80 * m}px -20px rgba(0,0,0,.8), 0 0 ${f >= L ? 140 : 40}px -10px ${HOT}`}}>
          <AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(255,255,255,.16), transparent 45%, rgba(0,0,0,.12))'}} />
          {f >= L && <Img src={img('pedeai-mark.png')} style={{position: 'absolute', left: T * 0.09, top: T * 0.09, width: T * 0.82, height: T * 0.82, clipPath: `inset(0 ${100 - wipe}% 0 0)`}} />}
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${sweep * 100 - 20}%, rgba(255,255,255,.5) ${sweep * 100}%, transparent ${sweep * 100 + 16}%)`}} />
        </div>
      )}
      {/* nome: cada letra pousa grande e desfocada até ficar nítida */}
      <div style={{position: 'absolute', left: 540 - lockW / 2 + T + gap, top: LY - 98, width: wordW, display: 'flex', font: '800 150px/1 Montserrat', letterSpacing: '-0.04em', color: '#fff'}}>
        {word.split('').map((ch, i) => {
          const k = spring({frame: f - (L + 16 + i * 3), fps, config: {damping: 16, stiffness: 140}});
          return <span key={i} style={{display: 'inline-block', opacity: Math.min(1, k * 1.4), transform: `scale(${interpolate(k, [0, 1], [1.4, 1])})`, filter: `blur(${(1 - k) * 12}px)`, transformOrigin: '50% 80%'}}>{ch}</span>;
        })}
      </div>
      <div style={{position: 'absolute', left: 540 - lockW / 2 + T + gap + 6, top: LY + 58, font: '700 28px DM Sans', textTransform: 'uppercase', color: '#ffb3b9',
        letterSpacing: `${interpolate(lerp(f, [L + 30, L + 48], [0, 1]), [0, 1], [1.1, 0.5])}em`, opacity: lerp(f, [L + 30, L + 42], [0, 1])}}>Delivery</div>
      <Streak y={LY} o={lerp(f, [L - 1, L + 2, L + 24], [0, 1, 0], Easing.linear)} />
      {/* mensagem */}
      {(() => {
        const t1 = reveal(L + 44);
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: LY + 190, textAlign: 'center', overflow: 'hidden', paddingBottom: 8}}>
            <div style={{font: '900 58px/1 Montserrat', letterSpacing: '-0.035em', color: '#fff', textTransform: 'uppercase', transform: `translateY(${(1 - t1) * 110}%)`}}>
              {loja ? 'Seu cardápio online.' : 'Peça sem baixar aplicativo.'}
            </div>
          </div>
        );
      })()}
      {/* bloco de destaque: data de estreia (cliente) ou "sem comissão" (restaurante) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: LY + 286, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 120 * lerp(f, [L + 52, L + 64], [0, 1]), height: 4, background: HOT, borderRadius: 2, boxShadow: `0 0 18px ${HOT}`, marginBottom: 26}} />
        <div style={{font: '700 26px DM Sans', letterSpacing: '0.42em', color: '#ff8f97', textTransform: 'uppercase', opacity: lerp(f, [L + 56, L + 66], [0, 1]), paddingLeft: '0.42em'}}>
          {loja ? 'Pedido pronto no seu WhatsApp' : 'Estreia'}
        </div>
        <div style={{display: 'flex', overflow: 'hidden', marginTop: 6}}>
          {(loja ? 'SEM COMISSÃO.' : '25/11').split('').map((ch, i) => {
            const k = reveal(L + 60 + i * 2);
            return <span key={i} style={{display: 'inline-block', font: `900 ${loja ? 100 : 196}px/1.02 Montserrat`, letterSpacing: '-0.045em', color: i === 2 && !loja ? HOT : '#fff', transform: `translateY(${(1 - k) * 105}%)`, whiteSpace: 'pre'}}>{ch}</span>;
          })}
        </div>
        {!loja && (
          <div style={{font: '800 42px Montserrat', letterSpacing: '-0.01em', color: '#fff', textTransform: 'uppercase', opacity: lerp(f, [L + 72, L + 84], [0, 1]), transform: `translateY(${(1 - lerp(f, [L + 72, L + 84], [0, 1])) * 18}px)`}}>
            No Vale do Araguaia.
          </div>
        )}
      </div>
      {/* endereço */}
      {(() => {
        const k = spring({frame: f - (L + 84), fps, config: {damping: 14, stiffness: 120}});
        const sh = lerp(f, [L + 104, L + 124], [-0.4, 1.4], IO);
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: LY + (loja ? 590 : 660), display: 'flex', justifyContent: 'center', opacity: Math.min(1, k * 1.5)}}>
            <div style={{position: 'relative', overflow: 'hidden', padding: '18px 44px', borderRadius: 99, background: '#fff', font: '800 40px Montserrat', letterSpacing: '-0.02em', color: RED, transform: `scale(${interpolate(k, [0, 1], [0.8, 1])})`, boxShadow: `0 20px 60px -10px ${RED}aa`}}>
              pedeaionline.com.br
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${sh * 100 - 20}%, rgba(255,140,150,.35) ${sh * 100}%, transparent ${sh * 100 + 20}%)`}} />
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};

/* ================================== MONTAGEM ================================== */
export const SCENES = [210, 225, 105, 90, 135, 105, 180]; // cada corte cai numa batida da trilha (15 quadros)
export const TOTAL = SCENES.reduce((a, b) => a + b, 0);
const AT = (i: number) => SCENES.slice(0, i).reduce((a, b) => a + b, 0);

export const Film: React.FC<{variant: 'cliente' | 'loja'; pos: any}> = ({variant, pos}) => {
  const scenes = [<S1 />, <S2 />, <S3 pos={pos} />, <S4 pos={pos} />, <S5 pos={pos} />, <S6 pos={pos} />, <S7 variant={variant} />];
  const s = AT;
  return (
    <AbsoluteFill style={{background: INK}}>
      <style>{fontFaces}</style>
      {scenes.map((el, i) => <Sequence key={i} from={AT(i)} durationInFrames={SCENES[i]} premountFor={15}>{el}</Sequence>)}
      <Grain />
      {/* desenho de som */}
      <Sfx at={0} s="impacto" v={0.6} />
      {[0, 4, 8, 12, 16].map((t) => <Sfx key={'m' + t} at={t} s="toque" v={0.22} />)}
      <Sfx at={20} s="whoosh" v={0.25} />
      <Sfx at={40} s="farelo" v={0.55} />
      <Sfx at={76} s="pressao" v={0.7} />
      <Sfx at={105} s="whoosh" v={0.2} />
      <Sfx at={128} s="whoosh-grave" v={0.55} />
      <Sfx at={150} s="impacto" v={0.75} />
      <Sfx at={198} s="whoosh" v={0.55} />
      <Sfx at={s(1) + 2} s="whoosh-grave" v={0.45} />
      {[44, 104, 170, 208].map((t) => <Sfx key={'t' + t} at={s(1) + t} s="toque" v={0.6} />)}
      <Sfx at={s(1) + 48} s="whoosh" v={0.3} />
      <Sfx at={s(1) + 70} s="whoosh" v={0.18} />
      <Sfx at={s(1) + 110} s="whoosh" v={0.25} />
      <Sfx at={s(1) + 132} s="whoosh" v={0.2} />
      <Sfx at={s(1) + 176} s="whoosh" v={0.2} />
      <Sfx at={s(1) + 210} s="whoosh-grave" v={0.55} />
      <Sfx at={s(2) + 22} s="whoosh" v={0.4} />
      <Sfx at={s(2) + 66} s="whoosh" v={0.35} />
      <Sfx at={s(3) + 24} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 40} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 56} s="adicionado" v={0.6} />
      <Sfx at={s(3) + 80} s="toque" v={0.6} />
      <Sfx at={s(4) + 26} s="toque" v={0.6} />
      {[44, 54, 64, 74].map(t => <Sfx key={t} at={s(4) + t} s="toque" v={0.25} />)}
      <Sfx at={s(4) + 88} s="toque" v={0.6} />
      <Sfx at={s(4) + 106} s="toque" v={0.6} />
      <Sfx at={s(5) + 4} s="toque" v={0.7} />
      <Sfx at={s(5) + 8} s="whoosh" v={0.6} />
      <Sfx at={s(5) + 18} s="mensagem" v={0.7} />
      <Sfx at={s(6) + 6} s="whoosh-grave" v={0.4} />
      <Sfx at={s(6) + 45 - 60} s="subida" v={0.4} />
      <Sfx at={s(6) + 45} s="impacto" v={0.65} />
      <Sfx at={s(6) + 46} s="assinatura" v={0.42} />
      <Sfx at={s(6) + 45 + 84} s="adicionado" v={0.35} />
      <Audio src={staticFile('sfx/trilha.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};
