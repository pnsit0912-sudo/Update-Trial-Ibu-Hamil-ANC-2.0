
export const RISK_FACTORS_MASTER: Record<string, {label: string, score: number, category: string, level: 'LOW' | 'HIGH' | 'EXTREME'}> = {
  // Faktor Risiko I (Skor 4)
  'AGE_EXTREME': { label: 'Usia Terlalu Muda <20 / Tua >35 thn', score: 4, category: 'OBSTETRI', level: 'LOW' },
  'PARITY_HIGH': { label: 'Anak Banyak (>= 4)', score: 4, category: 'OBSTETRI', level: 'LOW' },
  'HEIGHT_LOW': { label: 'Tinggi Badan Rendah (<145 cm)', score: 4, category: 'MEDIS', level: 'LOW' },
  'SHORT_PREG': { label: 'Jarak Hamil Terlalu Dekat (<2 thn)', score: 4, category: 'OBSTETRI', level: 'LOW' },
  'ANEMIA': { label: 'Anemia (Hb <11 g/dL)', score: 4, category: 'MEDIS', level: 'LOW' },
  
  // Faktor Risiko II (Skor 8)
  'HISTORY_SC': { label: 'Riwayat Sesar (SC) Sebelumnya', score: 8, category: 'OBSTETRI', level: 'HIGH' },
  'HYPERTENSION': { label: 'Hipertensi (Tekanan Darah Tinggi)', score: 8, category: 'MEDIS', level: 'HIGH' },
  'TWINS': { label: 'Hamil Kembar (Gemelli)', score: 8, category: 'OBSTETRI', level: 'HIGH' },
  'POSITION_BAD': { label: 'Kelainan Letak (Sungsang/Lintang)', score: 8, category: 'OBSTETRI', level: 'HIGH' },
  
  // Faktor Risiko III (Skor 12)
  'HEART_DIS': { label: 'Penyakit Jantung / Gagal Ginjal', score: 12, category: 'MEDIS', level: 'EXTREME' },
  'DIABETES': { label: 'Diabetes Melitus (Gula Darah)', score: 12, category: 'MEDIS', level: 'EXTREME' },
  'PRE_ECLAMPSIA': { label: 'Pre-Eklampsia Berat / Eklampsia', score: 12, category: 'MEDIS', level: 'EXTREME' },
  'HEMORRHAGE': { label: 'Riwayat Perdarahan Hebat', score: 12, category: 'OBSTETRI', level: 'EXTREME' }
};

export const calculatePregnancyProgress = (hphtString: string) => {
  if (!hphtString) return null;
  const hpht = new Date(hphtString);
  const today = new Date();
  const diffTime = today.getTime() - hpht.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (totalDays < 0) return null;
  const weeks = Math.floor(totalDays / 7);
  const months = Math.floor(totalDays / 30.417);
  const hpl = new Date(hpht);
  hpl.setDate(hpl.getDate() + 280); 

  return {
    weeks,
    months,
    totalDays,
    hpl: hpl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    percentage: Math.min(Math.round((totalDays / 280) * 100), 100)
  };
};

export const getRiskCategory = (scoreFromFactors: number, currentAncData?: any) => {
  const baseScore = 2; // Skor awal ibu hamil (KRR)
  const total = scoreFromFactors + baseScore;

  // 1. TRIASE HITAM (GAWAT DARURAT KLINIS)
  if (currentAncData) {
    const bpStr = currentAncData.bloodPressure || "0/0";
    const bpParts = bpStr.split('/');
    const sys = bpParts.length > 0 ? Number(bpParts[0]) : 0;
    const dia = bpParts.length > 1 ? Number(bpParts[1]) : 0;
    
    const djj = Number(currentAncData.djj || 140);
    
    const hasFatalSigns = currentAncData.dangerSigns?.some((s: string) => 
      ['Perdarahan', 'Ketuban Pecah', 'Kejang', 'Pusing Hebat', 'Nyeri Perut Hebat'].includes(s)
    );
    
    if ((sys >= 160 && sys < 500) || (dia >= 110 && dia < 500) || hasFatalSigns || currentAncData.fetalMovement === 'Tidak Ada' || djj < 120 || djj > 160) {
      return { 
        label: 'HITAM', 
        desc: 'KRITIS / EMERGENCY - RUJUK SEGERA', 
        color: 'text-white bg-slate-950 border-slate-900', 
        hex: '#020617',
        priority: 0
      };
    }
  }

  // 2. KRST (MERAH) - Skor >= 12
  if (total >= 12) {
    return { 
      label: 'MERAH', 
      desc: 'Risiko Sangat Tinggi (KRST)', 
      color: 'text-white bg-red-600 border-red-700', 
      hex: '#dc2626',
      priority: 1
    };
  }
  
  // 3. KRT (KUNING) - Skor 6 - 10
  if (total >= 6) {
    return { 
      label: 'KUNING', 
      desc: 'Risiko Tinggi (KRT)', 
      color: 'text-yellow-900 bg-yellow-400 border-yellow-500', 
      hex: '#facc15',
      priority: 2
    };
  }
  
  // 4. KRR (HIJAU) - Skor 2
  return { 
    label: 'HIJAU', 
    desc: 'Risiko Rendah (KRR)', 
    color: 'text-white bg-emerald-500 border-emerald-600', 
    hex: '#10b981',
    priority: 3
  };
};

export const getBabySizeByWeek = (week: number) => {
  if (week <= 4) return { name: 'Biji Poppy', icon: '🌱' };
  if (week <= 8) return { name: 'Buah Raspberry', icon: '🫐' };
  if (week <= 12) return { name: 'Buah Lemon', icon: '🍋' };
  if (week <= 16) return { name: 'Buah Alpukat', icon: '🥑' };
  if (week <= 20) return { name: 'Buah Pisang', icon: '🍌' };
  if (week <= 24) return { name: 'Buah Jagung', icon: '🌽' };
  if (week <= 28) return { name: 'Buah Terong', icon: '🍆' };
  if (week <= 32) return { name: 'Buah Kelapa', icon: '🥥' };
  if (week <= 36) return { name: 'Buah Melon', icon: '🍈' };
  return { name: 'Semangka Kecil', icon: '🍉' };
};
