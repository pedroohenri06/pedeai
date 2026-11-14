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
