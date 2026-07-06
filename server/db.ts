import fs from 'fs';
import path from 'path';

// Define DB Types based on user tables
export interface Kullanici {
  id: number;
  ad_soyad: string;
  email: string;
  sifre: string;
  rol: 'admin' | 'ogretmen' | 'rehber' | 'veli' | 'ogrenci';
  telefon?: string;
  kurum_id?: number;
}

export interface Kurum {
  id: number;
  ad: string;
  tur: string;
}

export interface Sinif {
  id: number;
  ad: string;
  seviye: number; // e.g. 11, 12
  kurum_id: number;
}

export interface Ogrenci {
  id: number;
  ad_soyad: string;
  tc_no: string;
  sinif_id: number;
  veli_id: number | null;
  alan: 'Sayısal' | 'Sözel' | 'Eşit Ağırlık';
  aktif: boolean;
}

export interface SinavTanim {
  id: number;
  ad: string;
  tur: 'TYT' | 'AYT';
  tarih: string;
  kurum_id: number;
}

export interface SinavSonuc {
  id: number;
  ogrenci_id: number;
  sinav_id: number;
  turkce_net: number;
  sosyal_net: number;
  matematik_net: number;
  fen_net: number;
  toplam_net: number;
  puan: number;
}

export interface OgretmenSinif {
  id: number;
  ogretmen_id: number;
  sinif_id: number;
}

export interface RehberlikNotu {
  id: number;
  ogrenci_id: number;
  rehber_id: number;
  not_metni: string;
  tarih: string;
}

export interface Mesaj {
  id: number;
  gonderen_id: number;
  alici_id: number;
  ogrenci_id: number;
  konu: string;
  mesaj: string;
  okundu: boolean;
  tarih: string;
}

export interface DatabaseSchema {
  kullanicilar: Kullanici[];
  kurumlar: Kurum[];
  siniflar: Sinif[];
  ogrenciler: Ogrenci[];
  sinav_tanimlari: SinavTanim[];
  sinav_sonuclari: SinavSonuc[];
  ogretmen_sinif: OgretmenSinif[];
  rehberlik_notlari: RehberlikNotu[];
  mesajlar: Mesaj[];
  ders_programlari: DersProgrami[];
}

export interface DersProgrami {
  id: number;
  ogrenci_id: number;
  gun: string;
  saat: string;
  ders_adi: string;
  ogretmen_adi: string;
}

const DB_FILE_PATH = path.resolve('db.json');

// Initial seeded data for rich visual rendering and realistic flows
const initialData: DatabaseSchema = {
  kurumlar: [
    { id: 1, ad: "Gelecek Koleji", tur: "Özel Anadolu Lisesi" }
  ],
  kullanicilar: [
    { id: 1, ad_soyad: "Ahmet Yılmaz", email: "admin@kas.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 111 2233" },
    { id: 2, ad_soyad: "Süleyman Kaya", email: "teacher@kas.com", sifre: "ogretmen123", rol: "ogretmen", kurum_id: 1, telefon: "0555 123 4567" },
    { id: 3, ad_soyad: "Esra Güneş", email: "rehber@kas.com", sifre: "rehber123", rol: "rehber", kurum_id: 1, telefon: "0555 987 6543" },
    { id: 4, ad_soyad: "Murat Aksoy", email: "veli@kas.com", sifre: "veli123", rol: "veli", kurum_id: 1, telefon: "0555 456 7890" },
    { id: 5, ad_soyad: "Zeynep Öztürk", email: "veli2@kas.com", sifre: "veli123", rol: "veli", kurum_id: 1, telefon: "0555 654 3210" }
  ],
  siniflar: [
    { id: 1, ad: "12-A", seviye: 12, kurum_id: 1 },
    { id: 2, ad: "12-B", seviye: 12, kurum_id: 1 },
    { id: 3, ad: "12-C", seviye: 12, kurum_id: 1 },
    { id: 4, ad: "11-A", seviye: 11, kurum_id: 1 }
  ],
  ogrenciler: [
    { id: 1, ad_soyad: "Canberk Aksoy", tc_no: "12345678901", sinif_id: 1, veli_id: 4, alan: "Sayısal", aktif: true },
    { id: 2, ad_soyad: "Selin Öztürk", tc_no: "12345678902", sinif_id: 3, veli_id: 5, alan: "Eşit Ağırlık", aktif: true },
    { id: 3, ad_soyad: "Eren Demir", tc_no: "12345678903", sinif_id: 2, veli_id: null, alan: "Sayısal", aktif: true },
    { id: 4, ad_soyad: "Duru Yılmaz", tc_no: "12345678904", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: false }
  ],
  sinav_tanimlari: [
    { id: 1, ad: "Özdebir TYT-1", tur: "TYT", tarih: "2026-06-15", kurum_id: 1 },
    { id: 2, ad: "3D AYT-1", tur: "AYT", tarih: "2026-06-28", kurum_id: 1 },
    { id: 3, ad: "Bilgi Sarmal TYT-2", tur: "TYT", tarih: "2026-07-01", kurum_id: 1 }
  ],
  sinav_sonuclari: [
    // Canberk Aksoy (ID: 1)
    { id: 1, ogrenci_id: 1, sinav_id: 1, turkce_net: 32.50, sosyal_net: 14.20, matematik_net: 35.00, fen_net: 16.80, toplam_net: 98.50, puan: 432.50 },
    { id: 2, ogrenci_id: 1, sinav_id: 3, turkce_net: 28.00, sosyal_net: 12.00, matematik_net: 30.50, fen_net: 13.75, toplam_net: 84.25, puan: 382.10 }, // Düşüşte
    // Selin Öztürk (ID: 2)
    { id: 3, ogrenci_id: 2, sinav_id: 1, turkce_net: 28.50, sosyal_net: 17.50, matematik_net: 15.00, fen_net: -1.50, toplam_net: 59.50, puan: 310.20 },
    { id: 4, ogrenci_id: 2, sinav_id: 3, turkce_net: 25.00, sosyal_net: 16.00, matematik_net: 12.00, fen_net: 0.00, toplam_net: 53.00, puan: 285.40 }, // Düşüşte
    // Eren Demir (ID: 3)
    { id: 5, ogrenci_id: 3, sinav_id: 1, turkce_net: 35.00, sosyal_net: 15.00, matematik_net: 38.00, fen_net: 18.00, toplam_net: 106.00, puan: 462.10 },
    { id: 6, ogrenci_id: 3, sinav_id: 3, turkce_net: 36.50, sosyal_net: 14.00, matematik_net: 39.00, fen_net: 19.00, toplam_net: 108.50, puan: 474.20 } // Yükselişte
  ],
  ogretmen_sinif: [
    { id: 1, ogretmen_id: 2, sinif_id: 1 },
    { id: 2, ogretmen_id: 2, sinif_id: 2 }
  ],
  rehberlik_notlari: [
    { id: 1, ogrenci_id: 1, rehber_id: 3, not_metni: "Matematik geometrisi düşüşte, haftalık geometri soru hedefi 150'ye çıkarıldı.", tarih: "2026-07-02" },
    { id: 2, ogrenci_id: 2, rehber_id: 3, not_metni: "Edebiyat denemeleri aksıyor, her gün bir adet bölüm branş denemesi çözmesi planlandı.", tarih: "2026-07-03" }
  ],
  mesajlar: [
    {
      id: 1,
      gonderen_id: 3, // Esra Güneş
      alici_id: 4, // Murat Aksoy
      ogrenci_id: 1, // Canberk Aksoy
      konu: "Canberk'in Matematik Net Gelişimi",
      mesaj: "Merhabalar Murat Bey, Canberk'in son Bilgi Sarmal denemesinde matematik netlerinde küçük bir düşüş olduğunu tespit ettik. Kendisiyle detaylı bir görüşme yaptık ve özel bir çalışma programı hazırladık. Süreci yakından takip ediyoruz.",
      okundu: false,
      tarih: "2026-07-04T10:30:00"
    }
  ],
  ders_programlari: [
    { id: 1, ogrenci_id: 1, gun: "Pazartesi", saat: "09:00 - 10:30", ders_adi: "1-1 Geometri", ogretmen_adi: "Hakan Şen" },
    { id: 2, ogrenci_id: 1, gun: "Pazartesi", saat: "13:30 - 15:00", ders_adi: "1-1 Fizik Soru Çözümü", ogretmen_adi: "Ahmet Kaya" },
    { id: 3, ogrenci_id: 1, gun: "Salı", saat: "10:45 - 12:15", ders_adi: "1-1 Analitik Matematik", ogretmen_adi: "Ahmet Yılmaz" },
    { id: 4, ogrenci_id: 1, gun: "Çarşamba", saat: "09:00 - 10:30", ders_adi: "1-1 Türkçe Paragraf", ogretmen_adi: "Elif Can" },
    { id: 5, ogrenci_id: 1, gun: "Perşembe", saat: "13:30 - 15:00", ders_adi: "1-1 Kimya Hibrit", ogretmen_adi: "Süleyman Kaya" },
    { id: 6, ogrenci_id: 1, gun: "Cuma", saat: "15:00 - 16:30", ders_adi: "1-1 Rehberlik Takibi", ogretmen_adi: "Esra Güneş" },
    { id: 7, ogrenci_id: 2, gun: "Pazartesi", saat: "10:45 - 12:15", ders_adi: "1-1 Edebiyat", ogretmen_adi: "Elif Can" },
    { id: 8, ogrenci_id: 2, gun: "Salı", saat: "13:30 - 15:00", ders_adi: "1-1 Temel Matematik", ogretmen_adi: "Ahmet Yılmaz" },
    { id: 9, ogrenci_id: 2, gun: "Perşembe", saat: "09:00 - 10:30", ders_adi: "1-1 Tarih Kampı", ogretmen_adi: "Zeynep Eser" }
  ]
};

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = { ...initialData };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          kurumlar: parsed.kurumlar || [],
          kullanicilar: parsed.kullanicilar || [],
          siniflar: parsed.siniflar || [],
          ogrenciler: parsed.ogrenciler || [],
          sinav_tanimlari: parsed.sinav_tanimlari || [],
          sinav_sonuclari: parsed.sinav_sonuclari || [],
          ogretmen_sinif: parsed.ogretmen_sinif || [],
          rehberlik_notlari: parsed.rehberlik_notlari || [],
          mesajlar: parsed.mesajlar || [],
          ders_programlari: parsed.ders_programlari || []
        };
        // Save back if some keys were missing so that they are saved in db.json too
        const schemaKeys = [
          'kurumlar', 'kullanicilar', 'siniflar', 'ogrenciler', 
          'sinav_tanimlari', 'sinav_sonuclari', 'ogretmen_sinif', 
          'rehberlik_notlari', 'mesajlar', 'ders_programlari'
        ];
        let hasMissingKeys = false;
        for (const key of schemaKeys) {
          if (parsed[key] === undefined) {
            hasMissingKeys = true;
            break;
          }
        }
        if (hasMissingKeys) {
          this.save();
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database file, using in-memory fallback:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  // Generic Query Helpers
  public getKullanicilar() { return this.data.kullanicilar || []; }
  public getKurumlar() { return this.data.kurumlar || []; }
  public getSiniflar() { return this.data.siniflar || []; }
  public getOgrenciler() { return this.data.ogrenciler || []; }
  public getSinavTanimlari() { return this.data.sinav_tanimlari || []; }
  public getSinavSonuclari() { return this.data.sinav_sonuclari || []; }
  public getOgretmenSinif() { return this.data.ogretmen_sinif || []; }
  public getRehberlikNotlari() { return this.data.rehberlik_notlari || []; }
  public getMesajlar() { return this.data.mesajlar || []; }
  public getDersProgramlari() { return this.data.ders_programlari || []; }

  // Mutation helper wrapper to auto-save after calls
  public insert<K extends keyof DatabaseSchema>(table: K, item: any): any {
    if (!this.data[table]) {
      this.data[table] = [] as any;
    }
    const list = this.data[table] as any[];
    const maxId = list.reduce((max, x) => (x.id > max ? x.id : max), 0);
    const newItem = { id: maxId + 1, ...item };
    list.push(newItem);
    this.save();
    return newItem;
  }

  public update<K extends keyof DatabaseSchema>(table: K, id: number, updates: any): boolean {
    if (!this.data[table]) {
      this.data[table] = [] as any;
    }
    const list = this.data[table] as any[];
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public delete<K extends keyof DatabaseSchema>(table: K, id: number): boolean {
    if (!this.data[table]) {
      this.data[table] = [] as any;
    }
    const list = this.data[table] as any[];
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new Database();
