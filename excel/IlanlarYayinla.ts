/**
 * GBMC PDU Circle — İlanlar
 * "İlanları Yayınla" Office Script
 *
 * İlanlar sayfasında Durum = "Yayında" olan ve süresi dolmamış satırların
 * yalnızca kamuya açık alanlarını JSON'a çevirir ve GitHub deposundaki
 * data/ilanlar.json dosyasına yazar. LearnWorlds sayfasındaki bileşen bu
 * dosyayı okuyarak kartları çizer.
 *
 * Yayın sırasında ayrıca:
 *  - Süresi dolan "Yayında" satırların Durum'u "Arşiv" yapılır.
 *  - LinkedIn bağlantıları kalıcı biçime çevrilir (izleme parametreleri atılır)
 *    ve temiz adres Excel'e geri yazılır.
 *
 * Dışarı ÇIKMAYAN alanlar: Durum, Ekleyen, Eklenme Tarihi, İç Not.
 *
 * Kurulum: aşağıda yalnızca GITHUB_TOKEN değerini doldurun (Kütüphane betiğindeki
 * token ile aynıdır: fine-grained, yalnızca bu depo, "Contents: Read and write").
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "data/ilanlar.json";
const SAYFA = "İlanlar";
// Son başvuru tarihi olmayan ilanlar, ilan tarihinden itibaren kaç gün yayında kalsın:
const VARSAYILAN_OMUR = 30;
// -----------------------------------------

interface Ilan {
  id: string;
  pozisyon: string;
  firma: string;
  rol: string;
  kidem: string;
  sektor: string;
  sehir: string;
  ulke: string;
  calisma: string;
  istihdam: string;
  sertifika: string;
  dil: string;
  ilanTarihi: string;
  sonBasvuru: string;
  kaynak: string;
  url: string;
  not: string;
  kontrol: string;
}

interface Paket {
  surum: number;
  guncellendi: string;
  omur: number;
  adet: number;
  ilanlar: Ilan[];
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

// İstanbul saatine göre bugünün tarihi (YYYY-MM-DD)
function bugun(): string {
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}

function gunEkle(t: string, n: number): string {
  return new Date(Date.parse(t) + n * 86400000).toISOString().slice(0, 10);
}

// Excel tarih hücresini (seri numara ya da metin) YYYY-MM-DD'ye çevirir.
function tarihOku(v: string | number | boolean): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2);
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); // GG.AA.YYYY
  if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
  return "";
}

// LinkedIn ilan adresini kalıcı biçime çevirir; diğer adreslerden utm_ parametrelerini atar.
function temizUrl(u: string): string {
  const s = u.trim();
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

  const bg = bugun();
  const ilanlar: Ilan[] = [];
  const atlanan: string[] = [];
  const arsivlenen: string[] = [];
  let temizlenen = 0;

  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    const id = metin(s, "ID");
    if (!id) continue;
    if (metin(s, "Durum") !== "Yayında") continue;

    const hamUrl = metin(s, "Bağlantı");
    if (!hamUrl.startsWith("https://")) {
      atlanan.push(id + " (bağlantı yok veya https değil)");
      continue;
    }
    const url = temizUrl(hamUrl);
    if (url !== hamUrl) {
      aralik.getCell(r, sutun("Bağlantı")).setValue(url);
      temizlenen++;
    }

    const ilanTarihi = tarihOku(s[sutun("İlan Tarihi")]);
    const sonBasvuru = tarihOku(s[sutun("Son Başvuru")]);
    const bitis = sonBasvuru || (ilanTarihi ? gunEkle(ilanTarihi, VARSAYILAN_OMUR) : "");
    if (!bitis) {
      atlanan.push(id + " (İlan Tarihi ve Son Başvuru boş)");
      continue;
    }
    if (bitis < bg) {
      aralik.getCell(r, sutun("Durum")).setValue("Arşiv");
      arsivlenen.push(id);
      continue;
    }
    if (!metin(s, "Pozisyon") || !metin(s, "Firma")) {
      atlanan.push(id + " (Pozisyon veya Firma boş)");
      continue;
    }

    ilanlar.push({
      id: id,
      pozisyon: metin(s, "Pozisyon"),
      firma: metin(s, "Firma"),
      rol: metin(s, "Rol Türü"),
      kidem: metin(s, "Kıdem"),
      sektor: metin(s, "Sektör"),
      sehir: metin(s, "Şehir"),
      ulke: metin(s, "Ülke") || "Türkiye",
      calisma: metin(s, "Çalışma Şekli"),
      istihdam: metin(s, "İstihdam Türü"),
      sertifika: metin(s, "Sertifika"),
      dil: metin(s, "İlan Dili"),
      ilanTarihi: ilanTarihi,
      sonBasvuru: sonBasvuru,
      kaynak: metin(s, "Kaynak"),
      url: url,
      not: metin(s, "Kısa Not").slice(0, 160),
      kontrol: tarihOku(s[sutun("Son Kontrol")]),
    });
  }

  ilanlar.sort((a, b) => (b.ilanTarihi || "").localeCompare(a.ilanTarihi || ""));

  const paket: Paket = {
    surum: 1,
    guncellendi: new Date().toISOString(),
    omur: VARSAYILAN_OMUR,
    adet: ilanlar.length,
    ilanlar: ilanlar,
  };

  const api = "https://api.github.com/repos/" + REPO + "/contents/" + DOSYA;
  const icerik = utf8Base64(JSON.stringify(paket, null, 1));

  // Mevcut dosyanın sürüm kimliği (sha). Önbelleği atlamak için her okumada benzersiz adres kullanılır.
  const shaOku = async (): Promise<string> => {
    const r = await fetch(api + "?ref=" + BRANCH + "&t=" + Date.now(), {
      headers: { "Authorization": "Bearer " + GITHUB_TOKEN, "Accept": "application/vnd.github+json", "Cache-Control": "no-cache" },
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
      message: "İlanlar yayını: " + ilanlar.length + " ilan",
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
  // Sürüm çakışması (arka arkaya yayın): kimliği yeniden okuyup bir kez daha dene.
  if (yanit.status === 409 || yanit.status === 422) {
    yanit = await yaz(await shaOku());
  }

  if (!yanit.ok) {
    const hata = await yanit.text();
    throw new Error("GitHub yayını başarısız (" + yanit.status + "): " + hata.slice(0, 300));
  }
  const sonuc: CommitYanit = await yanit.json();

  console.log("Yayınlandı: " + ilanlar.length + " ilan.");
  console.log("Kayıt: " + sonuc.commit.html_url);
  console.log("LearnWorlds sayfası birkaç dakika içinde güncellenir.");
  if (arsivlenen.length > 0) {
    console.log("Süresi dolduğu için Arşiv'e alınan: " + arsivlenen.join(", "));
  }
  if (temizlenen > 0) {
    console.log("Temizlenen bağlantı sayısı: " + temizlenen);
  }
  if (atlanan.length > 0) {
    console.log("Atlanan satırlar: " + atlanan.join(", "));
  }
}
