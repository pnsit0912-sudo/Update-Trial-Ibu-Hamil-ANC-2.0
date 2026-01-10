
import React, { useState, useMemo } from 'react';
import { HeartPulse, Printer, Download, MapPin, Phone, Mail, UserX, AlertCircle, ShieldCheck, Share2, Filter, LayoutGrid, MessageSquare, Send, CheckCircle, Fingerprint, CalendarDays, Building2, UserCircle2, QrCode, Baby, Sparkles, Scale, Info, Crosshair, Save } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PUSKESMAS_INFO, EDUCATION_LIST } from './constants';
import { User, AppState, EducationContent } from './types';

// Modul Kartu ANC Pintar
export const SmartCardModule = ({ state, setState, isUser, user }: { state: AppState, setState: any, isUser: boolean, user: User }) => {
  const patientToDisplay = isUser ? user : state.users.find(u => u.id === state.selectedPatientId);
  
  const getQrValue = (pid: string) => {
    return `${window.location.origin}${window.location.pathname}?pid=${pid}`;
  };

  const handleSaveCard = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      {/* SELEKTOR PASIEN (Hanya muncul di layar) */}
      {!isUser && (
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
           <div className="flex items-center gap-4 mb-6">
             <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <UserCircle2 size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Pilih Pasien</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pilih data untuk dicetak</p>
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
          {/* PREVIEW LAYAR (No-Print) */}
          <div className="no-print bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl rotate-3">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">KARTU ANC PINTAR</h1>
                  <p className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mt-2">Versi Digital Aktif</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-white p-6 border-[6px] border-slate-900 rounded-[3rem] shadow-xl">
                  <QRCode value={getQrValue(patientToDisplay.id)} size={150} />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identitas Pasien</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">{patientToDisplay.name}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1">ID: {patientToDisplay.id}</p>
                </div>
                <div className="pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                   <p className="text-lg font-black text-slate-700 uppercase">
                      {patientToDisplay.isDelivered ? 'Pasca Salin (Nifas)' : 'Sedang Hamil (ANC)'}
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEMPLATE CETAK (Shadow Dihilangkan via Class & CSS Print) */}
          <div className="print-only">
            <div className="flex flex-col items-center w-full">
              
              <div className="w-full text-center mb-10 border-b-2 border-black pb-4">
                 <h2 className="text-xl font-black uppercase">Dokumen Kartu Kesehatan Digital</h2>
                 <p className="text-xs font-bold uppercase">{PUSKESMAS_INFO.name}</p>
              </div>

              {/* SISI DEPAN KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] bg-white border-[2.5pt] border-black rounded-[15pt] p-6 relative overflow-hidden mb-12 shadow-none">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-black" />
                      <h2 className="text-[12pt] font-black uppercase tracking-tighter">KARTU ANC PINTAR</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[7pt] font-black text-black uppercase leading-none">PASAR MINGGU</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-6 items-center">
                    <div className="bg-white p-1 border-[1.5pt] border-black rounded-lg">
                       <QRCode value={getQrValue(patientToDisplay.id)} size={75} fgColor="#000000" />
                    </div>
                    <div className="flex-1 space-y-3">
                       <div>
                          <p className="text-[6pt] font-black text-gray-500 uppercase">Nama Pasien</p>
                          <p className="text-[11pt] font-black text-black uppercase truncate leading-none">{patientToDisplay.name}</p>
                       </div>
                       <div>
                          <p className="text-[6pt] font-black text-gray-500 uppercase">ID Sistem</p>
                          <p className="text-[10pt] font-black text-black leading-none">{patientToDisplay.id}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-4 left-6 right-6 pt-2 border-t-[1pt] border-black flex justify-between items-center">
                    <p className="text-[6pt] font-black uppercase">Terenkripsi Digital</p>
                    <p className="text-[6pt] font-black text-gray-400 uppercase tracking-widest">Smart ANC v4.0</p>
                 </div>
              </div>

              {/* SISI BELAKANG KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] bg-white border-[2.5pt] border-black rounded-[15pt] p-6 relative overflow-hidden shadow-none">
                 <div className="mb-4 pb-2 border-b border-gray-300">
                    <h3 className="text-[10pt] font-black uppercase tracking-[0.1em]">INSTRUKSI LAYANAN</h3>
                 </div>

                 <div className="space-y-4 flex-1">
                    <p className="text-[8pt] font-bold text-black uppercase leading-tight">• BAWA KARTU INI SAAT KONTROL KE PUSKESMAS.</p>
                    <p className="text-[8pt] font-bold text-black uppercase leading-tight">• SCAN QR CODE UNTUK MELIHAT REKAM MEDIS.</p>
                    <p className="text-[8pt] font-bold text-black uppercase leading-tight">• HUBUNGI BIDAN JIKA ADA TANDA BAHAYA.</p>
                 </div>

                 <div className="absolute bottom-4 left-0 right-0 text-center px-6">
                    <div className="pt-2 border-t border-gray-200">
                       <p className="text-[8pt] font-black uppercase">{PUSKESMAS_INFO.phone}</p>
                       <p className="text-[5pt] font-bold text-gray-400 uppercase">Emergency Hot-Line</p>
                    </div>
                 </div>
              </div>

              <div className="mt-16 text-center text-gray-300">
                 <p className="text-[12pt] font-black uppercase tracking-[0.3em]">Gunting Tepat Pada Garis Tepi</p>
              </div>
            </div>
          </div>

          <div className="no-print px-4">
            <button 
              onClick={handleSaveCard} 
              className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-6 hover:bg-indigo-600 transition-all uppercase text-sm tracking-[0.2em] active:scale-95 group"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" /> SIMPAN KARTU (PDF/CETAK)
            </button>
            <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Klik tombol di atas, lalu pada pilihan printer pilih <span className="text-indigo-600">"Save as PDF"</span> <br/> 
              untuk menyimpan kartu ke dalam galeri handphone atau laptop Anda.
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Pilih pasien untuk menampilkan kartu digital</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ... (EducationModule, ContactModule, AccessDenied tetap sama)
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

export const ContactModule = () => {
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

export const AccessDenied = () => (
  <div className="p-20 text-center animate-in zoom-in duration-500">
    <div className="bg-red-50 p-16 rounded-[4rem] border-4 border-dashed border-red-200">
      <UserX size={80} className="mx-auto text-red-400 mb-6" />
      <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Akses Sistem Dicabut</h2>
      <p className="text-red-500 font-bold mt-2">Silakan hubungi administrator puskesmas untuk verifikasi ulang identitas Anda.</p>
    </div>
  </div>
);
