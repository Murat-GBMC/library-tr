# GBMC CoE — Kütüphane ve Bağlantılar (TR)

Bu depo CoE ve PDU Circle kütüphane sayfasının yayın verisini ve LearnWorlds bileşenlerini içerir.

## Akış

1. Küratör SharePoint'teki **Master Excel**'i günceller (tek veri kaynağı).
2. Excel'deki **Kütüphaneyi Yayınla** düğmesi (`excel/KutuphaneYayinla.ts`), Durum = *Yayında* olan satırların kart alanlarını `data/kutuphane.json` dosyasına yazar. Her yayın bu depoda bir commit olarak saklanır.
3. LearnWorlds sayfasındaki bileşenler bu dosyayı okur ve kartları çizer (birkaç dakika içinde güncellenir).

## Klasörler

| Klasör | İçerik |
|---|---|
| `data/` | `kutuphane.json`: yayındaki kaynaklar (yalnızca kamuya açık kart alanları) |
| `learnworlds/` | Bölüm başına bileşen kodları (1–7) ve tek parça tam sayfa bileşeni |
| `excel/` | Office Script: Excel'den bu depoya yayın |

## Kurallar

- **Token bu depoya asla yüklenmez.** Yalnızca Excel'deki betikte durur.
- İç notlar, CARA özetleri ve kontrol bilgileri JSON'a girmez.
- Bileşenler `data-platform="CoE"` veya `"PDU Circle"` ile platforma göre süzer.
- Kategori adları Excel'deki *Ana Kategori* ile birebir aynı olmalıdır.

Veri adresi: `https://raw.githubusercontent.com/Murat-GBMC/library-tr/main/data/kutuphane.json`
