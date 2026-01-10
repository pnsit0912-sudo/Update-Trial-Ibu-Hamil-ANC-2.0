
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserRole, User, AppState, ANCVisit, SystemLog, SystemAlert, DeliveryData } from './types';
import { MOCK_USERS, PUSKESMAS_INFO, WILAYAH_DATA, NAVIGATION, MOCK_ANC_VISITS } from './constants';
import { RISK_FACTORS_MASTER, calculatePregnancyProgress, getRiskCategory, getBabySizeByWeek } from './utils';
import { 
  CheckCircle, AlertCircle, Users, Calendar, AlertTriangle,
  UserPlus, Edit3, X, Clock, Baby, Trash2, ShieldCheck, LayoutDashboard, Activity, 
  MapPin, ShieldAlert, QrCode, BookOpen, Map as MapIcon, Phone, Navigation as NavIcon, Crosshair,
  RefreshCw, Stethoscope, Heart, Droplets, Thermometer, ClipboardCheck, ArrowRight, ExternalLink,
  Info, Bell, Eye, Star, TrendingUp, CheckSquare, Zap, Shield, List, Sparkles, BrainCircuit, Waves, Utensils, Download, Upload, Database, UserX, Save, PartyPopper, RefreshCcw, Scale, Ruler
} from 'lucide-react';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatientList } from './PatientList';
import { LoginScreen } from './LoginScreen';
import { AccessManagement } from './AccessManagement';
import { RiskMonitoring } from './RiskMonitoring';
import { SmartCardModule, EducationModule, ContactModule } from './FeatureModules';
import { MapView } from './MapView';
import { PatientProfileView } from './PatientProfileView';

const STORAGE_KEY = 'SMART_ANC_V4_MASTER';
const DATABASE_VERSION = '4.3.1';

const DAILY_TASKS = [
  { task: 'Minum Tablet Tambah Darah', time: 'Malam Hari', icon: <Droplets size={16} /> },
  { task: 'Hitung 10 Gerakan Janin', time: 'Setiap Hari', icon: <Activity size={16} /> },
  { task: 'Konsumsi Protein Tinggi', time: 'Sarapan/Maksi', icon: <Utensils size={16} /> }
];

const getTrimesterAdvice = (weeks: number) => {
  if (weeks <= 13) return "Trimester 1: Fokus pada asupan Asam Folat untuk perkembangan saraf janin. Istirahat cukup jika sering mual (morning sickness).";
  if (weeks <= 26) return "Trimester 2: Mulai hitung gerakan janin. Konsumsi kalsium tinggi untuk pembentukan tulang bayi dan cegah anemia dengan zat besi.";
  return "Trimester 3: Waspadai tanda persalinan dan Pre-eklampsia (pusing hebat/kaki bengkak). Siapkan tas persalinan dan perlengkapan bayi.";
};

export default function App() {
  const [editingPatient, setEditingPatient] = useState<User | null>(null);
  const [isAddingVisit, setIsAddingVisit] = useState<User | null>(null);
  const [recordingDelivery, setRecordingDelivery] = useState<User | null>(null);
  const [startingNewPregnancy, setStartingNewPregnancy] = useState<User | null>(null);
  const [editingVisit, setEditingVisit] = useState<{patient: User, visit: ANCVisit} | null>(null);
  const [viewingPatientProfile, setViewingPatientProfile] = useState<string | null>(null);
  const [tempRiskFactors, setTempRiskFactors] = useState<string[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formCoords, setFormCoords] = useState<{lat: string, lng: string}>({lat: '', lng: ''});
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [visitPreviewData, setVisitPreviewData] = useState<Partial<ANCVisit>>({
    bloodPressure: '120/80',
    dangerSigns: [],
    fetalMovement: 'Normal',
    djj: 140
  });

  // 1. Inisialisasi State Global dari LocalStorage
  const [state, setState] = useState<AppState>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        if (parsed.users && Array.isArray(parsed.users)) {
           if (!parsed.userChecklists) parsed.userChecklists = {};
           if (!parsed.ancVisits || parsed.ancVisits.length === 0) parsed.ancVisits = MOCK_ANC_VISITS;
           return parsed; 
        }
      } catch (e) { console.error("Database Error:", e); }
    }
    return {
      currentUser: null,
      currentView: 'dashboard',
      users: MOCK_USERS,
      ancVisits: MOCK_ANC_VISITS,
      alerts: [],
      selectedPatientId: null,
      logs: [{ id: 'l1', timestamp: new Date().toISOString(), userId: 'system', userName: 'System', action: 'INIT', module: 'CORE', details: 'Database Smart ANC Berhasil Dimuat' }],
      userChecklists: {}
    };
  });

  // 2. Inisialisasi User & View dari hasil pembacaan State (Penting: Menghindari Reset saat Refresh)
  const [currentUser, setCurrentUser] = useState<User | null>(state.currentUser);
  const [view, setView] = useState(state.currentView || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [patientSearch, setPatientSearch] = useState('');

  // 3. Sinkronisasi Otomatis ke LocalStorage saat ada perubahan User atau Halaman
  useEffect(() => {
    setIsSyncing(true);
    // Masukkan currentUser dan view ke dalam objek yang disimpan
    const dataToSave = { ...state, currentUser, currentView: view };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    const timer = setTimeout(() => setIsSyncing(false), 500);
    return () => clearTimeout(timer);
  }, [state, currentUser, view]);

  const addLog = useCallback((action: string, module: string, details: string) => {
    if (!currentUser) return;
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      module,
      details
    };
    setState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 100)
    }));
  }, [currentUser]);

  const showNotification = useCallback((message: string) => {
    setNotification({ message, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleDeliverySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!recordingDelivery || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const weight = parseInt(formData.get('babyWeight') as string);
    const height = parseInt(formData.get('babyHeight') as string);
    
    let classification: 'NORMAL' | 'BBLR' | 'BBLSR' = 'NORMAL';
    if (weight < 1500) classification = 'BBLSR';
    else if (weight < 2500) classification = 'BBLR';

    const deliveryData: DeliveryData = {
      id: `birth-${Date.now()}`,
      deliveryDate: formData.get('deliveryDate') as string,
      babyName: formData.get('babyName') as string || 'Bayi Ny. ' + recordingDelivery.name,
      babyGender: formData.get('babyGender') as 'L' | 'P',
      babyWeight: weight,
      babyHeight: height,
      motherStatus: formData.get('motherStatus') as any,
      babyStatus: formData.get('babyStatus') as any,
      classification,
      condition: formData.get('condition') as string,
    };

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === recordingDelivery.id ? { 
        ...u, 
        isDelivered: true, 
        deliveryData,
        pregnancyHistory: [...(u.pregnancyHistory || []), deliveryData]
      } : u)
    }));

    addLog('RECORD_DELIVERY', 'PATIENT', `Mencatat kelahiran bayi Ny. ${recordingDelivery.name}. Berat: ${weight}g, Tinggi: ${height}cm, Kelamin: ${deliveryData.babyGender}`);
    setRecordingDelivery(null);
    showNotification(`Data kelahiran berhasil dicatat. Klasifikasi Bayi: ${classification}`);
  };

  const handleDeleteDelivery = useCallback((patientId: string, deliveryId: string) => {
    if (!window.confirm('Hapus permanen riwayat kelahiran ini?')) return;
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === patientId ? {
        ...u,
        pregnancyHistory: (u.pregnancyHistory || []).filter(h => h.id !== deliveryId)
      } : u)
    }));
    addLog('DELETE_DELIVERY', 'PATIENT', `Menghapus riwayat kelahiran ID: ${deliveryId}`);
    showNotification('Riwayat kelahiran berhasil dihapus');
  }, [addLog, showNotification]);

  const handleNewPregnancySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startingNewPregnancy || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const newHpht = formData.get('newHpht') as string;
    const progress = calculatePregnancyProgress(newHpht);

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id === startingNewPregnancy.id) {
          const history = u.pregnancyHistory || [];
          if (u.deliveryData && !history.some(h => h.id === u.deliveryData?.id)) {
            history.push(u.deliveryData);
          }
          
          return {
            ...u,
            hpht: newHpht,
            isDelivered: false,
            deliveryData: undefined,
            pregnancyHistory: history,
            pregnancyNumber: u.pregnancyNumber + 1,
            parityP: u.parityP + 1,
            pregnancyMonth: progress?.months || 0,
          };
        }
        return u;
      })
    }));

    addLog('NEW_PREGNANCY', 'PATIENT', `Memulai siklus ANC baru untuk Ny. ${startingNewPregnancy.name}. HPHT: ${newHpht}`);
    setStartingNewPregnancy(null);
    showNotification(`Siklus ANC baru dimulai. Pasien kembali masuk pemantauan aktif.`);
  };

  const toggleDailyTask = useCallback((userId: string, task: string) => {
    setState(prev => ({
      ...prev,
      userChecklists: {
        ...prev.userChecklists,
        [userId]: {
          ...(prev.userChecklists[userId] || {}),
          [task]: !(prev.userChecklists[userId]?.[task])
        }
      }
    }));
  }, []);

  const handleDeleteVisit = useCallback((visitId: string) => {
    if (!window.confirm('Hapus permanen riwayat pemeriksaan ini?')) return;
    setState(prev => ({
      ...prev,
      ancVisits: prev.ancVisits.filter(v => v.id !== visitId)
    }));
    addLog('DELETE_VISIT', 'ANC', `Menghapus riwayat pemeriksaan ID: ${visitId}`);
    showNotification('Riwayat pemeriksaan berhasil dihapus');
  }, [addLog, showNotification]);

  const handleExportSystemData = useCallback(() => {
    const dataStr = JSON.stringify({ ...state, currentUser, currentView: view }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `SMART_ANC_DB_EXPORT_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Database berhasil diekspor');
  }, [state, currentUser, view, showNotification]);

  const handleImportSystemData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.users && Array.isArray(json.users)) {
          setState(json);
          if (json.currentUser) setCurrentUser(json.currentUser);
          if (json.currentView) setView(json.currentView);
          showNotification('Database berhasil diimpor');
          addLog('IMPORT_DATABASE', 'SYSTEM', 'Admin melakukan restorasi/impor database');
        } else {
          alert('Format file tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  }, [addLog, showNotification]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
        setIsGettingLocation(false);
        showNotification('Lokasi berhasil didapatkan');
      },
      (error) => {
        setIsGettingLocation(false);
        alert(`Gagal mendapatkan lokasi: ${error.message}`);
      }
    );
  }, [showNotification]);

  const handleNavigate = (targetView: string) => {
    setEditingPatient(null);
    setIsAddingVisit(null);
    setEditingVisit(null);
    setViewingPatientProfile(null);
    setRecordingDelivery(null);
    setStartingNewPregnancy(null);
    setTempRiskFactors([]);
    setView(targetView);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role === UserRole.USER) return;
    const formData = new FormData(e.currentTarget);
    const hpht = formData.get('hpht') as string;
    const progress = calculatePregnancyProgress(hpht);
    const score = tempRiskFactors.reduce((acc, id) => acc + (RISK_FACTORS_MASTER[id]?.score || 0), 0);

    const data = {
      name: formData.get('name') as string,
      dob: formData.get('dob') as string,
      phone: formData.get('phone') as string,
      hpht: hpht,
      pregnancyMonth: progress?.months || 0,
      pregnancyNumber: parseInt(formData.get('gravida') as string || '0'),
      parityP: parseInt(formData.get('para') as string || '0'),
      parityA: parseInt(formData.get('abortus') as string || '0'),
      medicalHistory: formData.get('history') as string,
      address: formData.get('address') as string,
      kecamatan: formData.get('kecamatan') as string,
      kelurahan: formData.get('kelurahan') as string,
      lat: parseFloat(formData.get('lat') as string) || parseFloat(formCoords.lat) || undefined,
      lng: parseFloat(formData.get('lng') as string) || parseFloat(formCoords.lng) || undefined,
      selectedRiskFactors: tempRiskFactors,
      totalRiskScore: score,
    };

    setState(prev => {
      if (editingPatient) {
        addLog('UPDATE_PATIENT', 'PATIENT', `Mengubah data ${data.name}`);
        return { ...prev, users: prev.users.map(u => u.id === editingPatient.id ? { ...u, ...data } : u) };
      } else {
        const id = `ANC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        addLog('REGISTER_PATIENT', 'PATIENT', `Mendaftarkan ${data.name}`);
        return { ...prev, users: [...prev.users, { ...data, id, username: id, password: id, role: UserRole.USER, isActive: true } as User] };
      }
    });
    handleNavigate('patients');
    showNotification(editingPatient ? 'Data diperbarui' : 'Pasien baru terdaftar');
  };

  const handleVisitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const activePatient = isAddingVisit || editingVisit?.patient;
    if (!activePatient || !currentUser) return;
    
    const formData = new FormData(e.currentTarget);
    const visitData: ANCVisit = {
      id: editingVisit ? editingVisit.visit.id : `v${Date.now()}`,
      patientId: activePatient.id,
      visitDate: editingVisit ? editingVisit.visit.visitDate : new Date().toISOString().split('T')[0],
      scheduledDate: editingVisit ? editingVisit.visit.scheduledDate : new Date().toISOString().split('T')[0],
      nextVisitDate: formData.get('nextVisit') as string,
      weight: parseFloat(formData.get('weight') as string),
      bloodPressure: formData.get('bp') as string,
      tfu: parseFloat(formData.get('tfu') as string),
      djj: parseFloat(formData.get('djj') as string),
      hb: parseFloat(formData.get('hb') as string),
      complaints: formData.get('complaints') as string,
      dangerSigns: formData.getAll('dangerSigns') as string[],
      edema: formData.get('edema') === 'on',
      fetalMovement: formData.get('fetalMovement') as string,
      followUp: formData.get('followUp') as string,
      nakesNotes: formData.get('notes') as string,
      nakesId: editingVisit ? editingVisit.visit.nakesId : currentUser.id,
      status: 'COMPLETED'
    };
    
    const finalRisk = getRiskCategory(activePatient.totalRiskScore, visitData);
    
    setState(prev => {
      const alerts = [...prev.alerts];
      if (finalRisk.label === 'HITAM' || finalRisk.label === 'MERAH') {
        alerts.unshift({ id: `alert-${Date.now()}`, type: 'EMERGENCY', patientId: activePatient.id, patientName: activePatient.name, message: `Risiko ${finalRisk.label} terdeteksi!`, timestamp: new Date().toISOString(), isRead: false });
      }
      
      let newVisits = [...prev.ancVisits];
      if (editingVisit) {
        newVisits = newVisits.map(v => v.id === editingVisit.visit.id ? visitData : v);
        addLog('UPDATE_ANC_VISIT', 'ANC', `Memperbarui riwayat ANC ${activePatient.name}`);
      } else {
        newVisits.push(visitData);
        addLog('ANC_VISIT', 'ANC', `Pemeriksaan ANC ${activePatient.name}`);
      }
      
      return { ...prev, ancVisits: newVisits, alerts: alerts.slice(0, 50) };
    });
    
    setIsAddingVisit(null);
    setEditingVisit(null);
    showNotification(editingVisit ? 'Data riwayat diperbarui' : 'Pemeriksaan Berhasil Disimpan');
  };

  const DashboardHome = () => {
    const patients = useMemo(() => state.users.filter(u => u.role === UserRole.USER), [state.users]);
    const today = new Date().toISOString().split('T')[0];

    if (currentUser?.role === UserRole.USER) {
      const progress = calculatePregnancyProgress(currentUser.hpht);
      const babySize = getBabySizeByWeek(progress?.weeks || 0);
      const userVisits = state.ancVisits.filter(v => v.patientId === currentUser.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
      const latest = userVisits[0];
      const risk = getRiskCategory(currentUser.totalRiskScore, latest);
      const checklist = state.userChecklists[currentUser.id] || {};

      return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
          {currentUser.isDelivered ? (
            <div className="bg-emerald-600 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
               <div className="relative z-10 text-center md:text-left flex-1">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none uppercase">Selamat, Ibu {currentUser.name}!</h2>
                 <p className="text-emerald-100 font-bold text-sm md:text-xl max-w-xl">
                   Bayi Anda lahir pada {new Date(currentUser.deliveryData!.deliveryDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}.
                 </p>
                 <div className="flex gap-4 mt-8">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                       <p className="text-[8px] font-black uppercase opacity-60">Berat Lahir</p>
                       <p className="text-2xl font-black">{currentUser.deliveryData!.babyWeight} g</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                       <p className="text-[8px] font-black uppercase opacity-60">Klasifikasi</p>
                       <p className="text-2xl font-black">{currentUser.deliveryData!.classification}</p>
                    </div>
                 </div>
               </div>
               <PartyPopper size={240} className="opacity-10 absolute -right-10 rotate-12" />
               <div className="bg-white p-10 rounded-[3rem] text-emerald-900 text-center shadow-xl">
                  <Stethoscope size={48} className="mx-auto mb-4 opacity-40" />
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status Bayi</p>
                  <p className="text-2xl font-black uppercase tracking-tighter">{currentUser.deliveryData!.classification}</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
              <div className="lg:col-span-2 bg-indigo-600 p-8 md:p-14 rounded-[3rem] md:rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                   <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-6">Halo, Ibu {currentUser.name.split(' ')[0]}! ✨</h2>
                   <p className="text-indigo-100 font-bold text-sm md:text-lg max-w-lg mb-10 leading-relaxed">
                     {getTrimesterAdvice(progress?.weeks || 0)}
                   </p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Minggu Ke</p>
                         <p className="text-2xl font-black mt-1">{progress?.weeks || 0}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Estimasi Lahir</p>
                         <p className="text-xs font-black mt-2 leading-tight">{progress?.hpl || 'N/A'}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Status Risiko</p>
                         <p className={`text-[10px] font-black mt-2 px-2 py-1 rounded-lg w-fit ${risk.color}`}>{risk.label}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Kunjungan Berikutnya</p>
                         <p className="text-xs font-black mt-2">{latest?.nextVisitDate || 'N/A'}</p>
                      </div>
                   </div>
                 </div>
                 <Baby size={280} className="absolute -right-16 -bottom-16 opacity-10 rotate-12 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
              </div>

              <div className="bg-white p-10 rounded-[3rem] md:rounded-[4rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                 <div className="text-6xl md:text-8xl mb-6 animate-bounce duration-[2000ms]">{babySize.icon}</div>
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Ukuran Janin Saat Ini</h3>
                 <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">Seukuran {babySize.name}</p>
                 <div className="mt-8 w-full bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-black text-indigo-600">{progress?.percentage}%</span>
                 </div>
                 <div className="mt-2 w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progress?.percentage}%` }} />
                 </div>
                 <Sparkles className="absolute top-6 right-6 text-indigo-100" size={32} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                     <List className="text-indigo-600" size={28} /> Rutinitas Sehat Hari Ini
                  </h3>
                  <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                     {Object.values(checklist).filter(Boolean).length}/{DAILY_TASKS.length} Selesai
                  </div>
               </div>
               <div className="space-y-4">
                  {DAILY_TASKS.map((item, idx) => (
                    <button 
                       key={idx}
                       onClick={() => toggleDailyTask(currentUser.id, item.task)}
                       className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-4 transition-all group ${
                         checklist[item.task] 
                           ? 'bg-emerald-50 border-emerald-500 shadow-emerald-100' 
                           : 'bg-gray-50 border-transparent hover:border-gray-200'
                       }`}
                    >
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            checklist[item.task] ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 shadow-sm border border-gray-100'
                          }`}>
                             {item.icon}
                          </div>
                          <div className="text-left">
                             <p className={`text-sm font-black uppercase tracking-tight ${checklist[item.task] ? 'text-emerald-900 line-through opacity-50' : 'text-gray-900'}`}>{item.task}</p>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{item.time}</p>
                          </div>
                       </div>
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                         checklist[item.task] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 group-hover:border-indigo-400'
                       }`}>
                          {checklist[item.task] && <CheckCircle size={14} />}
                       </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-8">
               <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4 px-2">
                  <Stethoscope className="text-indigo-600" size={28} /> Hasil Pemeriksaan Terakhir
               </h3>
               {latest ? (
                 <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-transform hover:scale-105">
                       <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 mb-4"><Activity size={20}/></div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tekanan Darah</p>
                       <p className="text-2xl font-black text-gray-900 mt-1">{latest.bloodPressure}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-transform hover:scale-105">
                       <div className="bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center text-rose-600 mb-4"><Heart size={20}/></div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Detak Jantung Janin</p>
                       <p className="text-2xl font-black text-gray-900 mt-1">{latest.djj} <span className="text-sm opacity-40">x/m</span></p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-transform hover:scale-105">
                       <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-4"><Droplets size={20}/></div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kadar Hemoglobin</p>
                       <p className="text-2xl font-black text-gray-900 mt-1">{latest.hb} <span className="text-sm opacity-40">g/dL</span></p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-transform hover:scale-105">
                       <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 mb-4"><ClipboardCheck size={20}/></div>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Berat Badan</p>
                       <p className="text-2xl font-black text-gray-900 mt-1">{latest.weight} <span className="text-sm opacity-40">Kg</span></p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-gray-100 text-center">
                    <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Belum ada catatan medis tersedia</p>
                 </div>
               )}
               <button 
                  onClick={() => handleNavigate('smart-card')}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95"
               >
                  <QrCode size={18} /> Tunjukkan Kartu ANC Pintar Saya
               </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentUser?.role === UserRole.ADMIN) {
      return (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                <div><p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Integritas Akun</p><h3 className="text-4xl font-black mt-2 tracking-tighter">{state.users.length}</h3></div>
                <|pill_close_id|>
