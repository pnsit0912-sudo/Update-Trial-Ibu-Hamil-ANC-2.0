
import React, { useState, useMemo } from 'react';
import { HeartPulse, Printer, Download, MapPin, Phone, Mail, UserX, AlertCircle, ShieldCheck, Share2, Filter, LayoutGrid, MessageSquare, Send, CheckCircle, Fingerprint, CalendarDays, Building2, UserCircle2, QrCode, Baby, Sparkles, Scale, Info, Crosshair } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PUSKESMAS_INFO, EDUCATION_LIST } from './constants';
import { User, AppState, EducationContent } from './types';

// Modul Kartu ANC Pintar
export const SmartCardModule = ({ state, setState, isUser, user }: { state: AppState, setState: any, isUser: boolean, user: User }) => {
  const patientToDisplay = isUser ? user : state.users.find(u => u.id === state.selectedPatientId);
  
  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      {/* Selector untuk Nakes/Admin */}
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
          {/* Main Digital Card Preview - ONLY FOR SCREEN */}
          <div className="no-print bg-white p-10 md:p-14 rounded-[4rem] shadow-[0_48px_96px_-12px_rgba(79,70,229,0.12)] relative overflow-hidden border border-slate-100">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mb-20" />
            
            {/* Card Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl shadow-indigo-100 rotate-3">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">KARTU ANC PINTAR</h1>
                  <p className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mt-2">Sistem Monitoring Terintegrasi</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verifikasi Digital</p>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <Fingerprint size={16} className="text-indigo-600" />
                  <span className="text-[11px] font-black text-slate-900">AUTHENTICATED</span>
                </div>
              </div>
            </div>

            {/* Card Body Split */}
            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="bg-white p-6 border-[6px] border-slate-900 rounded-[3rem] shadow-2xl relative transition-transform hover:scale-105 duration-500">
                  <QRCode value={`ANC-${patientToDisplay.id}`} size={160} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <HeartPulse size={40} className="text-indigo-600" />
                  </div>
                </div>
                <div className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg">
                  ID: {patientToDisplay.id}
                </div>
              </div>

              {/* Information Section */}
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserCircle2 size={12} className="text-indigo-600" /> Nama Lengkap Pasien
                    </p>
                    <p className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
                      {patientToDisplay.name}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {patientToDisplay.isDelivered ? (
                      <>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle size={12} className="text-emerald-500" /> Status Pasien
                        </p>
                        <p className="text-xl font-black text-emerald-600 uppercase tracking-tighter">
                          Pasca Salin (Nifas)
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <CalendarDays size={12} className="text-indigo-600" /> Usia Kandungan
                        </p>
                        <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                          G{patientToDisplay.pregnancyNumber} | {patientToDisplay.pregnancyMonth} Bulan
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Baby Info Section (Conditional) */}
                {patientToDisplay.isDelivered && patientToDisplay.deliveryData && (
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
                      <div className="bg-white p-2.5 rounded-xl text-emerald-600 shadow-sm border border-emerald-50">
                        <Baby size={18} />
                      </div>
                      <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em]">Ringkasan Data Buah Hati</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Nama Bayi</p>
                        <p className="text-sm font-black text-slate-900 uppercase leading-tight truncate">
                          {patientToDisplay.deliveryData.babyName || 'Belum Dinamai'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Tanggal Lahir</p>
                        <p className="text-sm font-black text-slate-900 uppercase">
                          {new Date(patientToDisplay.deliveryData.deliveryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                          <Scale size={10}/> Berat Lahir
                        </p>
                        <p className="text-sm font-black text-slate-900 uppercase">
                          {patientToDisplay.deliveryData.babyWeight} <span className="text-[9px] opacity-40">Gram</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Kondisi Bayi</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-[10px] font-black text-emerald-700 uppercase">
                            {patientToDisplay.deliveryData.babyStatus.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-indigo-100/50">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faskes Pendaftar</span>
                    </div>
                    <span className="font-black text-indigo-900 uppercase text-xs tracking-tight">{PUSKESMAS_INFO.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak Darurat</span>
                    </div>
                    <span className="font-black text-indigo-900 text-xs">{patientToDisplay.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Footer Card */}
            <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validitas Kartu</p>
                  <p className="text-xs font-black text-emerald-600 uppercase">AKTIF & TERVALIDASI</p>
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">
                *Tunjukkan kartu ini setiap melakukan kunjungan di Puskesmas
              </p>
            </div>
          </div>

          {/* PHYSICAL CARD PRINT TEMPLATE - IMPROVED ALIGNMENT & CONTRAST */}
          <div className="print-only w-full bg-white text-slate-900">
            <div className="flex flex-col items-center gap-12">
              {/* FRONT SIDE */}
              <div className="w-[85.6mm] h-[54mm] bg-white border-2 border-indigo-600 rounded-[1.5rem] relative overflow-hidden flex flex-col p-6 shadow-none">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10" />
                 <div className="flex justify-between items-start relative z-10 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                        <ShieldCheck size={14} />
                      </div>
                      <h2 className="text-[11px] font-black uppercase tracking-tighter text-indigo-900">KARTU ANC PINTAR</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Puskesmas</p>
                      <p className="text-[7px] font-black text-indigo-600 uppercase leading-none">Pasar Minggu</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-4 items-center flex-1 relative z-10">
                    <div className="bg-white p-2 border-2 border-slate-900 rounded-2xl shrink-0">
                       <QRCode value={`ANC-${patientToDisplay.id}`} size={70} />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                       <div className="space-y-0.5">
                          <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Nama Pasien</p>
                          <p className="text-[13px] font-black text-slate-900 uppercase truncate leading-none">{patientToDisplay.name}</p>
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">NIK / ID Pasien</p>
                          <p className="text-[10px] font-black text-indigo-600 uppercase leading-none">{patientToDisplay.id}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
                          <div>
                            <p className="text-[5px] font-black text-slate-400 uppercase">HPHT</p>
                            <p className="text-[8px] font-black text-slate-900">{patientToDisplay.hpht || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[5px] font-black text-slate-400 uppercase">Gravida</p>
                            <p className="text-[8px] font-black text-slate-900">G{patientToDisplay.pregnancyNumber} P{patientToDisplay.parityP}</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-2 pt-2 border-t-2 border-indigo-600 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={8} className="text-emerald-500" />
                      <span className="text-[7px] font-black text-emerald-600 uppercase">Valid & Terverifikasi</span>
                    </div>
                    <p className="text-[6px] font-black text-slate-300 uppercase">Digital ID Security</p>
                 </div>
              </div>

              {/* BACK SIDE - LIGHTENED FOR BETTER PRINTING */}
              <div className="w-[85.6mm] h-[54mm] bg-indigo-50 border-2 border-indigo-200 rounded-[1.5rem] relative overflow-hidden flex flex-col p-6 shadow-none">
                 <div className="absolute inset-0 bg-white/40 pointer-events-none" />
                 
                 <div className="mb-4 pb-3 border-b border-indigo-200 flex items-center justify-between relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Instruksi Layanan</h3>
                    <Phone size={14} className="text-indigo-300" />
                 </div>

                 <div className="space-y-3 flex-1 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                      <p className="text-[8px] font-bold text-slate-700 leading-tight uppercase">Bawa kartu ini setiap melakukan pemeriksaan kehamilan (ANC) di Puskesmas atau RS.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                      <p className="text-[8px] font-bold text-slate-700 leading-tight uppercase">Hubungi kontak darurat di nomor <b>{PUSKESMAS_INFO.phone}</b> jika terjadi tanda bahaya kehamilan.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                      <p className="text-[8px] font-bold text-slate-700 leading-tight uppercase">Pantau status kehamilan secara mandiri melalui Aplikasi Smart ANC.</p>
                    </div>
                 </div>

                 <div className="mt-4 pt-3 border-t border-indigo-200 text-center relative z-10">
                    <p className="text-[8px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-1">{PUSKESMAS_INFO.name}</p>
                    <p className="text-[6px] font-bold text-indigo-400 uppercase italic">Digital Health Persistence v4.3</p>
                 </div>
              </div>
              
              <div className="text-center opacity-40 border-t border-dashed border-slate-200 pt-6 w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panduan: Gunting sesuai garis tepi kartu fisik.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 no-print px-4">
            <button 
              onClick={() => window.print()} 
              className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"
            >
              <Printer size={20} /> Cetak Kartu Fisik
            </button>
            <button className="flex-1 py-6 bg-white text-indigo-600 border-4 border-indigo-50 rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-indigo-50 transition-all uppercase text-xs tracking-widest">
              <Download size={20} /> Simpan Digital (PDF)
            </button>
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

// Modul Edukasi
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
      {/* Filter Bar */}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEducation.map(edu => (
          <div 
            key={edu.id} 
            className="bg-white rounded-[3rem] overflow-hidden shadow-sm group border border-gray-100 hover:shadow-2xl transition-all duration-500 animate-in zoom-in-95"
          >
            <div className="h-64 overflow-hidden relative">
              <img src={edu.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt={edu.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent opacity-60" />
              <div className="absolute bottom-6 left-6 flex gap-2">
                <span className="px-4 py-1.5 bg-white text-indigo-900 text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">
                  {edu.category}
                </span>
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xl text-white text-[9px] font-black rounded-full uppercase tracking-widest border border-white/30">
                  {edu.type}
                </span>
              </div>
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
        {filteredEducation.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <LayoutGrid size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Belum ada materi untuk kategori ini</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modul Kontak
export const ContactModule = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulasi pengiriman data
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      // Reset state setelah beberapa detik agar form muncul kembali jika dibutuhkan
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
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
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

      {/* Formulir Feedback Baru */}
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Masukan & Saran</h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Bantu kami meningkatkan layanan Smart ANC</p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="py-20 text-center animate-in zoom-in duration-500">
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <CheckCircle size={48} />
            </div>
            <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Terima Kasih!</h4>
            <p className="text-gray-500 font-bold mt-2">Masukan Anda telah kami terima dan akan segera ditindaklanjuti.</p>
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Nama Lengkap</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Masukkan nama Anda" 
                  className="w-full px-8 py-5 bg-gray-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                  required 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Kontrol (Email / WA)</label>
                <input 
                  type="text" 
                  name="contact" 
                  placeholder="Email atau No. WhatsApp" 
                  className="w-full px-8 py-5 bg-gray-50 border-none rounded-[2rem] font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Kategori Masukan</label>
              <select 
                name="category" 
                className="w-full px-8 py-5 bg-gray-50 border-none rounded-[2rem] font-black text-xs outline-none focus:ring-4 focus:ring-indigo-100" 
                required
              >
                <option value="SUGGESTION">SARAN PERBAIKAN FITUR</option>
                <option value="BUG">LAPORAN BUG / KENDALA SISTEM</option>
                <option value="QUESTION">PERTANYAAN UMUM</option>
                <option value="OTHER">LAINNYA</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Pesan Masukan</label>
              <textarea 
                name="message" 
                rows={5} 
                placeholder="Tuliskan masukan atau laporan Anda di sini..." 
                className="w-full px-8 py-6 bg-gray-50 border-none rounded-[2.5rem] font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                isSubmitting 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : <><Send size={18} /> Kirim Masukan Sekarang</>}
            </button>
          </form>
        )}
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
