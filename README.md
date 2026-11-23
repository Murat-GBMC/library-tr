# GBMC CoE — Kütüphane ve Bağlantılar (TR)

Bu depo CoE ve PDU Circle kütüphane sayfasının yayın verisini ve LearnWorlds bileşenlerini içerir.

## Akış

1. Küratör SharePoint'teki **Master Excel**'i günceller (tek veri kaynağı). Claude'un aylık taramasındaki aday kaynaklar `staging/kutuphane-adaylari.json` dosyasına yazılır; Excel'deki **Kütüphane Adaylarını Getir** düğmesi (`excel/KutuphaneAdaylariniGetir.ts`) bunları Katalog'a *Taslak* olarak, sıradaki LIB numarası ve formüllerle ekler (kopyala-yapıştır gerekmez).
2. Excel'deki **Kütüphaneyi Yayınla** düğmesi (`excel/KutuphaneYayinla.ts`), Durum = *Yayında* olan satırların kart alanlarını `data/kutuphane.json` dosyasına yazar. Her yayın bu depoda bir commit olarak saklanır.
3. LearnWorlds sayfasındaki bileşenler bu dosyayı okur ve kartları çizer (birkaç dakika içinde güncellenir).

## Klasörler

| Klasör | İçerik |
|---|---|
| `data/` | `kutuphane.json`: yayındaki kaynaklar · `ilanlar.json`: yayındaki ilanlar (yalnızca kamuya açık alanlar) |
| `learnworlds/` | Kütüphane bölüm bileşenleri (1–7) · `ilanlar.html` |
| `staging/` | `ilan-adaylari.json` ve `kutuphane-adaylari.json`: Claude'un hazırladığı, kontrol bekleyen adaylar (LearnWorlds'te gösterilmez) |
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
- Firması gizli ilanlar alınır; Firma alanına "Gizli firma (kamu)" ya da "Gizli firma (sektör)" yazılır, ilan veren danışmanlık şirketi biliniyorsa kısa notta belirtilir.
- Son başvuru tarihi olmayan ilan, ilan tarihinden itibaren 21 gün görünür.
- `staging/` klasörü LearnWorlds'te gösterilmez; yalnızca Excel'e aktarım içindir.

Veri adresi: `https://raw.githubusercontent.com/Murat-GBMC/library-tr/main/data/ilanlar.json`


## Sürüm numaraları

Excel'e ya da LearnWorlds'e yapıştırılan her dosyanın (`excel/*.ts`, `learnworlds/*.html`) başında sürüm numarası, tarih ve değişiklik listesi bulunur. Dosya her değiştiğinde sürüm bir artırılır. Excel betikleri çalıştıklarında sürümlerini çıktı paneline yazar; böylece Excel'deki betiğin depodakiyle aynı sürüm olup olmadığı kolayca görülür.

---

# Yapay Zekâ Okuryazarlığı — Güncel Modeller

Eğitimin Modül 2 videosu model isimlerini söylemez; güncel isimler eğitimin ana sayfasındaki **Güncel Modeller** bölümünde tutulur. CoE ve PDU Circle'da aynı bileşen kullanılır.

## Akış

1. Claude her ayın başında beş aracı (ChatGPT, Claude, Gemini, Microsoft Copilot, DeepSeek) kontrol eder ve anlamlı değişiklikleri `staging/model-adaylari.json` dosyasına yazar (kurallar: `staging/MODEL-TARAMA.md`). Ardından özet e-postası gönderir.
2. SharePoint'teki **GBMC_Modeller.xlsx** içinde **Model Adaylarını Getir** düğmesi (`excel/ModelAdaylariniGetir.ts`) önerileri Durum = *Taslak* olarak ekler.
3. Uygun satırlar *Yayında*, uygun olmayanlar *Reddedildi* yapılır.
4. **Modelleri Yayınla** düğmesi (`excel/ModelleriYayinla.ts`) her araç için en yeni *Yayında* satırı `data/modeller.json` dosyasına yazar; aynı aracın eski satırlarını *Arşiv*'e alır.
5. `learnworlds/guncel-modeller.html` bileşeni bu dosyayı okur. Bölümün çapası `#guncel-modeller`; videodaki etkileşimli bağlantı bu adrese gider.

## Kurallar

- `data/modeller.json` yalnızca Excel'deki düğmeyle yazılır; tarama bu dosyaya dokunmaz.
- Her satırda en az bir `https://` kaynak bulunur. İç Not ve Değişiklik alanları yayına çıkmaz.
- Aday dosyası gönderilmeden önce `python3 -I staging/model_kontrol.py staging/model-adaylari.json` çalıştırılır.

Veri adresi: `https://raw.githubusercontent.com/Murat-GBMC/library-tr/main/data/modeller.json`
