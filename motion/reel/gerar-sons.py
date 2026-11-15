# Desenho de som do filme PedeAi, sintetizado do zero (sem amostras de terceiros).
# Uso: python3 gerar-sons.py public/sfx
import sys, wave, numpy as np
SR = 48000
out = sys.argv[1] if len(sys.argv) > 1 else 'public/sfx'
rng = np.random.default_rng(7)
t = lambda d: np.arange(int(SR * d)) / SR

def save(name, x, gain=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    st = np.stack([x, x], 1)
    with wave.open(f'{out}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 4), len(x))

def bandsweep(x, f0, f1):
    # filtro de banda que varre f0 → f1 (por blocos)
    n = len(x); y = np.zeros(n); blk = 1024
    for i in range(0, n, blk // 2):
        seg = x[i:i + blk]
        if len(seg) < 16: break
        win = np.hanning(len(seg)); fc = f0 * (f1 / f0) ** (i / n)
        S = np.fft.rfft(seg * win); f = np.fft.rfftfreq(len(seg), 1 / SR)
        S *= np.exp(-((np.log2(f + 1) - np.log2(fc)) ** 2) / 0.6)
        y[i:i + len(seg)] += np.fft.irfft(S, len(seg))
    return y

# 1. Impacto grave (abertura e logo): queda de 95 → 36 Hz, cauda longa + transiente
d = t(2.2); f = 36 + 59 * np.exp(-d * 9)
hit = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-d * 2.2)
click = lowpass(rng.standard_normal(len(d)), 2500) * np.exp(-d * 60) * 0.5
save('impacto', hit + click + 0.25 * np.tanh(3 * hit))

# 2. Whoosh discreto (transições)
d = t(0.7); env = np.sin(np.pi * np.clip(d / 0.7, 0, 1)) ** 2
save('whoosh', bandsweep(rng.standard_normal(len(d)), 400, 3200) * env, 0.7)

# 3. Whoosh longo e grave (mergulho / chicote)
d = t(1.0); env = np.sin(np.pi * np.clip(d / 1.0, 0, 1)) ** 3
save('whoosh-grave', bandsweep(rng.standard_normal(len(d)), 1600, 220) * env, 0.75)

# 4. Toque de interface, sutil
d = t(0.09); tick = np.sin(2 * np.pi * 2100 * d) * np.exp(-d * 90) + 0.4 * lowpass(rng.standard_normal(len(d)), 6000) * np.exp(-d * 200)
save('toque', tick, 0.5)

# 5. "Adicionado": blip curto que sobe
d = t(0.14); f = 820 + 640 * (d / 0.14)
save('adicionado', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-d * 28) * (1 - np.exp(-d * 400)), 0.5)

# 6. Subida (riser) antes da marca
d = t(2.0); fr = 180 * (6 ** (d / 2.0))
riser = 0.55 * np.sin(2 * np.pi * np.cumsum(fr) / SR) + bandsweep(rng.standard_normal(len(d)), 300, 6000)
save('subida', riser * (d / 2.0) ** 2.2 * (1 - np.exp(-(2.0 - d) * 40)), 0.6)

# 7. Chegada da mensagem: dois toques suaves (sol → dó)
d = t(0.6); a = np.sin(2 * np.pi * 784 * d) * np.exp(-d * 9); b = np.zeros_like(d)
k = int(SR * 0.11); b[k:] = np.sin(2 * np.pi * 1047 * d[:-k]) * np.exp(-d[:-k] * 7)
save('mensagem', a + b, 0.45)

# 8. Assinatura sonora da marca: brilho em quinta com tremolo e cauda
d = t(3.2); env = (1 - np.exp(-d * 30)) * np.exp(-d * 1.1)
sig = sum(np.sin(2 * np.pi * fq * d) * g for fq, g in [(392, 1), (587.3, .7), (784, .55), (1174.7, .3), (1568, .18)])
save('assinatura', sig * env * (1 + 0.08 * np.sin(2 * np.pi * 5 * d)), 0.6)
print('ok')

# 9. Trilha original (120 BPM, sol menor), alinhada aos cortes do filme (1 batida = 15 quadros).
#    0–2,5 s: drone escuro e pulso grave · 2,5–12 s: pulso + arpejo com filtro abrindo
#    12–19,9 s: entra o chimbal e o baixo · 19,9–20,5 s: respiro em silêncio · 20,5 s: marca (acorde final).
def trilha(dur=24.5):
    n = int(SR * dur); x = np.zeros(n); tt = np.arange(n) / SR
    beat = 0.5
    def at(s, sig, g=1.0):
        i = int(s * SR); j = min(n, i + len(sig))
        if i < n: x[i:j] += sig[:j - i] * g
    # drone (sol 49 Hz + quinta), cresce até o respiro
    drone = (np.sin(2*np.pi*49*tt) + 0.5*np.sin(2*np.pi*73.4*tt) + 0.25*np.sin(2*np.pi*98*tt))
    x += drone * 0.18 * np.clip(tt / 2, 0, 1) * (tt < 19.9)
    # bumbo macio em cada batida (a partir de 0) — só tempo 1 e 3 no início
    kd = t(0.35); kick = np.sin(2*np.pi*np.cumsum(48 + 90*np.exp(-kd*30))/SR) * np.exp(-kd*9)
    for k in range(int(19.9 / beat)):
        s = k * beat
        if s < 2.5 and k % 4: continue
        if s < 12 and k % 2: continue
        at(s, kick, 0.55 + 0.25 * (s / 20))
    # arpejo (colcheias) com progressão sol–mi♭–si♭–ré, filtro abrindo
    prog = [[196, 233.1, 293.7], [155.6, 196, 233.1], [233.1, 293.7, 349.2], [146.8, 185, 220]]
    ad = t(0.24)
    for k in range(int((19.9 - 2.5) / 0.25)):
        s = 2.5 + k * 0.25; chord = prog[int(s / 2) % 4]; fq = chord[k % 3] * (2 if k % 4 == 3 else 1)
        bright = 1 + 6 * ((s - 2.5) / 17.4) ** 1.5
        note = sum(np.sin(2*np.pi*fq*h*ad) / h**(2.2 - bright*0.15) for h in range(1, 6)) * np.exp(-ad*10)
        at(s, note, 0.07 + 0.05 * (s - 2.5) / 17.4)
    # baixo (semínimas) a partir de 12 s
    bd = t(0.45)
    for k in range(int((19.9 - 12) / beat)):
        s = 12 + k * beat; fq = prog[int(s / 2) % 4][0] / 4
        at(s, (np.sin(2*np.pi*fq*bd) + 0.3*np.sin(4*np.pi*fq*bd)) * np.exp(-bd*4), 0.35)
    # chimbal (semicolcheias) a partir de 12 s
    hd = t(0.05); hat = bandsweep(rng.standard_normal(len(hd) + 2048), 7000, 9000)[:len(hd)] * np.exp(-hd*90)
    for k in range(int((19.9 - 12) / 0.125)):
        at(12 + k * 0.125, hat, 0.10 if k % 2 else 0.16)
    # acorde final da marca (pad longo) a partir de 20,5 s
    pd = t(4.0); env = (1 - np.exp(-pd*12)) * np.exp(-pd*0.7)
    pad = sum(np.sin(2*np.pi*fq*pd + 0.3*np.sin(2*np.pi*0.3*pd)) * g for fq, g in [(98, .8), (146.8, .6), (196, .6), (233.1, .35), (293.7, .3)])
    at(20.5, pad * env, 0.35)
    # fade final suave
    x *= np.clip((dur - tt) / 0.6, 0, 1)
    return np.tanh(x * 1.4)
save('trilha', trilha(), 0.8)
print('trilha ok')
