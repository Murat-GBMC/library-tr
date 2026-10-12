/**
 * GBMC CoE — Kütüphane ve Bağlantılar
 * "Kütüphaneyi Yayınla" Office Script (GitHub deposu sürümü)
 *
 * Katalog sayfasında Durum = "Yayında" olan satırların yalnızca kart alanlarını
 * JSON'a çevirir ve GitHub deposundaki data/kutuphane.json dosyasına yazar.
 * LearnWorlds sayfasındaki bileşen bu dosyayı okuyarak kartları çizer.
 *
 * Dışarı ÇIKMAYAN alanlar: İç Not, CARA özetleri, Kontrol Eden, Son Kontrol,
 * Pilot, Talent Triangle.
 *
 * Kurulum: aşağıda yalnızca GITHUB_TOKEN değerini doldurun.
 * Token: fine-grained, yalnızca bu depo, "Contents: Read and write".
 * Token'ı ASLA depoya yüklemeyin; yalnızca bu betikte durur.
 */

// ---------------- AYARLAR ----------------
const GITHUB_TOKEN = "BURAYA_GITHUB_TOKEN";
const REPO = "Murat-GBMC/library-tr";
const BRANCH = "main";
const DOSYA = "data/kutuphane.json";
// Pilot testinde "Kontrol Edildi" satırlarını da göstermek için:
// const YAYIN_DURUMLARI = ["Yayında", "Kontrol Edildi"];
const YAYIN_DURUMLARI = ["Yayında"];
// -----------------------------------------

const HEDEF_KITLE: { [k: string]: string } = {
  J1: "Tüm Kurum",
  J2: "Takım Üyeleri",
  J3: "Proje Liderleri",
  J4: "Program / Portföy / PMO Liderleri",
  J5: "Sponsorlar ve Fonksiyon Yöneticileri",
  J6: "Üst Yöneticiler",
};

interface Kaynak {
  id: string;
  baslik: string;
  kaynak: string;
  yil: string;
  tur: string;
  kategori: string;
  kategori2: string;
  dil: string;
  dilNotu: string;
  sure: string;
  erisim: string;
  url: string;
  not: string;
  soru: string;
  gbmc: string;
  hedef: string[];
  platform: string;
  kurumsal: boolean;
}

interface Paket {
  surum: number;
  guncellendi: string;
  adet: number;
  kaynaklar: Kaynak[];
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

  const sayfa = workbook.getWorksheet("Katalog");
  if (!sayfa) {
    throw new Error("'Katalog' sayfası bulunamadı.");
  }
  const degerler = sayfa.getUsedRange().getValues();
  const basliklar = degerler[0].map((h) => String(h).trim());

  const sutun = (ad: string): number => {
    const i = basliklar.indexOf(ad);
    if (i < 0) {
      throw new Error("Katalog sayfasında '" + ad + "' sütunu bulunamadı.");
    }
    return i;
  };
  const metin = (satir: (string | number | boolean)[], ad: string): string => {
    const v = satir[sutun(ad)];
    return v === null || v === undefined ? "" : String(v).trim();
  };

  const kaynaklar: Kaynak[] = [];
  const atlanan: string[] = [];

  for (let r = 1; r < degerler.length; r++) {
    const s = degerler[r];
    const id = metin(s, "ID");
    if (!id) continue;
    if (YAYIN_DURUMLARI.indexOf(metin(s, "Durum")) < 0) continue;

    const url = metin(s, "URL");
    if (!url.startsWith("https://")) {
      atlanan.push(id + " (URL yok veya https değil)");
      continue;
    }

    const hedef: string[] = [];
    ["J1", "J2", "J3", "J4", "J5", "J6"].forEach((j) => {
      if (metin(s, j).toUpperCase() === "X") hedef.push(HEDEF_KITLE[j]);
    });

    kaynaklar.push({
      id: id,
      baslik: metin(s, "Başlık"),
      kaynak: metin(s, "Yazar / Kurum"),
      yil: metin(s, "Yıl"),
      tur: metin(s, "Tür"),
      kategori: metin(s, "Ana Kategori"),
      kategori2: metin(s, "İkincil Kategori"),
      dil: metin(s, "Dil"),
      dilNotu: metin(s, "Türkçe Uygunluk Notu"),
      sure: metin(s, "Süre"),
      erisim: metin(s, "Erişim"),
      url: url,
      not: metin(s, "GBMC Notu (kart ön yüzü)"),
      soru: metin(s, "Düşünün / Uygulayın"),
      gbmc: metin(s, "İlgili GBMC İçeriği"),
      hedef: hedef,
      platform: metin(s, "Platform") || "Her ikisi",
      kurumsal: metin(s, "Kurumsal Alan") === "Evet",
    });
  }

  if (kaynaklar.length === 0) {
    throw new Error("Yayınlanacak kaynak yok. Durum sütununda '" + YAYIN_DURUMLARI.join(" / ") +
      "' olan satır bulunamadı; mevcut yayın değiştirilmedi.");
  }

  const paket: Paket = {
    surum: 1,
    guncellendi: new Date().toISOString(),
    adet: kaynaklar.length,
    kaynaklar: kaynaklar,
  };

  const api = "https://api.github.com/repos/" + REPO + "/contents/" + DOSYA;
  const basliklarHttp = {
    "Authorization": "Bearer " + GITHUB_TOKEN,
    "Accept": "application/vnd.github+json",
  };

  // Mevcut dosyanın sürüm kimliği (sha) — dosya yoksa boş kalır.
  let sha = "";
  const mevcut = await fetch(api + "?ref=" + BRANCH, { headers: basliklarHttp });
  if (mevcut.status === 200) {
    const bilgi: DosyaBilgi = await mevcut.json();
    sha = bilgi.sha;
  } else if (mevcut.status !== 404) {
    throw new Error("GitHub'a erişilemedi (" + mevcut.status + "). Token'ı ve depo adını kontrol edin.");
  }

  const govde: Govde = {
    message: "Kütüphane yayını: " + kaynaklar.length + " kaynak",
    content: utf8Base64(JSON.stringify(paket, null, 1)),
    branch: BRANCH,
  };
  if (sha) {
    govde.sha = sha;
  }

  const yanit = await fetch(api, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(govde),
  });

  if (!yanit.ok) {
    const hata = await yanit.text();
    throw new Error("GitHub yayını başarısız (" + yanit.status + "): " + hata.slice(0, 300));
  }
  const sonuc: CommitYanit = await yanit.json();

  console.log("Yayınlandı: " + kaynaklar.length + " kaynak.");
  console.log("Kayıt: " + sonuc.commit.html_url);
  console.log("LearnWorlds sayfası birkaç dakika içinde güncellenir.");
  if (atlanan.length > 0) {
    console.log("Atlanan satırlar: " + atlanan.join(", "));
  }
}
