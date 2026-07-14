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
  abonelik_turu?: 'trial' | 'premium';
  deneme_bitis?: string;
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
    { id: 1, ad: "Gelecek Koleji", tur: "Özel Anadolu Lisesi", abonelik_turu: "premium", deneme_bitis: "2029-12-31T23:59:59.000Z" }
  ],
  kullanicilar: [
    { id: 1, ad_soyad: "Ahmet Yılmaz", email: "admin@kas.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 111 2233" },
    { id: 2, ad_soyad: "Caner Demir", email: "dibiadam81@gmail.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 222 3344" },
    { id: 3, ad_soyad: "Zeynep Kaya", email: "ogretmen@kas.com", sifre: "ogretmen123", rol: "ogretmen", kurum_id: 1, telefon: "0555 333 4455" },
    { id: 4, ad_soyad: "Murat Can", email: "rehber@kas.com", sifre: "rehber123", rol: "rehber", kurum_id: 1, telefon: "0555 444 5566" },
    { id: 5, ad_soyad: "Mehmet Öztürk", email: "veli@kas.com", sifre: "veli123", rol: "veli", kurum_id: 1, telefon: "0555 555 6677" },
    { id: 6, ad_soyad: "Ali Öztürk", email: "12345678901", sifre: "12345678901", rol: "ogrenci", kurum_id: 1, telefon: "0555 666 7788" }
  ],
  siniflar: [
    { id: 1, ad: "12-A Sayısal", seviye: 12, kurum_id: 1 },
    { id: 2, ad: "12-B Eşit Ağırlık", seviye: 12, kurum_id: 1 },
    { id: 3, ad: "11-A Sayısal", seviye: 11, kurum_id: 1 },
    { id: 4, ad: "8-A LGS", seviye: 8, kurum_id: 1 }
  ],
  ogrenciler: [
    { id: 1, ad_soyad: "Ali Öztürk", tc_no: "12345678901", sinif_id: 1, veli_id: 5, alan: "Sayısal", aktif: true },
    { id: 2, ad_soyad: "Elif Yılmaz", tc_no: "23456789012", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: true },
    { id: 3, ad_soyad: "Yiğit Özkaya", tc_no: "34567890123", sinif_id: 2, veli_id: null, alan: "Eşit Ağırlık", aktif: true },
    { id: 4, ad_soyad: "Melis Şahin", tc_no: "45678901234", sinif_id: 2, veli_id: null, alan: "Eşit Ağırlık", aktif: true },
    { id: 5, ad_soyad: "Arda Çelik", tc_no: "56789012345", sinif_id: 3, veli_id: null, alan: "Sayısal", aktif: true },
    { id: 6, ad_soyad: "Burak Aydın", tc_no: "67890123456", sinif_id: 4, veli_id: null, alan: "LGS", aktif: true },
    { id: 7, ad_soyad: "Ceren Demir", tc_no: "78901234567", sinif_id: 4, veli_id: null, alan: "LGS", aktif: true }
  ],
  sinav_tanimlari: [
    { id: 1, ad: "3D Türkiye Geneli TYT-1", tur: "TYT", tarih: "2026-05-15", kurum_id: 1 },
    { id: 2, ad: "Özdebir Türkiye Geneli TYT-2", tur: "TYT", tarih: "2026-06-02", kurum_id: 1 },
    { id: 3, ad: "Bilgi Sarmal TYT-3", tur: "TYT", tarih: "2026-06-20", kurum_id: 1 },
    { id: 4, ad: "Özdebir AYT-1", tur: "AYT", tarih: "2026-05-20", kurum_id: 1 },
    { id: 5, ad: "Bilgi Sarmal AYT-2", tur: "AYT", tarih: "2026-06-10", kurum_id: 1 },
    { id: 6, ad: "Nitelik LGS-1", tur: "LGS", tarih: "2026-05-18", kurum_id: 1 },
    { id: 7, ad: "Sadık Uygun LGS-2", tur: "LGS", tarih: "2026-06-15", kurum_id: 1 }
  ],
  sinav_sonuclari: [
    { id: 1, ogrenci_id: 1, sinav_id: 1, turkce_net: 28, sosyal_net: 12, matematik_net: 22, fen_net: 10, toplam_net: 72, puan: 310 },
    { id: 2, ogrenci_id: 1, sinav_id: 2, turkce_net: 30, sosyal_net: 14, matematik_net: 25, fen_net: 12, toplam_net: 81, puan: 345 },
    { id: 3, ogrenci_id: 1, sinav_id: 3, turkce_net: 32, sosyal_net: 15, matematik_net: 28, fen_net: 14, toplam_net: 89, puan: 375 },
    { id: 4, ogrenci_id: 2, sinav_id: 1, turkce_net: 32, sosyal_net: 14, matematik_net: 30, fen_net: 16, toplam_net: 92, puan: 390 },
    { id: 5, ogrenci_id: 2, sinav_id: 2, turkce_net: 34, sosyal_net: 13, matematik_net: 32, fen_net: 15, toplam_net: 94, puan: 398 },
    { id: 6, ogrenci_id: 2, sinav_id: 3, turkce_net: 35, sosyal_net: 16, matematik_net: 34, fen_net: 17, toplam_net: 102, puan: 425 },
    { id: 7, ogrenci_id: 3, sinav_id: 1, turkce_net: 24, sosyal_net: 16, matematik_net: 15, fen_net: 4, toplam_net: 59, puan: 265 },
    { id: 8, ogrenci_id: 3, sinav_id: 2, turkce_net: 26, sosyal_net: 15, matematik_net: 18, fen_net: 5, toplam_net: 64, puan: 285 },
    { id: 9, ogrenci_id: 3, sinav_id: 3, turkce_net: 28, sosyal_net: 18, matematik_net: 20, fen_net: 6, toplam_net: 72, puan: 315 },
    { id: 10, ogrenci_id: 1, sinav_id: 4, turkce_net: 14, sosyal_net: 0, matematik_net: 18, fen_net: 10, toplam_net: 42, puan: 290 },
    { id: 11, ogrenci_id: 1, sinav_id: 5, turkce_net: 16, sosyal_net: 0, matematik_net: 22, fen_net: 12, toplam_net: 50, puan: 325 },
    { id: 12, ogrenci_id: 2, sinav_id: 4, turkce_net: 18, sosyal_net: 0, matematik_net: 28, fen_net: 14, toplam_net: 60, puan: 380 },
    { id: 13, ogrenci_id: 2, sinav_id: 5, turkce_net: 20, sosyal_net: 0, matematik_net: 32, fen_net: 15, toplam_net: 67, puan: 415 },
    { id: 14, ogrenci_id: 6, sinav_id: 6, turkce_net: 15, sosyal_net: 8, matematik_net: 12, fen_net: 14, toplam_net: 49, puan: 385 },
    { id: 15, ogrenci_id: 6, sinav_id: 7, turkce_net: 17, sosyal_net: 9, matematik_net: 14, fen_net: 16, toplam_net: 56, puan: 415 },
    { id: 16, ogrenci_id: 7, sinav_id: 6, turkce_net: 18, sosyal_net: 10, matematik_net: 16, fen_net: 18, toplam_net: 62, puan: 450 },
    { id: 17, ogrenci_id: 7, sinav_id: 7, turkce_net: 19, sosyal_net: 9, matematik_net: 18, fen_net: 19, toplam_net: 65, puan: 472 }
  ],
  ogretmen_sinif: [
    { id: 1, ogretmen_id: 3, sinif_id: 1 },
    { id: 2, ogretmen_id: 3, sinif_id: 2 },
    { id: 3, ogretmen_id: 3, sinif_id: 3 }
  ],
  rehberlik_notlari: [
    { id: 1, ogrenci_id: 1, rehber_id: 4, not_metni: "Ali son denemede Matematik netlerini ciddi oranda artırdı. Kendisiyle haftalık soru hedefi belirledik. Motivasyonu çok yüksek.", tarih: "2026-07-10T10:00:00.000Z" },
    { id: 2, ogrenci_id: 1, rehber_id: 4, not_metni: "Veli görüşmesi yapıldı. Evdeki çalışma ortamının düzenlenmesi konusunda tavsiyelerde bulunuldu.", tarih: "2026-07-12T14:30:00.000Z" },
    { id: 3, ogrenci_id: 2, rehber_id: 4, not_metni: "Elif üst düzey hedeflerine odaklanmış durumda. Geometri soru çözümlerine ağırlık vermesi gerekiyor.", tarih: "2026-07-08T09:15:00.000Z" }
  ],
  mesajlar: [
    { id: 1, gonderen_id: 1, alici_id: 5, ogrenci_id: 1, konu: "Deneme Sonuçları Bildirimi", mesaj: "Sayın Velimiz, Ali'nin son deneme sınavı sonuçları ve haftalık gelişim grafikleri sisteme yüklenmiştir. Başarılarının devamını dileriz.", okundu: true, tarih: "2026-07-13T17:00:00.000Z" }
  ],
  ders_programlari: [
    { id: 1, ogrenci_id: 1, gun: "Pazartesi", saat: "16:30", ders_adi: "Matematik Birebir", ogretmen_adi: "Zeynep Kaya" },
    { id: 2, ogrenci_id: 1, gun: "Çarşamba", saat: "17:15", ders_adi: "Fizik Soru Çözümü", ogretmen_adi: "Hakan Yılmaz" },
    { id: 3, ogrenci_id: 1, gun: "Cuma", saat: "15:45", ders_adi: "Kimya Konu Analizi", ogretmen_adi: "Selin Demir" },
    { id: 4, ogrenci_id: 2, gun: "Pazartesi", saat: "17:30", ders_adi: "Geometri İleri Seviye", ogretmen_adi: "Zeynep Kaya" },
    { id: 5, ogrenci_id: 2, gun: "Perşembe", saat: "16:30", ders_adi: "Biyoloji Soru Çözümü", ogretmen_adi: "Ahmet Tekin" }
  ],
  risk_thresholds: [
    { id: 1, tur: 'TYT', turkce_net: 25, sosyal_net: 12, matematik_net: 20, fen_net: 12, toplam_net: 60 },
    { id: 2, tur: 'AYT', turkce_net: 15, sosyal_net: 15, matematik_net: 15, fen_net: 15, toplam_net: 45 },
    { id: 3, tur: 'LGS', turkce_net: 14, sosyal_net: 18, matematik_net: 10, fen_net: 12, toplam_net: 55 }
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
        
        // Seed risk thresholds if not exists in parsed file or incomplete
        if (!parsed.risk_thresholds || parsed.risk_thresholds.length === 0) {
          parsed.risk_thresholds = [
            { id: 1, tur: 'TYT', turkce_net: 25, sosyal_net: 12, matematik_net: 20, fen_net: 12, toplam_net: 60 },
            { id: 2, tur: 'AYT', turkce_net: 15, sosyal_net: 15, matematik_net: 15, fen_net: 15, toplam_net: 45 },
            { id: 3, tur: 'LGS', turkce_net: 14, sosyal_net: 18, matematik_net: 10, fen_net: 12, toplam_net: 55 }
          ];
        } else if (parsed.risk_thresholds.length < 3) {
          // If existing but missing LGS (id 3)
          const hasLgs = parsed.risk_thresholds.some((t: any) => t.tur === 'LGS');
          if (!hasLgs) {
            parsed.risk_thresholds.push({ id: 3, tur: 'LGS', turkce_net: 14, sosyal_net: 18, matematik_net: 10, fen_net: 12, toplam_net: 55 });
          }
        }

        // Ensure critical seed users exist in the loaded database (such as dibiadam81@gmail.com)
        const defaultUsers = initialData.kullanicilar;
        const currentUsers = parsed.kullanicilar || [];
        for (const defUser of defaultUsers) {
          if (!currentUsers.some((u: any) => u.email.toLowerCase() === defUser.email.toLowerCase())) {
            currentUsers.push(defUser);
          }
        }

        // Ensure default classes and students are seeded if the tables are empty
        const currentClasses = parsed.siniflar && parsed.siniflar.length > 0 ? parsed.siniflar : initialData.siniflar;
        const currentStudents = parsed.ogrenciler && parsed.ogrenciler.length > 0 ? parsed.ogrenciler : initialData.ogrenciler;
        const currentExams = parsed.sinav_tanimlari && parsed.sinav_tanimlari.length > 0 ? parsed.sinav_tanimlari : initialData.sinav_tanimlari;
        const currentResults = parsed.sinav_sonuclari && parsed.sinav_sonuclari.length > 0 ? parsed.sinav_sonuclari : initialData.sinav_sonuclari;
        const currentTeacherClasses = parsed.ogretmen_sinif && parsed.ogretmen_sinif.length > 0 ? parsed.ogretmen_sinif : initialData.ogretmen_sinif;
        const currentNotes = parsed.rehberlik_notlari && parsed.rehberlik_notlari.length > 0 ? parsed.rehberlik_notlari : initialData.rehberlik_notlari;
        const currentMessages = parsed.mesajlar && parsed.mesajlar.length > 0 ? parsed.mesajlar : initialData.mesajlar;
        const currentSchedules = parsed.ders_programlari && parsed.ders_programlari.length > 0 ? parsed.ders_programlari : initialData.ders_programlari;

        this.data = {
          kurumlar: parsed.kurumlar || initialData.kurumlar,
          kullanicilar: currentUsers,
          siniflar: currentClasses,
          ogrenciler: currentStudents,
          sinav_tanimlari: currentExams,
          sinav_sonuclari: currentResults,
          ogretmen_sinif: currentTeacherClasses,
          rehberlik_notlari: currentNotes,
          mesajlar: currentMessages,
          ders_programlari: currentSchedules,
          risk_thresholds: parsed.risk_thresholds
        };

        // Always save back to keep db.json perfectly seeded and up to date
        this.save();
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
  public getRiskThresholds() { return this.data.risk_thresholds || []; }

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
