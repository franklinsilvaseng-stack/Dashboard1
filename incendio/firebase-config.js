/**
 * Cole aqui a configuração do seu projeto Firebase.
 * Console Firebase → Configurações do projeto → Seus apps → SDK → Configuração.
 *
 * Guia rápido:
 * 1. Acesse https://console.firebase.google.com
 * 2. Crie um projeto (ex.: FireBoard)
 * 3. Adicione um app Web (</>)
 * 4. Copie o objeto firebaseConfig e substitua abaixo
 * 5. Authentication → Sign-in method → ative E-mail/senha
 * 6. Authentication → Users → Add user (você + a outra pessoa)
 * 7. Firestore Database → Create database → modo produção
 * 8. Firestore → Rules → cole as regras do arquivo firestore.rules e publique
 */
export const firebaseConfig = {
  apiKey: "AIzaSyAY-kGpPtcbKclKOP8laJeAItDgJ-5RGtk",
  authDomain: "fireboard-e11c1.firebaseapp.com",
  projectId: "fireboard-e11c1",
  storageBucket: "fireboard-e11c1.firebasestorage.app",
  messagingSenderId: "176156766047",
  appId: "1:176156766047:web:96c8d9624635c679fd90ea",
};

export function isFirebaseConfigured() {
  return (
    typeof firebaseConfig.apiKey === "string" &&
    firebaseConfig.apiKey.length > 8 &&
    !firebaseConfig.apiKey.includes("COLE_AQUI") &&
    firebaseConfig.projectId &&
    !String(firebaseConfig.projectId).includes("COLE_AQUI")
  );
}
