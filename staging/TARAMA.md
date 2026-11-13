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
- Kariyer.net: e-postada `kariyer.net/is-ilani/...-{ID}` adresi varsa o adres, izleme parametreleri atılmış hâliyle. Kariyer.net'in "İş tercihlerine uygun ilanlara göz at" öneri e-postalarında ise yalnızca tek kullanımlık `link.kariyer.net/p/be/cl/...` izleme bağlantıları bulunur; bunlar çözülemez. Bu durumda ilan **atlanmaz**: Bağlantı = `https://www.kariyer.net/is-ilanlari/{firma adının ilk iki kelimesi, küçük harf, Türkçe karakterler sadeleştirilmiş, + ile birleşik}` (ör. `https://www.kariyer.net/is-ilanlari/pozitera+perakende`); iç not "KONTROL: Kariyer.net bağlantısı geçici. Kariyer.net'te ilanı açıp adres çubuğundaki kariyer.net/is-ilani/... adresini yapıştırın; şehir ve çalışma şeklini doldurun. E-postadaki Başvur düğmesine basmayın." Bu e-postalarda şehir ve ilan tarihi yoktur: sehir boş, ilanTarihi = e-posta tarihi.
- UNTalent (BM kuruluşları, haftalık alarm; Türkiye): e-postadaki ilan sayfası bağlantısı (untalent.org) izleme parametreleri atılmış hâliyle kullanılır. Firma = kuruluşun kısa adı (UNDP, UNICEF, IOM, UNHCR, WHO vb.), sektor = "Kamu / Uluslararası Kuruluş". Danışmanlık (Consultant) ilanlarında istihdam = "Proje bazlı". Yalnızca proje/program yönetimi, proje koordinasyonu ve PMO rolleri alınır; teknik uzman, analist, finans, İK ilanları alınmaz. E-postada kalıcı bir ilan bağlantısı bulunamazsa aday eklenmez ve özete "UNTalent bağlantı biçimi çözülemedi" uyarısı yazılır.
- Kariyer.net'in "Bu hafta yayınlanan ilanlar", mülakat provası, anket, uygulama tanıtımı gibi e-postaları ilan içermez; yalnızca "işlendi" olarak etiketlenir.
- Indeed: e-postadaki bağlantılar kısa ömürlü yönlendirmedir ve çözülemez. Bağlantı = `https://tr.indeed.com/jobs?q={pozisyon + firma}&l=Türkiye` arama adresi; iç not "KONTROL: Indeed bağlantısı geçici. İlanı açıp adres çubuğundaki vjk= kodunu https://tr.indeed.com/viewjob?jk=KOD olarak yazın."

## 4. Alanlar

`staging/ilan-adaylari.json` içindeki her aday:

| Alan | Değer |
|---|---|
| pozisyon | İlandaki unvan, olduğu gibi |
| firma | Firma adı |
| rol | Proje Yöneticisi / Program Yöneticisi / PMO / Portföy Yöneticisi / Agile / Scrum / Proje Koordinatörü / Proje Uzmanı |
| kidem | Giriş / Uzman / Kıdemli / Lider / Yönetici; bilinmiyorsa boş. Ayrım için aşağıdaki "Kıdem kuralları"na bakın. |
| sektor | Excel listesindeki değerlerden biri; bilinmiyorsa boş. Çok sektörlü firmalar için aşağıdaki "Sektör kuralları"na bakın. |
| sehir, ulke | Şehir ve ülke (Türkiye için ulke = "Türkiye") |
| calisma | Ofis / Hibrit / Uzaktan; e-postada yoksa boş |
| istihdam | Tam zamanlı (aksi yazmıyorsa) |
| dil | İlan unvanı İngilizceyse EN, değilse TR |
| ilanTarihi | YYYY-AA-GG; e-postadaki "x gün önce" bilgisinden hesaplanır, yoksa e-posta tarihi |
| sonBasvuru | Biliniyorsa YYYY-AA-GG, yoksa boş |
| kaynak | LinkedIn / Kariyer.net / Indeed |
| url | Bölüm 3'e göre |
| not | En fazla 160 karakter, **kendi cümlemizle**, ilan metninden kopyalamadan. Bilinmeyeni uydurma; yalnızca e-postada görünen olgulardan yaz. Not üyelere görünür: ilanın hangi alarmdan, e-postadan ya da kaynaktan geldiği gibi iç bilgiler buraya değil icNot'a yazılır. |
| icNot | Kontrol gerektiren her şey "KONTROL: ..." ile başlar |
| basvuru | Türkiye ilanlarında boş. Yurt dışı ilanlarda: **Vize / taşınma desteği** (e-postada açıkça yazıyorsa) · **Uzaktan (Türkiye dahil)** (Türkiye'den uzaktan çalışmaya açıkça izin veriyorsa) · **Yabancı adaya açık (Körfez)** (Körfez ülkesi, vatandaşlık şartı yok). Bu üç değerin dışında bir şey yazılmaz. |

### Kıdem kuralları

Önce e-postada görünen deneyim yılına bakılır; yoksa unvana. İkisi de belirsizse alan boş kalır, tahmin edilmez.

1. Deneyim yılı (e-postada yazıyorsa):
   - 0–2 yıl → Giriş
   - 2–5 yıl → Uzman
   - 5–10 yıl → Kıdemli
   - 10+ yıl ya da ekip/portföy/PMO yönetimi → Lider / Yönetici
2. Unvandaki işaretler (yıl yoksa):
   - "Junior", "Jr.", "Associate", "Asistan", "Yardımcı" → Giriş
   - "Specialist", "Uzman" (başında Senior yoksa) → Uzman
   - "Senior", "Sr.", "Kıdemli" → Kıdemli
   - "Lead", "Head", "Director", "Direktör", "Senior Manager", "PMO Manager" → Lider / Yönetici
3. Özel durumlar:
   - "Senior Specialist" gibi birleşimlerde Senior baskındır → Kıdemli.
   - Tek başına "Project Manager", "Proje Yöneticisi", "Proje Müdürü", "Program Manager" → yıl yoksa boş; icNot'a "KONTROL: kıdem" yazılır.
   - Unvan ile e-postadaki özet çelişirse (ör. unvan "Manager", özet "Senior Specialist") özete göre seçilir ve icNot'ta belirtilir.
   - Körfez ilanlarında "Manager" unvanı daha alt seviyeye denk gelebilir; yalnızca unvandan Lider / Yönetici seçilmez.

### Sektör kuralları

Sektör, firmanın bütününe göre değil **rolün çalıştığı iş koluna** göre seçilir. Holding ve çok sektörlü gruplarda:

1. Rol belirli bir iş kolundaysa o iş kolunun sektörü yazılır. İşaretler: şirket adı ("X Energy", "X Motors"), proje türü (konut, otel, santral), aranan deneyim. Örnekler: gayrimenkul geliştirme → İnşaat / Altyapı; otomotiv → Otomotiv; enerji → Enerji.
2. Rol grup düzeyindeyse (holding PMO'su, strateji, dönüşüm ofisi gibi tüm iş kollarına hizmet eden roller) sektor = "Diğer". icNot: "KONTROL: Holding (iş kolları virgülle); rol grup düzeyinde".
3. Hangisi olduğu anlaşılmıyorsa sektor boş bırakılır. icNot: "KONTROL: sektör (çok sektörlü holding)".

İş kolları yalnızca e-postada görünen bilgiden yazılır; firma hakkında dışarıdan bilgi eklenmez.

## 5. Çıktı

1. Depoyu güncelle, `staging/ilan-adaylari.json` dosyasını oku.
2. Yeni adayları mevcut listeye **ekle**. Aynı bağlantı ya da aynı firma + pozisyon ikilisi varsa ekleme. `data/ilanlar.json` içinde yayında olan ilanları da tekrar sayarak atla.
3. İlan tarihi 21 günden eski adayları listeden çıkar.
4. Göndermeden önce `python3 -I staging/kontrol.py staging/ilan-adaylari.json` çalıştırılır. Hata varsa düzeltilir (iç bilgi notu icNot'a taşınır) ve kontrol yeniden çalıştırılır; kontrol geçmeden gönderim yapılmaz.
5. `olusturuldu` (ISO tarih, +03:00) ve `adet` alanlarını güncelle. Commit mesajı: `İlan adayları: GG.AA taraması (N yeni)`. Depoya gönder.
6. İşlenen tüm e-posta dizilerine `ilanlar/islendi` etiketini ekle.

## 6. Özet e-postası

Alıcı: m.muratozbilen@gmail.com. Konu: `İlan taraması GG.AA: N yeni aday`. Türkçe, kısa:
- Kaç e-posta okundu, kaç ilan görüldü, kaç aday eklendi.
- Eklenen adaylar: pozisyon, firma, şehir; KONTROL gerektirenler ayrıca belirtilir.
- Elenenlerin kısa özeti (neden gruplarıyla, tek tek değil).
- Kaynaklarda sorun varsa (ör. iki taramadır LinkedIn'den hiç e-posta gelmedi) bir satır uyarı.
- Kural dışı kaldığı için alınamayan ilan olursa (ör. bağlantı kurulamadı) sayısı ve nedeni yazılır. Uygun bir ilan hiçbir zaman sessizce atlanmaz.
- Son satır: "Excel'de Adayları Getir'e basıp kontrol edin, ardından İlanları Yayınla."

Yeni aday yoksa da e-posta gönderilir (konu: `İlan taraması GG.AA: yeni aday yok`).
