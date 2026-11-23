/**
 * GBMC CoE / PDU Circle — Güncel Modeller
 * "Model Adaylarını Getir" Office Script
 *
 * Sürüm: 1.0 · 23.11.2026
 * Değişiklikler:
 *   1.0 (23.11.2026) İlk sürüm
 *
 * Claude'un her ay hazırladığı güncelleme önerilerini
 * (depodaki staging/model-adaylari.json) okur ve Modeller sayfasına
 * Durum = "Taslak" olarak ekler. Siz kontrol edip uygun olanları
 * "Yayında" yaptıktan sonra "Modelleri Yayınla" düğmesine basarsınız.
 *
 * Tekrar kontrolü: Aynı araç için içeriği birebir aynı olan bir satır
 * sayfada herhangi bir durumda zaten varsa aday eklenmez. Uygun bulmadığınız
 * satırları silmek yerine Durum'u "Reddedildi" yapın.
 *
 * Kurulum: GITHUB_TOKEN, Kütüphane betiklerindeki token ile aynıdır.
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "staging/model-adaylari.json";
const SAYFA = "Modeller";
const ID_ON_EKI = "MDL-";
// -----------------------------------------

interface Aday {
  sira?: number;
  arac: string;
  sirket?: string;
  ulke?: string;
  hizli?: string;
  guclu?: string;
  enGuclu?: string;
  dusunme?: string;
  ucretsiz?: string;
  kurumsal?: string;
  veri?: string;
  kaynak?: string;
  kontrol?: string;
  degisiklik?: string;
  icNot?: string;
}

interface AdayPaketi {
  olusturuldu: string;
  adaylar: Aday[];
}

function bugun(): string {
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}

// YYYY-MM-DD metnini Excel seri tarihine çevirir (boşsa boş döner).
function seriTarih(t: string | undefined): string | number {
  if (!t) return "";
  const ms = Date.parse(t.slice(0, 10) + "T00:00:00Z");
  if (isNaN(ms)) return "";
  return ms / 86400000 + 25569;
}

function sade(s: string | number | boolean | undefined): string {
  return String(s === undefined || s === null ? "" : s).trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

async function main(workbook: ExcelScript.Workbook) {
  console.log("Model Adaylarını Getir · sürüm 1.0 (23.11.2026)");
  if (GITHUB_TOKEN.indexOf("BURAYA") === 0) {
    throw new Error("Önce scriptin başındaki GITHUB_TOKEN ayarını doldurun.");
  }

  const sayfa = workbook.getWorksheet(SAYFA);
  if (!sayfa) {
    throw new Error("'" + SAYFA + "' sayfası bulunamadı.");
  }

  const yanit = await fetch(
    "https://api.github.com/repos/" + REPO + "/contents/" + DOSYA + "?ref=" + BRANCH + "&t=" + Date.now(),
    { headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github.raw+json" } }
  );
  if (yanit.status === 404) {
    console.log("Henüz aday dosyası yok. Yeni öneri gelmedi.");
    return;
  }
  if (!yanit.ok) {
    throw new Error("Aday dosyası okunamadı (" + yanit.status + "). Token'ı ve depo adını kontrol edin.");
  }
  const paket: AdayPaketi = await yanit.json();
  const adaylar = (paket && paket.adaylar) || [];

  const kullanilan = sayfa.getUsedRange(true);
  const degerler = kullanilan.getValues();
  const ilkSatir = kullanilan.getRowIndex();
  const ilkSutun = kullanilan.getColumnIndex();
  const basliklar = degerler[0].map((h) => String(h).trim());
  const sutun = (ad: string): number => {
    const i = basliklar.indexOf(ad);
    if (i < 0) {
      throw new Error(SAYFA + " sayfasında '" + ad + "' sütunu bulunamadı.");
    }
    return i;
  };
  const ICERIK = ["Araç", "Hızlı Model", "Güçlü Model", "En Güçlü Model", "Düşünme", "Ücretsiz Sürümde", "Kurumsal Sürüm", "Veri Notu"];
  const imza = (degerlerListesi: (string | number | boolean | undefined)[]) => degerlerListesi.map(sade).join("|");

  const mevcut: { [k: string]: boolean } = {};
  let enBuyuk = 0;
  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    const id = String(s[sutun("ID")] || "");
    const m = id.match(/(\d+)$/);
    if (m) enBuyuk = Math.max(enBuyuk, parseInt(m[1], 10));
    if (!id) continue;
    mevcut[imza(ICERIK.map((ad) => s[sutun(ad)]))] = true;
  }

  const bg = bugun();
  const yeniSatirlar: (string | number)[][] = [];
  let tekrar = 0;
  let eksik = 0;

  adaylar.forEach((a) => {
    if (!a.arac || !a.kaynak || !a.kaynak.startsWith("https://")) {
      eksik++;
      return;
    }
    const k = imza([a.arac, a.hizli, a.guclu, a.enGuclu, a.dusunme, a.ucretsiz, a.kurumsal, a.veri]);
    if (mevcut[k]) {
      tekrar++;
      return;
    }
    mevcut[k] = true;
    enBuyuk++;

    const satir: (string | number)[] = basliklar.map(() => "");
    const yaz = (ad: string, v: string | number | undefined) => {
      const i = basliklar.indexOf(ad);
      if (i >= 0) satir[i] = v === undefined || v === null ? "" : v;
    };
    yaz("ID", ID_ON_EKI + ("000" + enBuyuk).slice(-4));
    yaz("Durum", "Taslak");
    yaz("Sıra", a.sira);
    yaz("Araç", a.arac);
    yaz("Şirket", a.sirket);
    yaz("Ülke", a.ulke);
    yaz("Hızlı Model", a.hizli);
    yaz("Güçlü Model", a.guclu);
    yaz("En Güçlü Model", a.enGuclu);
    yaz("Düşünme", a.dusunme);
    yaz("Ücretsiz Sürümde", a.ucretsiz);
    yaz("Kurumsal Sürüm", a.kurumsal);
    yaz("Veri Notu", a.veri);
    yaz("Kaynak", a.kaynak);
    yaz("Son Kontrol", seriTarih(a.kontrol || bg));
    yaz("Değişiklik", a.degisiklik);
    yaz("İç Not", a.icNot);
    yaz("Ekleyen", "Claude");
    yaz("Eklenme Tarihi", seriTarih(bg));
    yeniSatirlar.push(satir);
  });

  if (yeniSatirlar.length > 0) {
    const bas = ilkSatir + degerler.length;
    sayfa.getRangeByIndexes(bas, ilkSutun, yeniSatirlar.length, basliklar.length).setValues(yeniSatirlar);
    ["Son Kontrol", "Eklenme Tarihi"].forEach((ad) => {
      sayfa.getRangeByIndexes(bas, ilkSutun + sutun(ad), yeniSatirlar.length, 1).setNumberFormat("dd.mm.yyyy");
    });
  }

  console.log("Öneri listesi tarihi: " + (paket.olusturuldu || "-"));
  console.log("Eklenen yeni öneri: " + yeniSatirlar.length + " (Durum: Taslak)");
  if (tekrar > 0) console.log("Sayfada aynısı olduğu için atlanan: " + tekrar);
  if (eksik > 0) console.log("Araç adı ya da https kaynak eksik olduğu için atlanan: " + eksik);
}
