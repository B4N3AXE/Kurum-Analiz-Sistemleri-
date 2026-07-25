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
  alan?: string;
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

export interface TaksitPlani { id: number; ogrenci_id: number; kurum_id: number; toplam_tutar: number; pesinat: number; taksit_sayisi: number; baslangic_tarihi: string; durum: "aktif" | "tamamlandi" | "iptal"; }
export interface Taksit { id: number; plan_id: number; ogrenci_id: number; vade_tarihi: string; tutar: number; odenen_tutar: number; durum: "odendi" | "bekliyor" | "gecikti"; odeme_tarihi?: string; }

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

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'once' | 'forever' | 'repeating';
  active: boolean;
}

export interface KonuTakip {
  id: number;
  ogrenci_id: number;
  konu_key: string;
  tamamlandi: boolean;
  tarih?: string;
}

export interface CalismaSeansi {
  id: number;
  ogrenci_id: number;
  ders_adi: string;
  sure: number; // in seconds
  tarih: string;
}

export interface HaftalikGorev {
  id: number;
  ogrenci_id: number;
  gorev_metni: string;
  ders_adi: string;
  gun: string;
  tamamlandi: boolean;
  tarih?: string;
}

export interface UserPDF {
  id: number;
  userId: number;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export interface PDFAnnotation {
  id: number;
  pdfId: number;
  userId: number;
  pageNumber: number;
  annotationData: string;
  updatedAt: string;
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
  coupons?: Coupon[];
  konu_takip?: KonuTakip[];
  calisma_seanslari?: CalismaSeansi[];
  haftalik_gorevler?: HaftalikGorev[];
  user_pdfs?: UserPDF[];
  pdf_annotations?: PDFAnnotation[];
  taksit_planlari?: TaksitPlani[];
  taksitler?: Taksit[];
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

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfigPath = path.resolve('firebase-applet-config.json');
let dbFirestore: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const app = initializeApp(firebaseConfig);
    dbFirestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase Firestore initialized for persistent DB sync.");
  } catch (e) {
    console.error("Firebase config error:", e);
  }
}


// Initial seeded data for rich visual rendering and realistic flows
const initialData: DatabaseSchema = {
  kurumlar: [
    { id: 1, ad: "Gelecek Koleji", tur: "Özel Anadolu Lisesi", abonelik_turu: "premium", deneme_bitis: "2029-12-31T23:59:59.000Z" }
  ],
  kullanicilar: [
    { id: 1, ad_soyad: "Ahmet Yılmaz", email: "admin@kas.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 111 2233" },
    { id: 2, ad_soyad: "Caner Demir", email: "dibiadam81@gmail.com", sifre: "admin123", rol: "admin", kurum_id: 1, telefon: "0555 222 3344" }
  ],
  siniflar: [
    { id: 1, ad: "12-A", seviye: 12, kurum_id: 1, alan: "Sayısal" },
    { id: 2, ad: "11-B", seviye: 11, kurum_id: 1, alan: "Eşit Ağırlık" }
  ],
  ogrenciler: [
    { id: 10001, ad_soyad: "Efe Yılmaz", tc_no: "11111111111", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: true, danisman_id: 3 },
    { id: 10002, ad_soyad: "Ayşe Kaya", tc_no: "22222222222", sinif_id: 1, veli_id: null, alan: "Sayısal", aktif: true, danisman_id: 3 },
    { id: 10003, ad_soyad: "Mehmet Demir", tc_no: "33333333333", sinif_id: 2, veli_id: null, alan: "Eşit Ağırlık", aktif: true, danisman_id: 3 }
  ],
  sinav_tanimlari: [
    { id: 1, ad: "TYT Deneme 1", tur: "TYT", tarih: "2023-09-15T09:00:00Z", kurum_id: 1 },
    { id: 2, ad: "TYT Deneme 2", tur: "TYT", tarih: "2023-10-15T09:00:00Z", kurum_id: 1 },
    { id: 3, ad: "AYT Deneme 1", tur: "AYT", tarih: "2023-10-16T09:00:00Z", kurum_id: 1 }
  ],
  sinav_sonuclari: [
    { id: 1, sinav_id: 1, ogrenci_id: 10001, turkce_net: 25, matematik_net: 15, sosyal_net: 10, fen_net: 10, toplam_net: 60, puan: 280, createdAt: "2023-09-15T12:00:00Z" },
    { id: 2, sinav_id: 2, ogrenci_id: 10001, turkce_net: 30, matematik_net: 20, sosyal_net: 12, fen_net: 15, toplam_net: 77, puan: 320, createdAt: "2023-10-15T12:00:00Z" },
    { id: 3, sinav_id: 1, ogrenci_id: 10002, turkce_net: 35, matematik_net: 30, sosyal_net: 15, fen_net: 18, toplam_net: 98, puan: 410, createdAt: "2023-09-15T12:00:00Z" },
    { id: 4, sinav_id: 2, ogrenci_id: 10002, turkce_net: 36, matematik_net: 32, sosyal_net: 16, fen_net: 19, toplam_net: 103, puan: 430, createdAt: "2023-10-15T12:00:00Z" },
    { id: 5, sinav_id: 1, ogrenci_id: 10003, turkce_net: 28, matematik_net: 10, sosyal_net: 15, fen_net: 5, toplam_net: 58, puan: 270, createdAt: "2023-09-15T12:00:00Z" },
    { id: 6, sinav_id: 2, ogrenci_id: 10003, turkce_net: 30, matematik_net: 8, sosyal_net: 18, fen_net: 4, toplam_net: 60, puan: 280, createdAt: "2023-10-15T12:00:00Z" }
  ],
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
  veli_notlari: [],
  coupons: [
    { id: 1, code: "YENISEZON10", discount_type: "percentage", discount_value: 10, applies_to: "once", active: true },
    { id: 2, code: "KURUM100", discount_type: "percentage", discount_value: 100, applies_to: "once", active: true },
    { id: 3, code: "KAS100", discount_type: "percentage", discount_value: 100, applies_to: "once", active: true }
  ],
  konu_takip: [],
  calisma_seanslari: [],
  haftalik_gorevler: [],
  user_pdfs: [],
  pdf_annotations: [],
  taksit_planlari: [],
  taksitler: []
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
        this.mergeParsedData(parsed);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading database file, using in-memory fallback:', e);
    }
  }

  private mergeParsedData(parsed: any) {
    try {
      
        
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

        // Seed coupons if not exists or empty
        if (!parsed.coupons || parsed.coupons.length === 0) {
          parsed.coupons = [
            { id: 1, code: "YENISEZON10", discount_type: "percentage", discount_value: 10, applies_to: "once", active: true },
    { id: 2, code: "KURUM100", discount_type: "percentage", discount_value: 100, applies_to: "once", active: true },
    { id: 3, code: "KAS100", discount_type: "percentage", discount_value: 100, applies_to: "once", active: true }
          ];
        }

        // Ensure critical seed users exist in the loaded database (such as dibiadam81@gmail.com)
        const defaultUsers = initialData.kullanicilar;
        const currentUsers = parsed.kullanicilar || [];
        for (const defUser of defaultUsers) {
          if (defUser.rol !== 'ogrenci' && !currentUsers.some((u: any) => u.email.toLowerCase() === defUser.email.toLowerCase())) {
            currentUsers.push(defUser);
          }
        }

        // Ensure default classes and students are seeded if the tables are undefined/null
        const currentClasses = parsed.siniflar !== undefined && parsed.siniflar !== null ? parsed.siniflar : initialData.siniflar;
        const currentStudents = parsed.ogrenciler !== undefined && parsed.ogrenciler !== null ? parsed.ogrenciler : initialData.ogrenciler;
        const currentExams = parsed.sinav_tanimlari !== undefined && parsed.sinav_tanimlari !== null ? parsed.sinav_tanimlari : initialData.sinav_tanimlari;
        const currentResults = parsed.sinav_sonuclari !== undefined && parsed.sinav_sonuclari !== null ? parsed.sinav_sonuclari : initialData.sinav_sonuclari;
        const currentTeacherClasses = parsed.ogretmen_sinif !== undefined && parsed.ogretmen_sinif !== null ? parsed.ogretmen_sinif : initialData.ogretmen_sinif;
        const currentNotes = parsed.rehberlik_notlari !== undefined && parsed.rehberlik_notlari !== null ? parsed.rehberlik_notlari : initialData.rehberlik_notlari;
        const currentMessages = parsed.mesajlar !== undefined && parsed.mesajlar !== null ? parsed.mesajlar : initialData.mesajlar;
        const currentSchedules = parsed.ders_programlari !== undefined && parsed.ders_programlari !== null ? parsed.ders_programlari : initialData.ders_programlari;

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
          risk_thresholds: parsed.risk_thresholds,
          ogretmen_tavsiyeleri: parsed.ogretmen_tavsiyeleri || [],
          veli_notlari: parsed.veli_notlari || [],
          coupons: parsed.coupons || initialData.coupons,
          konu_takip: parsed.konu_takip || [],
          calisma_seanslari: parsed.calisma_seanslari || [],
          haftalik_gorevler: parsed.haftalik_gorevler || [],
          user_pdfs: parsed.user_pdfs || [],
          pdf_annotations: parsed.pdf_annotations || [],
          taksit_planlari: parsed.taksit_planlari || [],
          taksitler: parsed.taksitler || []
        };

        
      this.saveLocal();
    } catch (e) {
      console.error("Error in mergeParsedData:", e);
    }
  }

  public async loadFromFirestore() {
     if (!dbFirestore) return;
     try {
       console.log("Syncing database from Firestore...");
       const snapshot = await getDoc(doc(dbFirestore, 'system', 'database'));
       if (snapshot.exists()) {
          const docData = snapshot.data();
          if (docData && docData.data) {
             const parsed = JSON.parse(docData.data);
             this.mergeParsedData(parsed);
             console.log("Successfully synced database from Firestore.");
          }
       }
     } catch (e) {
        console.error("Error loading from Firestore:", e);
     }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving local database file:', e);
    }
  }

  public save() {
    this.saveLocal();
    try {
      if (dbFirestore) {
         setDoc(doc(dbFirestore, 'system', 'database'), { 
            data: JSON.stringify(this.data),
            updatedAt: new Date().toISOString()
         }).catch(e => console.error("Firestore background sync error", e));
      }
    } catch (e) {
      console.error('Error triggering Firestore sync:', e);
    }
  }


  

  // Generic Query Helpers
  public getCoupons() { return this.data.coupons || []; }
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
  public getKonuTakip() { return this.data.konu_takip || []; }
  public getCalismaSeanslari() { return this.data.calisma_seanslari || []; }
  public getHaftalikGorevler() { return this.data.haftalik_gorevler || []; }
  public getUserPDFs() { return this.data.user_pdfs || []; }
  public getPDFAnnotations() { return this.data.pdf_annotations || []; }
  public getTaksitPlanlari() { return this.data.taksit_planlari || []; }
  public getTaksitler() { return this.data.taksitler || []; }

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
