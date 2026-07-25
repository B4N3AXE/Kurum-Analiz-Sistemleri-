export interface Kurum {
  id: number;
  ad: string;
  tur: string;
}

export interface User {
  id: number;
  ad_soyad: string;
  email: string;
  rol: 'admin' | 'ogretmen' | 'rehber' | 'veli' | 'ogrenci';
  telefon: string;
  kurum_id: number;
  kurum_adi?: string;
  abonelik_turu?: string;
  deneme_bitis?: string;
}

export interface Sinif {
  id: number;
  ad: string;
  seviye: string;
  kurum_id: number;
  alan?: string;
}

export interface Ogrenci {
  id: number;
  ad_soyad: string;
  tc_no: string;
  sinif_id: number;
  sinif_adi?: string;
  veli_id: number | null;
  veli_adi?: string;
  veli_telefon?: string;
  veli_email?: string;
  alan: 'Sayısal' | 'Sözel' | 'Eşit Ağırlık' | 'Yabancı Dil' | 'LGS';
  aktif: boolean;
  son_net?: number | string;
  son_puan?: number | string;
  hedef_net?: number;
  danisman_id?: number | null;
  danisman_adi?: string;
  sifre?: string;
  bugun_calisma_suresi?: number;
  aktif_seans?: {
    ders_adi: string;
    mod: 'pomodoro' | 'stopwatch';
    kalan_sure: number;
    toplam_sure: number;
    calisiyor: boolean;
    son_guncelleme: string;
  } | null;
}

export interface SinavTanim {
  id: number;
  ad: string;
  tur: 'TYT' | 'AYT' | 'LGS';
  tarih: string;
  kurum_id: number;
  katilimci_sayisi?: number;
  ortalama_net?: number;
  en_yuksek_puan?: number;
}

export interface SinavSonuc {
  id: number;
  ogrenci_id: number;
  sinav_id: number;
  sinav_adi?: string;
  sinav_tarih?: string;
  sinav_turu?: 'TYT' | 'AYT' | 'LGS';
  turkce_net: number;
  sosyal_net: number;
  matematik_net: number;
  fen_net: number;
  toplam_net: number;
  puan: number;
}

export interface RehberlikNotu {
  id: number;
  ogrenci_id: number;
  rehber_id: number;
  rehber_adi?: string;
  not_metni: string;
  tarih: string;
}

export interface Mesaj {
  id: number;
  gonderen_id: number;
  gonderen_adi?: string;
  alici_id: number;
  alici_adi?: string;
  ogrenci_id: number | null;
  ogrenci_adi?: string;
  konu: string;
  mesaj: string;
  okundu: boolean;
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

export interface TaksitPlani {
  id: number;
  ogrenci_id: number;
  ogrenci_adi?: string;
  kurum_id: number;
  toplam_tutar: number;
  pesinat: number;
  taksit_sayisi: number;
  baslangic_tarihi: string;
  durum: 'aktif' | 'tamamlandi' | 'iptal';
}

export interface Taksit {
  id: number;
  plan_id: number;
  ogrenci_id: number;
  vade_tarihi: string;
  tutar: number;
  odenen_tutar: number;
  durum: 'odendi' | 'bekliyor' | 'gecikti';
  odeme_tarihi?: string;
}
