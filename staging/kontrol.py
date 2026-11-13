#!/usr/bin/env python3
"""
İlan adayları kontrolü · sürüm 1.0 · 13.11.2026
Kullanım: python3 -I staging/kontrol.py staging/ilan-adaylari.json
Tarama, aday dosyasını depoya göndermeden önce bu betiği çalıştırır.
Hata varsa çıkış kodu 1'dir; hatalar düzeltilmeden gönderim yapılmaz.
"""
import json, sys

# Kısa not üyelere görünür; bu ifadeler iç bilgi işaretidir (İlanları Yayınla betiğindeki listeyle aynı).
YASAK = ["alarm", "e-posta", "e-mail", "email", "linkedin", "indeed", "kariyer.net",
         "untalent", "gulftalent", "claude", "tarama", "fwd"]
BASVURU = {"", "Vize / taşınma desteği", "Uzaktan (Türkiye dahil)", "Yabancı adaya açık (Körfez)"}


def main(yol):
    d = json.load(open(yol, encoding="utf-8"))
    hatalar = []
    for n, a in enumerate(d.get("adaylar", []), 1):
        etiket = f"{n}. {a.get('firma', '?')} / {a.get('pozisyon', '?')}"
        notu = (a.get("not") or "")
        kucuk = notu.lower()
        for y in YASAK:
            if y in kucuk:
                hatalar.append(f"{etiket}: kısa notta iç bilgi ('{y}'). Bu bilgiyi icNot'a taşıyın.")
        if len(notu) > 160:
            hatalar.append(f"{etiket}: kısa not {len(notu)} karakter (en fazla 160).")
        if not str(a.get("url", "")).startswith("https://"):
            hatalar.append(f"{etiket}: bağlantı https:// ile başlamıyor.")
        if not a.get("pozisyon") or not a.get("firma"):
            hatalar.append(f"{etiket}: pozisyon ya da firma boş.")
        if (a.get("basvuru") or "") not in BASVURU:
            hatalar.append(f"{etiket}: basvuru değeri geçersiz: {a.get('basvuru')}")
    if hatalar:
        print("KONTROL BAŞARISIZ:")
        for h in hatalar:
            print(" -", h)
        sys.exit(1)
    print(f"Kontrol tamam: {len(d.get('adaylar', []))} aday.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "staging/ilan-adaylari.json")
