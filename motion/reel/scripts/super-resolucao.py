# Super-resolução da filmagem de abertura: Real-ESRGAN realesr-general-x4v3 (SRVGGNetCompact) com mistura de redução de ruído (DNI), em CPU.
# Pesos: github.com/xinntao/Real-ESRGAN/releases/v0.2.5.0 (realesr-general-x4v3.pth e realesr-general-wdn-x4v3.pth), na mesma pasta deste script.
# Quadros de entrada: ffmpeg -i public/motim/original.mp4 src/%04d.png · saída convertida para public/motim/sr/NNNN.jpg (qualidade 96).
# Uso: python3 -I super-resolucao.py <pasta_entrada> <pasta_saida> <largura_final> <altura_final> [dni=0.5] [primeiro] [ultimo]
import sys, os, glob, time
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

class SRVGGNetCompact(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.upscale = upscale
        self.body = nn.ModuleList()
        self.body.append(nn.Conv2d(num_in_ch, num_feat, 3, 1, 1))
        self.body.append(nn.PReLU(num_parameters=num_feat))
        for _ in range(num_conv):
            self.body.append(nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.append(nn.PReLU(num_parameters=num_feat))
        self.body.append(nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1))
        self.upsampler = nn.PixelShuffle(upscale)
    def forward(self, x):
        out = x
        for m in self.body:
            out = m(out)
        out = self.upsampler(out)
        return out + F.interpolate(x, scale_factor=self.upscale, mode='nearest')

here = os.path.dirname(os.path.abspath(__file__))
src, dst, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
dni = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
a = torch.load(os.path.join(here, 'general-x4v3.pth'), map_location='cpu')
b = torch.load(os.path.join(here, 'general-wdn-x4v3.pth'), map_location='cpu')
a = a.get('params', a); b = b.get('params', b)
sd = {k: dni * a[k] + (1 - dni) * b[k] for k in a}
net = SRVGGNetCompact(); net.load_state_dict(sd); net.eval()
torch.set_num_threads(os.cpu_count())
os.makedirs(dst, exist_ok=True)
files = sorted(glob.glob(os.path.join(src, '*.png')))
lo = int(sys.argv[6]) if len(sys.argv) > 6 else 0
hi = int(sys.argv[7]) if len(sys.argv) > 7 else len(files)
for p in files[lo:hi]:
    out = os.path.join(dst, os.path.basename(p))
    if os.path.exists(out):
        continue
    t = time.time()
    im = np.asarray(Image.open(p).convert('RGB')).astype(np.float32) / 255
    x = torch.from_numpy(im).permute(2, 0, 1)[None]
    with torch.no_grad():
        y = net(x).clamp(0, 1)[0].permute(1, 2, 0).numpy()
    img = Image.fromarray((y * 255 + 0.5).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    img.save(out, compress_level=1)
    print(os.path.basename(p), round(time.time() - t, 1), 's', flush=True)
