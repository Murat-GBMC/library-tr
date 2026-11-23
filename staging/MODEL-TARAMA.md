# Güncel Modeller taraması: çalışma talimatı

Bu dosya, Yapay Zekâ Okuryazarlığı eğitimindeki **Güncel Modeller** bölümü için her ay çalışan taramanın kurallarıdır. Eğitimin Modül 2 videosu model isimlerini söylemez; isimler yalnızca bu bölümde tutulur. Amaç, listeyi güncel tutmak ve hiçbir değişikliği Murat'ın onayı olmadan yayına almamaktır.

## 1. Kapsam

Beş araç, bu sırayla: ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), Microsoft Copilot (Microsoft), DeepSeek (DeepSeek). Yeni bir araç eklenmez; önemli bir araç ortaya çıktıysa yalnızca özet e-postasında önerilir.

## 2. Kaynaklar

Öncelik sırası: şirketin kendi duyuru, yardım ve fiyat sayfaları → şirketin geliştirici belgeleri ve değişiklik günlüğü → saygın teknoloji haberleri. Forum ve blog yazıları tek başına kaynak olmaz. Her öneride en az bir `https://` kaynak bulunur; kaynakta yazmayan bilgi eklenmez.

## 3. Ne kontrol edilir

Her araç için `data/modeller.json` içindeki yayındaki satır, bugünkü durumla karşılaştırılır:

| Alan | İçerik |
|---|---|
| hizli | Günlük işler için hızlı / hafif model |
| guclu | Zor işler için güçlü model(ler) |
| enGuclu | Ailenin en güçlü modeli (hangi planda olduğu parantez içinde) |
| dusunme | Düşünme / akıl yürütme seçeneği nasıl sunuluyor |
| ucretsiz | Ücretsiz sürümde hangi model ve önemli sınırlar |
| kurumsal | Kurumsal sürümün adı |
| veri | Verinin eğitimde kullanılıp kullanılmadığı, nerede saklandığı (kısa, olgusal) |

Bir araçta **anlamlı bir değişiklik** varsa (yeni model, emekliye ayrılan model, ücretsiz sürüm değişikliği, veri politikası değişikliği) o araç için tam bir aday satır yazılır. Değişiklik yoksa aday yazılmaz. Sürüm numarasındaki küçük düzeltmeler (ör. "-1017" gibi tarih ekleri) tek başına değişiklik sayılmaz.

## 4. Yazım kuralları

- Türkçe, kısa ve olgusal. Pazarlama dili ve kıyaslama ("en iyi", "rakiplerini geçiyor") kullanılmaz.
- Model adları şirketin kullandığı biçimde yazılır.
- Veri notu tarafsız yazılır: verinin nereye gittiği aracın kendisine değil, nerede çalıştığına (şirketin kendi uygulaması, kurumsal sürüm, bulut platformu, kurumun kendi sunucusu) bağlıdır. Bunu her araç için aynı ölçüyle yaz; bir ülkeyi ya da şirketi öne çıkaran ifade kullanma.
- Kaynaklar çelişiyorsa daha temkinli olan yazılır ve `icNot` alanına `KONTROL: ...` ile açıklama eklenir.
- `degisiklik` alanına bir cümleyle neyin değiştiği yazılır (ör. "Ücretsiz sürüm Luna'dan Terra'ya geçti").

## 5. Çıktı

1. Depoyu güncelle; `staging/model-adaylari.json` ve `data/modeller.json` dosyalarını oku.
2. `adaylar` listesini **bu taramanın** önerileriyle değiştir (eski öneriler Excel'e zaten aktarılmıştır). Öneri yoksa liste boş kalır.
3. `python3 -I staging/model_kontrol.py staging/model-adaylari.json` çalıştır; hata varsa düzelt, kontrol geçmeden gönderim yapma.
4. `olusturuldu` (ISO tarih, +03:00) ve `adet` alanlarını güncelle. Commit mesajı: `Model adayları: AA.YYYY taraması (N öneri)`. Depoya gönder.
5. `data/modeller.json` dosyasına **asla** dokunma; yayın yalnızca Excel'deki düğmeyle yapılır.

## 6. Özet e-postası

Alıcı: murat@ozbilen.com (başka alıcı eklenmez). Konu: `Güncel Modeller AA.YYYY: N öneri` (öneri yoksa `Güncel Modeller AA.YYYY: değişiklik yok`). Türkçe, kısa:
- Her araç için bir satır: değişti / değişmedi; değiştiyse ne değişti.
- KONTROL gerektiren noktalar ayrıca.
- Kullanılan ana kaynakların bağlantıları.
- Son satır: "Excel'de Model Adaylarını Getir'e basıp kontrol edin; uygun satırları Yayında yapıp Modelleri Yayınla'ya basın."
