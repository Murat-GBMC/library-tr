/**
 * GBMC PDU Circle — İlanlar
 * "Adayları Getir" Office Script
 *
 * Claude'un düzenli olarak hazırladığı aday ilan listesini
 * (depodaki staging/ilan-adaylari.json) okur ve İlanlar sayfasına
 * Durum = "Taslak" olarak ekler. Siz kontrol edip uygun olanları
 * "Yayında" yaptıktan sonra "İlanları Yayınla" düğmesine basarsınız.
 *
 * Tekrar kontrolü: Bağlantısı (ya da firma + pozisyon ikilisi) sayfada
 * herhangi bir durumda zaten bulunan aday eklenmez. Bu yüzden uygun
 * bulmadığınız satırları silmek yerine Durum'u "Reddedildi" yapın;
 * böylece aynı ilan bir daha aday olarak gelmez.
 *
 * Kurulum: GITHUB_TOKEN, "İlanları Yayınla" betiğindekiyle aynıdır.
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "staging/ilan-adaylari.json";
const SAYFA = "İlanlar";
const ID_ON_EKI = "ILN-";
// -----------------------------------------

interface Aday {
  pozisyon: string;
  firma: string;
  rol?: string;
  kidem?: string;
  sektor?: string;
  sehir?: string;
  ulke?: string;
  calisma?: string;
  istihdam?: string;
  sertifika?: string;
  dil?: string;
  ilanTarihi?: string;
  sonBasvuru?: string;
  kaynak?: string;
  url: string;
  not?: string;
  icNot?: string;
}

interface AdayPaketi {
  olusturuldu: string;
  adaylar: Aday[];
}

function bugun(): string {
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}

// YYYY-MM-DD → Excel seri tarih numarası
function seriTarih(t: string | undefined): number | string {
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  return Math.round(Date.parse(t) / 86400000) + 25569;
}

function temizUrl(u: string): string {
  const s = (u || "").trim();
  if (/linkedin\.com/i.test(s)) {
    let m = s.match(/\/jobs\/view\/(?:[^/?#]*-)?(\d{6,})/i);
    if (!m) m = s.match(/[?&]currentJobId=(\d{6,})/i);
    if (m) return "https://www.linkedin.com/jobs/view/" + m[1] + "/";
  }
  const q = s.indexOf("?");
  if (q < 0) return s;
  const kalan = s.slice(q + 1).split("&").filter((p) => !/^utm_/i.test(p) && p !== "");
  return s.slice(0, q) + (kalan.length ? "?" + kalan.join("&") : "");
}

function anahtar(firma: string, pozisyon: string): string {
  return (firma + "|" + pozisyon).toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

async function main(workbook: ExcelScript.Workbook) {
  if (GITHUB_TOKEN.indexOf("BURAYA") === 0) {
    throw new Error("Önce scriptin başındaki GITHUB_TOKEN ayarını doldurun.");
  }

  const sayfa = workbook.getWorksheet(SAYFA);
  if (!sayfa) {
    throw new Error("'" + SAYFA + "' sayfası bulunamadı.");
  }

  // Aday dosyasını oku (API üzerinden, önbelleğe takılmadan)
  const yanit = await fetch(
    "https://api.github.com/repos/" + REPO + "/contents/" + DOSYA + "?ref=" + BRANCH,
    { headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github.raw+json" } }
  );
  if (yanit.status === 404) {
    console.log("Henüz aday dosyası yok. Yeni aday gelmedi.");
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

  // Mevcut satırlardan tekrar kontrolü ve son ID
  const urller: { [k: string]: boolean } = {};
  const ikililer: { [k: string]: boolean } = {};
  let enBuyuk = 0;
  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    const id = String(s[sutun("ID")] || "");
    const m = id.match(/(\d+)$/);
    if (m) enBuyuk = Math.max(enBuyuk, parseInt(m[1], 10));
    const u = temizUrl(String(s[sutun("Bağlantı")] || ""));
    if (u) urller[u] = true;
    ikililer[anahtar(String(s[sutun("Firma")] || ""), String(s[sutun("Pozisyon")] || ""))] = true;
  }

  const bg = bugun();
  const yeniSatirlar: (string | number)[][] = [];
  let tekrar = 0;
  let eksik = 0;

  adaylar.forEach((a) => {
    const url = temizUrl(a.url);
    if (!url.startsWith("https://") || !a.pozisyon || !a.firma) {
      eksik++;
      return;
    }
    const ik = anahtar(a.firma, a.pozisyon);
    if (urller[url] || ikililer[ik]) {
      tekrar++;
      return;
    }
    urller[url] = true;
    ikililer[ik] = true;
    enBuyuk++;

    const satir: (string | number)[] = basliklar.map(() => "");
    const yaz = (ad: string, v: string | number | undefined) => {
      satir[sutun(ad)] = v === undefined || v === null ? "" : v;
    };
    yaz("ID", ID_ON_EKI + ("000" + enBuyuk).slice(-4));
    yaz("Durum", "Taslak");
    yaz("Pozisyon", a.pozisyon);
    yaz("Firma", a.firma);
    yaz("Rol Türü", a.rol);
    yaz("Kıdem", a.kidem);
    yaz("Sektör", a.sektor);
    yaz("Şehir", a.sehir);
    yaz("Ülke", a.ulke || "Türkiye");
    yaz("Çalışma Şekli", a.calisma);
    yaz("İstihdam Türü", a.istihdam);
    yaz("Sertifika", a.sertifika);
    yaz("İlan Dili", a.dil);
    yaz("İlan Tarihi", seriTarih(a.ilanTarihi));
    yaz("Son Başvuru", seriTarih(a.sonBasvuru));
    yaz("Kaynak", a.kaynak);
    yaz("Bağlantı", url);
    yaz("Kısa Not", a.not);
    yaz("Ekleyen", "Claude");
    yaz("Eklenme Tarihi", seriTarih(bg));
    yaz("Son Kontrol", seriTarih(bg));
    yaz("İç Not", a.icNot);
    yeniSatirlar.push(satir);
  });

  if (yeniSatirlar.length > 0) {
    const bas = ilkSatir + degerler.length;
    sayfa.getRangeByIndexes(bas, ilkSutun, yeniSatirlar.length, basliklar.length).setValues(yeniSatirlar);
    ["İlan Tarihi", "Son Başvuru", "Eklenme Tarihi", "Son Kontrol"].forEach((ad) => {
      sayfa.getRangeByIndexes(bas, ilkSutun + sutun(ad), yeniSatirlar.length, 1).setNumberFormat("dd.mm.yyyy");
    });
  }

  console.log("Aday listesi tarihi: " + (paket.olusturuldu || "-"));
  console.log("Eklenen yeni aday: " + yeniSatirlar.length + " (Durum: Taslak)");
  if (tekrar > 0) console.log("Zaten sayfada olduğu için atlanan: " + tekrar);
  if (eksik > 0) console.log("Eksik bilgi nedeniyle atlanan: " + eksik);
}
