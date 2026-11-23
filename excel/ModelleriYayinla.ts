/**
 * GBMC CoE / PDU Circle — Güncel Modeller
 * "Modelleri Yayınla" Office Script
 *
 * Sürüm: 1.0 · 23.11.2026
 * Değişiklikler:
 *   1.0 (23.11.2026) İlk sürüm
 *
 * Modeller sayfasında Durum = "Yayında" olan satırları JSON'a çevirir ve
 * GitHub deposundaki data/modeller.json dosyasına yazar. LearnWorlds'teki
 * "Güncel Modeller" bileşeni bu dosyayı okur.
 *
 * Her araç için yalnızca bir satır yayınlanır: Aynı araçta birden fazla
 * "Yayında" satır varsa en yeni Eklenme Tarihi'ne sahip olan yayınlanır,
 * eskiler otomatik olarak "Arşiv" yapılır. Yani bir güncellemeyi
 * onaylamak için yeni satırı "Yayında" yapmanız yeterlidir.
 *
 * Dışarı ÇIKMAYAN alanlar: ID, Durum, Değişiklik, İç Not, Ekleyen, Eklenme Tarihi.
 *
 * Kurulum: GITHUB_TOKEN, Kütüphane betiklerindeki token ile aynıdır.
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "data/modeller.json";
const SAYFA = "Modeller";
// -----------------------------------------

interface Model {
  sira: number;
  arac: string;
  sirket: string;
  ulke: string;
  hizli: string;
  guclu: string;
  enGuclu: string;
  dusunme: string;
  ucretsiz: string;
  kurumsal: string;
  veri: string;
  kaynak: string;
  kontrol: string;
}

interface Paket {
  surum: number;
  guncellendi: string;
  adet: number;
  modeller: Model[];
}

interface DosyaBilgi {
  sha: string;
}

interface Govde {
  message: string;
  content: string;
  branch: string;
  sha?: string;
}

interface CommitYanit {
  commit: { html_url: string };
}

function tarihOku(v: string | number | boolean): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  return "";
}

// UTF-8 metni base64'e çevirir (Türkçe karakterler için btoa tek başına yetmez).
function utf8Base64(metin: string): string {
  const baytlar: number[] = [];
  for (let i = 0; i < metin.length; i++) {
    let k = metin.charCodeAt(i);
    if (k >= 0xd800 && k <= 0xdbff && i + 1 < metin.length) {
      const d = metin.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        k = 0x10000 + ((k - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (k < 0x80) {
      baytlar.push(k);
    } else if (k < 0x800) {
      baytlar.push(0xc0 | (k >> 6), 0x80 | (k & 0x3f));
    } else if (k < 0x10000) {
      baytlar.push(0xe0 | (k >> 12), 0x80 | ((k >> 6) & 0x3f), 0x80 | (k & 0x3f));
    } else {
      baytlar.push(0xf0 | (k >> 18), 0x80 | ((k >> 12) & 0x3f), 0x80 | ((k >> 6) & 0x3f), 0x80 | (k & 0x3f));
    }
  }
  const harf = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let sonuc = "";
  for (let i = 0; i < baytlar.length; i += 3) {
    const b1 = baytlar[i];
    const b2 = i + 1 < baytlar.length ? baytlar[i + 1] : 0;
    const b3 = i + 2 < baytlar.length ? baytlar[i + 2] : 0;
    const n = (b1 << 16) | (b2 << 8) | b3;
    sonuc += harf.charAt((n >> 18) & 63) + harf.charAt((n >> 12) & 63);
    sonuc += i + 1 < baytlar.length ? harf.charAt((n >> 6) & 63) : "=";
    sonuc += i + 2 < baytlar.length ? harf.charAt(n & 63) : "=";
  }
  return sonuc;
}

async function main(workbook: ExcelScript.Workbook) {
  console.log("Modelleri Yayınla · sürüm 1.0 (23.11.2026)");
  if (GITHUB_TOKEN.indexOf("BURAYA") === 0) {
    throw new Error("Önce scriptin başındaki GITHUB_TOKEN ayarını doldurun.");
  }

  const sayfa = workbook.getWorksheet(SAYFA);
  if (!sayfa) {
    throw new Error("'" + SAYFA + "' sayfası bulunamadı.");
  }
  const aralik = sayfa.getUsedRange(true);
  const degerler = aralik.getValues();
  const basliklar = degerler[0].map((h) => String(h).trim());
  const sutun = (ad: string): number => {
    const i = basliklar.indexOf(ad);
    if (i < 0) {
      throw new Error(SAYFA + " sayfasında '" + ad + "' sütunu bulunamadı.");
    }
    return i;
  };
  const metin = (satir: (string | number | boolean)[], ad: string): string => {
    const v = satir[sutun(ad)];
    return v === null || v === undefined ? "" : String(v).trim();
  };

  // Her araç için en yeni "Yayında" satırı seç; eskileri Arşiv'e al.
  const secilen: { [arac: string]: number } = {};
  const atlanan: string[] = [];
  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    if (!metin(s, "ID") || metin(s, "Durum") !== "Yayında") continue;
    const arac = metin(s, "Araç");
    if (!arac) {
      atlanan.push(metin(s, "ID") + " (Araç boş)");
      continue;
    }
    if (!metin(s, "Kaynak").startsWith("https://")) {
      atlanan.push(metin(s, "ID") + " (Kaynak yok veya https değil)");
      continue;
    }
    const onceki = secilen[arac];
    if (onceki === undefined) {
      secilen[arac] = r;
    } else {
      const yeni = tarihOku(s[sutun("Eklenme Tarihi")]);
      const eski = tarihOku(degerler[onceki][sutun("Eklenme Tarihi")]);
      if (yeni > eski || (yeni === eski && r > onceki)) {
        secilen[arac] = r;
      }
    }
  }

  const arsivlenen: string[] = [];
  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    if (metin(s, "Durum") !== "Yayında") continue;
    const arac = metin(s, "Araç");
    if (secilen[arac] !== undefined && secilen[arac] !== r) {
      aralik.getCell(r, sutun("Durum")).setValue("Arşiv");
      arsivlenen.push(metin(s, "ID"));
    }
  }

  const modeller: Model[] = Object.keys(secilen).map((arac) => {
    const s = degerler[secilen[arac]];
    const sira = Number(s[sutun("Sıra")]);
    return {
      sira: isNaN(sira) ? 99 : sira,
      arac: arac,
      sirket: metin(s, "Şirket"),
      ulke: metin(s, "Ülke"),
      hizli: metin(s, "Hızlı Model"),
      guclu: metin(s, "Güçlü Model"),
      enGuclu: metin(s, "En Güçlü Model"),
      dusunme: metin(s, "Düşünme"),
      ucretsiz: metin(s, "Ücretsiz Sürümde"),
      kurumsal: metin(s, "Kurumsal Sürüm"),
      veri: metin(s, "Veri Notu"),
      kaynak: metin(s, "Kaynak"),
      kontrol: tarihOku(s[sutun("Son Kontrol")]),
    };
  });
  modeller.sort((a, b) => a.sira - b.sira || a.arac.localeCompare(b.arac, "tr"));

  if (modeller.length === 0) {
    throw new Error("Yayında satır yok. En az bir satırın Durum'unu 'Yayında' yapın.");
  }

  const paket: Paket = {
    surum: 1,
    guncellendi: new Date().toISOString(),
    adet: modeller.length,
    modeller: modeller,
  };

  const api = "https://api.github.com/repos/" + REPO + "/contents/" + DOSYA;
  const icerik = utf8Base64(JSON.stringify(paket, null, 1));

  const shaOku = async (): Promise<string> => {
    const r = await fetch(api + "?ref=" + BRANCH + "&t=" + Date.now(), {
      headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github+json" },
    });
    if (r.status === 200) {
      const bilgi: DosyaBilgi = await r.json();
      return bilgi.sha;
    }
    if (r.status === 404) return "";
    throw new Error("GitHub'a erişilemedi (" + r.status + "). Token'ı ve depo adını kontrol edin.");
  };

  const yaz = async (sha: string) => {
    const govde: Govde = {
      message: "Güncel Modeller yayını: " + modeller.length + " araç",
      content: icerik,
      branch: BRANCH,
    };
    if (sha) {
      govde.sha = sha;
    }
    return await fetch(api, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(govde),
    });
  };

  let yanit = await yaz(await shaOku());
  if (yanit.status === 409 || yanit.status === 422) {
    yanit = await yaz(await shaOku());
  }
  if (!yanit.ok) {
    const hata = await yanit.text();
    throw new Error("GitHub yayını başarısız (" + yanit.status + "): " + hata.slice(0, 300));
  }
  const sonuc: CommitYanit = await yanit.json();

  console.log("Yayınlandı: " + modeller.length + " araç (" + modeller.map((m) => m.arac).join(", ") + ").");
  console.log("Kayıt: " + sonuc.commit.html_url);
  console.log("LearnWorlds sayfası birkaç dakika içinde güncellenir.");
  if (arsivlenen.length > 0) console.log("Yenisi yayınlandığı için Arşiv'e alınan: " + arsivlenen.join(", "));
  if (atlanan.length > 0) console.log("Atlanan satırlar: " + atlanan.join(", "));
}
