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
  ogrenciler: [],
  sinav_tanimlari: [],
  sinav_sonuclari: [],
  ogretmen_sinif: [
    { id: 1, ogretmen_id: 2, sinif_id: 1 },
    { id: 2, ogretmen_id: 2, sinif_id: 2 }
  ],
  rehberlik_notlari: [],
  mesajlar: [],
  ders_programlari: []
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
