/**
 * GBMC CoE — Kütüphane ve Bağlantılar
 * "Kütüphane Adaylarını Getir" Office Script
 *
 * Sürüm: 1.0 · 01.11.2026
 * Değişiklikler:
 *   1.0 (01.11.2026) İlk sürüm
 *
 * Claude'un aylık taramada hazırladığı aday kaynakları
 * (depodaki staging/kutuphane-adaylari.json) okur ve Katalog sayfasının
 * sonuna Durum = "Taslak" olarak ekler. Kopyala-yapıştır gerekmez.
 *
 * Betik her yeni satır için:
 *  - sıradaki LIB numarasını verir (sayfadaki en büyük LIB-xxx + 1),
 *  - "CARA Önerebilir" ve "Bakım Uyarısı" formüllerini bir üst satırdan kopyalar,
 *  - Eklenme tarihini bugün olarak yazar.
 *
 * Tekrar kontrolü: URL'si ya da başlığı Katalog'da herhangi bir durumda zaten
 * bulunan aday eklenmez. Betiği iki kez çalıştırmak çift satır oluşturmaz.
 * Beğenmediğiniz satırları silmek yerine Durum'u "Reddedildi" yaparsanız
 * aynı kaynak bir daha aday olarak gelmez.
 *
 * Sonra: beğendiklerinizin Durum'unu "Yayında" yapıp
 * "Kütüphaneyi Yayınla" düğmesine basın.
 *
 * Kurulum: GITHUB_TOKEN, "Kütüphaneyi Yayınla" betiğindekiyle aynıdır.
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "staging/kutuphane-adaylari.json";
const SAYFA = "Katalog";
const ID_ON_EKI = "LIB-";
// Formülü bir üst satırdan kopyalanacak sütunlar (başlıkta bu ifade geçmesi yeterli)
const FORMUL_SUTUNLARI = ["CARA Önerebilir", "Bakım Uyarısı"];
// -----------------------------------------

interface Aday {
  baslik: string;
  kaynak: string;
  yil?: string;
  tur?: string;
  kategori?: string;
  kategori2?: string;
  dil?: string;
  dilNotu?: string;
  sure?: string;
  erisim?: string;
  url: string;
  not?: string;
  soru?: string;
  hedef?: string[];
  talent?: string;
  platform?: string;
  kurumsal?: string;
  ozetTR?: string;
  summaryEN?: string;
  sonKontrol?: string;
  kontrolEden?: string;
  icNot?: string;
}

interface AdayPaketi {
  olusturuldu: string;
  tarama?: string;
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

function urlAnahtar(u: string): string {
  return (u || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function baslikAnahtar(b: string): string {
  return (b || "").toLocaleLowerCase("tr-TR").replace(/[\s\-–—:.,;!?'"()\/]+/g, " ").trim();
}

function normal(s: string): string {
  return s.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
}

async function main(workbook: ExcelScript.Workbook) {
  console.log("Kütüphane Adaylarını Getir · sürüm 1.0 (01.11.2026)");
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
  const varsaSutun = (ad: string): number => basliklar.indexOf(ad);

  // Formül sütunlarını bul (başlıkta ifade geçiyorsa)
  const formulSutunlari: number[] = [];
  const bulunamayanFormul: string[] = [];
  FORMUL_SUTUNLARI.forEach((ad) => {
    const i = basliklar.findIndex((h) => normal(h).indexOf(normal(ad)) >= 0);
    if (i >= 0) formulSutunlari.push(i);
    else bulunamayanFormul.push(ad);
  });

  // Mevcut satırlardan tekrar kontrolü, son ID ve son dolu satır
  const urller: { [k: string]: boolean } = {};
  const basliklarMevcut: { [k: string]: boolean } = {};
  let enBuyuk = 0;
  let sonDolu = 0; // degerler içindeki son dolu satırın sırası
  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    const id = String(s[sutun("ID")] || "").trim();
    const baslik = String(s[sutun("Başlık")] || "").trim();
    if (id || baslik) sonDolu = r;
    const m = id.match(/^LIB-(\d+)$/i);
    if (m) enBuyuk = Math.max(enBuyuk, parseInt(m[1], 10));
    const u = urlAnahtar(String(s[sutun("URL")] || ""));
    if (u) urller[u] = true;
    const b = baslikAnahtar(baslik);
    if (b) basliklarMevcut[b] = true;
  }

  const bg = bugun();
  const yeniSatirlar: (string | number)[][] = [];
  const eklenenler: string[] = [];
  let tekrar = 0;
  let eksik = 0;

  adaylar.forEach((a) => {
    const url = (a.url || "").trim();
    if (!url.startsWith("https://") || !a.baslik) {
      eksik++;
      return;
    }
    const uk = urlAnahtar(url);
    const bk = baslikAnahtar(a.baslik);
    if (urller[uk] || basliklarMevcut[bk]) {
      tekrar++;
      return;
    }
    urller[uk] = true;
    basliklarMevcut[bk] = true;
    enBuyuk++;
    const id = ID_ON_EKI + ("00" + enBuyuk).slice(-3);

    const satir: (string | number)[] = basliklar.map(() => "");
    const yaz = (ad: string, v: string | number | undefined) => {
      satir[sutun(ad)] = v === undefined || v === null ? "" : v;
    };
    yaz("ID", id);
    yaz("Başlık", a.baslik);
    yaz("Yazar / Kurum", a.kaynak);
    yaz("Yıl", a.yil);
    yaz("Tür", a.tur);
    yaz("Ana Kategori", a.kategori);
    yaz("İkincil Kategori", a.kategori2);
    yaz("Dil", a.dil);
    yaz("Türkçe Uygunluk Notu", a.dilNotu);
    yaz("Süre", a.sure);
    yaz("Erişim", a.erisim);
    yaz("URL", url);
    yaz("GBMC Notu (kart ön yüzü)", a.not);
    yaz("Düşünün / Uygulayın", a.soru);
    ["J1", "J2", "J3", "J4", "J5", "J6"].forEach((j) => {
      yaz(j, (a.hedef || []).indexOf(j) >= 0 ? "X" : "");
    });
    yaz("Talent Triangle", a.talent);
    yaz("Platform", a.platform || "Her ikisi");
    yaz("CARA'ya Dahil", "Evet");
    yaz("Pilot", "Hayır");
    yaz("Kurumsal Alan", a.kurumsal || "Hayır");
    yaz("Özet TR (CARA kataloğu, özgün)", a.ozetTR);
    yaz("Summary EN (CARA catalogue, original)", a.summaryEN);
    yaz("Durum", "Taslak");
    yaz("Son Kontrol", seriTarih(a.sonKontrol || bg));
    yaz("Kontrol Eden", a.kontrolEden || "Claude (aylık tarama)");
    yaz("Eklenme", seriTarih(bg));
    yaz("İç Not", a.icNot);
    yeniSatirlar.push(satir);
    eklenenler.push(id + " " + a.baslik);
  });

  if (yeniSatirlar.length > 0) {
    const ustSatir = ilkSatir + sonDolu; // formüllerin kopyalanacağı satır (sayfa indeksi)
    const bas = ustSatir + 1;            // ilk yeni satır
    const tablolar = sayfa.getTables();
    const tablo = tablolar.find((t) => {
      const r = t.getRange();
      return r.getRowIndex() <= ustSatir && r.getRowIndex() + r.getRowCount() - 1 >= ustSatir;
    });

    if (tablo) {
      // Katalog bir Excel tablosuysa satırları tablonun içine ekle
      const tabloSutun = tablo.getRange().getColumnIndex();
      const kaydir = ilkSutun - tabloSutun;
      const genislik = tablo.getRange().getColumnCount();
      const tabloSatirlari = yeniSatirlar.map((s) => {
        const t: (string | number)[] = [];
        for (let c = 0; c < genislik; c++) {
          const k = c - kaydir;
          t.push(k >= 0 && k < s.length ? s[k] : "");
        }
        return t;
      });
      tablo.addRows(-1, tabloSatirlari);
    } else {
      sayfa.getRangeByIndexes(bas, ilkSutun, yeniSatirlar.length, basliklar.length).setValues(yeniSatirlar);
    }

    // Formülleri üst satırdan göreli olarak kopyala
    formulSutunlari.forEach((c) => {
      const kaynak = sayfa.getRangeByIndexes(ustSatir, ilkSutun + c, 1, 1);
      const f = kaynak.getFormulasR1C1()[0][0];
      if (typeof f === "string" && f.startsWith("=")) {
        const hedef = sayfa.getRangeByIndexes(bas, ilkSutun + c, yeniSatirlar.length, 1);
        hedef.setFormulasR1C1(yeniSatirlar.map(() => [f]));
      }
    });

    // Biçimi üst satırdan al (yükseklik, kaydırma, yazı tipi)
    const ustAralik = sayfa.getRangeByIndexes(ustSatir, ilkSutun, 1, basliklar.length);
    const yeniAralik = sayfa.getRangeByIndexes(bas, ilkSutun, yeniSatirlar.length, basliklar.length);
    yeniAralik.copyFrom(ustAralik, ExcelScript.RangeCopyType.formats, false, false);
    ["Son Kontrol", "Eklenme"].forEach((ad) => {
      const c = varsaSutun(ad);
      if (c >= 0) {
        sayfa.getRangeByIndexes(bas, ilkSutun + c, yeniSatirlar.length, 1).setNumberFormat("dd.mm.yyyy");
      }
    });
  }

  console.log("Aday listesi: " + (paket.tarama || paket.olusturuldu || "-"));
  console.log("Eklenen yeni aday: " + yeniSatirlar.length + " (Durum: Taslak)");
  eklenenler.forEach((e) => console.log("  + " + e));
  if (tekrar > 0) console.log("Zaten Katalog'da olduğu için atlanan: " + tekrar);
  if (eksik > 0) console.log("Eksik bilgi nedeniyle atlanan: " + eksik);
  if (bulunamayanFormul.length > 0) {
    console.log("Uyarı: şu formül sütunları bulunamadı, elle kopyalayın: " + bulunamayanFormul.join(", "));
  }
}
