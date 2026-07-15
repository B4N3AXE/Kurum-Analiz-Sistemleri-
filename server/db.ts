import fs from 'fs';
import path from 'path';

// ==================== TYPES ====================

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
  abonelik_turu?: 'trial' | 'premium';
  deneme_bitis?: string;
}

export interface Sinif {
  id: number;
  ad: string;
  seviye: number;
  kurum_id: number;
}

export interface Ogrenci {
  id: number;
  ad_soyad: string;
  tc_no: string;
  sinif_id: number;
  veli_id: number | null;
  alan: 'Sayısal' | 'Sözel' | 'Eşit Ağırlık' | 'Yabancı Dil' | 'LGS';
  aktif: boolean;
  danisman_id?: number | null;
  sifre?: string;
}

export interface SinavTanim {
  id: number;
  ad: string;
  tur: 'TYT' | 'AYT' | 'LGS';
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

export interface RiskThreshold {
  id: number;
  tur: 'TYT' | 'AYT' | 'LGS';
  turkce_net: number;
  sosyal_net: number;
  matematik_net: number;
  fen_net: number;
  toplam_net: number;
}

export interface OgretmenTavsiyesi {
  id: number;
  ogrenci_id: number;
  ogretmen_id: number;
  ogretmen_adi: string;
  ders_adi: string;
  tavsiye_metni: string;
  tarih: string;
}

export interface VeliNotu {
  id: number;
  ogrenci_id: number;
  veli_id: number;
  veli_adi: string;
  not_metni: string;
  tarih: string;
}

export interface DersProgrami {
  id: number;
  ogrenci_id: number;
  gun: string;
  saat: string;
  ders_adi: string;
  ogretmen_adi: string;
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
  risk_thresholds: RiskThreshold[];
  ogretmen_tavsiyeleri?: OgretmenTavsiyesi[];
  veli_notlari?: VeliNotu[];
}

// ==================== SEED DATA ====================
// Bu data SADECE db.json ilk kez oluşturulurken kullanılır.
// Sonraki açılışlarda buradan hiçbir şey eklenmez.

const SEED_DATA: DatabaseSchema = {
  kurumlar: [
    { id: 1, ad: "Gelecek Koleji", tur: "Özel Anadolu Lisesi", abonelik_turu: "premium", deneme_bitis: "2029-12-31T23:59:59.000Z" }
  ],
  kullanicilar: [
    { id: 1, ad_soyad: "Ahmet Yılmaz", email: "admin@kas.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 111 2233" },
    { id: 2, ad_soyad: "Caner Demir", email: "dibiadam81@gmail.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 222 3344" }
  ],
  siniflar: [],
  ogrenciler: [],
  sinav_tanimlari: [],
  sinav_sonuclari: [],
  ogretmen_sinif: [],
  rehberlik_notlari: [],
  mesajlar: [],
  ders_programlari: [],
  risk_thresholds: [
    { id: 1, tur: 'TYT', turkce_net: 25, sosyal_net: 12, matematik_net: 20, fen_net: 12, toplam_net: 60 },
    { id: 2, tur: 'AYT', turkce_net: 15, sosyal_net: 15, matematik_net: 15, fen_net: 15, toplam_net: 45 },
    { id: 3, tur: 'LGS', turkce_net: 14, sosyal_net: 18, matematik_net: 10, fen_net: 12, toplam_net: 55 }
  ],
  ogretmen_tavsiyeleri: [],
  veli_notlari: []
};

// Sistem adminleri — db.json'da olmasa bile her zaman var olmalı
const SYSTEM_ADMINS: Kullanici[] = [
  { id: 2, ad_soyad: "Caner Demir", email: "dibiadam81@gmail.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 222 3344" }
];

const DB_FILE_PATH = path.resolve('db.json');

// ==================== DATABASE CLASS ====================

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = JSON.parse(JSON.stringify(SEED_DATA)); // deep copy
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        // db.json MEVCUT → sadece dosyadan yükle, seed data ekleme
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(fileContent);

        // Risk thresholds config olduğu için her zaman güvence altına al
        if (!parsed.risk_thresholds || parsed.risk_thresholds.length === 0) {
          parsed.risk_thresholds = SEED_DATA.risk_thresholds;
        } else {
          for (const defaultThreshold of SEED_DATA.risk_thresholds) {
            if (!parsed.risk_thresholds.some(t => t.tur === defaultThreshold.tur)) {
              parsed.risk_thresholds.push(defaultThreshold);
            }
          }
        }

        // Sistem adminlerini güvence altına al (sadece bunlar, genel seed user'lar değil)
        const users = parsed.kullanicilar || [];
        for (const admin of SYSTEM_ADMINS) {
          if (!users.some(u => u.email.toLowerCase() === admin.email.toLowerCase())) {
            const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
            users.push({ ...admin, id: maxId + 1 });
          }
        }

        this.data = {
          kurumlar: parsed.kurumlar || [],
          kullanicilar: users,
          siniflar: parsed.siniflar || [],
          ogrenciler: parsed.ogrenciler || [],
          sinav_tanimlari: parsed.sinav_tanimlari || [],
          sinav_sonuclari: parsed.sinav_sonuclari || [],
          ogretmen_sinif: parsed.ogretmen_sinif || [],
          rehberlik_notlari: parsed.rehberlik_notlari || [],
          mesajlar: parsed.mesajlar || [],
          ders_programlari: parsed.ders_programlari || [],
          risk_thresholds: parsed.risk_thresholds,
          ogretmen_tavsiyeleri: parsed.ogretmen_tavsiyeleri || [],
          veli_notlari: parsed.veli_notlari || []
        };

        this.save();
      } else {
        // db.json YOK → ilk kurulum, seed data ile başlat
        console.log('db.json bulunamadı, ilk kurulum yapılıyor...');
        this.save();
      }
    } catch (e) {
      console.error('Veritabanı yüklenirken hata oluştu, bellek içi veri kullanılıyor:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Veritabanı kaydedilirken hata oluştu:', e);
    }
  }

  // ==================== GETTERS ====================

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
  public getRiskThresholds() { return this.data.risk_thresholds || []; }
  public getOgretmenTavsiyeleri() { return this.data.ogretmen_tavsiyeleri || []; }
  public getVeliNotlari() { return this.data.veli_notlari || []; }

  // ==================== MUTATIONS ====================

  public insert<K extends keyof DatabaseSchema>(table: K, item: any): any {
    if (!this.data[table]) {
      (this.data[table] as any) = [];
    }
    const list = this.data[table] as any[];
    const maxId = list.reduce((max, x) => (x.id > max ? x.id : max), 0);
    const newItem = { id: maxId + 1, ...item };
    list.push(newItem);
    this.save();
    return newItem;
  }

  public update<K extends keyof DatabaseSchema>(table: K, id: number, updates: any): boolean {
    if (!this.data[table]) return false;
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
    if (!this.data[table]) return false;
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