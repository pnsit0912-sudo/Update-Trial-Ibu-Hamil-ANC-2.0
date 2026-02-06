
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HeartPulse, Printer, Download, MapPin, Phone, Mail, UserX, AlertCircle, ShieldCheck, Share2, Filter, LayoutGrid, MessageSquare, Send, CheckCircle, Fingerprint, CalendarDays, Building2, UserCircle2, QrCode, Baby, Sparkles, Scale, Info, Crosshair, Save, Clock, Play, Square, RefreshCcw, Loader2, MessageCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PUSKESMAS_INFO, EDUCATION_LIST } from './constants';
import { User, AppState, EducationContent, UserRole } from './types';
import { getRiskCategory } from './utils';

// Modul WhatsApp Blast
export const WhatsAppBlastModule = ({ state }: { state: AppState }) => {
  const [template, setTemplate] = useState('Halo Ibu {nama}, kami dari Puskesmas Pasar Minggu mengingatkan jadwal pemeriksaan ANC Anda pada tanggal {next_visit}. Mohon kehadirannya ya Bu. Salam sehat!');
  const [delay, setDelay] = useState(10); // Detik
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [isBlasting, setIsBlasting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [blastQueue, setBlastQueue] = useState<{user: User, status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED'}[]>([]);
  const timerRef = useRef<number | null>(null);

  const patients = useMemo(() => {
    return state.users.filter(u => {
      if (u.role !== UserRole.USER || u.isDelivered) return false;
      if (riskFilter === 'ALL') return true;
      const latest = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0];
      const risk = getRiskCategory(u.totalRiskScore, latest);
      return risk.label === riskFilter;
    });
  }, [state.users, state.ancVisits, riskFilter]);

  const prepareQueue = () => {
    setBlastQueue(patients.map(u => ({ user: u, status: 'PENDING' })));
    setCurrentIndex(-1);
    setIsBlasting(false);
  };

  useEffect(() => {
    prepareQueue();
  }, [patients]);

  const formatMessage = (user: User) => {
    const latest = state.ancVisits.filter(v => v.patientId === user.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate))[0];
    return template
      .replace(/{nama}/g, user.name)
      .replace(/{id}/g, user.id)
      .replace(/{next_visit}/g, latest?.nextVisitDate || '(Belum Terjadwal)');
  };

  const startBlast = () => {
    if (blastQueue.length === 0) return;
    setIsBlasting(true);
    setCurrentIndex(0);
  };

  const stopBlast = () => {
    setIsBlasting(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (isBlasting && currentIndex >= 0 && currentIndex < blastQueue.length) {
      const currentItem = blastQueue[currentIndex];
      
      if (currentItem.status === 'PENDING') {
        // Update status ke SENDING
        setBlastQueue(prev => prev.map((item, idx) => idx === currentIndex ? { ...item, status: 'SENDING' } : item));
        
        // Eksekusi pengiriman (via WhatsApp Web link)
        const phone = currentItem.user.phone.replace(/\D/g, '').replace(/^0/, '62');
        const message = encodeURIComponent(formatMessage(currentItem.user));
        const url = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
        
        window.open(url, '_blank');

        // Tandai sebagai SENT setelah sedikit delay simulasi
        setTimeout(() => {
          setBlastQueue(prev => prev.map((item, idx) => idx === currentIndex ? { ...item, status: 'SENT' } : item));
          
          // Lanjut ke pesan berikutnya setelah Delay yang ditentukan user
          if (currentIndex + 1 < blastQueue.length) {
            timerRef.current = window.setTimeout(() => {
              setCurrentIndex(prev => prev + 1);
            }, delay * 1000);
          } else {
            setIsBlasting(false);
            alert('WhatsApp Blast Selesai!');
          }
        }, 1000);
      }
    }
  }, [isBlasting, currentIndex]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Filter */}
      <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100 rotate-3">
            <Send size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">WhatsApp Blast Manager</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Kirim Pengingat Masal Tanpa Biaya</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Filter Risiko Pasien</label>
            <div className="relative">
              <select 
                value={riskFilter} 
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
              >
                <option value="ALL">Semua Risiko</option>
                <option value="HITAM">Kritis (Hitam)</option>
                <option value="MERAH">Tinggi (Merah)</option>
                <option value="KUNING">Sedang (Kuning)</option>
                <option value="HIJAU">Rendah (Hijau)</option>
              </select>
              <Filter size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">Delay Per Pesan (Detik)</label>
            <div className="relative">
              <input 
                type="number" 
                value={delay} 
                onChange={(e) => setDelay(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-xs outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
              />
              <Clock size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Pesan & Controls */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <MessageSquare className="text-emerald-600" size={24} /> Template Pesan
            </h3>
            <textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full p-6 bg-slate-50 border-none rounded-[2rem] font-bold text-sm outline-none focus:ring-8 focus:ring-emerald-50 transition-all min-h-[200px]"
              placeholder="Gunakan {nama}, {id}, {next_visit} untuk variabel otomatis..."
            />
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Variabel Tersedia:</p>
              <div className="flex flex-wrap gap-2">
                {['{nama}', '{id}', '{next_visit}'].map(v => <span key={v} className="px-2 py-1 bg-white text-[10px] font-bold rounded-lg border border-emerald-200">{v}</span>)}
              </div>
            </div>
            
            <div className="pt-6 space-y-4">
               {!isBlasting ? (
                 <button 
                   onClick={startBlast}
                   disabled={blastQueue.length === 0}
                   className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   <Play size={18} /> Mulai WhatsApp Blast
                 </button>
               ) : (
                 <button 
                   onClick={stopBlast}
                   className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                 >
                   <Square size={18} /> Hentikan Antrian
                 </button>
               )}
               <button onClick={prepareQueue} className="w-full py-4 bg-slate-50 text-slate-400 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:text-emerald-600 transition-all">
                 Reset Antrian
               </button>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                   <Loader2 className={`text-emerald-600 ${isBlasting ? 'animate-spin' : ''}`} size={24} /> Antrian Pengiriman ({blastQueue.length})
                 </h3>
                 {isBlasting && (
                   <div className="px-5 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase animate-pulse">
                     Sisa Waktu Tunggu: {currentIndex < blastQueue.length - 1 ? delay : 0}s
                   </div>
                 )}
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {blastQueue.length === 0 ? (
                  <div className="py-24 text-center opacity-30">
                    <MessageCircle size={64} className="mx-auto mb-4" />
                    <p className="text-xl font-black uppercase tracking-widest">Tidak Ada Pasien Terpilih</p>
                  </div>
                ) : (
                  blastQueue.map((item, idx) => (
                    <div 
                      key={item.user.id} 
                      className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between gap-6 ${
                        idx === currentIndex ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]' : 
                        item.status === 'SENT' ? 'border-slate-50 bg-slate-50 opacity-60' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-5 min-w-0">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${item.status === 'SENT' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-sm'}`}>
                           {item.status === 'SENT' ? <CheckCircle size={20}/> : item.user.name.charAt(0)}
                         </div>
                         <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 uppercase truncate">{item.user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{item.user.phone}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          item.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' :
                          item.status === 'SENDING' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {item.status}
                        </div>
                        {idx === currentIndex && isBlasting && <Loader2 size={16} className="text-emerald-600 animate-spin" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Modul Kartu ANC Pintar
export const SmartCardModule = ({ state, setState, isUser, user }: { state: AppState, setState: any, isUser: boolean, user: User }) => {
  const patientToDisplay = isUser ? user : state.users.find(u => u.id === state.selectedPatientId);
  
  // ==========================================
  // COLOR CONTROL CENTER (EDIT DI SINI)
  // ==========================================
  const CARD_COLORS = {
    paper: "#FFFFFF",    // Warna Kertas (Background Kartu)
    text: "#000000",     // Warna Teks Utama & Border
    barcode: "#000000",  // Warna QR Code (Foreground)
    barcodeBg: "#FFFFFF",// Warna Background QR Code
    accent: "#000000"    // Warna Ikon / Aksen
  };

  const getQrValue = (pid: string) => {
    return `${window.location.origin}${window.location.pathname}?pid=${pid}`;
  };

  const handleSaveCard = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      {/* SELEKTOR PASIEN */}
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

          {/* TEMPLATE CETAK (DIPISAHKAN WARNA ELEMENNYA) */}
          <div className="print-only">
            <div className="flex flex-col items-center w-full bg-white">
              
              <div className="w-full text-center mb-10 border-b-2 border-white pb-4">
                 <h2 className="text-xl font-black uppercase" style={{ color: CARD_COLORS.text }}>Dokumen Kartu Kesehatan Digital</h2>
                 <p className="text-xs font-bold uppercase" style={{ color: CARD_COLORS.text }}>{PUSKESMAS_INFO.name}</p>
              </div>

              {/* SISI DEPAN KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] rounded-[15pt] p-6 relative overflow-hidden mb-12"
                   style={{ 
                     backgroundColor: CARD_COLORS.paper, 
                     border: `2.5pt solid ${CARD_COLORS.text}` 
                   }}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} style={{ color: CARD_COLORS.accent }} />
                      <h2 className="text-[12pt] font-black uppercase tracking-tighter" style={{ color: CARD_COLORS.text }}>KARTU ANC PINTAR</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[7pt] font-black uppercase leading-none" style={{ color: CARD_COLORS.text }}>PASAR MINGGU</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-6 items-center">
                    {/* QR Code Area - Terpisah Warnanya */}
                    <div className="p-1 border-[1.5pt] rounded-lg" style={{ borderColor: CARD_COLORS.text, backgroundColor: CARD_COLORS.barcodeBg }}>
                       <QRCode 
                        value={getQrValue(patientToDisplay.id)} 
                        size={80} 
                        fgColor={CARD_COLORS.barcode} 
                        bgColor={CARD_COLORS.barcodeBg} 
                       />
                    </div>
                    {/* Info Area */}
                    <div className="flex-1 space-y-3">
                       <div>
                          <p className="text-[6pt] font-black uppercase opacity-60" style={{ color: CARD_COLORS.text }}>Nama Pasien</p>
                          <p className="text-[11pt] font-black uppercase truncate leading-none" style={{ color: CARD_COLORS.text }}>{patientToDisplay.name}</p>
                       </div>
                       <div>
                          <p className="text-[6pt] font-black uppercase opacity-60" style={{ color: CARD_COLORS.text }}>ID Sistem</p>
                          <p className="text-[10pt] font-black leading-none" style={{ color: CARD_COLORS.text }}>{patientToDisplay.id}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-4 left-6 right-6 pt-2 flex justify-between items-center" 
                      style={{ borderTop: `1pt solid ${CARD_COLORS.text}` }}>
                    <p className="text-[6pt] font-black uppercase" style={{ color: CARD_COLORS.text }}>Terenkripsi Digital</p>
                    <p className="text-[6pt] font-black opacity-40 uppercase tracking-widest" style={{ color: CARD_COLORS.text }}>Smart ANC v4.0</p>
                 </div>
              </div>

              {/* SISI BELAKANG KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] rounded-[15pt] p-6 relative overflow-hidden"
                   style={{ 
                     backgroundColor: CARD_COLORS.paper, 
                     border: `2.5pt solid ${CARD_COLORS.text}` 
                   }}>
                 <div className="mb-4 pb-2" style={{ borderBottom: `1pt solid ${CARD_COLORS.text}` }}>
                    <h3 className="text-[10pt] font-black uppercase tracking-[0.1em]" style={{ color: CARD_COLORS.text }}>INSTRUKSI LAYANAN</h3>
                 </div>

                 <div className="space-y-4 flex-1">
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• BAWA KARTU INI SAAT KONTROL KE PUSKESMAS.</p>
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• SCAN QR CODE UNTUK MELIHAT REKAM MEDIS.</p>
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• HUBUNGI BIDAN JIKA ADA TANDA BAHAYA.</p>
                 </div>

                 <div className="absolute bottom-4 left-0 right-0 text-center px-6">
                    <div className="pt-2" style={{ borderTop: `1pt solid ${CARD_COLORS.text}` }}>
                       <p className="text-[8pt] font-black uppercase" style={{ color: CARD_COLORS.text }}>{PUSKESMAS_INFO.phone}</p>
                       <p className="text-[5pt] font-bold opacity-40 uppercase tracking-widest" style={{ color: CARD_COLORS.text }}>Emergency Hot-Line</p>
                    </div>
                 </div>
              </div>

              <div className="mt-16 text-center opacity-30">
                 <p className="text-[12pt] font-black uppercase tracking-[0.3em]" style={{ color: CARD_COLORS.text }}>Gunting Tepat Pada Garis Tepi Hitam</p>
              </div>
            </div>
          </div>

          <div className="no-print px-4">
            <button 
              onClick={handleSaveCard} 
              className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-6 hover:bg-black transition-all uppercase text-sm tracking-[0.2em] active:scale-95 group"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" /> SIMPAN KARTU (CETAK/PDF)
            </button>
            <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Pastikan Anda menggunakan kertas putih bersih untuk hasil terbaik. <br/> 
              Warna teks, barcode, dan kertas telah dipisahkan untuk ketajaman dokumen.
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
