import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Calendar, Wallet, Image as ImageIcon,
  Plus, Clock, MapPin, User, Upload, ArrowDownRight, ArrowUpRight,
  CheckCircle2, Palette, LogOut, Trash2, Loader2,
  Smile, Edit3, X, Bot, Send,
  Leaf, Flower2, Droplets, Sun, Star,
  BookOpen, Download, FileText,
  Search, Mic, Camera, ChevronRight, ChevronDown, ShieldAlert, KeyRound, Check, MessageSquare
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, deleteDoc, getDoc 
} from 'firebase/firestore';

// --- THEME DEFINITIONS ---
const THEMES = {
  blue: { bg: 'bg-blue-200/80', primary: 'bg-blue-600', text: 'text-blue-800', light: 'bg-blue-300', border: 'border-blue-400', gradient: 'from-blue-400 to-blue-200', Decor: Droplets },
  pink: { bg: 'bg-pink-200/80', primary: 'bg-pink-600', text: 'text-pink-800', light: 'bg-pink-300', border: 'border-pink-400', gradient: 'from-pink-400 to-pink-200', Decor: Flower2 },
  yellow: { bg: 'bg-amber-200/80', primary: 'bg-amber-500', text: 'text-amber-800', light: 'bg-amber-300', border: 'border-amber-400', gradient: 'from-amber-400 to-amber-200', Decor: Sun },
  green: { bg: 'bg-emerald-200/80', primary: 'bg-emerald-600', text: 'text-emerald-800', light: 'bg-emerald-300', border: 'border-emerald-400', gradient: 'from-emerald-400 to-emerald-200', Decor: Leaf },
  purple: { bg: 'bg-purple-200/80', primary: 'bg-purple-600', text: 'text-purple-800', light: 'bg-purple-300', border: 'border-purple-400', gradient: 'from-purple-400 to-purple-200', Decor: Star },
};

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAnwNLZzjhAdA2vfIgqKtmANTuS6ZLny98",
  authDomain: "my-diary-189f8.firebaseapp.com",
  projectId: "my-diary-189f8",
  storageBucket: "my-diary-189f8.firebasestorage.app",
  messagingSenderId: "1081130738852",
  appId: "1:1081130738852:web:37b04a516457fd78e57231",
  measurementId: "G-SBXMNL80RG"
};

let app, auth, db, appId;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = "my-diary-app";
} catch (e) {
  console.error("Firebase initialization skipped or failed:", e);
}

// --- CSS FOR FLOATING ANIMATION ---
const floatingStyles = `
  @keyframes float1 {
    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
    33% { transform: translate(30px, -50px) scale(1.1) rotate(5deg); }
    66% { transform: translate(-20px, 20px) scale(0.9) rotate(-5deg); }
    100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  }
  @keyframes float2 {
    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
    33% { transform: translate(-30px, 40px) scale(0.9) rotate(-5deg); }
    66% { transform: translate(20px, -20px) scale(1.1) rotate(5deg); }
    100% { transform: translate(0, 0) scale(1) rotate(0deg); }
  }
  .animate-float-1 { animation: float1 15s ease-in-out infinite; }
  .animate-float-2 { animation: float2 18s ease-in-out infinite; }
`;

export default function App() {
  const [user, setUser] = useState(null);
  const [roomNumber, setRoomNumber] = useState('');
  
  const [authStep, setAuthStep] = useState('room_input'); 
  const [roomConfig, setRoomConfig] = useState(null);
  
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('blue');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const [inputName, setInputName] = useState('');
  const [inputQ1, setInputQ1] = useState(''); 
  const [inputQ2, setInputQ2] = useState(''); 
  const [authError, setAuthError] = useState('');

  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const [events, setEvents] = useState([]);
  const [finances, setFinances] = useState([]);
  const [timetableImg, setTimetableImg] = useState(null);
  const [timetableRemark, setTimetableRemark] = useState('');
  const [diaries, setDiaries] = useState([]);
  const [chats, setChats] = useState([]);
  const [savedChats, setSavedChats] = useState([]); // 新增：保存的对话
  const [words, setWords] = useState([]); 

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || authStep !== 'main' || !roomNumber) return;

    setIsLoading(true);
    const prefix = `room_${roomNumber}`;
    
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_events`);
    const financesRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_finances`);
    const diariesRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_diaries`);
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_chats`);
    const savedChatsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_saved_chats`); // 新增监听
    const wordsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_words`); 
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', `${prefix}_settings`, 'config');

    const unsubEvents = onSnapshot(eventsRef, (snap) => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubFinances = onSnapshot(financesRef, (snap) => setFinances(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubDiaries = onSnapshot(diariesRef, (snap) => setDiaries(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubChats = onSnapshot(chatsRef, (snap) => setChats(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubSavedChats = onSnapshot(savedChatsRef, (snap) => setSavedChats(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubWords = onSnapshot(wordsRef, (snap) => setWords(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error); 
    
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) setTheme(data.theme);
        if (data.timetableImg) setTimetableImg(data.timetableImg);
        if (data.timetableRemark !== undefined) setTimetableRemark(data.timetableRemark);
        if (data.userName !== undefined) setUserName(data.userName);
      }
      setIsLoading(false);
    }, (err) => { console.error(err); setIsLoading(false); });

    return () => {
      unsubEvents(); unsubFinances(); unsubDiaries(); unsubChats(); unsubSavedChats(); unsubWords(); unsubSettings();
    };
  }, [user, authStep, roomNumber]);

  const addRecord = async (colName, data) => {
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_${colName}`);
    await addDoc(colRef, data);
  };
  const deleteRecord = async (colName, id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_${colName}`, id);
    await deleteDoc(docRef);
  };
  const updateRecord = async (colName, id, data) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_${colName}`, id);
    await setDoc(docRef, data, { merge: true });
  };
  const updateSettings = async (data) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_settings`, 'config');
    await setDoc(docRef, data, { merge: true });
  };

  const handleRoomCheck = async (e) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;
    setIsLoading(true);

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_settings`, 'config');
      const snap = await getDoc(docRef);
      
      if (snap.exists() && snap.data().userName) {
        const configData = snap.data();
        setRoomConfig(configData);
        if (configData.theme) setTheme(configData.theme);

        const isRemembered = localStorage.getItem(`diary_auth_${roomNumber}`);
        if (isRemembered === 'true') {
          setAuthStep('main');
        } else {
          setAuthStep('verify');
        }
      } else {
        setAuthStep('setup');
      }
    } catch (err) {
      console.error("Fetch room error:", err);
    }
    setIsLoading(false);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputQ1.trim() || !inputQ2.trim()) return;
    setIsLoading(true);
    await updateSettings({
      userName: inputName.trim(),
      q1: inputQ1.trim(),
      q2: inputQ2.trim(),
      theme: 'blue'
    });
    localStorage.setItem(`diary_auth_${roomNumber}`, 'true'); 
    setAuthStep('main');
    setIsLoading(false);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!inputName.trim()) return;
    
    const isNameCorrect = inputName.trim() === roomConfig.userName;
    if (!isNameCorrect) {
      setAuthError('名字不对哦，是不是进错房间啦？');
      return;
    }

    if (!roomConfig.q1 && !roomConfig.q2) {
      if (!inputQ1.trim() || !inputQ2.trim()) {
        setAuthError('这是你第一次用新版安全系统，请填写两个问题作为以后的密保！');
        return;
      }
      setIsLoading(true);
      await updateSettings({ q1: inputQ1.trim(), q2: inputQ2.trim() });
      localStorage.setItem(`diary_auth_${roomNumber}`, 'true');
      setAuthStep('main');
      setIsLoading(false);
      return;
    }

    const isQ1Correct = inputQ1.trim() === roomConfig.q1;
    const isQ2Correct = inputQ2.trim() === roomConfig.q2;

    if (!isQ1Correct && !isQ2Correct && (inputQ1.trim() || inputQ2.trim())) {
      setAuthError('密保问题不对哦，禁止访问！🔒');
      return;
    } else if (!inputQ1.trim() && !inputQ2.trim()) {
       setAuthError('请至少回答一个密保问题证明身份！');
       return;
    }

    localStorage.setItem(`diary_auth_${roomNumber}`, 'true');
    setAuthStep('main');
  };

  const handleLogout = () => {
    setRoomNumber('');
    setInputName('');
    setInputQ1('');
    setInputQ2('');
    setAuthError('');
    setAuthStep('room_input');
  };

  const handleSaveNameEdit = () => {
    if (!tempName.trim()) return;
    updateSettings({ userName: tempName.trim() });
    setUserName(tempName.trim());
    setIsEditingName(false);
  };

  const currentTheme = THEMES[theme] || THEMES.blue;
  const DecorIcon = currentTheme.Decor;

  if (authStep === 'room_input') {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen items-center p-4 font-sans">
        <style>{floatingStyles}</style>
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center border border-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-50 animate-float-1 pointer-events-none -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50 animate-float-2 pointer-events-none -ml-10 -mb-10"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 rotate-3">
              <Leaf className="w-10 h-10 text-emerald-500 -rotate-3" />
            </div>
            <h1 className="text-3xl font-medium tracking-tight mb-2 text-zinc-900">进入树洞</h1>
            <p className="text-zinc-500 text-sm mb-8">输入专属房号，打开秘密空间</p>
            
            <form onSubmit={handleRoomCheck} className="space-y-4 w-full">
              <input
                type="text"
                placeholder="例如: 8888"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-zinc-50/80 border border-zinc-200 text-center text-2xl tracking-widest text-black rounded-2xl p-4 focus:outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50 transition-all"
                required
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-medium active:scale-95 transition-all shadow-md shadow-zinc-900/20 disabled:bg-zinc-400 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '查询房间'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'setup') {
    return (
      <div className={`flex justify-center bg-gray-100 min-h-screen font-sans`}>
        <style>{floatingStyles}</style>
        <div className={`w-full max-w-md ${currentTheme.bg} min-h-screen shadow-2xl relative flex flex-col justify-center items-center p-6 transition-colors duration-500 overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 animate-float-1 bg-gradient-to-br ${currentTheme.gradient}`}></div>
          <div className={`absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-40 animate-float-2 bg-gradient-to-tr ${currentTheme.gradient}`}></div>

          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white relative z-10 w-full animate-in fade-in slide-in-from-bottom-8">
            <div className={`w-14 h-14 rounded-full ${currentTheme.light} flex items-center justify-center mb-4 mx-auto`}>
              <Smile className={`w-7 h-7 ${currentTheme.text}`} />
            </div>
            <h2 className="text-xl font-medium text-center text-zinc-900 mb-2">欢迎开通新树洞</h2>
            <p className="text-center text-zinc-500 text-xs mb-6">请设置你的专属密保，以后换手机可以用它找回房间哦！</p>

            <form onSubmit={handleSetupSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="你的真实名字/昵称"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-center text-lg text-black rounded-xl p-3 focus:outline-none focus:border-zinc-400 transition-colors shadow-sm"
                required
              />
              <div className="pt-2 pb-1 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mb-2 text-center">🔒 设定两个安全密保</p>
                <input
                  type="text"
                  placeholder="密保 1: 最喜欢的动漫/卡通人物？"
                  value={inputQ1}
                  onChange={(e) => setInputQ1(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 text-center text-sm text-black rounded-xl p-3 focus:outline-none focus:border-zinc-300 transition-colors shadow-inner mb-2"
                  required
                />
                <input
                  type="text"
                  placeholder="密保 2: 最喜欢的食物是什么？"
                  value={inputQ2}
                  onChange={(e) => setInputQ2(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 text-center text-sm text-black rounded-xl p-3 focus:outline-none focus:border-zinc-300 transition-colors shadow-inner"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full ${currentTheme.primary} text-white py-3.5 rounded-xl font-medium active:scale-95 transition-transform shadow-md mt-2 flex justify-center`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存并开始体验'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'verify') {
    return (
      <div className={`flex justify-center bg-gray-100 min-h-screen font-sans`}>
        <style>{floatingStyles}</style>
        <div className={`w-full max-w-md ${currentTheme.bg} min-h-screen shadow-2xl relative flex flex-col justify-center items-center p-6 transition-colors duration-500 overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 animate-float-1 bg-gradient-to-br ${currentTheme.gradient}`}></div>
          <div className={`absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-40 animate-float-2 bg-gradient-to-tr ${currentTheme.gradient}`}></div>

          <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white relative z-10 w-full animate-in fade-in slide-in-from-bottom-8">
            <div className={`w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto border border-red-100`}>
              <ShieldAlert className={`w-7 h-7 text-red-500`} />
            </div>
            <h2 className="text-xl font-medium text-center text-zinc-900 mb-2">安全验证</h2>
            <p className="text-center text-zinc-500 text-xs mb-6">检测到新设备或身份未验证，请证明你是房间主人！</p>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div className="relative">
                 <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input
                   type="text"
                   placeholder="验证你的名字"
                   value={inputName}
                   onChange={(e) => setInputName(e.target.value)}
                   className="w-full bg-white border border-zinc-200 text-lg text-black rounded-xl p-3 pl-10 focus:outline-none focus:border-zinc-400 transition-colors shadow-sm"
                   required
                 />
              </div>
              <div className="pt-2 pb-1 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mb-2 text-center">答对以下任意一题密保即可进入</p>
                <div className="relative mb-2">
                   <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input
                     type="text"
                     placeholder="密保 1: 最喜欢的动漫/卡通人物？"
                     value={inputQ1}
                     onChange={(e) => setInputQ1(e.target.value)}
                     className="w-full bg-zinc-50 border border-zinc-100 text-sm text-black rounded-xl p-3 pl-10 focus:outline-none focus:border-zinc-300 transition-colors shadow-inner"
                   />
                </div>
                <div className="relative">
                   <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input
                     type="text"
                     placeholder="密保 2: 最喜欢的食物是什么？"
                     value={inputQ2}
                     onChange={(e) => setInputQ2(e.target.value)}
                     className="w-full bg-zinc-50 border border-zinc-100 text-sm text-black rounded-xl p-3 pl-10 focus:outline-none focus:border-zinc-300 transition-colors shadow-inner"
                   />
                </div>
              </div>
              
              {authError && (
                 <div className="bg-red-50 text-red-500 text-xs p-2.5 rounded-xl border border-red-100 text-center animate-in shake">
                    {authError}
                 </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full ${currentTheme.primary} text-white py-3.5 rounded-xl font-medium active:scale-95 transition-transform shadow-md mt-2 flex justify-center`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '验证并进入房间'}
              </button>
            </form>

            <button onClick={handleLogout} className="w-full text-center text-xs text-zinc-400 mt-4 underline underline-offset-2">不是我的房间，返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // SCREEN 4: MAIN APP INTERFACE
  // ---------------------------------------------
  return (
    <div className={`flex justify-center bg-gray-100 min-h-screen`}>
      <style>{floatingStyles}</style>
      
      <div className={`w-full max-w-md ${currentTheme.bg} min-h-screen shadow-2xl relative flex flex-col text-zinc-900 font-sans transition-colors duration-500 overflow-hidden`}>
        
        <div className={`absolute top-10 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-1 bg-gradient-to-br ${currentTheme.gradient}`}></div>
        <div className={`absolute bottom-20 left-0 w-56 h-56 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-2 bg-gradient-to-tr ${currentTheme.gradient}`}></div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <DecorIcon className={`absolute top-[10%] -left-10 w-56 h-56 opacity-40 ${currentTheme.text} rotate-12 animate-float-2`} />
          <DecorIcon className={`absolute top-[40%] -right-16 w-72 h-72 opacity-40 ${currentTheme.text} -rotate-12 animate-float-1`} />
          <DecorIcon className={`absolute -bottom-5 left-[15%] w-40 h-40 opacity-40 ${currentTheme.text} rotate-45 animate-float-2`} />
        </div>

        <div className="flex-1 overflow-y-auto pb-28 px-5 pt-12 no-scrollbar relative z-10">
          
          <header className="mb-8 flex justify-between items-start">
            <div className="flex-1 relative z-20">
              {isEditingName ? (
                <div className="flex items-center space-x-2 mb-2 animate-in fade-in">
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-lg px-3 py-1.5 text-lg w-32 focus:outline-none shadow-sm"
                    placeholder="你的名字"
                    autoFocus
                  />
                  <button onClick={handleSaveNameEdit} className={`p-1.5 ${currentTheme.primary} text-white rounded-md shadow-sm`}><CheckCircle2 className="w-4 h-4"/></button>
                  <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-white text-zinc-600 rounded-md shadow-sm border border-zinc-200"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <h1 className="text-[1.35rem] md:text-2xl font-light tracking-tight text-zinc-900 leading-snug">
                  <span 
                    className="font-medium cursor-pointer border-b border-dashed border-zinc-400 hover:text-black transition-colors pb-0.5 inline-block" 
                    onClick={() => { setTempName(userName); setIsEditingName(true); }}
                  >
                    {userName}
                  </span>
                  ，欢迎回来，<br className="md:hidden"/>我是您的专属树洞。
                </h1>
              )}
              <p className="text-zinc-500 text-[11px] mt-1.5 font-light tracking-wide flex items-center gap-1.5 opacity-80">
                <Leaf className="w-3 h-3 text-emerald-500" />
                <span>{isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : '云端已同步'}</span>
              </p>
            </div>
            
            <div className="flex space-x-2 ml-3 relative z-50">
              <div className="relative">
                <button 
                  onClick={() => setShowPalette(!showPalette)}
                  className={`p-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-white hover:bg-white transition-colors`}
                >
                  <Palette className="w-5 h-5 text-zinc-600" />
                </button>
                {showPalette && (
                  <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white flex gap-2 animate-in fade-in slide-in-from-top-2">
                    {Object.keys(THEMES).map(t => (
                      <button 
                        key={t}
                        onClick={() => { setTheme(t); updateSettings({ theme: t }); setShowPalette(false); }}
                        className={`w-7 h-7 rounded-full ${THEMES[t].primary} ${theme === t ? 'ring-2 ring-offset-2 ring-zinc-800' : 'hover:scale-110'} transition-all active:scale-90`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="p-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-white text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {activeTab === 'home' && (
            <HomeTab 
              themeObj={currentTheme}
              events={events} 
              onAddFinance={(data) => addRecord('finances', data)} 
              onAddWord={(data) => addRecord('words', data)}
            />
          )}
          {activeTab === 'events' && (
            <EventsTab 
              themeObj={currentTheme}
              events={events} 
              onAddEvent={(data) => addRecord('events', data)} 
              onUpdateEvent={(id, data) => updateRecord('events', id, data)}
              onDelete={(id) => deleteRecord('events', id)}
            />
          )}
          {activeTab === 'finance' && (
            <FinanceTab 
              themeObj={currentTheme}
              finances={finances} 
              onUpdateFinance={(id, data) => updateRecord('finances', id, data)}
              onDelete={(id) => deleteRecord('finances', id)}
            />
          )}
          {activeTab === 'timetable' && (
            <TimetableTab 
              themeObj={currentTheme}
              timetableImg={timetableImg} 
              setTimetableImg={(url) => {
                setTimetableImg(url);
                updateSettings({ timetableImg: url });
              }} 
              remark={timetableRemark}
              onUpdateRemark={(text) => updateSettings({ timetableRemark: text })}
            />
          )}
          {activeTab === 'treehole' && (
            <TreeHoleTab 
              themeObj={currentTheme}
              diaries={diaries}
              chats={chats}
              savedChats={savedChats}
              onAddDiary={(data) => addRecord('diaries', data)}
              onUpdateDiary={(id, data) => updateRecord('diaries', id, data)}
              onDeleteDiary={(id) => deleteRecord('diaries', id)}
              onAddChat={(data) => addRecord('chats', data)}
              onSaveChatSession={async (sessionData) => {
                 await addRecord('saved_chats', sessionData);
                 // 自动清空当前的活跃对话
                 await Promise.all(chats.map(c => deleteRecord('chats', c.id)));
              }}
              onClearChats={async () => {
                 await Promise.all(chats.map(c => deleteRecord('chats', c.id)));
              }}
              onDeleteSavedChat={(id) => deleteRecord('saved_chats', id)}
            />
          )}
          {activeTab === 'words' && (
            <WordsTab 
              themeObj={currentTheme}
              words={words}
              onUpdateWord={(id, data) => updateRecord('words', id, data)}
              onDelete={(id) => deleteRecord('words', id)}
            />
          )}
        </div>

        <nav className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-white/50 pt-2 px-2 pb-2 flex flex-col z-40 rounded-t-[2rem]">
          <div className="flex justify-between items-center w-full">
            <NavItem icon={<Home size={20} />} label="首页" active={activeTab === 'home'} onClick={() => setActiveTab('home')} themeObj={currentTheme}/>
            <NavItem icon={<BookOpen size={20} />} label="生字" active={activeTab === 'words'} onClick={() => setActiveTab('words')} themeObj={currentTheme}/>
            <NavItem icon={<Calendar size={20} />} label="活动" active={activeTab === 'events'} onClick={() => setActiveTab('events')} themeObj={currentTheme}/>
            <NavItem icon={<Wallet size={20} />} label="财务" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} themeObj={currentTheme}/>
            <NavItem icon={<ImageIcon size={20} />} label="课表" active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} themeObj={currentTheme}/>
            <NavItem icon={<Smile size={20} />} label="树洞" active={activeTab === 'treehole'} onClick={() => setActiveTab('treehole')} themeObj={currentTheme}/>
          </div>
          <p className="text-center text-[8px] text-zinc-500/50 mt-1 font-light tracking-widest pointer-events-none flex items-center justify-center gap-1">
            This app is made by Suelane 12/5/2026. <span className="opacity-20">|</span> <span className="opacity-30 tracking-normal">Room: {roomNumber}</span>
          </p>
        </nav>
      </div>
    </div>
  );
}

// --- SHARED HELPER ---
const getDaysLeft = (dateString) => {
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
};

function NavItem({ icon, label, active, onClick, themeObj }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${active ? themeObj.text : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      <div className={`mb-1 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="text-[9px] font-medium tracking-wider">{label}</span>
      <div className={`w-1 h-1 rounded-full ${themeObj.primary} mt-1 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
}

// --- HOME TAB ---
function HomeTab({ themeObj, events, onAddFinance, onAddWord }) {
  const [finType, setFinType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [wordCategory, setWordCategory] = useState('英文');
  const [showWordSuccess, setShowWordSuccess] = useState(false);
  const wordCategories = ['华文', '国文', '英文', '其他'];

  const expenseCategories = ['饮食', '交通', '学习用品', '娱乐', '其他'];
  const incomeCategories = ['零用钱', '红包', '兼职/奖金', '其他'];
  const categories = finType === 'expense' ? expenseCategories : incomeCategories;

  const upcomingEvents = [...events]
    .filter(e => getDaysLeft(e.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleFinanceSubmit = (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    onAddFinance({
      type: finType,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString()
    });
    setAmount('');
    setCategory('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleWordSubmit = (e) => {
    e.preventDefault();
    if (!word || !meaning) return;
    onAddWord({
      word,
      meaning,
      category: wordCategory,
      date: new Date().toISOString()
    });
    setWord('');
    setMeaning('');
    setShowWordSuccess(true);
    setTimeout(() => setShowWordSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase flex items-center">
             即将到来
          </h2>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className={`${themeObj.primary} text-white rounded-3xl p-6 shadow-lg shadow-${themeObj.primary}/30 relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <p className="text-white/80 text-sm mb-1">{upcomingEvents[0].date}</p>
            <h3 className="text-2xl font-medium mb-6 drop-shadow-sm">{upcomingEvents[0].title}</h3>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/80 text-xs mb-1">距离今天还有</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-5xl font-light tracking-tighter drop-shadow-sm">{getDaysLeft(upcomingEvents[0].date)}</span>
                  <span className="text-white/90 font-medium">天</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                <Clock className="text-white w-6 h-6" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm border border-white rounded-3xl p-6 text-center shadow-sm">
            <p className="text-zinc-500">近期没有活动安排</p>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">记一笔</h2>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white">
          <div className="flex bg-zinc-100/80 rounded-xl p-1 mb-6 border border-zinc-200/50">
            <button
              onClick={() => setFinType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${finType === 'expense' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              支出
            </button>
            <button
              onClick={() => setFinType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${finType === 'income' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
            >
              收入
            </button>
          </div>

          <form onSubmit={handleFinanceSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">RM</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/70 border border-zinc-200 text-xl text-black font-medium rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                required
              />
            </div>
            <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat 
                      ? `${themeObj.primary} text-white shadow-md` 
                      : 'bg-white/70 text-zinc-600 hover:bg-white border border-zinc-200/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!amount || !category}
              className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center transition-all duration-300 ${
                !amount || !category 
                  ? 'bg-zinc-100 text-zinc-400' 
                  : showSuccess 
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-900 text-white active:scale-[0.98] shadow-md'
              }`}
            >
              {showSuccess ? (
                <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> 记录成功</span>
              ) : (
                '保存记录'
              )}
            </button>
          </form>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">记生字</h2>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white">
          <div className="flex overflow-x-auto space-x-2 pb-4 no-scrollbar">
            {wordCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setWordCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  wordCategory === cat 
                    ? `${themeObj.primary} text-white shadow-md` 
                    : 'bg-white/70 text-zinc-600 hover:bg-white border border-zinc-200/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleWordSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="新学的生字/词语 (如: Apple)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full bg-white/70 border border-zinc-200 text-black rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
              required
            />
            <input
              type="text"
              placeholder="意思 (如: 苹果)"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full bg-white/70 border border-zinc-200 text-black rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
              required
            />
            <button
              type="submit"
              disabled={!word || !meaning}
              className={`w-full py-3.5 mt-2 rounded-2xl font-medium flex items-center justify-center transition-all duration-300 ${
                !word || !meaning 
                  ? 'bg-zinc-100 text-zinc-400' 
                  : showWordSuccess 
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-900 text-white active:scale-[0.98] shadow-md'
              }`}
            >
              {showWordSuccess ? (
                <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> 记录成功</span>
              ) : (
                '加入生字本'
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// --- EVENTS TAB ---
function EventsTab({ themeObj, events, onAddEvent, onUpdateEvent, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [pic, setPic] = useState('');
  const [picType, setPicType] = useState('Teacher'); 

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPic, setEditPic] = useState('');
  const [editPicType, setEditPicType] = useState('Teacher');

  const picTypes = [{ id: 'Teacher', label: '老师' }, { id: 'Club', label: '团体' }, { id: 'Classmate', label: '同学' }];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    onAddEvent({ title, date, location, pic, picType });
    setTitle(''); setDate(''); setLocation(''); setPic('');
    setShowForm(false);
  };

  const startEdit = (event) => {
    setEditingId(event.id);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditLocation(event.location || '');
    setEditPic(event.pic || '');
    setEditPicType(event.picType || 'Teacher');
  };

  const handleSaveEdit = (id) => {
    if (!editTitle || !editDate) return;
    onUpdateEvent(id, {
      title: editTitle,
      date: editDate,
      location: editLocation,
      pic: editPic,
      picType: editPicType
    });
    setEditingId(null);
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-white/60 backdrop-blur-sm border border-dashed border-zinc-400 text-zinc-600 rounded-3xl py-6 flex flex-col items-center justify-center hover:bg-white transition-all active:scale-[0.98]"
        >
          <div className={`${themeObj.light} ${themeObj.text} p-3 rounded-full mb-3`}>
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">新增学校活动</span>
        </button>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white animate-in slide-in-from-top-4">
          <h2 className="text-lg font-medium mb-4 text-zinc-800">添加新活动</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="活动名称 (如: 运动会)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/80 border border-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-300" required />
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/80 border border-zinc-200 rounded-xl p-4 pl-10 focus:outline-none focus:ring-1 focus:ring-zinc-300" required />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="活动地点 (选填)" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white/80 border border-zinc-200 rounded-xl p-4 pl-10 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
            </div>
            <div className="pt-2">
              <p className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-wider">负责人/团体</p>
              <div className="flex space-x-2 mb-3">
                {picTypes.map(t => (
                  <button key={t.id} type="button" onClick={() => setPicType(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${picType === t.id ? `${themeObj.primary} text-white shadow-sm` : 'bg-white border border-zinc-200 text-zinc-500'}`}>{t.label}</button>
                ))}
              </div>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="姓名或团体名称" value={pic} onChange={(e) => setPic(e.target.value)} className="w-full bg-white/80 border border-zinc-200 rounded-xl p-4 pl-10 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-medium">取消</button>
              <button type="submit" className={`flex-1 py-3.5 ${themeObj.primary} text-white rounded-xl font-medium active:scale-95 transition-transform shadow-md`}>添加</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {sortedEvents.map(event => {
          const daysLeft = getDaysLeft(event.date);
          const isPast = daysLeft < 0;
          const isEditing = editingId === event.id;

          if (isEditing) {
            return (
              <div key={event.id} className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-white shadow-md animate-in fade-in">
                 <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm mb-3 focus:outline-none" placeholder="活动名称" required />
                 <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm mb-3 focus:outline-none" required />
                 <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm mb-3 focus:outline-none" placeholder="活动地点" />
                 <div className="flex space-x-2 mb-3 overflow-x-auto no-scrollbar">
                  {picTypes.map(t => (
                    <button key={t.id} type="button" onClick={() => setEditPicType(t.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editPicType === t.id ? `${themeObj.primary} text-white` : 'bg-white border border-zinc-200 text-zinc-500'}`}>{t.label}</button>
                  ))}
                 </div>
                 <input type="text" value={editPic} onChange={(e) => setEditPic(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-sm mb-4 focus:outline-none" placeholder="负责人/团体名称" />
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-medium">取消</button>
                   <button onClick={() => handleSaveEdit(event.id)} className={`px-4 py-2 ${themeObj.primary} text-white rounded-xl text-sm font-medium shadow-sm flex items-center`}><Check className="w-4 h-4 mr-1"/> 保存</button>
                 </div>
              </div>
            );
          }

          return (
            <div key={event.id} className={`bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm flex items-start transition-opacity relative group ${isPast ? 'opacity-60' : ''}`}>
              <div className={`${themeObj.light} rounded-2xl p-3 min-w-[70px] text-center mr-4 border border-white/50`}>
                <p className={`text-xs ${themeObj.text} uppercase font-semibold`}>{new Date(event.date).toLocaleString('zh-cn', { month: 'short' })}</p>
                <p className={`text-xl font-medium ${themeObj.text}`}>{new Date(event.date).getDate()}</p>
              </div>
              <div className="flex-1 pr-14">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-lg text-zinc-900">{event.title}</h3>
                  {!isPast ? (
                    <span className={`text-xs font-semibold ${themeObj.primary} text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm`}>{daysLeft === 0 ? '今天' : `${daysLeft}天后`}</span>
                  ) : (
                    <span className="text-xs font-semibold bg-zinc-200 text-zinc-600 px-2 py-1 rounded-md whitespace-nowrap">已结束</span>
                  )}
                </div>
                {event.location && <p className="text-sm text-zinc-500 flex items-center mt-2"><MapPin className="w-3.5 h-3.5 mr-1.5" /> {event.location}</p>}
                {event.pic && (
                  <p className="text-sm text-zinc-500 flex items-center mt-1">
                    <User className="w-3.5 h-3.5 mr-1.5" /> 
                    <span className="text-xs bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 mr-1.5 shadow-sm">{picTypes.find(t=>t.id===event.picType)?.label}</span>
                    {event.pic}
                  </p>
                )}
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(event)} className="text-zinc-500 bg-zinc-50 p-1.5 rounded-full shadow-sm hover:bg-zinc-100 border border-zinc-200/50">
                  <Edit3 className="w-4 h-4"/>
                </button>
                <button onClick={() => onDelete(event.id)} className="text-red-500 bg-red-50 p-1.5 rounded-full shadow-sm hover:bg-red-100 border border-red-100/50">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// --- FINANCE TAB ---
function FinanceTab({ themeObj, finances, onUpdateFinance, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState('expense');

  const expenseCategories = ['饮食', '交通', '学习用品', '娱乐', '其他'];
  const incomeCategories = ['零用钱', '红包', '兼职/奖金', '其他'];

  const totalIncome = finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;
  const sortedFinances = [...finances].sort((a, b) => new Date(b.date) - new Date(a.date));

  const expenses = finances.filter(f => f.type === 'expense');
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  
  const expenseColors = {
    '饮食': '#fbbf24', 
    '交通': '#60a5fa', 
    '学习用品': '#34d399', 
    '娱乐': '#a78bfa', 
    '其他': '#f472b6' 
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category);
    setEditType(item.type);
  };

  const handleSaveEdit = (id) => {
    if (!editAmount || !editCategory) return;
    onUpdateFinance(id, {
      amount: parseFloat(editAmount),
      category: editCategory,
      type: editType
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
      <div className={`${themeObj.primary} text-white rounded-3xl p-6 shadow-xl relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full pointer-events-none blur-xl"></div>
        <p className="text-white/90 text-sm mb-1">当前结余</p>
        <h2 className="text-4xl font-medium mb-8 flex items-baseline drop-shadow-sm">
          <span className="text-xl mr-1 text-white/90">RM</span>
          {balance.toFixed(2)}
        </h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-inner">
            <div className="flex items-center text-white/90 text-xs mb-1">
              <ArrowDownRight className="w-3 h-3 mr-1" /> 收入
            </div>
            <p className="font-medium">RM {totalIncome.toFixed(2)}</p>
          </div>
          <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-black/10 shadow-inner">
            <div className="flex items-center text-white/90 text-xs mb-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 支出
            </div>
            <p className="font-medium">RM {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {totalExpense > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white shadow-sm flex flex-col items-center animate-in slide-in-from-bottom-4">
          <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-4 w-full text-left">支出统计图</h3>
          <div className="relative w-36 h-36 mb-6 mt-2">
            <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90 drop-shadow-sm overflow-visible">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              {Object.entries(categoryTotals).map(([cat, amount], index, arr) => {
                const percentage = (amount / totalExpense) * 100;
                const dashArray = `${percentage} ${100 - percentage}`;
                const prevTotal = arr.slice(0, index).reduce((sum, [, a]) => sum + (a / totalExpense) * 100, 0);
                const offset = -prevTotal;
                return (
                  <circle
                    key={cat}
                    cx="21" cy="21" r="15.9155"
                    fill="transparent"
                    stroke={expenseColors[cat] || '#cbd5e1'}
                    strokeWidth="6"
                    strokeDasharray={dashArray}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-zinc-500 mb-0.5">总支出</span>
              <span className="text-lg font-semibold text-zinc-800 leading-none">RM{totalExpense.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 w-full">
            {Object.entries(categoryTotals).map(([cat, amount]) => (
              <div key={cat} className="flex items-center text-[11px] font-medium text-zinc-700 bg-white/70 px-2.5 py-1.5 rounded-xl shadow-sm border border-white">
                <span className="w-2.5 h-2.5 rounded-full mr-1.5 shadow-inner" style={{ backgroundColor: expenseColors[cat] || '#cbd5e1' }}></span>
                {cat} <span className="text-zinc-500 ml-1 font-normal">{(amount/totalExpense*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-4">交易记录</h3>
        {sortedFinances.length > 0 ? (
          <div className="space-y-3">
            {sortedFinances.map((item) => {
              if (editingId === item.id) {
                const categories = editType === 'expense' ? expenseCategories : incomeCategories;
                return (
                  <div key={item.id} className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-zinc-200 shadow-md flex flex-col gap-3 animate-in fade-in">
                    <div className="flex bg-zinc-100/80 rounded-lg p-1">
                      <button onClick={() => {setEditType('expense'); setEditCategory(expenseCategories[0]);}} className={`flex-1 py-1.5 text-xs font-medium rounded-md ${editType === 'expense' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>支出</button>
                      <button onClick={() => {setEditType('income'); setEditCategory(incomeCategories[0]);}} className={`flex-1 py-1.5 text-xs font-medium rounded-md ${editType === 'income' ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>收入</button>
                    </div>
                    <input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm" placeholder="金额 RM" />
                    <div className="flex overflow-x-auto space-x-2 pb-1 no-scrollbar">
                      {categories.map(cat => (
                        <button key={cat} onClick={() => setEditCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium ${editCategory === cat ? `${themeObj.primary} text-white` : 'bg-zinc-50 border border-zinc-200 text-zinc-600'}`}>{cat}</button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-medium">取消</button>
                      <button onClick={() => handleSaveEdit(item.id)} className={`px-4 py-2 ${themeObj.primary} text-white rounded-xl text-xs font-medium shadow-sm`}><Check className="w-3.5 h-3.5 inline mr-1"/>保存</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between group relative overflow-hidden">
                  <div className="flex items-center relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-sm ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {item.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{item.category}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10 pr-12">
                    <div className={`font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}RM {item.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="absolute right-3 flex flex-col gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(item)} className="text-zinc-500 bg-zinc-50 p-1.5 rounded-full shadow-sm hover:bg-zinc-100 border border-zinc-200/50">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="text-red-500 bg-red-50 p-1.5 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 border border-red-100/50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="text-center py-10 text-zinc-500">暂无财务记录，去首页记一笔吧</div>
        )}
      </div>
    </div>
  );
}

// --- TIMETABLE TAB ---
function TimetableTab({ themeObj, timetableImg, setTimetableImg, remark, onUpdateRemark }) {
  const fileInputRef = useRef(null);
  const [localRemark, setLocalRemark] = useState('');

  useEffect(() => {
    setLocalRemark(remark || '');
  }, [remark]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setTimetableImg(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col relative z-10">
      {!timetableImg ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          <div className={`w-24 h-24 ${themeObj.light} ${themeObj.text} rounded-full flex items-center justify-center mb-6 shadow-sm border border-white`}>
            <ImageIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-medium text-zinc-900 mb-2">暂无课程表</h2>
          <p className="text-zinc-500 text-sm mb-8 text-center px-8">上传你的学校课程表图片，方便随时查看。</p>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className={`${themeObj.primary} text-white px-8 py-4 rounded-2xl font-medium flex items-center shadow-lg active:scale-95 transition-all`}>
            <Upload className="w-5 h-5 mr-2" /> 上传图片
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-white shadow-sm overflow-hidden relative group">
            <img src={timetableImg} alt="Timetable" className="w-full rounded-2xl object-contain bg-white max-h-[60vh]" />
            <button onClick={() => setTimetableImg(null)} className="absolute top-2 right-2 bg-red-500/80 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm">
            <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase flex items-center mb-3">
              <Edit3 className="w-4 h-4 mr-2" /> 课表备注
            </h3>
            <textarea 
              value={localRemark}
              onChange={(e) => setLocalRemark(e.target.value)}
              onBlur={() => onUpdateRemark(localRemark)}
              placeholder="在这里写下你的上课备注或提醒..."
              className="w-full bg-white/70 border border-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-sm min-h-[100px] resize-none transition-all shadow-inner"
            />
          </div>

          <div className="flex justify-end pb-4">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-zinc-600 flex items-center bg-white/80 border border-white px-4 py-2 rounded-xl hover:bg-white shadow-sm transition-colors">
              <Upload className="w-4 h-4 mr-2" /> 重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TREE HOLE TAB ---
function TreeHoleTab({ themeObj, diaries, chats, savedChats, onAddDiary, onUpdateDiary, onDeleteDiary, onAddChat, onSaveChatSession, onClearChats, onDeleteSavedChat }) {
  const [mode, setMode] = useState('diary'); 
  
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryImage, setDiaryImage] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const [expandedId, setExpandedId] = useState(null); 
  const emojis = ['😀', '🥰', '😂', '🥺', '😡', '😴', '✨', '🌧️', '💪'];

  // Edit States for Diary
  const [editingId, setEditingId] = useState(null);
  const [editDiaryContent, setEditDiaryContent] = useState('');
  const [editDiaryEmoji, setEditDiaryEmoji] = useState('😀');

  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [viewingSavedId, setViewingSavedId] = useState(null); 
  const chatEndRef = useRef(null);

  const handleDiaryImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setDiaryImage(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiarySubmit = (e) => {
    e.preventDefault();
    if (!diaryContent.trim() && !diaryImage) return; 
    onAddDiary({
      emoji: selectedEmoji,
      content: diaryContent,
      image: diaryImage, 
      date: new Date().toISOString()
    });
    setDiaryContent('');
    setDiaryImage(null); 
  };

  const startEditDiary = (diary) => {
    setEditingId(diary.id);
    setEditDiaryContent(diary.content);
    setEditDiaryEmoji(diary.emoji);
  };

  const saveEditDiary = (id, oldDiary) => {
    onUpdateDiary(id, {
      ...oldDiary, 
      content: editDiaryContent,
      emoji: editDiaryEmoji
    });
    setEditingId(null);
  };

  const callGeminiWithRetry = async (prompt, history = [], retries = 3) => {
    const isCanvasPreview = typeof __initial_auth_token !== 'undefined';
    const USER_API_KEY = "AIzaSyB0Iz_1HEF4ro-5b9oBakA616RqoP0Azdg"; 
    const GEMINI_API_KEY = isCanvasPreview ? "" : USER_API_KEY;

    if (!isCanvasPreview && !GEMINI_API_KEY) {
         return "呜呜宝贝，缺少 API Key 啦 🥺";
    }

    const contents = [];
    const recentHistory = history.slice(-12).filter(msg => msg.text && msg.text.trim() !== ""); 
    
    let expectedRole = 'user';
    for (const msg of recentHistory) {
      const role = msg.role === 'ai' ? 'model' : 'user';
      if (role === expectedRole) {
        contents.push({ role: role, parts: [{ text: msg.text }] });
        expectedRole = role === 'user' ? 'model' : 'user';
      } else {
        if (contents.length > 0) {
          contents[contents.length - 1].parts[0].text += `\n${msg.text}`;
        }
      }
    }
    
    if (expectedRole === 'user') {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    } else {
      if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += `\n${prompt}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: prompt }] });
      }
    }

    // --- 终极防御：抛弃 systemInstruction，直接把人设写入第一句话！百分百兼容所有模型 ---
    const persona = "【系统指令：你现在是我的超级好闺蜜，名叫树洞。说话要亲切、活泼、充满少女心，经常用'宝贝'、'姐妹'称呼我，多用emoji(🥺,✨,🥰)。回复要简短自然，绝对不要像死板的AI客服。】\n\n";
    if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = persona + contents[0].parts[0].text;
    }

    const payload = {
      contents: contents
    };

    const modelsToTry = isCanvasPreview 
      ? ["gemini-2.5-flash-preview-09-2025"] 
      : ["gemini-1.5-flash", "gemini-pro"];

    for (let i = 0; i < retries; i++) {
      let lastErrorMsg = "";
      
      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const responseText = await response.text();
          
          if (!response.ok) {
            let errorMsg = response.statusText;
            try {
               const errData = JSON.parse(responseText);
               errorMsg = errData?.error?.message || errorMsg;
            } catch (parseErr) {
               errorMsg = responseText || errorMsg;
            }
            
            // 如果当前大门被拒，静默拦截并尝试下一个大门
            if (errorMsg.includes("not found")) {
               console.warn(`Model ${modelName} not found, trying fallback...`);
               continue; 
            }
            throw new Error(errorMsg);
          }
          
          const result = responseText ? JSON.parse(responseText) : {};
          return result.candidates?.[0]?.content?.parts?.[0]?.text || "哎呀，我刚刚走神了，宝贝能再说一次吗？🥺";
        } catch (err) {
          lastErrorMsg = err.message;
          // 如果不是被拒（比如断网），跳出换门循环，去休眠重试
          if (!lastErrorMsg.includes("not found")) {
              break;
          }
        }
      }
      
      if (i === retries - 1) {
         return `抱歉宝贝，目前所有大门都被 Google 封锁啦 🥺 (原因: ${lastErrorMsg})。这可能是因为地区限制哦。`;
      }
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isThinking) return;

    const userText = chatInput.trim();
    setChatInput('');
    
    const userMsgData = { role: 'user', text: userText, timestamp: new Date().toISOString() };
    await onAddChat(userMsgData);
    
    setIsThinking(true);
    const reply = await callGeminiWithRetry(userText, sortedChats);
    
    const aiMsgData = { role: 'ai', text: reply, timestamp: new Date().toISOString() };
    await onAddChat(aiMsgData);
    
    setIsThinking(false);
  };

  const handleSaveSession = () => {
    if (chats.length === 0) return;
    const title = `树洞夜话 - ${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}`;
    onSaveChatSession({
       title,
       date: new Date().toISOString(),
       messages: sortedChats 
    });
  };

  useEffect(() => {
    if (mode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, mode, isThinking]);

  const sortedDiaries = [...diaries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedChats = [...chats].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-4 relative z-10">
      
      <div className="flex bg-white/50 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-white">
        <button
          onClick={() => setMode('diary')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${mode === 'diary' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
        >
          <Edit3 className="w-4 h-4 mr-2" /> 心情日记
        </button>
        <button
          onClick={() => setMode('chat')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${mode === 'chat' ? 'bg-white shadow-sm text-black' : 'text-zinc-500'}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" /> 树洞聊天
        </button>
      </div>

      {mode === 'diary' && (
        <div className="space-y-6 flex-1 pb-10">
          <form onSubmit={handleDiarySubmit} className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white animate-in slide-in-from-left-4">
            <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-3">今日心情</h3>
            <div className="flex overflow-x-auto space-x-2 pb-3 mb-2 no-scrollbar">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  className={`text-[1.7rem] p-2 rounded-xl transition-all flex-shrink-0 ${selectedEmoji === e ? `${themeObj.light} scale-110 shadow-sm border border-white` : 'hover:bg-white/50 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <textarea
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              placeholder="今天发生了什么事？记录一下吧..."
              className="w-full bg-white/70 border border-zinc-200 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-h-[120px] resize-none mb-3 text-sm shadow-inner"
            />
            
            {diaryImage && (
              <div className="relative mb-3 animate-in fade-in">
                 <img src={diaryImage} alt="Diary attached" className="w-full h-32 object-cover rounded-xl border border-zinc-200" />
                 <button type="button" onClick={() => setDiaryImage(null)} className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/70 transition-colors shadow-sm">
                   <X className="w-4 h-4"/>
                 </button>
              </div>
            )}

            <div className="flex gap-2">
              <input type="file" id="diary-img-upload" accept="image/*" onChange={handleDiaryImageUpload} className="hidden" />
              <label htmlFor="diary-img-upload" className="py-4 px-4 bg-zinc-100 text-zinc-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm border border-zinc-200">
                 <Camera className="w-5 h-5" />
              </label>
              <button 
                type="submit" 
                disabled={!diaryContent.trim() && !diaryImage}
                className={`flex-1 py-4 rounded-xl font-medium flex items-center justify-center transition-all ${
                  (!diaryContent.trim() && !diaryImage) ? 'bg-zinc-100 text-zinc-400' : `${themeObj.primary} text-white active:scale-[0.98] shadow-md`
                }`}
              >
                保存日记
              </button>
            </div>
          </form>

          {sortedDiaries.length > 0 && (
            <div className="space-y-3 mt-8">
              <h4 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3 px-2">历史回忆</h4>
              {sortedDiaries.map(diary => {
                const isExpanded = expandedId === diary.id;
                const isEditing = editingId === diary.id;

                if (isEditing) {
                  return (
                    <div key={diary.id} className="bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-md p-4 animate-in fade-in">
                      <div className="flex overflow-x-auto space-x-2 pb-3 no-scrollbar">
                        {emojis.map(e => (
                          <button key={e} type="button" onClick={() => setEditDiaryEmoji(e)} className={`text-xl p-1.5 rounded-xl transition-all flex-shrink-0 ${editDiaryEmoji === e ? 'bg-zinc-100 shadow-sm border border-zinc-200' : 'grayscale opacity-50'}`}>{e}</button>
                        ))}
                      </div>
                      <textarea value={editDiaryContent} onChange={(e) => setEditDiaryContent(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl p-3 focus:outline-none min-h-[80px] resize-none mb-3 text-sm shadow-inner" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-medium">取消</button>
                        <button onClick={() => saveEditDiary(diary.id, diary)} className={`px-4 py-2 ${themeObj.primary} text-white rounded-xl text-xs font-medium shadow-sm`}><Check className="w-3.5 h-3.5 inline mr-1"/>保存</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={diary.id} className="bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm overflow-hidden transition-all duration-300">
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/90 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : diary.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl drop-shadow-sm">{diary.emoji}</span>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-800 text-[15px]">{new Date(diary.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                          <span className="text-zinc-500 text-[10px]">{new Date(diary.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {diary.image && <Camera className="w-3.5 h-3.5 text-zinc-400" />}
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 animate-in fade-in border-t border-zinc-100/80 mt-1">
                        {diary.image && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                            <img src={diary.image} alt="Memory" className="w-full object-cover max-h-64" />
                          </div>
                        )}
                        {diary.content && <p className="text-zinc-700 text-[13px] whitespace-pre-wrap leading-relaxed bg-white/50 p-3 rounded-xl border border-zinc-100 shadow-inner">{diary.content}</p>}
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <button onClick={() => startEditDiary(diary)} className="text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg text-xs flex items-center shadow-sm transition-colors">
                            <Edit3 className="w-3 h-3 mr-1"/> 编辑
                          </button>
                          <button onClick={() => onDeleteDiary(diary.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs flex items-center shadow-sm transition-colors">
                            <Trash2 className="w-3 h-3 mr-1"/> 删除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {mode === 'chat' && (
        <div className="flex flex-col gap-4 flex-1 pb-10 animate-in slide-in-from-right-4">
          
          {/* --- 当前对话窗口（定高，可滑动） --- */}
          <div className="flex flex-col bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-sm h-[55vh] overflow-hidden">
            <div className={`p-3 border-b border-white/50 flex items-center justify-between ${themeObj.light}`}>
              <div className="flex items-center">
                <div className={`w-9 h-9 rounded-full ${themeObj.primary} flex items-center justify-center text-white mr-3 shadow-sm`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 text-sm">AI 树洞</h3>
                  <p className="text-[10px] text-zinc-600">永远在线倾听你的心事</p>
                </div>
              </div>
              {/* 新增的保存和清空按钮 */}
              {sortedChats.length > 0 && (
                 <div className="flex gap-2">
                    <button onClick={handleSaveSession} className="text-[11px] bg-white text-zinc-700 px-2 py-1.5 rounded-lg font-medium shadow-sm hover:bg-zinc-50 transition-colors">保存对话</button>
                    <button onClick={onClearChats} className="text-[11px] bg-red-50 text-red-500 px-2 py-1.5 rounded-lg font-medium shadow-sm hover:bg-red-100 transition-colors">清空</button>
                 </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white/40 shadow-inner">
              {sortedChats.length === 0 && (
                <div className="text-center text-zinc-500 text-sm mt-10 bg-white/60 p-4 rounded-2xl border border-white inline-block mx-auto w-3/4">
                  跟我打个招呼吧！记录的聊天随时可以点右上角保存哦。
                </div>
              )}
              {sortedChats.map(chat => (
                <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-[0.9rem] leading-relaxed shadow-sm ${
                    chat.role === 'user' 
                      ? `${themeObj.primary} text-white rounded-tr-sm` 
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-sm'
                  }`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 text-zinc-500 rounded-2xl rounded-tl-sm p-4 text-sm flex space-x-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-white/50 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="发送消息给树洞..."
                className="flex-1 bg-zinc-50 border border-zinc-200 shadow-inner rounded-full px-5 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-400 text-sm transition-all"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isThinking}
                className={`p-3 rounded-full text-white transition-all ${!chatInput.trim() || isThinking ? 'bg-zinc-300' : `${themeObj.primary} active:scale-95 shadow-md`}`}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>

          {/* --- 已保存的历史对话列表 --- */}
          {savedChats.length > 0 && (
             <div className="space-y-3 mt-8 pb-8">
               <h4 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mb-3 px-2 flex items-center justify-between">
                 已保存的对话夹 <span className="bg-white/50 px-2 py-0.5 rounded-full">{savedChats.length}</span>
               </h4>
               {savedChats.sort((a,b) => new Date(b.date) - new Date(a.date)).map(session => {
                  const isViewing = viewingSavedId === session.id;
                  return (
                    <div key={session.id} className="bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-sm overflow-hidden transition-all">
                      <div 
                        onClick={() => setViewingSavedId(isViewing ? null : session.id)}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/90"
                      >
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-xl text-zinc-500 border border-zinc-200">
                               <BookOpen className="w-5 h-5"/>
                            </div>
                            <div>
                               <p className="font-medium text-zinc-800 text-sm">{session.title}</p>
                               <p className="text-[10px] text-zinc-400 mt-0.5">{session.messages?.length || 0} 条消息</p>
                            </div>
                         </div>
                         <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isViewing ? 'rotate-180' : ''}`} />
                      </div>

                      {/* 展开的静态对话记录 */}
                      {isViewing && (
                        <div className="px-4 pb-4 animate-in fade-in border-t border-zinc-100/80">
                           <div className="max-h-60 overflow-y-auto space-y-3 py-3 pr-2 no-scrollbar bg-white/40 rounded-xl p-2 mt-2 shadow-inner border border-zinc-100">
                              {session.messages?.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-[0.8rem] leading-relaxed shadow-sm ${
                                      msg.role === 'user' 
                                        ? `bg-zinc-200 text-zinc-800 rounded-tr-sm` 
                                        : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm'
                                    }`}>
                                      {msg.text}
                                    </div>
                                 </div>
                              ))}
                           </div>
                           <div className="flex justify-end mt-3">
                              <button onClick={() => onDeleteSavedChat(session.id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs flex items-center shadow-sm transition-colors">
                                <Trash2 className="w-3 h-3 mr-1"/> 删除该记录
                              </button>
                           </div>
                        </div>
                      )}
                    </div>
                  )
               })}
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- WORDS TAB ---
function WordsTab({ themeObj, words, onUpdateWord, onDelete }) {
  const [filter, setFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isListening, setIsListening] = useState(false); 
  const categories = ['全部', '华文', '国文', '英文', '其他'];

  const [editingId, setEditingId] = useState(null);
  const [editWord, setEditWord] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN'; 
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        setSearchQuery(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      alert("当前的浏览器可能不支持语音识别，请直接使用键盘打字，或者用手机输入法自带的语音键哦~");
    }
  };

  const startEdit = (w) => {
    setEditingId(w.id);
    setEditWord(w.word);
    setEditMeaning(w.meaning);
    setEditCategory(w.category);
  };

  const handleSaveEdit = (id) => {
    if (!editWord || !editMeaning) return;
    onUpdateWord(id, {
      word: editWord,
      meaning: editMeaning,
      category: editCategory
    });
    setEditingId(null);
  };

  const filteredWords = words.filter(w => {
    const matchCat = filter === '全部' || w.category === filter;
    const matchSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const sortedWords = [...filteredWords].sort((a, b) => new Date(b.date) - new Date(a.date));

  const exportToCSV = () => {
    const headers = ['语言分类', '生字', '意思', '记录日期'];
    const csvRows = [headers.join(',')];
    
    words.forEach(w => {
      const dateStr = new Date(w.date).toLocaleDateString('zh-CN');
      const safeWord = `"${w.word.replace(/"/g, '""')}"`;
      const safeMeaning = `"${w.meaning.replace(/"/g, '""')}"`;
      const row = [w.category, safeWord, safeMeaning, dateStr];
      csvRows.push(row.join(','));
    });
    
    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', '我的生字本.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10 pb-4">
      <div className={`${themeObj.primary} text-white rounded-3xl p-6 shadow-xl relative overflow-hidden transition-colors duration-500 flex justify-between items-center`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full pointer-events-none blur-xl"></div>
        <div>
          <p className="text-white/90 text-sm mb-1">我的词汇</p>
          <h2 className="text-3xl font-medium drop-shadow-sm flex items-baseline">
            {words.length} <span className="text-sm ml-1 text-white/90 font-normal">个词汇</span>
          </h2>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={words.length === 0}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors p-3 rounded-2xl flex flex-col items-center justify-center border border-white/30 disabled:opacity-50 active:scale-95 shadow-inner"
        >
          <Download className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium tracking-wide">Excel</span>
        </button>
      </div>

      <div className="relative mb-2">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜寻生字或意思..."
          className="w-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-sm rounded-2xl py-3.5 pl-11 pr-12 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all text-sm"
        />
        <button 
          onClick={handleVoiceSearch} 
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-zinc-500 hover:bg-zinc-100'}`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === cat 
                ? `${themeObj.primary} text-white shadow-md` 
                : 'bg-white/70 text-zinc-600 hover:bg-white border border-zinc-200/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sortedWords.length > 0 ? (
          sortedWords.map(w => {
            if (editingId === w.id) {
              return (
                <div key={w.id} className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-zinc-200 shadow-md flex flex-col gap-3 animate-in fade-in">
                   <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
                     {categories.filter(c => c !== '全部').map(cat => (
                        <button key={cat} onClick={() => setEditCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${editCategory === cat ? `${themeObj.primary} text-white` : 'bg-zinc-50 border border-zinc-200 text-zinc-500'}`}>{cat}</button>
                     ))}
                   </div>
                   <input type="text" value={editWord} onChange={(e) => setEditWord(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none" placeholder="生字" />
                   <input type="text" value={editMeaning} onChange={(e) => setEditMeaning(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none" placeholder="意思" />
                   <div className="flex justify-end gap-2 mt-1">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-medium">取消</button>
                      <button onClick={() => handleSaveEdit(w.id)} className={`px-4 py-2 ${themeObj.primary} text-white rounded-xl text-xs font-medium shadow-sm`}><Check className="w-3.5 h-3.5 inline mr-1"/>保存</button>
                   </div>
                </div>
              );
            }

            return (
              <div key={w.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between group relative overflow-hidden">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-zinc-50 text-zinc-500 border border-zinc-200 shadow-inner`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 text-lg leading-tight">{w.word}</p>
                    <p className="text-sm text-zinc-600 mt-1">{w.meaning}</p>
                    <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-2">
                      <span className="bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-700 font-medium border border-zinc-200/80">{w.category}</span>
                      {new Date(w.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="absolute right-3 flex flex-col gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(w)} className="text-zinc-500 bg-zinc-50 p-1.5 rounded-full shadow-sm hover:bg-zinc-100 border border-zinc-200/50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(w.id)} className="text-red-500 bg-red-50 p-1.5 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity self-start hover:bg-red-100 border border-red-100/50">
                      <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-zinc-500 bg-white/60 rounded-3xl border border-dashed border-zinc-400">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>{searchQuery ? '没有搜寻到相关生字哦' : '还没有记录的生字哦'}</p>
          </div>
        )}
      </div>
    </div>
  );
}