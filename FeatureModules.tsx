
import React, { useState, useMemo } from 'react';
import { HeartPulse, Printer, Download, MapPin, Phone, Mail, UserX, AlertCircle, ShieldCheck, Share2, Filter, LayoutGrid, MessageSquare, Send, CheckCircle, Fingerprint, CalendarDays, Building2, UserCircle2, QrCode, Baby, Sparkles, Scale, Info, Crosshair, Save } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PUSKESMAS_INFO, EDUCATION_LIST } from './constants';
import { User, AppState, EducationContent } from './types';

// Modul Kartu ANC Pintar
export const SmartCardModule = ({ state, setState, isUser, user }: { state: AppState, setState: any, isUser: boolean, user: User }) => {
  const patientToDisplay = isUser ? user : state.users.find(u => u.id === state.selectedPatientId);
  
  // URL untuk QR Code agar saat di-scan langsung membuka profil (PID)
  const getQrValue = (pid: string) => {
    return `${window.location.origin}${window.location.pathname}?pid=${pid}`;
  };

  const handleSaveCard = () => {
    // Simulasi simpan kartu (bisa dikembangkan ke download image menggunakan html2canvas)
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      {/* Selector untuk Nakes/Admin (Disembunyikan saat cetak) */}
      {!isUser && (
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
           <div className="flex items-center gap-4 mb-6">
             <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <UserCircle2 size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Pilih Pasien</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Generate Kartu Digital</p>
             </div>
           </div>
           <select 
             onChange={(e) => setState((prev: AppState) => ({...prev, selectedPatientId: e.target.value}))}
             className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] font-black text-xs uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
             value={state.selectedPatientId || ''}
           >
             <option value="">-- PILIH NAMA PASIEN --</option>
             {state.users.filter(u => u.role === 'USER').map(u => (
               <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
             ))}
           </select>
         </div>
      )}

      {patientToDisplay ? (
        <div className="space-y-10">
          {/* DIGITAL PREVIEW ON SCREEN (NOT PRINTED) */}
          <div className="no-print bg-white p-10 md:p-14 rounded-[4rem] shadow-[0_48px_96px_-12px_rgba(79,70,229,0.12)] relative overflow-hidden border border-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mb-20" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl rotate-3">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">KARTU ANC PINTAR</h1>
                  <p className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mt-2">Sistem Monitoring Terintegrasi</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="bg-white p-6 border-[6px] border-slate-900 rounded-[3rem] shadow-2xl relative">
                  <QRCode value={getQrValue(patientToDisplay.id)} size={160} />
                </div>
                <div className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg">
                  ID: {patientToDisplay.id}
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap Pasien</p>
                    <p className="text-xl font-black text-slate-900 uppercase truncate">{patientToDisplay.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    {patientToDisplay.isDelivered ? (
                      <p className="text-xl font-black text-emerald-600 uppercase">Pasca Salin (Nifas)</p>
                    ) : (
                      <p className="text-xl font-black text-slate-900 uppercase">G{patientToDisplay.pregnancyNumber} | {patientToDisplay.pregnancyMonth} Bulan</p>
                    )}
                  </div>
                </div>

                {patientToDisplay.isDelivered && patientToDisplay.deliveryData && (
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                    <div className="flex items-center gap-3 border-b border-emerald-100 pb-4 mb-4">
                      <Baby size={18} className="text-emerald-600" />
                      <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Data Buah Hati</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Nama</p>
                        <p className="text-xs font-black text-slate-900 truncate">{patientToDisplay.deliveryData.babyName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Berat</p>
                        <p className="text-xs font-black text-slate-900">{patientToDisplay.deliveryData.babyWeight}g</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PHYSICAL CARD PRINT TEMPLATE - STRICT WHITE BACKGROUND NO COLORS */}
          <div className="print-only w-full bg-white text-black">
            <div className="flex flex-col items-center gap-14 bg-white">
              {/* FRONT SIDE - ABSOLUTE WHITE */}
              <div className="w-[85.6mm] h-[54mm] bg-white border-[2pt] border-black rounded-[12pt] relative flex flex-col p-6 shadow-none overflow-hidden">
                 <div className="flex justify-between items-start relative z-10 mb-3 bg-white">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-black" />
                      <h2 className="text-[11pt] font-black uppercase tracking-tighter text-black">KARTU ANC PINTAR</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[6pt] font-black text-gray-500 uppercase tracking-widest leading-none mb-0.5">Puskesmas</p>
                      <p className="text-[7pt] font-black text-black uppercase leading-none">Pasar Minggu</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-5 items-center flex-1 relative z-10 bg-white">
                    <div className="bg-white p-1.5 border-[2pt] border-black rounded-2xl shrink-0">
                       <QRCode value={getQrValue(patientToDisplay.id)} size={70} fgColor="#000000" />
                    </div>
                    <div className="flex-1 space-y-2.5 min-w-0 bg-white">
                       <div className="space-y-0.5">
                          <p className="text-[6pt] font-black text-gray-500 uppercase tracking-widest">Nama Pasien</p>
                          <p className="text-[12pt] font-black text-black uppercase truncate leading-none">{patientToDisplay.name}</p>
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[6pt] font-black text-gray-500 uppercase tracking-widest">ID Pasien</p>
                          <p className="text-[10pt] font-black text-black uppercase leading-none">{patientToDisplay.id}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 bg-white">
                          <div>
                            <p className="text-[5pt] font-black text-gray-500 uppercase">HPHT</p>
                            <p className="text-[8pt] font-black text-black">{patientToDisplay.hpht || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[5pt] font-black text-gray-500 uppercase">Gravida</p>
                            <p className="text-[8pt] font-black text-black">G{patientToDisplay.pregnancyNumber} P{patientToDisplay.parityP}</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-3 pt-2 border-t-[1.5pt] border-black flex justify-between items-center relative z-10 bg-white">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={8} className="text-black" />
                      <span className="text-[7pt] font-black text-black uppercase tracking-tight">Valid & Terverifikasi</span>
                    </div>
                    <p className="text-[6pt] font-black text-gray-300 uppercase">Smart ANC Digital System</p>
                 </div>
              </div>

              {/* BACK SIDE - ABSOLUTE WHITE */}
              <div className="w-[85.6mm] h-[54mm] bg-white border-[2pt] border-black rounded-[12pt] relative flex flex-col p-6 shadow-none overflow-hidden">
                 <div className="mb-4 pb-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h3 className="text-[10pt] font-black uppercase tracking-widest text-black">Instruksi Layanan</h3>
                    <Phone size={14} className="text-gray-400" />
                 </div>

                 <div className="space-y-3 flex-1 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                      <p className="text-[8.5pt] font-bold text-black leading-tight uppercase">Bawa kartu ini setiap melakukan pemeriksaan kehamilan (ANC) di Puskesmas atau RS.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                      <p className="text-[8.5pt] font-bold text-black leading-tight uppercase">Scan Barcode di kartu ini untuk melihat riwayat medis lengkap secara instan.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                      <p className="text-[8.5pt] font-bold text-black leading-tight uppercase">Pantau status kehamilan melalui Aplikasi Smart ANC.</p>
                    </div>
                 </div>

                 <div className="mt-3 pt-2.5 border-t border-gray-200 text-center bg-white">
                    <p className="text-[8.5pt] font-black text-black uppercase tracking-[0.15em] mb-1">{PUSKESMAS_INFO.name}</p>
                    <p className="text-[6pt] font-bold text-gray-400 uppercase italic tracking-widest">Digital Health Persistent ID</p>
                 </div>
              </div>
              
              <div className="text-center pt-8 border-t border-dashed border-gray-200 w-full bg-white">
                <p className="text-[10pt] font-black text-gray-300 uppercase tracking-widest">Gunting tepat sesuai garis tepi hitam kartu di atas.</p>
              </div>
            </div>
          </div>

          {/* SINGLE ACTION BUTTON: SIMPAN KARTU */}
          <div className="no-print px-4">
            <button 
              onClick={handleSaveCard} 
              className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-6 hover:bg-slate-800 transition-all uppercase text-sm tracking-[0.2em] active:scale-95 group"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" /> SIMPAN KARTU ANC PINTAR
            </button>
            <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Kartu akan disimpan sebagai asset digital (barcode) untuk akses rekam medis.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[4rem] shadow-sm border border-slate-100 text-center space-y-6 no-print">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
            <QrCode size={48} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Kartu Belum Tergenerasi</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Pilih pasien untuk menampilkan data kartu digital</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Modul Edukasi (Tetap sama)
export const EducationModule = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(EDUCATION_LIST.map(edu => edu.category)));
    return ['ALL', ...cats];
  }, []);

  const filteredEducation = useMemo(() => {
    return activeCategory === 'ALL' 
      ? EDUCATION_LIST 
      : EDUCATION_LIST.filter(edu => edu.category === activeCategory);
  }, [activeCategory]);

  const handleShare = async (edu: EducationContent) => {
    const shareData = {
      title: edu.title,
      text: `${edu.title}: ${edu.content}`,
      url: edu.url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(edu.url);
        alert('Tautan berhasil disalin ke papan klip!');
      }
    } catch (err) {
      console.error('Gagal membagikan konten:', err);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Topik Edukasi</h3>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Saring materi sesuai kebutuhan</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-xl translate-y-[-2px]' 
                  : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {cat === 'ALL' ? 'Semua Topik' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEducation.map(edu => (
          <div 
            key={edu.id} 
            className="bg-white rounded-[3rem] overflow-hidden shadow-sm group border border-gray-100 hover:shadow-2xl transition-all duration-500 animate-in zoom-in-95"
          >
            <div className="h-64 overflow-hidden relative">
              <img src={edu.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt={edu.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent opacity-60" />
            </div>
            <div className="p-10">
              <h4 className="text-2xl font-black text-gray-900 mb-4 leading-tight tracking-tighter">{edu.title}</h4>
              <p className="text-sm text-gray-500 mb-8 line-clamp-2 font-medium">{edu.content}</p>
              <div className="flex gap-3">
                <a 
                  href={edu.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-[2] text-center py-5 bg-gray-50 text-indigo-600 font-black text-[10px] rounded-2xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-[0.2em]"
                >
                  Buka Materi
                </a>
                <button 
                  onClick={() => handleShare(edu)}
                  className="flex-1 flex items-center justify-center gap-2 py-5 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-2xl hover:bg-indigo-100 transition-all uppercase tracking-[0.2em]"
                  title="Bagikan Materi"
                >
                  <Share2 size={16} /> Bagikan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modul Kontak (Tetap sama)
export const ContactModule = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-red-600 p-12 md:p-24 rounded-[4rem] md:rounded-[6rem] text-white shadow-2xl relative overflow-hidden text-center">
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-none relative z-10 uppercase">Gawat Darurat?</h2>
        <p className="text-red-100 font-bold max-w-xl mx-auto text-sm md:text-lg relative z-10 mb-10">Jika mengalami tanda bahaya, segera hubungi nomor di bawah ini atau menuju puskesmas terdekat.</p>
        <a href={`tel:${PUSKESMAS_INFO.phone}`} className="inline-flex items-center gap-4 px-8 md:px-12 py-4 md:py-6 bg-white text-red-600 rounded-full font-black text-lg md:text-xl shadow-2xl hover:scale-105 transition-all">
          <Phone size={28} /> {PUSKESMAS_INFO.phone}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {[
          { icon: <MapPin size={40}/>, title: "Lokasi Fisik", detail: PUSKESMAS_INFO.address },
          { icon: <Phone size={40}/>, title: "Layanan Konsultasi", detail: "Tersedia 08.00 - 16.00 WIB" },
          { icon: <Mail size={40}/>, title: "Email Dukungan", detail: PUSKESMAS_INFO.email }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-10 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-all">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center text-indigo-600 mb-8 shadow-inner">{card.icon}</div>
            <h4 className="font-black text-gray-900 text-xl mb-3 tracking-tighter">{card.title}</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modul Akses Ditolak
export const AccessDenied = () => (
  <div className="p-20 text-center animate-in zoom-in duration-500">
    <div className="bg-red-50 p-16 rounded-[4rem] border-4 border-dashed border-red-200">
      <UserX size={80} className="mx-auto text-red-400 mb-6" />
      <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Akses Sistem Dicabut</h2>
      <p className="text-red-500 font-bold mt-2">Silakan hubungi administrator puskesmas untuk verifikasi ulang identitas Anda.</p>
    </div>
  </div>
);
