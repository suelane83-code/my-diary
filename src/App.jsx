import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Calendar, Wallet, Image as ImageIcon,
  Plus, Clock, MapPin, User, Upload, ArrowDownRight, ArrowUpRight,
  CheckCircle2, Palette, LogOut, Trash2, Loader2,
  Smile, Edit3, X, Bot, Send,
  Leaf, Flower2, Droplets, Sun, Star
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  addDoc, deleteDoc 
} from 'firebase/firestore';

// --- THEME DEFINITIONS ---
const THEMES = {
  blue: { bg: 'bg-blue-50/50', primary: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100', border: 'border-blue-200', gradient: 'from-blue-200 to-blue-50', Decor: Droplets },
  pink: { bg: 'bg-pink-50/50', primary: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100', border: 'border-pink-200', gradient: 'from-pink-200 to-pink-50', Decor: Flower2 },
  yellow: { bg: 'bg-yellow-50/50', primary: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200', gradient: 'from-yellow-200 to-yellow-50', Decor: Sun },
  green: { bg: 'bg-emerald-50/50', primary: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-100', border: 'border-emerald-200', gradient: 'from-emerald-200 to-emerald-50', Decor: Leaf },
  purple: { bg: 'bg-purple-50/50', primary: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100', border: 'border-purple-200', gradient: 'from-purple-200 to-purple-50', Decor: Star },
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState('blue');
  
  // Loading and Setup states
  const [isLoading, setIsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // User details
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Data States
  const [events, setEvents] = useState([]);
  const [finances, setFinances] = useState([]);
  const [timetableImg, setTimetableImg] = useState(null);
  const [timetableRemark, setTimetableRemark] = useState('');
  const [diaries, setDiaries] = useState([]);
  const [chats, setChats] = useState([]);

  // 1. Initialize Auth
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

  // 2. Fetch Data after Login
  useEffect(() => {
    if (!user || !isLoggedIn || !roomNumber) return;

    setIsLoading(true);
    setSettingsLoaded(false);
    const prefix = `room_${roomNumber}`;
    
    // Paths
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_events`);
    const financesRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_finances`);
    const diariesRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_diaries`);
    const chatsRef = collection(db, 'artifacts', appId, 'public', 'data', `${prefix}_chats`);
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', `${prefix}_settings`, 'config');

    // Listeners
    const unsubEvents = onSnapshot(eventsRef, (snap) => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubFinances = onSnapshot(financesRef, (snap) => setFinances(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubDiaries = onSnapshot(diariesRef, (snap) => setDiaries(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubChats = onSnapshot(chatsRef, (snap) => setChats(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    
    // Settings listener
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme) setTheme(data.theme);
        if (data.timetableImg) setTimetableImg(data.timetableImg);
        if (data.timetableRemark !== undefined) setTimetableRemark(data.timetableRemark);
        if (data.userName !== undefined) setUserName(data.userName);
      } else {
        setUserName('');
      }
      setSettingsLoaded(true);
      setIsLoading(false);
    }, (err) => { console.error(err); setIsLoading(false); });

    return () => {
      unsubEvents(); unsubFinances(); unsubDiaries(); unsubChats(); unsubSettings();
    };
  }, [user, isLoggedIn, roomNumber]);

  // Firebase Helpers
  const addRecord = async (colName, data) => {
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_${colName}`);
    await addDoc(colRef, data);
  };
  const deleteRecord = async (colName, id) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_${colName}`, id);
    await deleteDoc(docRef);
  };
  const updateSettings = async (data) => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', `room_${roomNumber}_settings`, 'config');
    await setDoc(docRef, data, { merge: true });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (roomNumber.trim().length > 0) setIsLoggedIn(true);
  };

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    updateSettings({ userName: tempName.trim() });
    setUserName(tempName.trim());
    setIsEditingName(false);
  };

  const handleFirstTimeNameSubmit = (e) => {
    e.preventDefault();
    handleSaveName();
  };

  const currentTheme = THEMES[theme];
  const DecorIcon = currentTheme.Decor;

  // ---------------------------------------------
  // SCREEN 1: LOGIN / LOGOUT SCREEN
  // ---------------------------------------------
  if (!isLoggedIn) {
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
            <p className="text-zinc-500 text-sm mb-8">输入专属房号，打开你的秘密空间</p>
            
            <form onSubmit={handleLogin} className="space-y-4 w-full">
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
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-medium active:scale-95 transition-all shadow-md shadow-zinc-900/20"
              >
                进入房间
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // SCREEN 2: FIRST TIME NAME SETUP
  // ---------------------------------------------
  if (settingsLoaded && !userName) {
    return (
      <div className={`flex justify-center bg-gray-100 min-h-screen font-sans`}>
        <style>{floatingStyles}</style>
        <div className={`w-full max-w-md ${currentTheme.bg} min-h-screen shadow-2xl relative flex flex-col justify-center items-center p-8 transition-colors duration-500 overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 animate-float-1 bg-gradient-to-br ${currentTheme.gradient}`}></div>
          <div className={`absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-40 animate-float-2 bg-gradient-to-tr ${currentTheme.gradient}`}></div>

          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white relative z-10 w-full animate-in fade-in slide-in-from-bottom-8">
            <div className={`w-16 h-16 rounded-full ${currentTheme.light} flex items-center justify-center mb-6 mx-auto`}>
              <Smile className={`w-8 h-8 ${currentTheme.text}`} />
            </div>
            <h2 className="text-2xl font-medium text-center text-zinc-900 mb-2">初次见面</h2>
            <p className="text-center text-zinc-500 text-sm mb-8">我是你的树洞管家，请问我该怎么称呼你呢？</p>

            <form onSubmit={handleFirstTimeNameSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="输入你的昵称/名字"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-center text-xl text-black rounded-xl p-4 focus:outline-none focus:border-zinc-400 transition-colors shadow-sm"
                autoFocus
                required
              />
              <button 
                type="submit"
                className={`w-full ${currentTheme.primary} text-white py-4 rounded-xl font-medium active:scale-95 transition-transform shadow-md`}
              >
                开始体验
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // SCREEN 3: MAIN APP INTERFACE
  // ---------------------------------------------
  return (
    <div className={`flex justify-center bg-gray-100 min-h-screen`}>
      <style>{floatingStyles}</style>
      
      {/* Mobile Container */}
      <div className={`w-full max-w-md ${currentTheme.bg} min-h-screen shadow-2xl relative flex flex-col text-zinc-900 font-sans transition-colors duration-500 overflow-hidden`}>
        
        {/* Animated Background Gradients */}
        <div className={`absolute top-10 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-1 bg-gradient-to-br ${currentTheme.gradient}`}></div>
        <div className={`absolute bottom-20 left-0 w-56 h-56 rounded-full blur-3xl opacity-40 pointer-events-none animate-float-2 bg-gradient-to-tr ${currentTheme.gradient}`}></div>

        {/* --- DYNAMIC BACKGROUND PATTERN --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <DecorIcon className={`absolute top-[10%] -left-10 w-48 h-48 opacity-[0.03] ${currentTheme.text} rotate-12 animate-float-2`} />
          <DecorIcon className={`absolute top-[40%] -right-16 w-64 h-64 opacity-[0.03] ${currentTheme.text} -rotate-12 animate-float-1`} />
          <DecorIcon className={`absolute -bottom-5 left-[15%] w-40 h-40 opacity-[0.03] ${currentTheme.text} rotate-45 animate-float-2`} />
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-28 px-5 pt-12 no-scrollbar relative z-10">
          
          {/* Header */}
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
                  <button onClick={handleSaveName} className={`p-1.5 ${currentTheme.primary} text-white rounded-md shadow-sm`}><CheckCircle2 className="w-4 h-4"/></button>
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
              <p className="text-zinc-400 text-[11px] mt-1.5 font-light tracking-wide flex items-center gap-1.5 opacity-80">
                <Leaf className="w-3 h-3 text-emerald-400" />
                <span>房号: {roomNumber}</span>
                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                <span>{isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : '已同步'}</span>
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
                {/* Theme Dropdown */}
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
              <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm border border-white text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Tab Contents */}
          {activeTab === 'home' && (
            <HomeTab 
              themeObj={currentTheme}
              events={events} 
              onAddFinance={(data) => addRecord('finances', data)} 
            />
          )}
          {activeTab === 'events' && (
            <EventsTab 
              themeObj={currentTheme}
              events={events} 
              onAddEvent={(data) => addRecord('events', data)} 
              onDelete={(id) => deleteRecord('events', id)}
            />
          )}
          {activeTab === 'finance' && (
            <FinanceTab 
              themeObj={currentTheme}
              finances={finances} 
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
              onAddDiary={(data) => addRecord('diaries', data)}
              onDeleteDiary={(id) => deleteRecord('diaries', id)}
              onAddChat={(data) => addRecord('chats', data)}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-white/50 pt-2 px-4 pb-2 flex flex-col z-40 rounded-t-[2rem]">
          <div className="flex justify-between items-center w-full">
            <NavItem icon={<Home size={22} />} label="首页" active={activeTab === 'home'} onClick={() => setActiveTab('home')} themeObj={currentTheme}/>
            <NavItem icon={<Calendar size={22} />} label="活动" active={activeTab === 'events'} onClick={() => setActiveTab('events')} themeObj={currentTheme}/>
            <NavItem icon={<Wallet size={22} />} label="财务" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} themeObj={currentTheme}/>
            <NavItem icon={<ImageIcon size={22} />} label="课表" active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')} themeObj={currentTheme}/>
            <NavItem icon={<Smile size={22} />} label="树洞" active={activeTab === 'treehole'} onClick={() => setActiveTab('treehole')} themeObj={currentTheme}/>
          </div>
          <p className="text-center text-[8px] text-zinc-400/40 mt-1 font-light tracking-widest pointer-events-none">This app is made by Suelane 12/5/2026.</p>
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
      className={`flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${active ? themeObj.text : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      <div className={`mb-1 transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wider">{label}</span>
      <div className={`w-1 h-1 rounded-full ${themeObj.primary} mt-1 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
}

// --- HOME TAB ---
function HomeTab({ themeObj, events, onAddFinance }) {
  const [finType, setFinType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase flex items-center">
             即将到来
          </h2>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className={`${themeObj.primary} text-white rounded-3xl p-6 shadow-lg shadow-${themeObj.primary}/20 relative overflow-hidden transition-colors duration-500`}>
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
            <p className="text-zinc-400">近期没有活动安排</p>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">记一笔</h2>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white">
          <div className="flex bg-zinc-100/80 rounded-xl p-1 mb-6">
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
                className="w-full bg-white/50 border border-zinc-100 text-xl text-black font-medium rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
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
                      : 'bg-white/50 text-zinc-600 hover:bg-white'
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
                    : 'bg-zinc-900 text-white active:scale-[0.98]'
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
    </div>
  );
}

// --- EVENTS TAB ---
function EventsTab({ themeObj, events, onAddEvent, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [pic, setPic] = useState('');
  const [picType, setPicType] = useState('Teacher'); 

  const picTypes = [{ id: 'Teacher', label: '老师' }, { id: 'Club', label: '团体' }, { id: 'Classmate', label: '同学' }];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) return;
    onAddEvent({ title, date, location, pic, picType });
    setTitle(''); setDate(''); setLocation(''); setPic('');
    setShowForm(false);
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative z-10">
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full bg-white/60 backdrop-blur-sm border border-dashed border-zinc-300 text-zinc-500 rounded-3xl py-6 flex flex-col items-center justify-center hover:bg-white transition-all active:scale-[0.98]"
        >
          <div className={`${themeObj.light} ${themeObj.text} p-3 rounded-full mb-3`}>
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">新增学校活动</span>
        </button>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white animate-in slide-in-from-top-4">
          <h2 className="text-lg font-medium mb-4">添加新活动</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="活动名称 (如: 运动会)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white border border-zinc-100 rounded-xl p-4 focus:outline-none" required />
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-zinc-100 rounded-xl p-4 pl-10 focus:outline-none" required />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="活动地点 (选填)" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white border border-zinc-100 rounded-xl p-4 pl-10 focus:outline-none" />
            </div>
            <div className="pt-2">
              <p className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-wider">负责人/团体</p>
              <div className="flex space-x-2 mb-3">
                {picTypes.map(t => (
                  <button key={t.id} type="button" onClick={() => setPicType(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${picType === t.id ? `${themeObj.primary} text-white` : 'bg-white border border-zinc-100 text-zinc-500'}`}>{t.label}</button>
                ))}
              </div>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="text" placeholder="姓名或团体名称" value={pic} onChange={(e) => setPic(e.target.value)} className="w-full bg-white border border-zinc-100 rounded-xl p-4 pl-10 focus:outline-none" />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-medium">取消</button>
              <button type="submit" className={`flex-1 py-3.5 ${themeObj.primary} text-white rounded-xl font-medium active:scale-95 transition-transform`}>添加</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {sortedEvents.map(event => {
          const daysLeft = getDaysLeft(event.date);
          const isPast = daysLeft < 0;
          return (
            <div key={event.id} className={`bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm flex items-start transition-opacity relative group ${isPast ? 'opacity-60' : ''}`}>
              <div className={`${themeObj.light} rounded-2xl p-3 min-w-[70px] text-center mr-4`}>
                <p className={`text-xs ${themeObj.text} uppercase font-semibold`}>{new Date(event.date).toLocaleString('zh-cn', { month: 'short' })}</p>
                <p className={`text-xl font-medium ${themeObj.text}`}>{new Date(event.date).getDate()}</p>
              </div>
              <div className="flex-1 pr-6">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-lg text-zinc-900">{event.title}</h3>
                  {!isPast ? (
                    <span className={`text-xs font-semibold ${themeObj.primary} text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm`}>{daysLeft === 0 ? '今天' : `${daysLeft}天后`}</span>
                  ) : (
                    <span className="text-xs font-semibold bg-zinc-200 text-zinc-500 px-2 py-1 rounded-md whitespace-nowrap">已结束</span>
                  )}
                </div>
                {event.location && <p className="text-sm text-zinc-500 flex items-center mt-2"><MapPin className="w-3.5 h-3.5 mr-1.5" /> {event.location}</p>}
                {event.pic && (
                  <p className="text-sm text-zinc-500 flex items-center mt-1">
                    <User className="w-3.5 h-3.5 mr-1.5" /> 
                    <span className="text-xs bg-white border border-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 mr-1.5 shadow-sm">{picTypes.find(t=>t.id===event.picType)?.label}</span>
                    {event.pic}
                  </p>
                )}
              </div>
              <button onClick={() => onDelete(event.id)} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-full shadow-sm">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// --- FINANCE TAB ---
function FinanceTab({ themeObj, finances, onDelete }) {
  const totalIncome = finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;
  const sortedFinances = [...finances].sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- CALCULATE PIE CHART DATA ---
  const expenses = finances.filter(f => f.type === 'expense');
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  
  const expenseColors = {
    '饮食': '#fbbf24', // yellow
    '交通': '#60a5fa', // blue
    '学习用品': '#34d399', // green
    '娱乐': '#a78bfa', // purple
    '其他': '#f472b6' // pink
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
      <div className={`${themeObj.primary} text-white rounded-3xl p-6 shadow-xl relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none blur-xl"></div>
        <p className="text-white/80 text-sm mb-1">当前结余</p>
        <h2 className="text-4xl font-medium mb-8 flex items-baseline drop-shadow-sm">
          <span className="text-xl mr-1 text-white/80">RM</span>
          {balance.toFixed(2)}
        </h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center text-white/90 text-xs mb-1">
              <ArrowDownRight className="w-3 h-3 mr-1" /> 收入
            </div>
            <p className="font-medium">RM {totalIncome.toFixed(2)}</p>
          </div>
          <div className="flex-1 bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-black/5">
            <div className="flex items-center text-white/90 text-xs mb-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 支出
            </div>
            <p className="font-medium">RM {totalExpense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* --- ADD PIE CHART UI --- */}
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
              <span className="text-[10px] text-zinc-400 mb-0.5">总支出</span>
              <span className="text-lg font-semibold text-zinc-700 leading-none">RM{totalExpense.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 w-full">
            {Object.entries(categoryTotals).map(([cat, amount]) => (
              <div key={cat} className="flex items-center text-[11px] font-medium text-zinc-600 bg-white/60 px-2.5 py-1.5 rounded-xl shadow-sm border border-white">
                <span className="w-2.5 h-2.5 rounded-full mr-1.5 shadow-inner" style={{ backgroundColor: expenseColors[cat] || '#cbd5e1' }}></span>
                {cat} <span className="text-zinc-400 ml-1 font-normal">{(amount/totalExpense*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase mb-4">交易记录</h3>
        {sortedFinances.length > 0 ? (
          <div className="space-y-3">
            {sortedFinances.map((item) => (
              <div key={item.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between group relative overflow-hidden">
                <div className="flex items-center relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${item.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                    {item.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">{item.category}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`font-medium ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : '-'}RM {item.amount.toFixed(2)}
                  </div>
                  <button onClick={() => onDelete(item.id)} className="text-red-400 bg-white p-1.5 rounded-full shadow-sm md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="text-center py-10 text-zinc-400">暂无财务记录，去首页记一笔吧</div>
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
          <div className={`w-24 h-24 ${themeObj.light} ${themeObj.text} rounded-full flex items-center justify-center mb-6`}>
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
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-white shadow-sm overflow-hidden">
            <img src={timetableImg} alt="Timetable" className="w-full rounded-2xl object-contain bg-white max-h-[60vh]" />
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
              className="w-full bg-white/50 border border-zinc-100 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-black text-sm min-h-[100px] resize-none transition-all shadow-inner"
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
function TreeHoleTab({ themeObj, diaries, chats, onAddDiary, onDeleteDiary, onAddChat }) {
  const [mode, setMode] = useState('diary'); // 'diary' or 'chat'
  
  // Diary States
  const [diaryContent, setDiaryContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');
  const emojis = ['😀', '🥰', '😂', '🥺', '😡', '😴', '✨', '🌧️', '💪'];

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  const handleDiarySubmit = (e) => {
    e.preventDefault();
    if (!diaryContent.trim()) return;
    onAddDiary({
      emoji: selectedEmoji,
      content: diaryContent,
      date: new Date().toISOString()
    });
    setDiaryContent('');
  };

  const callGeminiWithRetry = async (prompt, retries = 3) => {
    // ⚠️⚠️⚠️ 终极重要步骤：在这里填入你的专属 Gemini API Key ⚠️⚠️⚠️
    // 获取免费 Key 的网址：https://aistudio.google.com/app/apikey
    // 请把下面双引号里的内容，替换成你申请到的真实密钥（一长串英文字母和数字）
    const GEMINI_API_KEY = "AIzaSyAI_hroeLO96ySb-tzzOoeZUVWC9vs26Iw"; 

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "请把你的GEMINI密钥粘贴在这里") {
         return "呜呜宝贝，我的脑电波暂时连不上啦 🥺 (缺少 API Key)，让妈妈帮忙在代码里设置一下 API 密钥，我们就能开心聊天啦~ ✨";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "你现在是我的超级好闺蜜。说话要超级亲切、活泼、充满少女心，懂我的奇奇怪怪，也会陪我一起开心或吐槽。经常用 '宝贝'、'姐妹' 等亲昵的称呼，多用可爱的颜文字和emoji（比如 🥺, ✨, 🥰, 贴贴）。回复要简短，像微信聊天一样自然，语气像个年轻可爱的女学生，绝对不要像死板的AI机器人或者官方客服。" }] }
    };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('API Error');
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "哎呀，我刚刚走神了，宝贝能再说一次吗？🥺";
      } catch (err) {
        if (i === retries - 1) return "抱歉宝贝，我现在脑子有点转不过来了，我们稍后再聊吧~ (网络错误) 🥺";
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
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
    const reply = await callGeminiWithRetry(userText);
    
    const aiMsgData = { role: 'ai', text: reply, timestamp: new Date().toISOString() };
    await onAddChat(aiMsgData);
    
    setIsThinking(false);
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
          <Bot className="w-4 h-4 mr-2" /> 树洞聊天
        </button>
      </div>

      {mode === 'diary' && (
        <div className="space-y-6 flex-1">
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
              className="w-full bg-white/50 border border-zinc-100 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-black min-h-[120px] resize-none mb-4 text-sm shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!diaryContent.trim()}
              className={`w-full py-4 rounded-xl font-medium flex items-center justify-center transition-all ${
                !diaryContent.trim() ? 'bg-zinc-100 text-zinc-400' : `${themeObj.primary} text-white active:scale-[0.98] shadow-md`
              }`}
            >
              保存日记
            </button>
          </form>

          <div className="space-y-4">
            {sortedDiaries.map(diary => (
              <div key={diary.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-start group relative">
                <div className="text-3xl mr-4">{diary.emoji}</div>
                <div className="flex-1 pr-6">
                  <p className="text-xs text-zinc-400 mb-1">{new Date(diary.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                  <p className="text-zinc-800 text-sm whitespace-pre-wrap leading-relaxed">{diary.content}</p>
                </div>
                <button onClick={() => onDeleteDiary(diary.id)} className="absolute top-4 right-4 text-red-400 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-full shadow-sm">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'chat' && (
        <div className="flex flex-col bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-sm flex-1 h-[65vh] animate-in slide-in-from-right-4 overflow-hidden">
          <div className={`p-4 border-b border-white/50 flex items-center ${themeObj.light}`}>
            <div className={`w-10 h-10 rounded-full ${themeObj.primary} flex items-center justify-center text-white mr-3 shadow-sm`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900">AI 树洞</h3>
              <p className="text-xs text-zinc-500">永远在线倾听你的心事</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white/30">
            {sortedChats.length === 0 && (
              <div className="text-center text-zinc-400 text-sm mt-10">
                跟我打个招呼吧！有什么烦恼都可以告诉我哦。
              </div>
            )}
            {sortedChats.map(chat => (
              <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3.5 text-[0.9rem] leading-relaxed shadow-sm ${
                  chat.role === 'user' 
                    ? `${themeObj.primary} text-white rounded-tr-sm` 
                    : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-sm'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-100 text-zinc-500 rounded-2xl rounded-tl-sm p-4 text-sm flex space-x-1.5 shadow-sm">
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
              className="flex-1 bg-zinc-50 border border-zinc-100 shadow-inner rounded-full px-5 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-300 text-sm transition-all"
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
      )}
    </div>
  );
}