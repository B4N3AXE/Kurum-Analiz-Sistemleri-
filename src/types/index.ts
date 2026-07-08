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
}

export interface Sinif {
  id: number;
  ad: string;
  seviye: string;
  kurum_id: number;
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
  alan: 'Sayısal' | 'Sözel' | 'Eşit Ağırlık' | 'Yabancı Dil';
  aktif: boolean;
  son_net?: number | string;
  son_puan?: number | string;
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
