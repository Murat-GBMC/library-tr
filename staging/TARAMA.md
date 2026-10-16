# İlan taraması: çalışma talimatı

Bu dosya, PDU Circle İlanlar sayfası için düzenli çalışan taramanın kurallarıdır. Tarama yalnızca Gmail'e gelen iş alarmı e-postalarını okur. LinkedIn, Kariyer.net, Indeed veya başka bir site **taranmaz**; bu sitelerin sayfaları açılmaz ve otomatik veri toplanmaz.

## 1. Girdi

- Gmail sorgusu: `label:ilanlar -label:ilanlar-islendi`
- Kaynaklar: LinkedIn iş uyarıları (doğrudan ya da Murat'ın elle ilettiği "Fwd:" e-postalar), Kariyer.net iş alarmları, Indeed iş alarmları.
- Aktivasyon, doğrulama kodu, tanıtım gibi ilan içermeyen e-postalar yalnızca "işlendi" olarak etiketlenir.

## 2. Kabul ölçütleri

Alınır:
- Rol gerçekten proje, program, portföy yönetimi ya da PMO işi (Proje Yöneticisi / Müdürü, Program Manager, PMO, Proje Koordinatörü, Transformation Office vb.).
- Türkiye'deki ilanlar.
- Yurt dışı ilanlar **yalnızca** Türkiye'den başvurulabileceği açıksa: Türkiye'den uzaktan çalışmaya açık ya da taşınma/vize desteği ilanda açıkça belirtilmiş. "X ülkesinde uzaktan" (ör. "Germany (Remote)") ilanlar o ülkede çalışma izni gerektirir; alınmaz. Körfez ülkelerinde (BAE, Suudi Arabistan, Katar, Kuveyt) işveren vizesi yaygındır; "yalnızca vatandaş" şartı yoksa alınabilir, iç notta "KONTROL: vize" yazılır.
- Firması gizli ilanlar: Firma = "Gizli firma (sektör)" (ör. "Gizli firma (kamu)").

Alınmaz:
- Proje yönetimi olmayan roller (satış, kasiyer, teknisyen, müşteri başarısı, genel müdür vb.), unvanında "proje" geçse bile.
- Hizmet sözleşmesi yöneticilikleri: yemek/catering, temizlik, güvenlik "proje müdürü" ilanları.
- Aracı ilan toplayıcı siteler (Jobgether vb.).
- Yaş, cinsiyet vb. ayrımcı şart içeren ilanlar.
- Sayfada zaten bulunan ilanlar (aynı bağlantı ya da aynı firma + pozisyon).

## 3. Bağlantı kuralları

Yalnızca e-postada görünen ilan kimliğinden kalıcı adres kurulur. Firma sitelerinde tahminle adres aranmaz.
- LinkedIn: `https://www.linkedin.com/jobs/view/{ID}/` (ID, e-postadaki `/jobs/view/{ID}/` bağlantısından).
- Kariyer.net: e-postadaki `kariyer.net/is-ilani/...-{ID}` adresi, izleme parametreleri atılmış hâliyle.
- Indeed: e-postadaki bağlantılar kısa ömürlü yönlendirmedir ve çözülemez. Bağlantı = `https://tr.indeed.com/jobs?q={pozisyon + firma}&l=Türkiye` arama adresi; iç not "KONTROL: Indeed bağlantısı geçici. İlanı açıp adres çubuğundaki vjk= kodunu https://tr.indeed.com/viewjob?jk=KOD olarak yazın."

## 4. Alanlar

`staging/ilan-adaylari.json` içindeki her aday:

| Alan | Değer |
|---|---|
| pozisyon | İlandaki unvan, olduğu gibi |
| firma | Firma adı |
| rol | Proje Yöneticisi / Program Yöneticisi / PMO / Portföy Yöneticisi / Agile / Scrum / Proje Koordinatörü / Proje Uzmanı |
| kidem | Giriş / Uzman / Kıdemli / Lider / Yönetici; bilinmiyorsa boş |
| sektor | Excel listesindeki değerlerden biri; bilinmiyorsa boş |
| sehir, ulke | Şehir ve ülke (Türkiye için ulke = "Türkiye") |
| calisma | Ofis / Hibrit / Uzaktan; e-postada yoksa boş |
| istihdam | Tam zamanlı (aksi yazmıyorsa) |
| dil | İlan unvanı İngilizceyse EN, değilse TR |
| ilanTarihi | YYYY-AA-GG; e-postadaki "x gün önce" bilgisinden hesaplanır, yoksa e-posta tarihi |
| sonBasvuru | Biliniyorsa YYYY-AA-GG, yoksa boş |
| kaynak | LinkedIn / Kariyer.net / Indeed |
| url | Bölüm 3'e göre |
| not | En fazla 160 karakter, **kendi cümlemizle**, ilan metninden kopyalamadan. Bilinmeyeni uydurma; yalnızca e-postada görünen olgulardan yaz. |
| icNot | Kontrol gerektiren her şey "KONTROL: ..." ile başlar |

## 5. Çıktı

1. Depoyu güncelle, `staging/ilan-adaylari.json` dosyasını oku.
2. Yeni adayları mevcut listeye **ekle**. Aynı bağlantı ya da aynı firma + pozisyon ikilisi varsa ekleme. `data/ilanlar.json` içinde yayında olan ilanları da tekrar sayarak atla.
3. İlan tarihi 21 günden eski adayları listeden çıkar.
4. `olusturuldu` (ISO tarih, +03:00) ve `adet` alanlarını güncelle. Commit mesajı: `İlan adayları: GG.AA taraması (N yeni)`. Depoya gönder.
5. İşlenen tüm e-posta dizilerine `ilanlar/islendi` etiketini ekle.

## 6. Özet e-postası

Alıcı: m.muratozbilen@gmail.com. Konu: `İlan taraması GG.AA: N yeni aday`. Türkçe, kısa:
- Kaç e-posta okundu, kaç ilan görüldü, kaç aday eklendi.
- Eklenen adaylar: pozisyon, firma, şehir; KONTROL gerektirenler ayrıca belirtilir.
- Elenenlerin kısa özeti (neden gruplarıyla, tek tek değil).
- Kaynaklarda sorun varsa (ör. iki taramadır LinkedIn'den hiç e-posta gelmedi) bir satır uyarı.
- Son satır: "Excel'de Adayları Getir'e basıp kontrol edin, ardından İlanları Yayınla."

Yeni aday yoksa da e-posta gönderilir (konu: `İlan taraması GG.AA: yeni aday yok`).
