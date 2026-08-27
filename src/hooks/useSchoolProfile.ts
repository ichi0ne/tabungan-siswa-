import { useState, useEffect, useCallback } from 'react';
import { SchoolProfile } from '../types';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  nama_sekolah: 'TK NEGERI 02 KEMAYORAN',
  alamat: 'Jl. Galindra, RT08/RW08, Kel.Kebon Kosong, Kec.Kemayoran',
  alamat_sekolah: 'Jl. Galindra, RT08/RW08, Kel.Kebon Kosong, Kec.Kemayoran',
  telepon: '',
  email: '',
  npsn: '',
  kota: 'Jakarta Pusat',
  wali_kelas: '',
  kontak_wali_kelas: '',
  bendahara: '',
  kontak_bendahara_kelas: '',
  tahun_ajaran_aktif: '2026/2027',
  tampilkan_demo_login: true
};

const STORAGE_KEY = 'SCHOOL_PROFILE';
const EVENT_NAME = 'school_profile_updated';

export function getStoredSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SCHOOL_PROFILE,
        ...parsed,
        alamat: parsed.alamat || parsed.alamat_sekolah || DEFAULT_SCHOOL_PROFILE.alamat,
        alamat_sekolah: parsed.alamat_sekolah || parsed.alamat || DEFAULT_SCHOOL_PROFILE.alamat,
        tampilkan_demo_login: parsed.tampilkan_demo_login !== undefined ? parsed.tampilkan_demo_login : true
      };
    }
  } catch (err) {
    console.error('Error reading stored school profile:', err);
  }
  return DEFAULT_SCHOOL_PROFILE;
}

export function saveStoredSchoolProfile(profile: Partial<SchoolProfile>): SchoolProfile {
  const current = getStoredSchoolProfile();
  const updated: SchoolProfile = {
    ...current,
    ...profile,
    alamat: profile.alamat || profile.alamat_sekolah || current.alamat,
    alamat_sekolah: profile.alamat_sekolah || profile.alamat || current.alamat_sekolah
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
  } catch (err) {
    console.error('Error saving school profile:', err);
  }

  return updated;
}

export function useSchoolProfile() {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(getStoredSchoolProfile);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        setSchoolProfile(e.detail);
      } else {
        setSchoolProfile(getStoredSchoolProfile());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = useCallback((newProfile: Partial<SchoolProfile>) => {
    const saved = saveStoredSchoolProfile(newProfile);
    setSchoolProfile(saved);
    return saved;
  }, []);

  const resetProfile = useCallback(() => {
    const saved = saveStoredSchoolProfile(DEFAULT_SCHOOL_PROFILE);
    setSchoolProfile(saved);
    return saved;
  }, []);

  return {
    schoolProfile,
    updateProfile,
    resetProfile
  };
}
