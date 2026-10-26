import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const DOC_PATH = ["painel", "shared"];

let app = null;
let auth = null;
let db = null;
let unsubSnapshot = null;
let ready = false;
let resolveFirstAuth = null;
const firstAuth = new Promise((resolve) => {
  resolveFirstAuth = resolve;
});

function settleFirstAuth(user) {
  if (resolveFirstAuth) {
    resolveFirstAuth(user || null);
    resolveFirstAuth = null;
  }
}

function setLoginMsg(text, isError = true) {
  const el = document.getElementById("loginMsg");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("is-error", Boolean(isError && text));
  el.classList.toggle("is-ok", Boolean(!isError && text));
}

function showLogin(show) {
  const gate = document.getElementById("loginGate");
  const shell = document.getElementById("appShell");
  if (gate) gate.hidden = !show;
  if (shell) shell.hidden = show;
  document.body.classList.toggle("is-locked", show);
}

function initialsFromEmail(email) {
  const base = String(email || "U").split("@")[0];
  const parts = base.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function displayNameFromEmail(email) {
  const base = String(email || "").split("@")[0] || "Usuário";
  return base
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function updateProfileUI(user) {
  const name = displayNameFromEmail(user?.email);
  const strong = document.querySelector(".profile strong");
  const small = document.querySelector(".profile small");
  const avatar = document.querySelector(".profile .avatar");
  const greeting = document.getElementById("greetingTitle");
  if (strong) strong.textContent = name;
  if (small) small.textContent = user?.email || "Conta compartilhada";
  if (avatar) avatar.textContent = initialsFromEmail(user?.email);
  if (greeting) {
    const h = new Date().getHours();
    const hello = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    greeting.textContent = `${hello}, ${name.split(" ")[0]}`;
  }
}

async function loadShared() {
  if (!db) return null;
  const snap = await getDoc(doc(db, ...DOC_PATH));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    extintores: Array.isArray(data.extintores) ? data.extintores : null,
    precos: data.precos || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
  };
}

async function saveShared({ extintores, precos }) {
  if (!db) throw new Error("Firestore não inicializado");
  await setDoc(
    doc(db, ...DOC_PATH),
    {
      extintores: extintores || [],
      precos: precos || {},
      updatedAt: serverTimestamp(),
      updatedBy: auth?.currentUser?.email || null,
    },
    { merge: true }
  );
}

function subscribe(onData) {
  if (!db) return () => {};
  if (unsubSnapshot) unsubSnapshot();
  unsubSnapshot = onSnapshot(
    doc(db, ...DOC_PATH),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data();
      onData({
        extintores: Array.isArray(data.extintores) ? data.extintores : null,
        precos: data.precos || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        updatedBy: data.updatedBy || null,
      });
    },
    (err) => console.error("Firestore sync:", err)
  );
  return () => {
    if (unsubSnapshot) {
      unsubSnapshot();
      unsubSnapshot = null;
    }
  };
}

async function login(email, password) {
  if (!auth) throw new Error("Firebase não configurado");
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

async function logout() {
  if (unsubSnapshot) {
    unsubSnapshot();
    unsubSnapshot = null;
  }
  if (auth) await signOut(auth);
}

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  const btnOut = document.getElementById("btnLogout");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      const btn = document.getElementById("btnLogin");
      if (btn) btn.disabled = true;
      setLoginMsg("Entrando…", false);
      try {
        await login(email, password);
        setLoginMsg("");
      } catch (err) {
        const code = err?.code || "";
        let msg = "Não foi possível entrar. Verifique e-mail e senha.";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
          msg = "E-mail ou senha incorretos.";
        } else if (code === "auth/user-not-found") {
          msg = "Usuário não encontrado. Crie a conta no Firebase Console.";
        } else if (code === "auth/too-many-requests") {
          msg = "Muitas tentativas. Aguarde e tente de novo.";
        } else if (String(err.message || "").includes("Firebase")) {
          msg = err.message;
        }
        setLoginMsg(msg, true);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }
  if (btnOut) {
    btnOut.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btnOut.disabled = true;
      try {
        await logout();
        showLogin(true);
      } catch (err) {
        console.error(err);
        alert("Não foi possível sair. Tente de novo.");
      } finally {
        btnOut.disabled = false;
      }
    });
  }
}

function initCloud() {
  bindLoginForm();

  if (!isFirebaseConfigured()) {
    ready = false;
    showLogin(true);
    setLoginMsg(
      "Configure o Firebase: edite o arquivo firebase-config.js com os dados do seu projeto.",
      true
    );
    settleFirstAuth(null);
    window.FireBoardCloud = api();
    window.dispatchEvent(new Event("fireboard-cloud-ready"));
    return;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  ready = true;

  window.FireBoardCloud = api();
  window.dispatchEvent(new Event("fireboard-cloud-ready"));

  onAuthStateChanged(auth, async (user) => {
    settleFirstAuth(user || null);
    if (!user) {
      showLogin(true);
      window.dispatchEvent(new CustomEvent("fireboard-auth", { detail: { user: null } }));
      return;
    }
    showLogin(false);
    updateProfileUI(user);
    window.dispatchEvent(new CustomEvent("fireboard-auth", { detail: { user } }));
  });
}

function api() {
  return {
    isReady: () => ready,
    isConfigured: isFirebaseConfigured,
    currentUser: () => auth?.currentUser || null,
    waitForAuth: () => firstAuth,
    login,
    logout,
    loadShared,
    saveShared,
    subscribe,
  };
}

initCloud();
