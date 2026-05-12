import React, { useState, useEffect, useRef, useCallback } from 'react';
// Firebase cargado desde CDN en index.html (window.firebase)
const firebase = window.firebase;

/* ══════════════════════════════════════════
   CONFIGURACIÓN DE FIREBASE
   ⚠️ REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO
   (Consola Firebase → ⚙ Configuración del proyecto → tus apps → SDK)
   ══════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: 'AIzaSyDcXyCCRKAhg99Ymwnp27lSUOd0zlzo5sE',
  authDomain: 'valdez-consultoria.firebaseapp.com',
  databaseURL: 'https://valdez-consultoria-default-rtdb.firebaseio.com',
  projectId: 'valdez-consultoria',
  storageBucket: 'valdez-consultoria.firebasestorage.app',
  messagingSenderId: '930989294291',
  appId: '1:930989294291:web:c00334871d9963cdc90a26',
  measurementId: 'G-46RH0ZLRDX',
};

const ADMIN_EMAIL = 'jscc.contable@gmail.com';

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

/* ══════════════════════════════════════════
   HELPERS DE BASE DE DATOS
   ══════════════════════════════════════════ */
const db = {
  async get(path) {
    try {
      const snap = await database.ref(path).get();
      return snap.val();
    } catch (e) {
      console.error('db.get', path, e);
      return null;
    }
  },
  async set(path, val) {
    try {
      await database.ref(path).set(val);
      return true;
    } catch (e) {
      console.error('db.set', path, e);
      return false;
    }
  },
  async update(path, val) {
    try {
      await database.ref(path).update(val);
      return true;
    } catch (e) {
      console.error('db.update', path, e);
      return false;
    }
  },
  async remove(path) {
    try {
      await database.ref(path).remove();
      return true;
    } catch (e) {
      console.error('db.remove', path, e);
      return false;
    }
  },
  async push(path, val) {
    try {
      const r = await database.ref(path).push(val);
      return r.key;
    } catch (e) {
      console.error('db.push', path, e);
      return null;
    }
  },
};

/* ═══ UTILS ═══ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const todayISO = () => new Date().toISOString().split('T')[0];
const isOverdue = (due, done) =>
  !done && due && new Date(due) < new Date(todayISO());
const daysLate = (due) => Math.floor((Date.now() - new Date(due)) / 86400000);
const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
};
const fmtTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ═══ CONSTANTS ═══ */
const FREQ = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Único'];
const FREQ_M = { Mensual: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 };
const EMP_COLORS = ['#1565C0', '#6A1B9A', '#00695C', '#C62828', '#E65100', '#2E7D32', '#4527A0', '#AD1457'];

/* ══════════════════════════════════════════
   LOGO
   ══════════════════════════════════════════ */
function ValdezLogo({ size = 40 }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 100 85" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E88E5" />
          <stop offset="100%" stopColor="#1565C0" />
        </linearGradient>
      </defs>
      <polygon points="0,2 20,2 50,62 30,62" fill="url(#lg1)" />
      <polygon points="100,2 80,2 50,62 70,62" fill="url(#lg2)" />
      <polygon points="32,2 50,2 50,22 41,2" fill="rgba(255,255,255,0.18)" />
      <polygon points="68,2 50,2 50,22 59,2" fill="rgba(255,255,255,0.1)" />
    </svg>
  );
}

/* ══════════════════════════════════════════
   CSS GLOBAL
   ══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#060F1A;color:#E2D9C8;font-family:'DM Sans',sans-serif;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:#060F1A;}
::-webkit-scrollbar-thumb{background:rgba(21,101,192,0.4);border-radius:3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(198,40,40,0.5);}50%{box-shadow:0 0 0 10px rgba(198,40,40,0);}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.4;}}
.fu{animation:fadeUp 0.4s cubic-bezier(.22,.68,0,1.2) forwards;}
.fi{animation:fadeIn 0.3s ease forwards;}
.card{background:linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018));border:1px solid rgba(21,101,192,0.18);border-radius:18px;padding:26px;cursor:pointer;transition:transform .25s,box-shadow .25s,border-color .25s;position:relative;overflow:hidden;}
.card:hover{transform:translateY(-5px);border-color:rgba(21,101,192,0.5);box-shadow:0 24px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(21,101,192,0.25);}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:22px;}
.btn{display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;border-radius:11px;transition:all .2s;}
.btn:hover{transform:translateY(-1px);filter:brightness(1.1);}
.btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
.bp{background:linear-gradient(135deg,#1565C0,#1E88E5);color:#fff;padding:11px 22px;font-size:14px;box-shadow:0 4px 20px rgba(21,101,192,0.35);}
.bd{background:rgba(198,40,40,0.12);color:#EF5350;border:1px solid rgba(198,40,40,0.3);padding:6px 13px;font-size:12px;}
.bg{background:rgba(255,255,255,0.06);color:#E2D9C8;border:1px solid rgba(255,255,255,0.1);padding:10px 20px;font-size:14px;}
.bs{background:rgba(27,94,32,0.2);color:#66BB6A;border:1px solid rgba(27,94,32,0.4);padding:6px 13px;font-size:12px;}
.bb{background:rgba(21,101,192,0.1);color:#42A5F5;border:1px solid rgba(21,101,192,0.3);padding:9px 18px;font-size:13px;border-radius:10px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;transition:all .2s;}
.bb:hover{background:rgba(21,101,192,0.2);transform:translateY(-1px);}
.inp{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(21,101,192,0.25);border-radius:11px;padding:13px 16px;color:#E2D9C8;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;}
.inp:focus{border-color:rgba(21,101,192,0.7);}
.sel{width:100%;background:#0D1E33;border:1px solid rgba(21,101,192,0.25);border-radius:11px;padding:13px 16px;color:#E2D9C8;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;}
.lbl{display:block;font-size:11px;font-weight:700;color:rgba(226,217,200,0.45);letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.82);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;animation:fadeIn .2s ease;}
.modal{background:linear-gradient(145deg,#0D1E33,#091525);border:1px solid rgba(21,101,192,0.35);border-radius:22px;padding:34px;width:100%;max-width:500px;box-shadow:0 50px 100px rgba(0,0,0,0.7);animation:fadeUp .3s cubic-bezier(.22,.68,0,1.1);max-height:90vh;overflow-y:auto;}
.badge{font-size:11px;padding:3px 11px;border-radius:20px;font-weight:600;}
.stat{background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015));border:1px solid rgba(255,255,255,0.07);border-radius:15px;padding:22px 26px;flex:1;min-width:130px;}
.obr{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:18px 22px;margin-bottom:12px;display:flex;align-items:center;gap:16px;transition:all .3s;}
.obr.done{background:rgba(27,94,32,0.08);border-color:rgba(27,94,32,0.3);}
.obr.overdue{background:rgba(198,40,40,0.08);border-color:rgba(198,40,40,0.35);animation:pulse 2.5s infinite;}
.ck{width:34px;height:34px;border-radius:9px;border:2px solid rgba(21,101,192,0.4);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;}
.ck.done{background:#2E7D32;border-color:#2E7D32;}
.ck:hover:not(.done){border-color:rgba(21,101,192,0.8);background:rgba(21,101,192,0.1);}
.alr{background:rgba(198,40,40,0.1);border:1px solid rgba(198,40,40,0.4);border-radius:13px;padding:13px 18px;margin-bottom:12px;display:flex;gap:12px;align-items:center;}
.div{height:1px;background:linear-gradient(90deg,rgba(21,101,192,0.3),transparent);margin:32px 0;}
.sec{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding-left:4px;margin-bottom:14px;}
.spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(21,101,192,0.3);border-top-color:#1E88E5;border-radius:50%;animation:spin .8s linear infinite;}
.live{width:8px;height:8px;background:#66BB6A;border-radius:50%;animation:blink 2s infinite;display:inline-block;}
.chatBox{position:fixed;bottom:24px;right:24px;width:360px;max-width:calc(100vw - 48px);height:520px;max-height:calc(100vh - 100px);background:linear-gradient(145deg,#0D1E33,#091525);border:1px solid rgba(21,101,192,0.4);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,0.6);display:flex;flex-direction:column;z-index:200;overflow:hidden;animation:fadeUp .25s ease;}
.chatHead{padding:16px 18px;border-bottom:1px solid rgba(21,101,192,0.25);display:flex;align-items:center;justify-content:space-between;background:rgba(21,101,192,0.08);}
.chatBody{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
.chatFoot{padding:12px;border-top:1px solid rgba(21,101,192,0.2);display:flex;gap:8px;}
.msg{padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.4;max-width:80%;}
.msgMe{background:linear-gradient(135deg,#1565C0,#1E88E5);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}
.msgOther{background:rgba(255,255,255,0.08);color:#E2D9C8;align-self:flex-start;border-bottom-left-radius:4px;}
.msgTime{font-size:10px;color:rgba(226,217,200,0.35);margin-top:4px;}
.fab{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1565C0,#1E88E5);border:none;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 10px 30px rgba(21,101,192,0.5);z-index:150;display:flex;align-items:center;justify-content:center;}
.fab:hover{transform:translateY(-2px);filter:brightness(1.1);}
.fabBadge{position:absolute;top:-4px;right:-4px;background:#EF5350;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;border-radius:10px;min-width:22px;text-align:center;}
.pendCard{background:rgba(255,153,0,0.06);border:1px solid rgba(255,153,0,0.35);border-radius:13px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;}
.pendAvatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#FF9800,#FB8C00);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;}
`;

/* ══════════════════════════════════════════
   APP RAÍZ (gestiona AUTH)
   ══════════════════════════════════════════ */
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'colaborador' | 'pending'
  const [linkedEmpId, setLinkedEmpId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Listener de auth
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        setLinkedEmpId(null);
        setAuthLoading(false);
        return;
      }
      setUser(u);
      setAuthLoading(true);

      // 1) Admin por correo conocido
      if (u.email === ADMIN_EMAIL) {
        await db.set(`valdez/admins/${u.uid}`, true);
        setRole('admin');
        setAuthLoading(false);
        return;
      }
      // 2) Admin por uid registrado
      const isAdmin = await db.get(`valdez/admins/${u.uid}`);
      if (isAdmin === true) {
        setRole('admin');
        setAuthLoading(false);
        return;
      }
      // 3) Colaborador vinculado a un empleado
      const allEmps = await db.get('valdez/employees');
      if (allEmps) {
        const linked = Object.values(allEmps).find((e) => e.authUid === u.uid);
        if (linked) {
          setLinkedEmpId(linked.id);
          setRole('colaborador');
          setAuthLoading(false);
          return;
        }
      }
      // 4) Pendiente de autorización
      await db.update(`valdez/pending/${u.uid}`, {
        uid: u.uid,
        email: u.email,
        name: u.displayName || u.email,
        photo: u.photoURL || null,
        requestedAt: Date.now(),
      });
      setRole('pending');
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setAuthError('');
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (e) {
      setAuthError(e.message || 'Error al iniciar sesión');
    }
  };
  const handleLogout = () => auth.signOut();

  /* ─── PANTALLAS DE ESTADO ─── */
  if (authLoading) return <FullScreen msg="Verificando acceso..." />;

  if (!user) return <LoginScreen onLogin={handleLogin} error={authError} />;

  if (role === 'pending')
    return <PendingScreen user={user} onLogout={handleLogout} />;

  if (role !== 'admin' && role !== 'colaborador')
    return <FullScreen msg="Cargando..." />;

  /* ─── APP CON DATOS ─── */
  return (
    <AppCore
      user={user}
      role={role}
      linkedEmpId={linkedEmpId}
      onLogout={handleLogout}
    />
  );
}

/* ══════════════════════════════════════════
   PANTALLAS AUXILIARES
   ══════════════════════════════════════════ */
function FullScreen({ msg }) {
  return (
    <div style={{ minHeight: '100vh', background: '#060F1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <style>{CSS}</style>
      <ValdezLogo size={70} />
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#E2D9C8', letterSpacing: '0.06em' }}>VALDEZ CONSULTORÍA</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(226,217,200,0.5)', fontSize: 13 }}>
        <span className="spin" />
        <span>{msg}</span>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, error }) {
  return (
    <div style={{ minHeight: '100vh', background: '#060F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ background: 'linear-gradient(145deg,#0D1E33,#091525)', border: '1px solid rgba(21,101,192,0.35)', borderRadius: 24, padding: 44, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <ValdezLogo size={70} />
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#E2D9C8', letterSpacing: '0.06em', marginBottom: 6 }}>
          VALDEZ CONSULTORÍA
        </div>
        <div style={{ fontSize: 11, color: 'rgba(226,217,200,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 36 }}>
          Confianza Empresarial
        </div>
        <div style={{ fontSize: 14, color: 'rgba(226,217,200,0.6)', marginBottom: 28, lineHeight: 1.5 }}>
          Inicia sesión con tu cuenta de Google para acceder al panel de obligaciones fiscales.
        </div>
        <button onClick={onLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 22px', background: '#fff', color: '#3c4043', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 6px 20px rgba(0,0,0,0.4)', transition: 'all .2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>
        {error && (
          <div style={{ marginTop: 18, padding: 12, background: 'rgba(198,40,40,0.1)', border: '1px solid rgba(198,40,40,0.3)', borderRadius: 10, color: '#EF5350', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: 30, fontSize: 11, color: 'rgba(226,217,200,0.3)', letterSpacing: '0.1em' }}>
          ACCESO RESTRINGIDO · SOLO PERSONAL AUTORIZADO
        </div>
      </div>
    </div>
  );
}

function PendingScreen({ user, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#060F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ background: 'linear-gradient(145deg,#0D1E33,#091525)', border: '1px solid rgba(255,153,0,0.35)', borderRadius: 24, padding: 44, maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: '#E2D9C8', marginBottom: 12 }}>
          Esperando autorización
        </div>
        <div style={{ fontSize: 14, color: 'rgba(226,217,200,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
          Hola <strong style={{ color: '#42A5F5' }}>{user.displayName || user.email}</strong>, tu solicitud de acceso fue registrada.
          El administrador del despacho debe autorizarte para que puedas ver tu panel.
        </div>
        <div style={{ background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.3)', borderRadius: 12, padding: 14, fontSize: 13, color: 'rgba(226,217,200,0.7)', marginBottom: 28 }}>
          Contacta al administrador y comparte este correo:<br />
          <strong style={{ color: '#FFB74D' }}>{user.email}</strong>
        </div>
        <button onClick={onLogout} className="btn bg" style={{ width: '100%', justifyContent: 'center' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   APP CORE — Lógica y UI principal
   ══════════════════════════════════════════ */
function AppCore({ user, role, linkedEmpId, onLogout }) {
  const [view, setView] = useState('main');
  const [emps, setEmps] = useState([]);
  const [cos, setCos] = useState({});
  const [obs, setObs] = useState({});
  const [pending, setPending] = useState([]);
  const [messages, setMessages] = useState({});
  const [selEmp, setSelEmp] = useState(null);
  const [selCo, setSelCo] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [chatTargetEmpId, setChatTargetEmpId] = useState(null);
  const pollRef = useRef(null);

  const isAdmin = role === 'admin';

  /* ─── CARGAR DATOS según rol ─── */
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      if (isAdmin) {
        // Admin puede leer todo el árbol valdez de un solo jalón
        const data = await db.get('valdez');
        if (!data) {
          if (!silent) setLoading(false);
          setSyncing(false);
          return;
        }
        if (data.employees) setEmps(Object.values(data.employees));
        else setEmps([]);
        if (data.companies) {
          const cosMap = {};
          Object.entries(data.companies).forEach(([eid, list]) => {
            cosMap[eid] = Object.values(list);
          });
          setCos(cosMap);
        } else setCos({});
        if (data.obligations) {
          const obsMap = {};
          Object.entries(data.obligations).forEach(([cid, list]) => {
            obsMap[cid] = Object.values(list);
          });
          setObs(obsMap);
        } else setObs({});
        setPending(data.pending ? Object.values(data.pending) : []);
        if (data.messages) {
          const msgMap = {};
          Object.entries(data.messages).forEach(([eid, list]) => {
            msgMap[eid] = Object.values(list).sort((a, b) => a.ts - b.ts);
          });
          setMessages(msgMap);
        } else setMessages({});
      } else if (role === 'colaborador' && linkedEmpId) {
        // Colaborador: lecturas dirigidas a sus propios datos
        const empsData = await db.get('valdez/employees');
        if (empsData) setEmps(Object.values(empsData));

        const cosData = await db.get(`valdez/companies/${linkedEmpId}`);
        if (cosData) {
          const myCos = Object.values(cosData);
          setCos({ [linkedEmpId]: myCos });
          const obsMap = {};
          for (const c of myCos) {
            const o = await db.get(`valdez/obligations/${c.id}`);
            if (o) obsMap[c.id] = Object.values(o);
          }
          setObs(obsMap);
        } else {
          setCos({ [linkedEmpId]: [] });
          setObs({});
        }

        const msgsData = await db.get(`valdez/messages/${linkedEmpId}`);
        if (msgsData) {
          setMessages({
            [linkedEmpId]: Object.values(msgsData).sort((a, b) => a.ts - b.ts),
          });
        } else {
          setMessages({});
        }
      }
    } catch (e) {
      console.error('loadAll error:', e);
    }
    if (!silent) setLoading(false);
    setSyncing(false);
  }, [isAdmin, role, linkedEmpId]);

  useEffect(() => {
    loadAll();
    pollRef.current = setInterval(() => loadAll(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [loadAll]);

  /* ─── GUARDAR (solo admin para empleados) ─── */
  const saveEmps = async (arr) => {
    setEmps(arr);
    setSyncing(true);
    const obj = {};
    arr.forEach((e) => (obj[e.id] = e));
    await db.set('valdez/employees', obj);
    setSyncing(false);
  };
  const saveCos = async (eid, arr) => {
    setCos((p) => ({ ...p, [eid]: arr }));
    setSyncing(true);
    const obj = {};
    arr.forEach((c) => (obj[c.id] = c));
    if (arr.length === 0) await db.remove(`valdez/companies/${eid}`);
    else await db.set(`valdez/companies/${eid}`, obj);
    setSyncing(false);
  };
  const saveObs = async (cid, arr) => {
    setObs((p) => ({ ...p, [cid]: arr }));
    setSyncing(true);
    const obj = {};
    arr.forEach((o) => (obj[o.id] = o));
    if (arr.length === 0) await db.remove(`valdez/obligations/${cid}`);
    else await db.set(`valdez/obligations/${cid}`, obj);
    setSyncing(false);
  };

  /* ─── AUTORIZAR PENDIENTE ─── */
  const authorizePending = async (pendingUser, empId, createNew, newEmpData) => {
    setSyncing(true);
    let targetEmpId = empId;
    if (createNew) {
      const newEmp = {
        id: uid(),
        name: newEmpData.name,
        role: newEmpData.role || 'Colaborador',
        initials: (newEmpData.name.split(' ').map(w => w[0]).join('').toUpperCase()).slice(0, 2) || '?',
        color: EMP_COLORS[Math.floor(Math.random() * EMP_COLORS.length)],
        email: pendingUser.email,
        authUid: pendingUser.uid,
      };
      await saveEmps([...emps, newEmp]);
      targetEmpId = newEmp.id;
    } else {
      const updEmps = emps.map((e) =>
        e.id === empId
          ? { ...e, authUid: pendingUser.uid, email: pendingUser.email }
          : e
      );
      await saveEmps(updEmps);
    }
    await db.remove(`valdez/pending/${pendingUser.uid}`);
    setPending(pending.filter((p) => p.uid !== pendingUser.uid));
    setSyncing(false);
  };
  const rejectPending = async (pendingUser) => {
    setSyncing(true);
    await db.remove(`valdez/pending/${pendingUser.uid}`);
    setPending(pending.filter((p) => p.uid !== pendingUser.uid));
    setSyncing(false);
  };

  /* ─── MENSAJES ─── */
  const sendMessage = async (empId, text) => {
    if (!text.trim()) return;
    const msg = {
      id: uid(),
      from: isAdmin ? 'admin' : 'colaborador',
      fromName: user.displayName || user.email,
      text: text.trim(),
      ts: Date.now(),
    };
    const path = `valdez/messages/${empId}/${msg.id}`;
    await db.set(path, msg);
    setMessages((p) => ({
      ...p,
      [empId]: [...(p[empId] || []), msg],
    }));
  };

  const deleteMessage = async (empId, msgId) => {
    await db.remove(`valdez/messages/${empId}/${msgId}`);
    setMessages((p) => ({
      ...p,
      [empId]: (p[empId] || []).filter((m) => m.id !== msgId),
    }));
  };

  /* ─── STATS ─── */
  const visibleEmps = isAdmin
    ? emps
    : emps.filter((e) => e.id === linkedEmpId);

  const empStats = (e) => {
    const list = (cos[e.id] || []).flatMap((c) => obs[c.id] || []);
    return {
      cos: (cos[e.id] || []).length,
      done: list.filter((o) => o.done).length,
      pending: list.filter((o) => !o.done && !isOverdue(o.due, o.done)).length,
      overdue: list.filter((o) => isOverdue(o.due, o.done)).length,
    };
  };
  const coStats = (c) => {
    const l = obs[c.id] || [];
    return {
      total: l.length,
      done: l.filter((o) => o.done).length,
      overdue: l.filter((o) => isOverdue(o.due, o.done)).length,
    };
  };
  const global = visibleEmps.reduce(
    (a, e) => {
      const s = empStats(e);
      return {
        done: a.done + s.done,
        pending: a.pending + s.pending,
        overdue: a.overdue + s.overdue,
      };
    },
    { done: 0, pending: 0, overdue: 0 }
  );

  /* ─── Auto-open colaborador on company ─── */
  useEffect(() => {
    if (role === 'colaborador' && linkedEmpId && emps.length > 0 && !selEmp) {
      const myEmp = emps.find((e) => e.id === linkedEmpId);
      if (myEmp) {
        setSelEmp(myEmp);
        setView('employee');
      }
    }
  }, [role, linkedEmpId, emps, selEmp]);

  if (loading) return <FullScreen msg="Cargando datos..." />;

  /* ─── Conteo de mensajes no leídos por colaborador (admin) ─── */
  const unreadByEmp = {};
  if (isAdmin) {
    Object.entries(messages).forEach(([eid, list]) => {
      unreadByEmp[eid] = list.filter((m) => m.from === 'colaborador' && !m.readByAdmin).length;
    });
  }
  const myUnread =
    role === 'colaborador' && linkedEmpId && messages[linkedEmpId]
      ? messages[linkedEmpId].filter((m) => m.from === 'admin' && !m.readByMe).length
      : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#060F1A' }}>
      <style>{CSS}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ background: 'linear-gradient(180deg,#0A1628,rgba(6,15,26,0.96))', borderBottom: '1px solid rgba(21,101,192,0.22)', padding: '0 36px', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => {
          if (isAdmin) {
            setView('main');
            setSelEmp(null);
            setSelCo(null);
          }
        }}>
          <ValdezLogo size={44} />
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 800, color: '#E2D9C8', letterSpacing: '0.06em' }}>VALDEZ CONSULTORÍA</div>
            <div style={{ fontSize: 10, color: 'rgba(226,217,200,0.32)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Confianza Empresarial</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {syncing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(66,165,245,0.7)' }}>
              <span className="spin" />
              <span>Sincronizando...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(102,187,106,0.8)' }}>
              <span className="live" />
              <span>En línea</span>
            </div>
          )}
          {isAdmin && pending.length > 0 && (
            <button className="bb" style={{ background: 'rgba(255,153,0,0.15)', color: '#FFB74D', borderColor: 'rgba(255,153,0,0.3)' }} onClick={() => setModal('pending')}>
              ⏳ {pending.length} pendiente{pending.length > 1 ? 's' : ''}
            </button>
          )}
          {/* Usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.08)' }}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                {(user.displayName || user.email).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#E2D9C8' }}>
              <div style={{ fontWeight: 600 }}>{user.displayName || user.email.split('@')[0]}</div>
              <div style={{ fontSize: 10, color: 'rgba(226,217,200,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isAdmin ? 'Administrador' : 'Colaborador'}
              </div>
            </div>
            <button onClick={onLogout} title="Cerrar sesión" style={{ background: 'none', border: 'none', color: 'rgba(226,217,200,0.5)', cursor: 'pointer', fontSize: 18, marginLeft: 4 }}>⎋</button>
          </div>
        </div>
      </header>

      <main style={{ padding: '44px 36px', maxWidth: 1440, margin: '0 auto' }}>
        {/* ═══ MAIN (solo admin) ═══ */}
        {view === 'main' && isAdmin && (
          <div className="fu">
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, color: '#E2D9C8' }}>Panel de Control</div>
                <div style={{ background: 'rgba(102,187,106,0.12)', border: '1px solid rgba(102,187,106,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#66BB6A', fontWeight: 700, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="live" />
                  EN VIVO
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.32)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 32 }}>
                Vista de Administrador · Todos los colaboradores
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div className="stat"><div style={{ fontSize: 30, fontWeight: 800, color: '#42A5F5', fontFamily: "'Playfair Display',serif" }}>{emps.length}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Colaboradores</div></div>
                <div className="stat"><div style={{ fontSize: 30, fontWeight: 800, color: '#66BB6A', fontFamily: "'Playfair Display',serif" }}>{global.done}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Cumplidas ✓</div></div>
                <div className="stat"><div style={{ fontSize: 30, fontWeight: 800, color: '#42A5F5', fontFamily: "'Playfair Display',serif" }}>{global.pending}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Pendientes</div></div>
                {global.overdue > 0 && (
                  <div className="stat" style={{ border: '1px solid rgba(198,40,40,0.4)', background: 'rgba(198,40,40,0.07)' }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#EF5350', fontFamily: "'Playfair Display',serif" }}>{global.overdue}</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Vencidas ⚠️</div>
                  </div>
                )}
              </div>
            </div>
            <div className="div" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
              <div className="sec" style={{ color: '#42A5F5' }}>◈ Colaboradores del Despacho</div>
              <button className="btn bp" onClick={() => setModal('addEmp')}>+ Agregar Colaborador</button>
            </div>
            {emps.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(226,217,200,0.22)' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>👤</div>
                <div>Sin colaboradores. Agrega el primero.</div>
              </div>
            )}
            <div className="grid">
              {emps.map((e, i) => {
                const s = empStats(e);
                const unread = unreadByEmp[e.id] || 0;
                return (
                  <div key={e.id} className="card fu" style={{ animationDelay: `${i * 0.07}s` }} onClick={() => { setSelEmp(e); setView('employee'); }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${e.color},transparent)`, borderRadius: '18px 18px 0 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 15, background: `linear-gradient(135deg,${e.color},${e.color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#fff', boxShadow: `0 8px 24px ${e.color}44` }}>
                        {e.initials}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn bb" style={{ padding: '6px 11px', fontSize: 12 }} onClick={(ev) => { ev.stopPropagation(); setChatTargetEmpId(e.id); }} title="Mensajes">
                          💬{unread > 0 ? ` ${unread}` : ''}
                        </button>
                        <button className="btn bd" onClick={(ev) => { ev.stopPropagation(); setConfirm({ type: 'emp', item: e }); }}>✕</button>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#E2D9C8', marginBottom: 4 }}>{e.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(226,217,200,0.42)', marginBottom: 16 }}>{e.role}</div>
                    {e.email && (
                      <div style={{ fontSize: 11, color: 'rgba(102,187,106,0.7)', marginBottom: 10 }}>✓ Vinculado: {e.email}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'rgba(21,101,192,0.15)', color: '#42A5F5' }}>{s.cos} empresas</span>
                      {s.done > 0 && <span className="badge" style={{ background: 'rgba(27,94,32,0.18)', color: '#66BB6A' }}>✓ {s.done}</span>}
                      {s.overdue > 0 && <span className="badge" style={{ background: 'rgba(198,40,40,0.15)', color: '#EF5350' }}>⚠ {s.overdue}</span>}
                    </div>
                    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(226,217,200,0.28)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ver empresas y obligaciones</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EMPLOYEE VIEW ═══ */}
        {view === 'employee' && selEmp && (() => {
          const empCos = (cos[selEmp.id] || []).map((c) => ({ ...c, ...coStats(c) }));
          const tot = empCos.reduce((a, c) => ({ done: a.done + c.done, overdue: a.overdue + c.overdue, total: a.total + c.total }), { done: 0, overdue: 0, total: 0 });
          return (
            <div className="fu">
              {isAdmin && (
                <button className="bb" style={{ marginBottom: 32 }} onClick={() => { setView('main'); setSelEmp(null); }}>← Volver al Inicio</button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8 }}>
                <div style={{ width: 62, height: 62, borderRadius: 16, background: `linear-gradient(135deg,${selEmp.color},${selEmp.color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', boxShadow: `0 10px 30px ${selEmp.color}44` }}>{selEmp.initials}</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: '#E2D9C8' }}>{selEmp.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{selEmp.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '32px 0' }}>
                <div className="stat"><div style={{ fontSize: 28, fontWeight: 800, color: '#42A5F5', fontFamily: "'Playfair Display',serif" }}>{empCos.length}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Empresas</div></div>
                <div className="stat"><div style={{ fontSize: 28, fontWeight: 800, color: '#66BB6A', fontFamily: "'Playfair Display',serif" }}>{tot.done}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Cumplidas</div></div>
                {tot.overdue > 0 && (
                  <div className="stat" style={{ border: '1px solid rgba(198,40,40,0.4)', background: 'rgba(198,40,40,0.07)' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#EF5350', fontFamily: "'Playfair Display',serif" }}>{tot.overdue}</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Vencidas</div>
                  </div>
                )}
              </div>
              <div className="div" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
                <div className="sec" style={{ color: '#42A5F5' }}>◈ Empresas Asignadas</div>
                {(isAdmin || role === 'colaborador') && (
                  <button className="btn bp" onClick={() => setModal('addCo')}>+ Agregar Empresa</button>
                )}
              </div>
              {empCos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(226,217,200,0.22)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🏢</div>
                  <div>Sin empresas asignadas.</div>
                </div>
              )}
              <div className="grid">
                {empCos.map((c, i) => (
                  <div key={c.id} className="card fu" style={{ animationDelay: `${i * 0.07}s` }} onClick={() => { setSelCo(c); setView('company'); }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c.type === 'moral' ? '#1565C0' : '#6A1B9A'},transparent)`, borderRadius: '18px 18px 0 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ fontSize: 36 }}>{c.type === 'moral' ? '🏛️' : '👤'}</div>
                      <button className="btn bd" onClick={(ev) => { ev.stopPropagation(); setConfirm({ type: 'co', item: c }); }}>✕</button>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#E2D9C8', marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(226,217,200,0.4)', marginBottom: 16 }}>{c.type === 'moral' ? 'Persona Moral' : 'Persona Física'}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'rgba(21,101,192,0.12)', color: '#42A5F5' }}>{c.total} obligaciones</span>
                      {c.done > 0 && <span className="badge" style={{ background: 'rgba(27,94,32,0.18)', color: '#66BB6A' }}>✓ {c.done}</span>}
                      {c.overdue > 0 && <span className="badge" style={{ background: 'rgba(198,40,40,0.15)', color: '#EF5350' }}>⚠ {c.overdue}</span>}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(226,217,200,0.28)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ver obligaciones</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ═══ COMPANY VIEW ═══ */}
        {view === 'company' && selCo && selEmp && (() => {
          const list = obs[selCo.id] || [];
          const overdues = list.filter((o) => isOverdue(o.due, o.done));
          const pendingList = list.filter((o) => !o.done && !isOverdue(o.due, o.done));
          const doneList = list.filter((o) => o.done);
          const secs = [
            ...(overdues.length ? [{ label: '⚠️ Vencidas', items: overdues, cls: 'overdue', color: '#EF5350', bg: 'rgba(198,40,40,0.07)' }] : []),
            ...(pendingList.length ? [{ label: '⏳ Pendientes', items: pendingList, cls: '', color: '#42A5F5', bg: 'rgba(21,101,192,0.04)' }] : []),
            ...(doneList.length ? [{ label: '✅ Cumplidas', items: doneList, cls: 'done', color: '#66BB6A', bg: 'rgba(27,94,32,0.07)' }] : []),
          ];
          return (
            <div className="fu">
              <div style={{ display: 'flex', gap: 12, marginBottom: 34 }}>
                <button className="bb" onClick={() => { setView('employee'); setSelCo(null); }}>← {selEmp.name}</button>
                {isAdmin && (
                  <button className="bb" style={{ color: 'rgba(226,217,200,0.4)', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => { setView('main'); setSelEmp(null); setSelCo(null); }}>⌂ Inicio</button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 10 }}>
                <div style={{ fontSize: 52 }}>{selCo.type === 'moral' ? '🏛️' : '👤'}</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 800, color: '#E2D9C8' }}>{selCo.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.32)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
                    {selCo.type === 'moral' ? 'Persona Moral' : 'Persona Física'} · {selEmp.name}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '32px 0' }}>
                <div className="stat"><div style={{ fontSize: 28, fontWeight: 800, color: '#42A5F5', fontFamily: "'Playfair Display',serif" }}>{list.length}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Total</div></div>
                <div className="stat"><div style={{ fontSize: 28, fontWeight: 800, color: '#66BB6A', fontFamily: "'Playfair Display',serif" }}>{doneList.length}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Cumplidas</div></div>
                <div className="stat"><div style={{ fontSize: 28, fontWeight: 800, color: '#42A5F5', fontFamily: "'Playfair Display',serif" }}>{pendingList.length}</div><div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Pendientes</div></div>
                {overdues.length > 0 && (
                  <div className="stat" style={{ border: '1px solid rgba(198,40,40,0.4)', background: 'rgba(198,40,40,0.07)' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#EF5350', fontFamily: "'Playfair Display',serif" }}>{overdues.length}</div>
                    <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.4)', marginTop: 6 }}>Vencidas</div>
                  </div>
                )}
              </div>
              {overdues.map((o) => (
                <div key={o.id} className="alr">
                  <span style={{ fontSize: 20 }}>🔴</span>
                  <div>
                    <span style={{ color: '#EF5350', fontWeight: 700, fontSize: 14 }}>{o.name}</span>
                    <span style={{ color: 'rgba(239,83,80,0.75)', fontSize: 13 }}> — venció hace {daysLate(o.due)} día(s) · Fecha: {o.due}</span>
                  </div>
                </div>
              ))}
              <div className="div" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
                <div className="sec" style={{ color: '#42A5F5' }}>◈ Obligaciones Fiscales</div>
                <button className="btn bp" onClick={() => setModal('addOb')}>+ Nueva Obligación</button>
              </div>
              {list.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(226,217,200,0.22)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                  <div>Sin obligaciones. Agrega la primera.</div>
                </div>
              )}
              {secs.map(({ label, items, cls, color, bg }) => (
                <div key={label} style={{ marginBottom: 34 }}>
                  <div className="sec" style={{ color }}>{label}</div>
                  {items.map((ob) => (
                    <div key={ob.id} className={`obr ${cls}`} style={{ background: bg }}>
                      <button className={`ck ${ob.done ? 'done' : ''}`} onClick={async () => {
                        const upd = list.map((o) => o.id === ob.id ? { ...o, done: !o.done, doneDate: !o.done ? todayISO() : null } : o);
                        await saveObs(selCo.id, upd);
                      }}>
                        {ob.done && <span style={{ color: '#fff', fontSize: 17 }}>✓</span>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: ob.done ? '#66BB6A' : '#E2D9C8', textDecoration: ob.done ? 'line-through' : 'none', marginBottom: 5 }}>{ob.name}</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'rgba(226,217,200,0.42)' }}>{ob.done ? `✓ Cumplida: ${ob.doneDate}` : `Vence: ${ob.due}`}</span>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(226,217,200,0.45)' }}>{ob.freq}</span>
                          {ob.notes && (<span style={{ fontSize: 12, color: 'rgba(226,217,200,0.32)', fontStyle: 'italic' }}>{ob.notes}</span>)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {ob.done && FREQ_M[ob.freq] && (
                          <button className="btn bs" title="Crear siguiente período" onClick={async () => {
                            const n = { ...ob, id: uid(), due: addMonths(ob.due, FREQ_M[ob.freq]), done: false, doneDate: null };
                            await saveObs(selCo.id, [...list, n]);
                          }}>↻ Renovar</button>
                        )}
                        <button className="btn bd" onClick={() => setConfirm({ type: 'ob', item: ob.id })}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
      </main>

      {/* ═══ FAB de chat para colaborador ═══ */}
      {role === 'colaborador' && linkedEmpId && !chatTargetEmpId && (
        <button className="fab" onClick={() => setChatTargetEmpId(linkedEmpId)} title="Mensajes con el administrador">
          💬
          {myUnread > 0 && <span className="fabBadge">{myUnread}</span>}
        </button>
      )}

      {/* ═══ CHAT BOX ═══ */}
      {chatTargetEmpId && (
        <ChatBox
          empId={chatTargetEmpId}
          emp={emps.find((e) => e.id === chatTargetEmpId)}
          messages={messages[chatTargetEmpId] || []}
          isAdmin={isAdmin}
          onClose={() => setChatTargetEmpId(null)}
          onSend={(text) => sendMessage(chatTargetEmpId, text)}
          onDelete={(msgId) => deleteMessage(chatTargetEmpId, msgId)}
        />
      )}

      {/* ═══ MODALS ═══ */}
      {modal === 'addEmp' && (
        <AddEmpModal onClose={() => setModal(null)} onSave={async (e) => { await saveEmps([...emps, e]); setModal(null); }} />
      )}
      {modal === 'addCo' && (
        <AddCoModal onClose={() => setModal(null)} onSave={async (c) => {
          const targetEmpId = isAdmin ? selEmp.id : linkedEmpId;
          const arr = [...(cos[targetEmpId] || []), c];
          await saveCos(targetEmpId, arr);
          setModal(null);
        }} />
      )}
      {modal === 'addOb' && (
        <AddObModal onClose={() => setModal(null)} onSave={async (o) => {
          await saveObs(selCo.id, [...(obs[selCo.id] || []), o]);
          setModal(null);
        }} />
      )}
      {modal === 'pending' && isAdmin && (
        <PendingModal
          pending={pending}
          emps={emps}
          onClose={() => setModal(null)}
          onAuthorize={authorizePending}
          onReject={rejectPending}
        />
      )}

      {/* ═══ CONFIRM ═══ */}
      {confirm && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#E2D9C8', marginBottom: 14 }}>Confirmar eliminación</div>
            <p style={{ color: 'rgba(226,217,200,0.62)', fontSize: 14, lineHeight: 1.6, marginBottom: 26 }}>
              {confirm.type === 'emp' ? `¿Eliminar al colaborador "${confirm.item.name}"? Se perderán todas sus empresas y obligaciones.` :
                confirm.type === 'co' ? `¿Eliminar la empresa "${confirm.item.name}"? Se eliminarán todas sus obligaciones.` :
                  '¿Eliminar esta obligación permanentemente?'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn bg" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="btn bd" style={{ padding: '10px 20px', fontSize: 14 }} onClick={async () => {
                if (confirm.type === 'emp') await saveEmps(emps.filter((e) => e.id !== confirm.item.id));
                else if (confirm.type === 'co') await saveCos(isAdmin ? selEmp.id : linkedEmpId, (cos[isAdmin ? selEmp.id : linkedEmpId] || []).filter((c) => c.id !== confirm.item.id));
                else await saveObs(selCo.id, (obs[selCo.id] || []).filter((o) => o.id !== confirm.item));
                setConfirm(null);
              }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   CHAT BOX
   ══════════════════════════════════════════ */
function ChatBox({ emp, messages, isAdmin, onClose, onSend, onDelete }) {
  const [text, setText] = useState('');
  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);
  const handleDelete = (msgId) => {
    if (window.confirm('¿Seguro que quieres eliminar este mensaje?')) {
      onDelete(msgId);
    }
  };
  return (
    <div className="chatBox">
      <div className="chatHead">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {emp && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${emp.color},${emp.color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              {emp.initials}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: '#E2D9C8', fontSize: 14 }}>{isAdmin ? (emp?.name || 'Colaborador') : 'Administrador'}</div>
            <div style={{ fontSize: 10, color: 'rgba(226,217,200,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mensajes</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(226,217,200,0.5)', cursor: 'pointer', fontSize: 22 }}>✕</button>
      </div>
      <div className="chatBody" ref={bodyRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(226,217,200,0.3)', fontSize: 13, padding: '40px 0' }}>
            Sin mensajes aún.<br />Escribe el primero ↓
          </div>
        )}
        {messages.map((m) => {
          const mine = (isAdmin && m.from === 'admin') || (!isAdmin && m.from === 'colaborador');
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ position: 'relative', maxWidth: '85%' }}>
                <div className={`msg ${mine ? 'msgMe' : 'msgOther'}`}>{m.text}</div>
                {mine && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    title="Eliminar mensaje"
                    style={{
                      position: 'absolute',
                      top: -7,
                      right: -7,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(198,40,40,0.95)',
                      border: '2px solid #0D1E33',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="msgTime">{fmtTime(m.ts)}</div>
            </div>
          );
        })}
      </div>
      <div className="chatFoot">
        <input
          className="inp"
          style={{ padding: '10px 14px' }}
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim()) {
              onSend(text);
              setText('');
            }
          }}
        />
        <button className="btn bp" style={{ padding: '10px 16px' }} onClick={() => { if (text.trim()) { onSend(text); setText(''); } }}>
          ➤
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MODALES
   ══════════════════════════════════════════ */
function Shell({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700, color: '#42A5F5' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(226,217,200,0.32)', cursor: 'pointer', fontSize: 24 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddEmpModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const ini = (n) => n.split(' ').map((w) => w[0] || '').join('').toUpperCase().slice(0, 2);
  return (
    <Shell title="➕ Nuevo Colaborador" onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label className="lbl">Nombre completo</label>
        <input className="inp" placeholder="Ej. María Rodríguez" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div style={{ marginBottom: 26 }}>
        <label className="lbl">Puesto / Rol</label>
        <input className="inp" placeholder="Ej. Contadora, Auxiliar Fiscal..." value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <div style={{ background: 'rgba(66,165,245,0.08)', border: '1px solid rgba(66,165,245,0.2)', borderRadius: 10, padding: 12, marginBottom: 26, fontSize: 12, color: 'rgba(226,217,200,0.65)' }}>
        💡 Después de crear el colaborador, pídele que inicie sesión con su Google. Aparecerá en "Pendientes" para que lo vincules a este registro.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn bg" onClick={onClose}>Cancelar</button>
        <button className="btn bp" disabled={!name.trim()} onClick={() => onSave({
          id: uid(),
          name: name.trim(),
          role: role.trim() || 'Colaborador',
          initials: ini(name.trim()) || '?',
          color: EMP_COLORS[Math.floor(Math.random() * EMP_COLORS.length)],
        })}>Agregar</button>
      </div>
    </Shell>
  );
}

function AddCoModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('moral');
  return (
    <Shell title="🏢 Nueva Empresa" onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label className="lbl">Nombre de la empresa</label>
        <input className="inp" placeholder="Ej. Distribuidora del Norte SA de CV" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div style={{ marginBottom: 26 }}>
        <label className="lbl">Tipo de persona</label>
        <select className="sel" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="moral">Persona Moral (SA de CV, SC, SAPI...)</option>
          <option value="fisica">Persona Física</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn bg" onClick={onClose}>Cancelar</button>
        <button className="btn bp" disabled={!name.trim()} onClick={() => onSave({ id: uid(), name: name.trim(), type })}>Agregar</button>
      </div>
    </Shell>
  );
}

function AddObModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [due, setDue] = useState(todayISO());
  const [freq, setFreq] = useState('Mensual');
  const [notes, setNotes] = useState('');
  return (
    <Shell title="📋 Nueva Obligación" onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label className="lbl">Nombre de la obligación</label>
        <input className="inp" placeholder="Ej. Declaración Mensual ISR" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label className="lbl">Fecha de vencimiento</label>
          <input className="inp" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div>
          <label className="lbl">Frecuencia</label>
          <select className="sel" value={freq} onChange={(e) => setFreq(e.target.value)}>
            {FREQ.map((f) => (<option key={f}>{f}</option>))}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 26 }}>
        <label className="lbl">Notas (opcional)</label>
        <input className="inp" placeholder="Observaciones adicionales..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn bg" onClick={onClose}>Cancelar</button>
        <button className="btn bp" disabled={!name.trim()} onClick={() => onSave({
          id: uid(), name: name.trim(), due, freq, notes, done: false, doneDate: null,
        })}>Agregar</button>
      </div>
    </Shell>
  );
}

function PendingModal({ pending, emps, onClose, onAuthorize, onReject }) {
  const [mode, setMode] = useState({});
  const [linkTo, setLinkTo] = useState({});
  const [newData, setNewData] = useState({});

  return (
    <Shell title="⏳ Usuarios pendientes de autorización" onClose={onClose}>
      {pending.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(226,217,200,0.4)' }}>
          No hay solicitudes pendientes.
        </div>
      )}
      {pending.map((p) => {
        const m = mode[p.uid] || 'link';
        return (
          <div key={p.uid} className="pendCard">
            {p.photo ? (
              <img src={p.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            ) : (
              <div className="pendAvatar">{(p.name || p.email || '?').slice(0, 1).toUpperCase()}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#E2D9C8', fontSize: 14 }}>{p.name || p.email}</div>
              <div style={{ fontSize: 12, color: 'rgba(226,217,200,0.5)', marginBottom: 10 }}>{p.email}</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button className={`bb`} style={{ fontSize: 11, padding: '5px 10px', background: m === 'link' ? 'rgba(21,101,192,0.3)' : 'rgba(21,101,192,0.08)' }} onClick={() => setMode({ ...mode, [p.uid]: 'link' })}>Vincular a existente</button>
                <button className={`bb`} style={{ fontSize: 11, padding: '5px 10px', background: m === 'new' ? 'rgba(21,101,192,0.3)' : 'rgba(21,101,192,0.08)' }} onClick={() => setMode({ ...mode, [p.uid]: 'new' })}>Crear nuevo</button>
              </div>
              {m === 'link' ? (
                <select className="sel" style={{ padding: '8px 12px', fontSize: 13, marginBottom: 8 }} value={linkTo[p.uid] || ''} onChange={(e) => setLinkTo({ ...linkTo, [p.uid]: e.target.value })}>
                  <option value="">— Selecciona un colaborador —</option>
                  {emps.filter((e) => !e.authUid).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input className="inp" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Nombre"
                    value={newData[p.uid]?.name || p.name || ''}
                    onChange={(e) => setNewData({ ...newData, [p.uid]: { ...newData[p.uid], name: e.target.value } })} />
                  <input className="inp" style={{ padding: '8px 12px', fontSize: 13 }} placeholder="Puesto"
                    value={newData[p.uid]?.role || ''}
                    onChange={(e) => setNewData({ ...newData, [p.uid]: { ...newData[p.uid], role: e.target.value } })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn bs" style={{ padding: '6px 14px' }} onClick={() => {
                  if (m === 'link') {
                    if (linkTo[p.uid]) onAuthorize(p, linkTo[p.uid], false, null);
                  } else {
                    const data = newData[p.uid] || { name: p.name || p.email };
                    if (data.name?.trim()) onAuthorize(p, null, true, data);
                  }
                }}>✓ Autorizar</button>
                <button className="btn bd" style={{ padding: '6px 14px' }} onClick={() => onReject(p)}>✕ Rechazar</button>
              </div>
            </div>
          </div>
        );
      })}
    </Shell>
  );
}
  
