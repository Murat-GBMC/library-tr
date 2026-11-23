"""Güncel Modeller aday dosyası kontrolü.

Sürüm: 1.0 · 23.11.2026
Değişiklikler:
  1.0 (23.11.2026) İlk sürüm

Kullanım: python3 -I staging/model_kontrol.py staging/model-adaylari.json
Hata yoksa 0, varsa 1 ile çıkar.
"""
import json
import sys

ARACLAR = ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "DeepSeek"]
ZORUNLU = ["arac", "sirket", "hizli", "guclu", "ucretsiz", "kurumsal", "veri", "kaynak", "kontrol", "degisiklik"]
YASAK = ["en iyi", "rakiplerini", "devrim", "inanılmaz", "claude taraması", "tarama"]


def main(yol):
    with open(yol, encoding="utf-8") as f:
        p = json.load(f)
    hatalar = []
    if "olusturuldu" not in p or "adaylar" not in p:
        hatalar.append("olusturuldu ve adaylar alanları zorunlu")
    adaylar = p.get("adaylar", [])
    if p.get("adet") != len(adaylar):
        hatalar.append("adet (%s) aday sayısıyla (%d) aynı değil" % (p.get("adet"), len(adaylar)))
    gorulen = set()
    for i, a in enumerate(adaylar, 1):
        ad = a.get("arac", "?")
        for alan in ZORUNLU:
            if not str(a.get(alan, "")).strip():
                hatalar.append("%d. aday (%s): '%s' boş" % (i, ad, alan))
        if ad not in ARACLAR:
            hatalar.append("%d. aday: bilinmeyen araç '%s'" % (i, ad))
        if ad in gorulen:
            hatalar.append("%d. aday: '%s' için birden fazla öneri" % (i, ad))
        gorulen.add(ad)
        if not str(a.get("kaynak", "")).startswith("https://"):
            hatalar.append("%d. aday (%s): kaynak https ile başlamalı" % (i, ad))
        gorunur = " ".join(str(a.get(k, "")) for k in ["hizli", "guclu", "enGuclu", "dusunme", "ucretsiz", "kurumsal", "veri"]).lower()
        for y in YASAK:
            if y in gorunur:
                hatalar.append("%d. aday (%s): görünür alanda '%s' ifadesi" % (i, ad, y))
        if len(str(a.get("veri", ""))) > 260:
            hatalar.append("%d. aday (%s): veri notu 260 karakteri aşıyor" % (i, ad))
    if hatalar:
        print("KONTROL BAŞARISIZ:")
        for h in hatalar:
            print(" -", h)
        return 1
    print("Kontrol geçti: %d aday." % len(adaylar))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
