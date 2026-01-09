
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
const DATABASE_VERSION = '4.3.0';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [patientSearch, setPatientSearch] = useState('');
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
      users: MOCK_USERS,
      ancVisits: MOCK_ANC_VISITS,
      alerts: [],
      selectedPatientId: null,
      logs: [{ id: 'l1', timestamp: new Date().toISOString(), userId: 'system', userName: 'System', action: 'INIT', module: 'CORE', details: 'Database Smart ANC Berhasil Dimuat' }],
      userChecklists: {}
    };
  });

  useEffect(() => {
    setIsSyncing(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const timer = setTimeout(() => setIsSyncing(false), 500);
    return () => clearTimeout(timer);
  }, [state]);

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
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `SMART_ANC_DB_EXPORT_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Database berhasil diekspor');
  }, [state, showNotification]);

  const handleImportSystemData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.users && Array.isArray(json.users)) {
          setState(json);
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
                <Users className="text-indigo-500/20 self-end" size={32} />
             </div>
             <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                <div><p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Kelahiran Bayi</p><h3 className="text-4xl font-black mt-2 tracking-tighter">{state.users.filter(u => u.isDelivered).length}</h3></div>
                <PartyPopper className="text-white/20 self-end" size={32} />
             </div>
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Log Aktivitas</p><h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tighter">{state.logs.length}</h3></div>
                <Shield className="text-indigo-500 self-end" size={32} />
             </div>
             <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-transform">
                <div><p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Status Sistem</p><h3 className="text-xl font-black mt-2 flex items-center gap-2">Online <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/></h3></div>
                <RefreshCw className={`text-white/20 self-end ${isSyncing ? 'animate-spin' : ''}`} size={32} />
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8"><h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Clock size={20} className="text-indigo-600"/> Audit Log Real-time</h4></div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {state.logs.slice(0, 8).map(log => (
                    <div key={log.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-indigo-50/50">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-gray-100 shadow-sm"><Zap size={16}/></div>
                       <div className="flex-1 min-w-0"><p className="text-[11px] font-black text-gray-900 uppercase truncate">{log.action}</p><p className="text-[9px] font-bold text-gray-400 mt-0.5 leading-tight line-clamp-1">{log.details}</p></div>
                       <p className="text-[8px] font-black text-gray-300 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
             </div>
             <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div><h4 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3"><Users size={20} className="text-indigo-600"/> Matriks Pengguna</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-8 bg-indigo-50 rounded-3xl text-center border border-indigo-100"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Nakes Terdaftar</p><p className="text-4xl font-black text-indigo-900">{state.users.filter(u => u.role === UserRole.NAKES).length}</p></div>
                    <div className="p-8 bg-emerald-50 rounded-3xl text-center border border-emerald-100"><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Pasien Aktif</p><p className="text-4xl font-black text-emerald-900">{patients.length}</p></div>
                  </div>
                </div>
                <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between relative overflow-hidden group">
                   <div className="relative z-10 flex items-center gap-4"><Database className="text-emerald-400" size={24} /><div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Database</p><p className="text-sm font-black uppercase">v{DATABASE_VERSION} Local-First</p></div></div>
                   <button onClick={handleExportSystemData} className="relative z-10 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">Download DB</button>
                   <Waves className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64 rotate-45" />
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (currentUser?.role === UserRole.NAKES) {
      const priorityList = patients.filter(p => !p.isDelivered).map(p => {
        const pVisits = state.ancVisits.filter(v => v.patientId === p.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
        const latest = pVisits[0];
        return { ...p, risk: getRiskCategory(p.totalRiskScore, latest), latestVisit: latest };
      }).filter(p => p.risk.label === 'HITAM' || p.risk.label === 'MERAH')
      .sort((a,b) => (a.risk.priority || 0) - (b.risk.priority || 0));

      return (
        <div className="space-y-10 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="bg-red-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Pasien Emergensi</p>
                <h3 className="text-5xl font-black mt-2 tracking-tighter">{priorityList.length} <span className="text-xl opacity-50">Ibu</span></h3>
                <button onClick={() => handleNavigate('monitoring')} className="mt-8 px-6 py-3 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase shadow-lg group-hover:scale-105 transition-transform">Pantau Risiko</button>
                <ShieldAlert size={120} className="absolute -right-6 -bottom-6 opacity-10 rotate-12" />
             </div>
             <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between">
                <div><p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Bayi Lahir</p><h3 className="text-5xl font-black mt-2 tracking-tighter">{state.users.filter(u => u.isDelivered).length} <span className="text-xl opacity-50">Bayi</span></h3></div>
                <button onClick={() => handleNavigate('patients')} className="mt-8 w-full py-4 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase transition-all">Lihat Data Nifas</button>
             </div>
             <div className="bg-white p-10 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center">
                <MapPin size={48} className="text-indigo-100 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Peta Sebaran Pasien</p>
                <button onClick={() => handleNavigate('map')} className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase">Buka Pemetaan</button>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2"><h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><ShieldAlert className="text-red-600"/> Pasien Risiko Tinggi</h4></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {priorityList.slice(0, 4).map(p => (
                    <div key={p.id} className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-sm relative group overflow-hidden hover:shadow-2xl transition-all duration-500">
                      <div className={`absolute top-0 right-0 w-32 h-2 ${p.risk.label === 'HITAM' ? 'bg-slate-950' : 'bg-red-600'}`} />
                      <div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-indigo-600 border border-gray-100">{p.name.charAt(0)}</div><div><h5 className="text-xl font-black text-gray-900 tracking-tighter uppercase truncate max-w-[120px]">{p.name}</h5><p className="text-[9px] font-black text-gray-400 uppercase mt-1">Kel. {p.kelurahan}</p></div></div><div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${p.risk.color}`}>{p.risk.label}</div></div>
                      <div className="flex gap-2"><button onClick={() => setViewingPatientProfile(p.id)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-indigo-100">Profil</button><button onClick={() => setIsAddingVisit(p)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-indigo-600 transition-all"><Activity size={18}/></button></div>
                    </div>
                  ))}
                </div>
             </div>
             <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="relative z-10">
                  <h4 className="text-2xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3"><Calendar size={24} className="text-indigo-400"/> Agenda Nakes</h4>
                  <div className="space-y-6">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl group hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Total Pantauan ANC</p>
                        <p className="text-4xl font-black tracking-tighter">{patients.filter(p => !p.isDelivered).length} <span className="text-sm font-bold opacity-40 uppercase ml-2">Ibu Hamil</span></p>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 space-y-4 pt-10"><button onClick={() => handleNavigate('register')} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.05] transition-all flex items-center justify-center gap-3"><UserPlus size={16}/> Registrasi Pasien</button></div>
                <Activity size={240} className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none rotate-12" />
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!currentUser) return <LoginScreen users={state.users} onLogin={(u) => setCurrentUser(u)} />;

  const currentRegisterRisk = getRiskCategory(tempRiskFactors.reduce((acc, id) => acc + (RISK_FACTORS_MASTER[id]?.score || 0), 0));
  const liveTriase = (isAddingVisit || editingVisit) ? getRiskCategory((isAddingVisit || editingVisit?.patient)!.totalRiskScore, visitPreviewData) : null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      <Sidebar currentView={view} onNavigate={handleNavigate} onLogout={() => setCurrentUser(null)} userRole={currentUser?.role} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={`transition-all duration-700 ${isSidebarOpen && window.innerWidth > 1024 ? 'lg:ml-80' : 'ml-0'}`}>
        <Header title={viewingPatientProfile ? "Profil Medis" : view.toUpperCase()} userName={currentUser?.name || ''} userRole={currentUser?.role} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onSearchChange={setPatientSearch} onLogout={() => setCurrentUser(null)} alerts={state.alerts} onMarkAsRead={(id) => setState(prev => ({ ...prev, alerts: prev.alerts.map(a => a.id === id ? { ...a, isRead: true } : a) }))} onNavigateToPatient={handleNavigate} isSyncing={isSyncing} />
        <div className="p-4 md:p-8 lg:p-12 xl:p-16 max-w-[1600px] mx-auto">
          {notification && <div className="fixed top-6 md:top-10 left-1/2 -translate-x-1/2 z-[999] px-6 md:px-10 py-4 md:py-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10"><CheckCircle size={20} className="text-emerald-400" /><p className="text-xs font-black uppercase tracking-widest">{notification.message}</p></div>}
          {view === 'dashboard' && <DashboardHome />}
          {view === 'patients' && currentUser.role !== UserRole.USER && (
            <PatientList users={state.users} visits={state.ancVisits} onEdit={(u) => { setEditingPatient(u); setTempRiskFactors(u.selectedRiskFactors); setView('register'); }} onAddVisit={(u) => { setIsAddingVisit(u); setVisitPreviewData({ bloodPressure: '120/80', dangerSigns: [], fetalMovement: 'Normal', djj: 140 }); }} onViewProfile={(id) => setViewingPatientProfile(id)} onDeletePatient={(id) => { if(window.confirm('Hapus permanen?')) setState(prev => ({...prev, users: prev.users.filter(u => u.id !== id)})) }} onDeleteVisit={handleDeleteVisit} onToggleVisitStatus={() => {}} onRecordDelivery={(u) => setRecordingDelivery(u)} onStartNewPregnancy={(u) => setStartingNewPregnancy(u)} currentUserRole={currentUser.role} searchFilter={patientSearch} />
          )}

          {recordingDelivery && (
            <div className="fixed inset-0 z-[120] bg-indigo-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                <div className="bg-indigo-600 p-10 text-white text-center relative">
                  <PartyPopper className="mx-auto mb-4" size={48} />
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Catat Kelahiran</h3>
                  <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest mt-2">Ibu {recordingDelivery.name}</p>
                  <button onClick={() => setRecordingDelivery(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X/></button>
                </div>
                <form onSubmit={handleDeliverySubmit} className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Bayi (Opsional)</label>
                      <input name="babyName" placeholder="Contoh: Muhammad Yusuf" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-100" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Jenis Kelamin</label>
                      <select name="babyGender" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required>
                        <option value="L">LAKI-LAKI</option>
                        <option value="P">PEREMPUAN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Tanggal Lahir</label>
                      <input type="date" name="deliveryDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-1"><Scale size={12}/> Berat (g)</label>
                      <input type="number" name="babyWeight" placeholder="Contoh: 3100" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-1"><Ruler size={12}/> Tinggi (cm)</label>
                      <input type="number" name="babyHeight" placeholder="Contoh: 50" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Status Ibu</label>
                      <select name="motherStatus" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required>
                        <option value="SEHAT">SEHAT / STABIL</option>
                        <option value="KOMPLIKASI">KOMPLIKASI PASCA SALIN</option>
                        <option value="MENINGGAL">MENINGGAL DUNIA</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Status Bayi</label>
                      <select name="babyStatus" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black outline-none focus:ring-4 focus:ring-indigo-100" required>
                        <option value="HIDUP_SEHAT">HIDUP & SEHAT</option>
                        <option value="HIDUP_KOMPLIKASI">HIDUP & BUTUH PERAWATAN</option>
                        <option value="MENINGGAL">MENINGGAL DUNIA</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Keterangan Tambahan</label>
                    <textarea name="condition" placeholder="Tuliskan catatan persalinan..." className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-100" rows={2}></textarea>
                  </div>

                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><Save size={18}/> Simpan Rekam Medis & Arsipkan Pasien</button>
                </form>
              </div>
            </div>
          )}

          {startingNewPregnancy && (
            <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white text-center relative">
                  <RefreshCcw className="mx-auto mb-4 text-indigo-400" size={48} />
                  <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Mulai Siklus ANC Baru</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Ny. {startingNewPregnancy.name}</p>
                  <button onClick={() => setStartingNewPregnancy(null)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors"><X/></button>
                </div>
                <form onSubmit={handleNewPregnancySubmit} className="p-10 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">HPHT Terbaru (Hari Pertama Haid Terakhir)</label>
                    <input type="date" name="newHpht" className="w-full px-8 py-5 bg-gray-50 border-none rounded-[2rem] font-black text-lg outline-none focus:ring-8 focus:ring-indigo-100" required />
                  </div>
                  <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-start gap-4">
                    <AlertCircle size={24} className="text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-indigo-900 uppercase tracking-tight">Peringatan Medis</p>
                      <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase mt-1">Data kelahiran sebelumnya akan diarsipkan secara otomatis. Nilai Gravida (G) akan meningkat menjadi G{startingNewPregnancy.pregnancyNumber + 1}.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"><Sparkles size={18}/> Aktifkan Pemantauan</button>
                    <button type="button" onClick={() => setStartingNewPregnancy(null)} className="px-10 py-6 bg-gray-100 text-gray-500 rounded-[2.5rem] font-black uppercase text-xs tracking-widest">Batal</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {view === 'register' && currentUser.role !== UserRole.USER && (
            <div className="max-w-5xl mx-auto space-y-10 animate-in zoom-in-95">
              <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16">
                  <div className="flex items-center gap-8"><div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-2xl shrink-0"><UserPlus size={28} /></div><div><h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-tight">{editingPatient ? 'Perbarui Profil' : 'Registrasi Baru'}</h2><p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2">Sistem Monitoring ANC Terpadu</p></div></div>
                  <div className={`px-10 py-5 rounded-[2rem] border-4 flex items-center gap-5 transition-all duration-700 shadow-xl ${currentRegisterRisk.color}`}><div className="text-left"><p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Triase Live Prediction</p><p className="text-lg font-black uppercase tracking-tighter">{currentRegisterRisk.label}</p></div><Activity size={24} className="animate-pulse shrink-0" /></div>
                </div>
                <form onSubmit={handleRegisterSubmit} className="space-y-16">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Nama Lengkap</label><input name="name" defaultValue={editingPatient?.name} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-8 focus:ring-indigo-100 transition-all" required /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Tanggal Lahir</label><input type="date" name="dob" defaultValue={editingPatient?.dob} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-8 focus:ring-indigo-100 transition-all" required /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Nomor WhatsApp</label><input type="tel" name="phone" defaultValue={editingPatient?.phone} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[1.5rem] font-bold outline-none focus:ring-8 focus:ring-indigo-100 transition-all" required /></div>
                  </div>
                  <div className="bg-indigo-50/50 p-10 rounded-[3.5rem] border border-indigo-100 relative overflow-hidden"><h4 className="text-sm font-black text-indigo-900 uppercase tracking-[0.3em] mb-10 flex items-center gap-3 relative z-10"><Baby size={18} /> Parameter Kehamilan Utama</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">HPHT</label><input type="date" name="hpht" defaultValue={editingPatient?.hpht} className="w-full px-8 py-5 bg-white border border-indigo-100 rounded-[1.5rem] font-black outline-none focus:ring-8 focus:ring-indigo-200 transition-all" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Gravida (G)</label><input type="number" name="gravida" defaultValue={editingPatient?.pregnancyNumber} className="w-full px-8 py-5 bg-white border border-indigo-100 rounded-[1.5rem] font-black outline-none focus:ring-8 focus:ring-indigo-200 transition-all" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Para (P)</label><input type="number" name="para" defaultValue={editingPatient?.parityP} className="w-full px-8 py-5 bg-white border border-indigo-100 rounded-[1.5rem] font-black outline-none focus:ring-8 focus:ring-indigo-200 transition-all" required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Abortus (A)</label><input type="number" name="abortus" defaultValue={editingPatient?.parityA} className="w-full px-8 py-5 bg-white border border-indigo-100 rounded-[1.5rem] font-black outline-none focus:ring-8 focus:ring-indigo-200 transition-all" required /></div>
                    </div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8"><h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><MapPin size={18} /> Data Domisili</h4><textarea name="address" rows={3} defaultValue={editingPatient?.address} className="w-full px-6 py-4 bg-gray-50 border-none rounded-[2rem] font-bold outline-none focus:ring-8 focus:ring-indigo-100 transition-all" placeholder="Alamat Lengkap..." required />
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Kecamatan</label><select name="kecamatan" className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.5rem] font-black text-xs outline-none"><option value="Pasar Minggu">Pasar Minggu</option></select></div>
                        <div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Kelurahan</label><select name="kelurahan" defaultValue={editingPatient?.kelurahan} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.5rem] font-black text-xs outline-none">{WILAYAH_DATA["Pasar Minggu"].map(kel => <option key={kel} value={kel}>{kel}</option>)}</select></div>
                      </div></div>
                    <div className="space-y-8"><div className="flex justify-between items-center"><h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><NavIcon size={18} /> Koordinat Geospasial</h4><button type="button" onClick={getCurrentLocation} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2">{isGettingLocation ? <RefreshCw size={12} className="animate-spin" /> : <Crosshair size={12} />} Tag Lokasi</button></div>
                      <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Latitude</label><input name="lat" value={formCoords.lat} onChange={(e) => setFormCoords({...formCoords, lat: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.5rem] font-black text-xs outline-none" /></div><div className="space-y-2"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Longitude</label><input name="lng" value={formCoords.lng} onChange={(e) => setFormCoords({...formCoords, lng: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-none rounded-[1.5rem] font-black text-xs outline-none" /></div></div></div>
                  </div>
                  <div className="space-y-8"><label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 ml-4"><ShieldAlert size={18} /> Penapisan Faktor Resiko (Skor SPR)</label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Object.entries(RISK_FACTORS_MASTER).map(([id, info]) => (<label key={id} className={`flex items-start gap-5 p-6 rounded-[2rem] border-4 transition-all cursor-pointer group hover:scale-[1.01] ${tempRiskFactors.includes(id) ? 'bg-indigo-50 border-indigo-600 shadow-xl' : 'bg-gray-50 border-transparent'}`}><input type="checkbox" className="mt-1 accent-indigo-600 w-5 h-5 shrink-0" checked={tempRiskFactors.includes(id)} onChange={(e) => { if (e.target.checked) setTempRiskFactors([...tempRiskFactors, id]); else setTempRiskFactors(tempRiskFactors.filter(f => f !== id)); }} /><div className="min-w-0"><p className="text-xs font-black text-gray-900 leading-tight uppercase group-hover:text-indigo-600 transition-colors line-clamp-2">{info.label}</p><p className="text-[10px] font-black text-indigo-400 mt-2 tracking-widest">+{info.score} Poin Risiko</p></div></label>))}</div></div>
                  <div className="pt-16 border-t border-gray-100 flex flex-col md:flex-row gap-8"><button type="submit" className="w-full md:flex-1 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">Simpan Rekam Medis</button><button type="button" onClick={() => handleNavigate('patients')} className="w-full md:px-16 py-7 bg-gray-100 text-gray-500 rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all">Batalkan</button></div>
                </form>
              </div>
            </div>
          )}
          {(isAddingVisit || editingVisit) && (
            <div className="fixed inset-0 z-[100] bg-indigo-950/80 backdrop-blur-2xl flex items-start justify-center p-2 md:p-10 overflow-y-auto"><div className="bg-white w-full max-w-5xl rounded-[1.5rem] md:rounded-[4.5rem] shadow-2xl my-4 md:my-auto animate-in zoom-in-95 duration-700 relative flex flex-col"><div className="bg-indigo-600 p-6 md:p-16 text-white flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 relative overflow-hidden rounded-t-[4.5rem]"><div className="relative z-10 text-center md:text-left"><h2 className="text-4xl font-black uppercase tracking-tighter">{editingVisit ? 'Edit Riwayat' : 'Input ANC'}</h2><p className="text-indigo-200 font-bold text-xs uppercase tracking-[0.3em] mt-2">Ibu {(isAddingVisit || editingVisit?.patient)!.name}</p></div><div className={`relative z-10 px-8 py-4 rounded-[2rem] flex items-center gap-4 border-4 shadow-2xl ${liveTriase?.color}`}><div className="text-left"><p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Triase Live</p><p className="text-lg font-black uppercase tracking-tighter">{liveTriase?.label}</p></div><ShieldAlert size={32} className={liveTriase?.label === 'HITAM' ? 'animate-pulse' : ''} /></div><button onClick={() => {setIsAddingVisit(null); setEditingVisit(null);}} className="relative z-10 p-5 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all"><X size={18}/></button><Activity size={180} className="absolute -left-10 -bottom-10 opacity-5" /></div><form onSubmit={handleVisitSubmit} className="p-6 md:p-20 space-y-16"><div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">BB (kg)</label><input name="weight" type="number" step="0.1" defaultValue={editingVisit?.visit.weight} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50" required /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">TD (mmHg)</label><input name="bp" placeholder="120/80" defaultValue={editingVisit?.visit.bloodPressure} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50" required onChange={(e) => setVisitPreviewData(prev => ({ ...prev, bloodPressure: e.target.value }))} /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">TFU (cm)</label><input name="tfu" type="number" step="0.1" defaultValue={editingVisit?.visit.tfu} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50" required /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">DJJ (x/m)</label><input name="djj" type="number" defaultValue={editingVisit?.visit.djj} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50" required onChange={(e) => setVisitPreviewData(prev => ({ ...prev, djj: Number(e.target.value) }))} /></div>
                      <div className="space-y-3 col-span-2 md:col-span-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Hb (g/dL)</label><input name="hb" type="number" step="0.1" defaultValue={editingVisit?.visit.hb} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-8 focus:ring-indigo-50" required /></div>
                  </div><div className="grid grid-cols-1 md:grid-cols-2 gap-16"><div className="space-y-8"><h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2"><AlertCircle size={16}/> Observasi Bahaya</h4><div className="grid grid-cols-2 gap-4">{['Perdarahan', 'Ketuban Pecah', 'Kejang', 'Pusing Hebat', 'Nyeri Perut Hebat', 'Demam'].map(s => (<label key={s} className="flex items-center gap-5 p-5 bg-gray-50 rounded-2xl hover:bg-red-50 transition-all cursor-pointer border-2 border-transparent hover:border-red-200 group"><input type="checkbox" name="dangerSigns" value={s} defaultChecked={editingVisit?.visit.dangerSigns.includes(s)} className="accent-red-600 w-5 h-5 shrink-0" onChange={(e) => { const current = visitPreviewData.dangerSigns || []; const updated = e.target.checked ? [...current, s] : current.filter(x => x !== s); setVisitPreviewData(prev => ({ ...prev, dangerSigns: updated })); }} /><span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-red-600 truncate">{s}</span></label>))}</div></div><div className="space-y-8"><h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2"><Baby size={16}/> Kondisi Janin</h4><div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Gerak Janin</label><select name="fetalMovement" defaultValue={editingVisit?.visit.fetalMovement || 'Normal'} className="w-full p-6 bg-gray-50 border-none rounded-2xl font-black text-sm outline-none focus:ring-8 focus:ring-indigo-50" onChange={(e) => setVisitPreviewData(prev => ({ ...prev, fetalMovement: e.target.value }))} required><option value="Normal">NORMAL / AKTIF</option><option value="Kurang Aktif">KURANG AKTIF</option><option value="Tidak Ada">TIDAK ADA (EMERGENCY)</option></select></div><div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Keluhan</label><textarea name="complaints" defaultValue={editingVisit?.visit.complaints} placeholder="Tuliskan jika ada..." className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-50" rows={3}></textarea></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-indigo-50/50 p-10 rounded-[3.5rem] border border-indigo-100"><div className="space-y-6"><h4 className="text-xs font-black text-indigo-900 uppercase tracking-[0.3em] flex items-center gap-3"><ClipboardCheck size={16}/> Rencana (Plan)</h4><select name="followUp" defaultValue={editingVisit?.visit.followUp || 'ANC_RUTIN'} className="w-full p-6 bg-white border border-indigo-200 rounded-2xl font-black text-xs outline-none focus:ring-8 focus:ring-indigo-100" required><option value="ANC_RUTIN">KONTROL RUTIN</option><option value="KONSUL_DOKTER">KONSULTASI OBGYN</option><option value="RUJUK_RS">RUJUK RS (KRITIS)</option></select><textarea name="notes" defaultValue={editingVisit?.visit.nakesNotes} placeholder="Catatan Bidan..." className="w-full p-6 bg-white border border-indigo-200 rounded-[2rem] font-bold text-xs outline-none focus:ring-8 focus:ring-indigo-100" rows={3}></textarea></div><div className="space-y-6"><h4 className="text-xs font-black text-indigo-900 uppercase tracking-[0.3em] flex items-center gap-3"><Calendar size={16}/> Jadwal Ulang</h4><div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Kontrol Berikutnya</label><input type="date" name="nextVisit" defaultValue={editingVisit?.visit.nextVisitDate} className="w-full p-6 bg-white border border-indigo-200 rounded-2xl font-black outline-none text-base" required /></div><div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white flex items-start gap-4 shadow-xl"><Info size={16} className="shrink-0" /><p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Pastikan hadir tepat waktu untuk menjaga kesehatan Ibu dan Buah Hati.</p></div></div></div><div className="flex flex-col md:flex-row gap-8 pb-4"><button type="submit" className="w-full md:flex-1 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-2xl transition-all"><Save size={18} className="inline mr-2"/> {editingVisit ? 'Simpan Perubahan' : 'Selesaikan'}</button><button type="button" onClick={() => {setIsAddingVisit(null); setEditingVisit(null);}} className="w-full md:py-7 px-16 bg-gray-100 text-gray-500 rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all">Batal</button></div></form></div></div>
          )}
          {view === 'management' && <AccessManagement state={state} setState={setState} currentUser={currentUser!} addLog={addLog} onExport={handleExportSystemData} onImport={handleImportSystemData} />}
          {view === 'monitoring' && <RiskMonitoring state={state} onViewProfile={(id)=>setViewingPatientProfile(id)} onAddVisit={(u)=>setIsAddingVisit(u)} onToggleVisitStatus={()=>{}} />}
          {view === 'map' && <MapView users={state.users} visits={state.ancVisits} />}
          {view === 'smart-card' && <SmartCardModule state={state} setState={setState} isUser={currentUser?.role === UserRole.USER} user={currentUser!} />}
          {view === 'education' && <EducationModule />}
          {view === 'contact' && <ContactModule />}
          {viewingPatientProfile && (
            <div className="fixed inset-0 z-[110] bg-indigo-950/90 backdrop-blur-3xl flex items-start justify-center p-2 md:p-12 overflow-y-auto pt-10 pb-10">
              <div className="bg-gray-50 w-full max-w-7xl rounded-[4.5rem] shadow-2xl relative border-4 border-indigo-500/20 my-auto">
                <PatientProfileView 
                  patient={state.users.find(u => u.id === viewingPatientProfile)!} 
                  visits={state.ancVisits} 
                  onClose={() => setViewingPatientProfile(null)} 
                  onEditVisit={(v) => { 
                    setEditingVisit({patient: state.users.find(u => u.id === viewingPatientProfile)!, visit: v}); 
                    setVisitPreviewData({bloodPressure: v.bloodPressure, djj: v.djj, fetalMovement: v.fetalMovement, dangerSigns: v.dangerSigns}); 
                  }} 
                  onDeleteVisit={handleDeleteVisit}
                  onDeleteDelivery={(deliveryId) => handleDeleteDelivery(viewingPatientProfile, deliveryId)}
                  isStaff={currentUser.role !== UserRole.USER} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
