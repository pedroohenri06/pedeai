import React from 'react';
import {
  AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from 'remotion';

/* PedeAi · Reel do fluxo real (cardápio → 3 etapas → WhatsApp da loja).
   1080×1920, 30 fps. Telas capturadas da plataforma em 3× (1170×2532). */

const RED = '#e51b2b', WINE = '#7d1019', DARK = '#150507', CREAM = '#f8f5ef';
const SCREEN_W = 1170, SCREEN_H = 2532; // px das capturas (390×844 css @3x)
const PHONE_W = 640; // largura da tela do celular no quadro
const K = PHONE_W / SCREEN_W; // px de captura → px de quadro
const CSS = 3 * K; // px css da página → px de quadro
const PHONE_H = SCREEN_H * K;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const shot = (n: string) => staticFile('shots/' + n);

export const fontFaces = `
@font-face{font-family:'Montserrat';font-weight:600 900;src:url(${staticFile('fonts/montserrat-latin.woff2')}) format('woff2')}
@font-face{font-family:'DM Sans';font-weight:400 700;src:url(${staticFile('fonts/dm-sans-latin.woff2')}) format('woff2')}`;

/* ---------- Palco: fundo vinho com luz de recorte e grão ---------- */
const Stage: React.FC<{glow?: number; hue?: string}> = ({glow = 1, hue = RED}) => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 70) * 8, y = 42 + Math.cos(f / 90) * 5;
  return (
    <AbsoluteFill style={{background: `radial-gradient(70% 50% at ${x}% ${y}%, ${hue}55 0%, transparent 60%), radial-gradient(120% 80% at 50% 110%, ${WINE} 0%, ${DARK} 55%, #070102 100%)`, opacity: 1}}>
      <AbsoluteFill style={{background: `radial-gradient(40% 30% at ${x}% ${y + 8}%, ${hue}${Math.round(40 * glow).toString(16).padStart(2, '0')}, transparent 70%)`, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 340px rgba(0,0,0,.85)'}} />
    </AbsoluteFill>
  );
};

/* ---------- Vazamento de luz (light leak) nas batidas ---------- */
const LightLeak: React.FC<{dur?: number; color?: string; from?: 'left' | 'right'}> = ({dur = 18, color = '#ff5a3c', from = 'left'}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], clamp);
  const o = interpolate(p, [0, 0.35, 1], [0, 0.9, 0]);
  const x = from === 'left' ? interpolate(p, [0, 1], [-10, 70]) : interpolate(p, [0, 1], [110, 30]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: o,
      background: `radial-gradient(45% 60% at ${x}% 40%, ${color} 0%, ${color}88 25%, transparent 65%), radial-gradient(30% 40% at ${x + 15}% 70%, #ffd29a 0%, transparent 60%)`}} />
  );
};

/* ---------- Texto com corte vertical por palavra ---------- */
const Caption: React.FC<{text: string; at?: number; out?: number; y?: number; size?: number; color?: string}> = ({text, at = 0, out = 9999, y = 250, size = 76, color = '#fff'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(' ');
  const leave = interpolate(f, [out, out + 8], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, textAlign: 'center', font: `900 ${size}px/1.04 Montserrat`, letterSpacing: '-0.035em', color, opacity: 1 - leave, transform: `translateY(${-leave * 30}px)`, textShadow: '0 8px 40px rgba(0,0,0,.45)'}}>
      {words.map((w, i) => {
        const s = spring({frame: f - at - i * 3, fps, config: {damping: 200}, durationInFrames: 16});
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: 8, marginRight: '0.24em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - s) * 110}%)`}}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/* ---------- Celular ---------- */
const Phone: React.FC<{children: React.ReactNode; rx?: number; ry?: number; rz?: number; scale?: number; x?: number; y?: number; glare?: number}> = ({children, rx = 0, ry = 0, rz = 0, scale = 1, x = 0, y = 0, glare = 0}) => {
  const bezel = 22;
  return (
    <AbsoluteFill style={{perspective: 2400, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `translate(${x}px, ${y}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`, transformStyle: 'preserve-3d'}}>
        <div style={{position: 'relative', width: PHONE_W + bezel * 2, height: PHONE_H + bezel * 2, borderRadius: 112, padding: bezel,
          background: 'linear-gradient(145deg,#3a3a3e 0%,#0c0c0e 40%,#26262a 100%)',
          boxShadow: `0 0 0 3px #4a4a50, 0 80px 140px -40px rgba(0,0,0,.9), 0 0 120px -10px ${RED}66`}}>
          <div style={{position: 'relative', width: PHONE_W, height: PHONE_H, borderRadius: 92, overflow: 'hidden', background: '#fff'}}>
            {children}
            {/* reflexo de vidro */}
            <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${glare * 100 - 30}%, rgba(255,255,255,.28) ${glare * 100 - 12}%, transparent ${glare * 100 + 6}%)`, pointerEvents: 'none'}} />
            {/* ilha */}
            <div style={{position: 'absolute', top: 18, left: '50%', width: 190, height: 52, marginLeft: -95, borderRadius: 30, background: '#000'}} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Screen: React.FC<{src: string; opacity?: number; y?: number}> = ({src, opacity = 1, y = 0}) => (
  <Img src={src} style={{position: 'absolute', left: 0, top: y, width: PHONE_W, opacity}} />
);

/* Anel de toque em coordenadas css da página */
const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 6, at, at + 14], [0, 1, 2], clamp);
  if (f < at - 6 || f > at + 16) return null;
  const press = p < 1 ? p : 1;
  const ring = p > 1 ? p - 1 : 0;
  return (
    <>
      <div style={{position: 'absolute', left: x * CSS - 34, top: y * CSS - 34, width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,.55)', border: '3px solid rgba(255,255,255,.95)', transform: `scale(${1 - press * 0.18})`, opacity: 1 - ring, boxShadow: '0 6px 20px rgba(0,0,0,.25)'}} />
      <div style={{position: 'absolute', left: x * CSS - 34, top: y * CSS - 34, width: 68, height: 68, borderRadius: '50%', border: `4px solid ${RED}`, transform: `scale(${1 + ring * 1.6})`, opacity: (1 - ring) * 0.9}} />
    </>
  );
};

/* ================= Cenas ================= */

/* 1 · Gancho: os lanches de verdade flutuando sob luz quente */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cards = [
    {src: 'img/103b63cca62c.webp', x: -300, y: 120, r: -9, d: 0.6, s: 0.78},
    {src: 'img/7c389b4c4497.webp', x: 300, y: 180, r: 8, d: 0.6, s: 0.78},
    {src: 'img/6f1c5240bee3.webp', x: 0, y: 40, r: 0, d: 1, s: 1},
  ];
  const sweep = interpolate(f, [8, 40], [-40, 140], clamp);
  return (
    <AbsoluteFill>
      <Stage glow={1.3} hue="#ff4a2a" />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 2000}}>
        {cards.map((c, i) => {
          const s = spring({frame: f - i * 4, fps, config: {damping: 18, stiffness: 90}});
          const drift = Math.sin((f + i * 20) / 22) * 10;
          const w = 560 * c.s;
          return (
            <div key={i} style={{position: 'absolute', width: w, height: c.src.includes('6f1c') ? w * 4 / 3 : w, borderRadius: 44, overflow: 'hidden',
              transform: `translate(${c.x * s}px, ${c.y + (1 - s) * 500 + drift}px) rotate(${c.r * s}deg) scale(${0.9 + f * 0.0016 * c.d})`,
              boxShadow: '0 60px 120px -30px rgba(0,0,0,.9)', opacity: s, filter: c.d < 1 ? 'blur(2px) brightness(.75)' : 'none'}}>
              <Img src={staticFile(c.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${sweep - 20}%, rgba(255,230,190,.45) ${sweep}%, transparent ${sweep + 18}%)`, mixBlendMode: 'screen'}} />
            </div>
          );
        })}
      </AbsoluteFill>
      <Caption text="Bateu a fome?" at={6} y={250} size={104} />
    </AbsoluteFill>
  );
};

/* 2 · Celular gira para a câmera com a home */
const PhoneIn: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 16, stiffness: 70}});
  const glare = interpolate(f, [6, 40], [-0.4, 1.4], clamp);
  const dive = interpolate(f, [62, 90], [0, 1], {...clamp, easing: inOut});
  return (
    <AbsoluteFill>
      <Stage />
      <Phone ry={interpolate(s, [0, 1], [-38, -7])} rx={interpolate(s, [0, 1], [18, 5])} rz={interpolate(s, [0, 1], [-6, 0])}
        y={interpolate(s, [0, 1], [900, 120]) - dive * 60} scale={interpolate(s, [0, 1], [0.7, 1]) + dive * 0.25} glare={glare}>
        <Screen src={shot('home.png')} y={-interpolate(f, [20, 70], [0, 160], {...clamp, easing: ease})} />
      </Phone>
      <Caption text="Todo o delivery da sua cidade" at={8} out={56} y={210} size={72} />
    </AbsoluteFill>
  );
};

/* 3 · A loja abre e o cardápio rola até os lanches */
const Store: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [0, 14], [0, 1], {...clamp, easing: ease});
  const scroll = interpolate(f, [22, 78], [0, 3928], {...clamp, easing: inOut});
  const speed = Math.abs(interpolate(f + 1, [22, 78], [0, 3928], {...clamp, easing: inOut}) - scroll);
  const blur = Math.min(10, speed / 18);
  return (
    <AbsoluteFill>
      <Stage />
      <Phone ry={-5} rx={4} y={110} scale={0.98} glare={interpolate(f, [0, 30], [-0.3, 1.3], clamp)}>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${blur * 0.25}px)`}}>
          <Img src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS, width: PHONE_W}} />
          {/* rastro vertical de movimento */}
          {blur > 1 && [1, 2, 3].map(i => (
            <Img key={i} src={shot('store_tall.jpg')} style={{position: 'absolute', left: 0, top: -scroll * CSS + i * blur * 2.2, width: PHONE_W, opacity: 0.18}} />
          ))}
        </div>
        <Screen src={shot('store_menu.png')} opacity={interpolate(f, [76, 84], [0, 1], clamp)} />
        <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 1 - open}} />
      </Phone>
      <Caption text="Cardápio com foto e preço" at={10} out={82} y={210} size={72} />
    </AbsoluteFill>
  );
};

/* 4 · Três toques no + */
const Add: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const taps = [{id: 'maromba', at: 12}, {id: 'tropical', at: 34}, {id: 'old-school', at: 56}];
  let src = 'store_menu.png';
  taps.forEach(t => { if (f >= t.at + 2) src = 'store_menu_' + t.id + '.png'; });
  const push = interpolate(f, [0, 80], [0.98, 1.04], clamp);
  return (
    <AbsoluteFill>
      <Stage />
      <Phone ry={-3} rx={3} y={120} scale={push} glare={0}>
        <Screen src={shot(src)} />
        {taps.map(t => <Tap key={t.id} x={pos['add_' + t.id].x} y={pos['add_' + t.id].y} at={t.at} />)}
      </Phone>
      {taps.map((t, i) => f >= t.at + 2 && f < t.at + 22 ? (
        <div key={t.id} style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', font: '900 120px Montserrat', color: '#fff',
          opacity: interpolate(f, [t.at + 2, t.at + 6, t.at + 16, t.at + 22], [0, 1, 1, 0]), transform: `scale(${interpolate(f, [t.at + 2, t.at + 8], [0.6, 1], clamp)})`, textShadow: `0 0 40px ${RED}`}}>
          +{i + 1}
        </div>
      ) : null)}
      <Caption text="Toca no + e pronto" at={4} out={80} y={210} size={72} />
    </AbsoluteFill>
  );
};

/* 5 · Pedido, Entrega e Pagamento no ritmo */
const Checkout: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  // linha do tempo da cena (frames)
  const T = {bar: 6, step1: 14, cont: 34, step2: 40, fill: [52, 62, 72, 82], go: 94, step3: 100, pix: 112};
  let src = 'store_menu_old-school.png';
  if (f >= T.step1) src = 'step1.png';
  if (f >= T.step2) src = 'step2_empty.png';
  if (f >= T.step3) src = 'step3_empty.png';
  if (f >= T.pix + 2) src = 'step3_pix.png';
  const fillMask = (i: number) => interpolate(f, [T.fill[i], T.fill[i] + 8], [0, 1], clamp);
  const fields = ['cartName', 'cartStreet', 'cartDistrict', 'cartRef'];
  const slide = (at: number) => interpolate(f, [at, at + 8], [80, 0], {...clamp, easing: ease});
  return (
    <AbsoluteFill>
      <Stage />
      <Phone ry={0} rx={2} y={130} scale={1.0} glare={interpolate(f, [T.step1, T.step1 + 26], [-0.3, 1.3], clamp)}>
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${f >= T.step3 ? slide(T.step3) : f >= T.step2 ? slide(T.step2) : f >= T.step1 ? slide(T.step1) : 0}px)`}}>
          <Screen src={shot(src)} />
          {/* preenchimento letra a letra: revela a versão preenchida campo por campo */}
          {f >= T.step2 && f < T.step3 && fields.map((k, i) => {
            const b = pos[k];
            const m = fillMask(i);
            return (
              <div key={k} style={{position: 'absolute', left: (b.x - b.w / 2) * CSS, top: (b.y - b.h / 2) * CSS, width: b.w * CSS * m, height: b.h * CSS, overflow: 'hidden'}}>
                <Img src={shot('step2_filled.png')} style={{position: 'absolute', width: PHONE_W, left: -(b.x - b.w / 2) * CSS, top: -(b.y - b.h / 2) * CSS}} />
              </div>
            );
          })}
        </div>
        <Tap x={pos.cartBar.x} y={pos.cartBar.y} at={T.bar} />
        <Tap x={pos.send.x} y={pos.send.y} at={T.cont} />
        <Tap x={pos.send.x} y={pos.send.y} at={T.go} />
        <Tap x={pos.pix.x} y={pos.pix.y} at={T.pix} />
      </Phone>
      <Caption text="Endereço e pagamento" at={T.step1} out={9999} y={180} size={72} />
      <Caption text="em segundos" at={T.step1 + 8} out={9999} y={262} size={72} color="#ffb4b9" />
    </AbsoluteFill>
  );
};

/* 6 · Enviar → conversa no WhatsApp da loja (tela desenhada para o vídeo) */
const LINES = [
  'Olá, Dantes! Gostaria de fazer um pedido pelo PedeAi Delivery:', '',
  '*Pedido*', '1x Maromba — R$ 29,90', '1x Tropical — R$ 29,90', '1x Old School — R$ 29,90', '',
  'Subtotal: R$ 89,70', 'Taxa de entrega: R$ 7,00', '*Total: R$ 96,70*', '',
  '*Entrega*', 'Nome: Maria', 'Endereço: Rua das Flores, 120, Bairro Centro', 'Referência: Casa azul', '',
  '*Pagamento:* Pix',
];
const fmt = (t: string) => t.split('*').map((p, i) => i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>);
const Chat: React.FC<{full?: boolean}> = ({full}) => {
  const f = useCurrentFrame();
  const shown = full ? LINES.length : Math.floor(interpolate(f, [8, 52], [0, LINES.length], clamp));
  const pop = full ? 1 : interpolate(f, [4, 12], [0.85, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{background: '#eae6df'}}>
      <div style={{height: 150, background: '#1f2c26', display: 'flex', alignItems: 'flex-end', padding: '0 28px 22px', gap: 18}}>
        <Img src={staticFile('img/dantes-logo.webp')} style={{width: 76, height: 76, borderRadius: '50%'}} />
        <div style={{color: '#fff', font: '700 34px DM Sans', lineHeight: 1.1}}>Dantes<div style={{font: '400 22px DM Sans', opacity: 0.75}}>online</div></div>
      </div>
      <div style={{position: 'absolute', right: 22, top: 200, width: PHONE_W - 90, background: '#d9f7e1', borderRadius: '30px 30px 8px 30px', padding: '22px 26px 30px', font: '400 24px/1.38 DM Sans', color: '#1d2a22',
        transform: `scale(${pop})`, transformOrigin: 'bottom right', boxShadow: '0 4px 10px rgba(0,0,0,.08)'}}>
        {LINES.slice(0, Math.max(1, shown)).map((l, i) => <div key={i} style={{minHeight: l ? 0 : 14}}>{fmt(l)}</div>)}
        <div style={{position: 'absolute', right: 18, bottom: 8, font: '400 18px DM Sans', color: '#5d7a66'}}>19:42 ✓✓</div>
      </div>
    </AbsoluteFill>
  );
};
const Send: React.FC<{pos: any}> = ({pos}) => {
  const f = useCurrentFrame();
  const whip = interpolate(f, [8, 20], [0, 1], {...clamp, easing: inOut});
  const x1 = -whip * 900, x2 = (1 - whip) * 900;
  const trail = Math.sin(whip * Math.PI);
  const flash = interpolate(f, [12, 16, 26], [0, 0.55, 0], clamp);
  return (
    <AbsoluteFill>
      <Stage hue={f > 14 ? '#21c26b' : RED} />
      <Phone ry={interpolate(f, [8, 20, 80], [0, -6, -10], clamp)} rx={2} y={130} scale={1.0} glare={interpolate(f, [20, 50], [-0.3, 1.3], clamp)}>
        {f < 20 && [0, 1, 2, 3].map(i => <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${x1 + i * trail * 60}px)`, opacity: i ? 0.22 : 1}}><Screen src={shot('step3_pix.png')} /></div>)}
        {f >= 8 && [0, 1, 2, 3].map(i => <div key={'c' + i} style={{position: 'absolute', inset: 0, transform: `translateX(${x2 - i * trail * 60}px)`, opacity: i ? 0.22 : 1}}><Sequence from={14} layout="none"><Chat /></Sequence>{f < 14 ? <div style={{position: 'absolute', inset: 0, background: '#eae6df'}} /> : null}</div>)}
        <Tap x={pos.send.x} y={pos.send.y} at={4} />
      </Phone>
      <AbsoluteFill style={{background: '#7dffb0', opacity: flash, mixBlendMode: 'screen'}} />
      <Caption text="O pedido chega pronto" at={18} y={180} size={72} />
      <Caption text="no WhatsApp da loja" at={26} y={262} size={72} color="#8ff0b4" />
    </AbsoluteFill>
  );
};

/* 7 · Fechamento */
const Close: React.FC<{variant: 'cliente' | 'loja'}> = ({variant}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const back = interpolate(f, [0, 40], [0, 1], {...clamp, easing: ease});
  const logo = spring({frame: f - 14, fps, config: {damping: 14, stiffness: 80}});
  const lines = variant === 'cliente'
    ? ['Peça sem baixar aplicativo', 'Estreia 25/11 no Vale do Araguaia']
    : ['Seu cardápio online', 'Pedido pronto no seu WhatsApp', 'Sem comissão'];
  return (
    <AbsoluteFill>
      <Stage glow={1.4} />
      <Phone ry={interpolate(back, [0, 1], [-10, 18])} rx={interpolate(back, [0, 1], [2, 8])} y={interpolate(back, [0, 1], [130, 520])} scale={interpolate(back, [0, 1], [1.0, 0.62])} glare={interpolate(f, [10, 40], [-0.3, 1.3], clamp)}>
        <Chat full />
      </Phone>
      <AbsoluteFill style={{alignItems: 'center', top: 230}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 28, transform: `scale(${logo})`, opacity: logo}}>
          <div style={{width: 150, height: 150, borderRadius: 42, background: RED, display: 'grid', placeItems: 'center', boxShadow: `0 30px 80px -10px ${RED}`}}>
            <Img src={staticFile('img/pedeai-mark.png')} style={{width: 108}} />
          </div>
          <div style={{font: '900 112px Montserrat', color: '#fff', letterSpacing: '-0.04em'}}>PedeAi</div>
        </div>
      </AbsoluteFill>
      {lines.map((l, i) => <Caption key={l} text={l} at={26 + i * 7} y={470 + i * 78} size={i ? 50 : 62} color={i ? '#ffd0d4' : '#fff'} />)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 470 + lines.length * 78 + 20, textAlign: 'center', font: '700 40px DM Sans', color: '#fff', opacity: interpolate(f, [50, 60], [0, 1], clamp)}}>pedeaionline.com.br</div>
    </AbsoluteFill>
  );
};

/* ================= Montagem ================= */
export const SCENES = [60, 90, 90, 90, 125, 85, 95]; // em frames, 30 fps
export const TOTAL = SCENES.reduce((a, b) => a + b, 0);

export const Reel: React.FC<{variant: 'cliente' | 'loja'; pos: any}> = ({variant, pos}) => {
  let t = 0;
  const at = (i: number) => SCENES.slice(0, i).reduce((a, b) => a + b, 0);
  const parts = [
    <Hook />, <PhoneIn />, <Store />, <Add pos={pos} />, <Checkout pos={pos} />, <Send pos={pos} />, <Close variant={variant} />,
  ];
  return (
    <AbsoluteFill style={{background: DARK}}>
      <style>{fontFaces}</style>
      {parts.map((p, i) => <Sequence key={i} from={at(i)} durationInFrames={SCENES[i]} premountFor={10}>{p}</Sequence>)}
      {/* vazamentos de luz nos cortes principais */}
      {[1, 2, 5, 6].map((i, k) => <Sequence key={'l' + i} from={at(i) - 6} durationInFrames={20}><LightLeak from={k % 2 ? 'right' : 'left'} color={i === 6 ? '#21c26b' : '#ff4a2a'} /></Sequence>)}
    </AbsoluteFill>
  );
};
