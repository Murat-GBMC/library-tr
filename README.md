# GBMC CoE — Kütüphane ve Bağlantılar (TR)

Bu depo CoE ve PDU Circle kütüphane sayfasının yayın verisini ve LearnWorlds bileşenlerini içerir.

## Akış

1. Küratör SharePoint'teki **Master Excel**'i günceller (tek veri kaynağı).
2. Excel'deki **Kütüphaneyi Yayınla** düğmesi (`excel/KutuphaneYayinla.ts`), Durum = *Yayında* olan satırların kart alanlarını `data/kutuphane.json` dosyasına yazar. Her yayın bu depoda bir commit olarak saklanır.
3. LearnWorlds sayfasındaki bileşenler bu dosyayı okur ve kartları çizer (birkaç dakika içinde güncellenir).

## Klasörler

| Klasör | İçerik |
|---|---|
| `data/` | `kutuphane.json`: yayındaki kaynaklar · `ilanlar.json`: yayındaki ilanlar (yalnızca kamuya açık alanlar) |
| `learnworlds/` | Kütüphane bölüm bileşenleri (1–7) · `ilanlar.html` |
| `staging/` | `ilan-adaylari.json`: Claude'un hazırladığı, kontrol bekleyen aday ilanlar |
| `excel/` | Office Script'ler ve `GBMC_Ilanlar.xlsx` şablonu |

## Kurallar

- **Token bu depoya asla yüklenmez.** Yalnızca Excel'deki betikte durur.
- İç notlar, CARA özetleri ve kontrol bilgileri JSON'a girmez.
- Bileşenler `data-platform="CoE"` veya `"PDU Circle"` ile platforma göre süzer.
- Kategori adları Excel'deki *Ana Kategori* ile birebir aynı olmalıdır.

Veri adresi: `https://raw.githubusercontent.com/Murat-GBMC/library-tr/main/data/kutuphane.json`

---

# PDU Circle — İlanlar

Proje yöneticisi arayan firmaların ilanlarına bağlantı veren PDU Circle sayfası. Yalnızca PDU Circle'da yayınlanır (CoE'de değil).

## Akış

1. Claude haftada iki kez LinkedIn iş uyarısı e-postalarını okur, ölçütlere uyan ilanları ayıklar ve `staging/ilan-adaylari.json` dosyasına yazar. LinkedIn sayfaları taranmaz; yalnızca LinkedIn'in gönderdiği uyarılar kullanılır.
2. SharePoint'teki **GBMC_Ilanlar.xlsx** içinde **Adayları Getir** düğmesi (`excel/IlanAdaylariniGetir.ts`) yeni adayları Durum = *Taslak* olarak ekler.
3. Kontrol eden kişi uygun ilanları *Yayında*, uygun olmayanları *Reddedildi* yapar.
4. **İlanları Yayınla** düğmesi (`excel/IlanlarYayinla.ts`) yayında ve süresi dolmamış satırların kamuya açık alanlarını `data/ilanlar.json` dosyasına yazar; süresi dolanları *Arşiv*'e alır.
5. `learnworlds/ilanlar.html` bileşeni bu dosyayı okur, filtreli kartları çizer ve süresi dolan ilanları tarayıcıda da gizler.

## Kurallar

- Yalnızca olgular ve bağlantı: ilan metni, logo ve görsel kopyalanmaz; kısa not kendi cümlemizle (en fazla 160 karakter).
- Kişi adı ve iletişim bilgisi yayınlanmaz; ayrımcı şart içeren ve aracı site ilanları alınmaz.
- Yurt dışı ilanlar yalnızca Türkiye'den başvurulabiliyorsa alınır: Türkiye'den uzaktan çalışmaya açık ya da taşınma/vize desteği belirten ilanlar. O ülkede çalışma izni şartı koyan ilanlar alınmaz.
- Son başvuru tarihi olmayan ilan, ilan tarihinden itibaren 30 gün görünür.
- `staging/` klasörü LearnWorlds'te gösterilmez; yalnızca Excel'e aktarım içindir.

Veri adresi: `https://raw.githubusercontent.com/Murat-GBMC/library-tr/main/data/ilanlar.json`
