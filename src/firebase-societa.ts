/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocFromServer,
  increment
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// ============================================================================
// 1. ARCHITETTURA DEL DATABASE (Firebase Firestore) - Modelli TypeScript
// ============================================================================

/**
 * 1. Collezione: 'societa_info'
 * Dati istituzionali, organigramma e palestre della New Volley Academy.
 * Documento singolo chiave: 'generale'
 */
export interface SocietaInfo {
  id: string; // "generale"
  nome: string;
  anno_fondazione: number;
  sede_legale: string;
  partita_iva: string;
  contatti: {
    email: string;
    telefono: string;
    pec: string;
    whatsapp?: string;
    social_facebook?: string;
    social_instagram?: string;
  };
  organigramma: {
    presidente?: string;
    vice_presidente?: string;
    direttore_tecnico?: string;
    responsabile_settore_giovanile?: string;
    direttivo: Array<{ ruolo: string; nome: string }>;
    staff_tecnico: Array<{ ruolo: string; nome: string; qualifica?: string }>;
  };
  palestre: Array<{
    id?: string;
    nome: string;
    indirizzo: string;
    citta?: string;
    cap?: string;
    capienza?: number;
    note?: string;
  }>;
  orari_generali: Array<{
    giorno: string;
    attivita: string;
    fascia_oraria: string;
    palestra: string;
  }>;
}

/**
 * 1b. Collezione: 'config_home'
 * Configurazione dinamica della home page (es. immagine hero di sfondo).
 */
export interface ConfigHome {
  id: string; // "generale"
  hero_foto_url: string;
  heroBgUrl?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroBtn1Text?: string;
  heroBtn2Text?: string;
  storyTitle?: string;
  storyDescription?: string;
  storyFotoUrl?: string;
  heroBgPositionY?: number | string;
  heroDescriptionColor?: string;
}

export interface ProssimaGara {
  id: string;
  categoria: "Serie D Maschile" | "Serie D Femminile";
  avversario: string;
  data_ora: string;
  luogo: string;
  giornata: string;
  casa: boolean;
  punti_nva: number | null;
  punti_avversario: number | null;
  link_mappa?: string;
}

/**
 * 2. Collezione: 'modulistica'
 * Documenti e PDF per le iscrizioni degli atleti suddivisi per categoria.
 */
export interface Modulistica {
  id: string;
  titolo_modulo: string;
  categoria_target: string; // es. "Minivolley", "Under 13", "Serie D"
  file_url_storage: string; // Link per lo scaricamento del PDF
  descrizione: string;
  attivo: boolean; // Se false, il modulo viene nascosto al download pubblico
  stato_pubblicazione?: 'bozza' | 'pubblicato';
}

/**
 * 3. Collezione: 'eventi_tornei'
 * Tornei ed eventi proprietari organizzati dalla New Volley Academy.
 */
export interface ClassificaSquadra {
  squadra: string;
  punti: number;
  giocate: number;
  vinte: number;
  perse: number;
}

export interface GironeTorneo {
  nome: string; // es. "Girone A"
  squadre: string[];
  classifica: ClassificaSquadra[];
}

export interface EventiTorneo {
  id: string;
  nome_evento: string; // es. "New Volley Academy Cup"
  edizione: string; // es. "2026 - Edizione Estiva"
  categoria: string; // es. "Under 16 Femminile"
  squadre_partecipanti: string[];
  gironi: GironeTorneo[];
  albo_oro: Array<{ anno: string; vincitore: string; secondo: string }>;
  foto_gallery_urls: string[];
  stato: 'programmato' | 'in_corso' | 'concluso';
  iscrizioni_aperte?: boolean;
  status?: 'ATTIVO' | 'NASCOSTO' | 'STORICO';
  archivio?: {
    partecipanti?: number;
    edizione?: string;
    location?: string;
    highlight?: string;
    foto?: string[];
  };
}

/**
 * 4. Collezione: 'sponsor'
 * Gestione dei partner commerciali visualizzati sul portale.
 */
export interface Sponsor {
  id: string;
  nomeSponsor: string;
  linkSito: string;
  tipologia: 'Main Sponsor' | 'Gold Partner' | 'Sponsor Tecnico' | 'Partner Locale';
  logo: {
    url: string;
    positionY: number; // 0-100% focal point
  };
  squadreAssociate?: string[]; // IDs delle squadre associate
  ordine: number;
  attivo?: boolean;
}

/**
 * 5. Collezione: 'news_blog'
 * Articoli di attualità, resoconti di gare e comunicati societari.
 */
export interface SocialTriggerLog {
  timestamp: string;
  platform: 'facebook' | 'instagram';
  status: 'pending' | 'success' | 'failed';
  messageId?: string;
  responseLog?: string;
}

export interface NewsBlog {
  id: string;
  titolo: string;
  data_pubblicazione: string; // Formato ISO String
  testo: string;
  foto_copertina_url: string;
  tag_categoria: string;
  autore: string;
  stato_pubblicazione?: 'bozza' | 'pubblicato';
  squadra_associata_id?: string; // ID della rosa_squadra a cui è legata la news
  social_trigger?: {
    attivo: boolean;
    stato_pubblicazione: 'non_avviata' | 'in_corso' | 'completata' | 'fallita';
    webhook_url?: string;
    log_invio?: SocialTriggerLog[];
  };
}

/**
 * 6. Collezione: 'giocatori'
 * Anagrafica e dettagli tecnici dei singoli tesserati.
 */
export interface RecordStoricoManuale {
  stagione: string;
  squadra_o_premio: string;
  ruolo?: string;
  note?: string;
}

export interface Giocatore {
  id: string;
  nome: string;
  cognome: string;
  data_nascita: string; // Formato YYYY-MM-DD
  ruolo?: string; // Es. 'Palleggiatore', 'Schiacciatore', 'Opposto', 'Centrale', 'Libero', 'Universale' o vuoto (es. Minivolley)
  genere?: 'F' | 'M';
  altezza?: number; // in cm (opzionale)
  foto_url?: string;
  numero_maglia: number;
  attivo: boolean;
  storico_manuale?: RecordStoricoManuale[];
  fotoPositionY?: number;
  fotoPositionX?: number;
  foto?: {
    url: string;
    positionY: number;
    positionX?: number;
  };
}

/**
 * 7. Collezione: 'rose_squadre'
 * Rose delle squadre per la singola stagione agonistica. Collega i giocatori
 * tramite il loro ID permettendo di mappare lo storico delle carriere.
 */
export interface RigaClassifica {
  pos: number;
  squadra: string;
  punti: number;
  giocate: number;
  vinte: number;
  perse: number;
  setVinti?: number;
  setPersi?: number;
  isMyTeam?: boolean;
}

export interface PartitaCampionato {
  id: string;
  giornata: string; // es. "1ª Giornata"
  data: string; // es. "2026-10-18" o "18/10/2026"
  ora: string; // es. "20:30"
  avversario: string;
  casa: boolean;
  luogo?: string; // es. "Palasport Comunale, Forlì"
  link_mappa?: string; // URL personalizzato Google Maps o Waze
  risultato?: string; // es. "3 - 1" o vuoto se da disputare
  setNva?: number | null;
  setAvversario?: number | null;
  parzialiSet?: string; // es. "25-21, 22-25, 25-18, 25-20"
  terminata: boolean;
  note?: string;
}

export interface IncontroGara {
  avversario: string;
  data: string;
  ora: string;
  set_vinti: number;
  set_persi: number;
  casa: boolean;
  terminata: boolean;
  luogo?: string;
  giornata?: string;
  parzialiSet?: string;
}

export interface RosaSquadra {
  id: string; // es. "squadra_seried_2025_2026"
  nome_squadra: string; // es. "Serie D Femminile"
  stagione: string; // es. "2025/2026"
  campionato: string; // es. "FIPAV Serie D Femminile - Girone B"
  fipav_url?: string; // URL scheda campionato FIPAV ufficiale
  allenatori: {
    primo: string;
    secondo?: string;
    dirigente_accompagnatore?: string;
  };
  ruoli_staff?: {
    primo?: string;
    secondo?: string;
    dirigente_accompagnatore?: string;
  };
  id_atleti: string[]; // Riferimenti agli ID della collezione 'giocatori'
  sponsor_abbinato_id?: string; // ID sponsor principale della squadra
  cronologia_gare?: IncontroGara[];
  partite?: PartitaCampionato[]; // Elenco gare del campionato
  classifica?: RigaClassifica[]; // Tabella classifica del campionato
  foto_copertina_url?: string; // Foto di squadra caricabile/aggiornabile
  category?: 'SERIE_D' | 'CAMPIONATI_SENIOR' | 'GIOVANILI';
  capitano_id?: string; // ID dell'atleta capitano
  coverPositionY?: number;
  nome_visualizzato_gare?: string; // Nome personalizzato mostrato nelle partite (es. "Serie D Femminile" o "SALFEP Volley Academy")
  squadra_fipav_ufficiale?: string; // Nome esatto della squadra societaria nel girone FIPAV (es. "SALFEP VOLLEY ACADEMY FORLI'")
  genere?: 'F' | 'M' | 'MISTO'; // Settore/Genere della squadra: Femminile, Maschile o Misto
  gender?: 'F' | 'M' | 'MISTO'; // Alias retrocompatibile
}

export type GenereSquadra = 'F' | 'M' | 'MISTO';

/**
 * Determina in modo accurato e tollerante il settore/genere di una squadra ('F' | 'M' | 'MISTO').
 * Priorità:
 * 1. Campo esplicito 'genere' o 'gender' impostato nel CMS.
 * 2. Analisi intelligente regex del nome squadra e del campionato.
 * 3. Default 'F' per la New Volley Academy.
 */
export function getGenereSquadra(s?: Partial<RosaSquadra> | null): GenereSquadra {
  if (!s) return 'F';
  const explicit = (s.genere || (s as any).gender || '').toString().trim().toUpperCase();
  if (explicit === 'F' || explicit === 'FEMMINILE') return 'F';
  if (explicit === 'M' || explicit === 'MASCHILE') return 'M';
  if (explicit === 'MISTO' || explicit === 'MIXED') return 'MISTO';

  const name = (s.nome_squadra || '').trim();
  const camp = (s.campionato || '').trim();
  const text = `${name} ${camp}`.toLowerCase();

  const isExplicitFemale = 
    /\b(femminile|femminili|donne|ragazze)\b/i.test(text) ||
    /(?:^|[\s\/\-\(_])(?:f|fem|femm)(?:$|[\s\/\-\)_])/i.test(name) ||
    /(?:^|[\s\/\-\(_])(?:f|fem|femm)(?:$|[\s\/\-\)_])/i.test(camp);

  const isExplicitMale = 
    /\b(maschile|maschili|uomini|ragazzi)\b/i.test(text) ||
    /(?:^|[\s\/\-\(_])(?:m|mas|masc)(?:$|[\s\/\-\)_])/i.test(name) ||
    /(?:^|[\s\/\-\(_])(?:m|mas|masc)(?:$|[\s\/\-\)_])/i.test(camp);

  const isExplicitMisto =
    /\b(misto|misti|mixed)\b/i.test(text);

  if (isExplicitFemale && !isExplicitMale) return 'F';
  if (isExplicitMale && !isExplicitFemale) return 'M';
  if (isExplicitMisto) return 'MISTO';

  if (/\b(minivolley|s3)\b/i.test(text)) return 'MISTO';

  return 'F';
}

export function isSquadraFemminile(s?: Partial<RosaSquadra> | null): boolean {
  return getGenereSquadra(s) === 'F';
}

export function isSquadraMaschile(s?: Partial<RosaSquadra> | null): boolean {
  return getGenereSquadra(s) === 'M';
}

/**
 * Calcola l'indice di importanza/gerarchia e fascia d'età di una squadra.
 * Minore è il numero, prima appare la squadra.
 * 
 * Gerarchia:
 * 1. Serie D (Femminile, Maschile)
 * 2. 1^ Divisione (Femminile, Maschile)
 * 3. 2^ Divisione (Femminile, Maschile)
 * 4. 3^ Divisione (Femminile, Maschile)
 * 5. Altri campionati Senior
 * 6. Settore Giovanile in ordine decrescente di età (Under 19 -> Under 12)
 * 7. Minivolley / S3 / Primi Passi
 */
export function getSquadraHierarchyRank(s?: Partial<RosaSquadra> | null): number {
  if (!s) return 9999;
  
  const nome = (s.nome_squadra || '').toUpperCase().trim();
  const camp = (s.campionato || '').toUpperCase().trim();
  const cat = (s.category || '').toUpperCase().trim();
  const combined = `${nome} ${camp} ${cat}`;
  
  const gender = getGenereSquadra(s);
  // Femminile prima (0), Maschile (1), Misto (2)
  const genderOffset = gender === 'F' ? 0 : gender === 'M' ? 1 : 2;

  // 1. SERIE D
  if (cat === 'SERIE_D' || combined.includes('SERIE D') || combined.includes('SERIE-D')) {
    return 100 + genderOffset;
  }

  // 2. PRIMA DIVISIONE (1^ DIV / 1° DIV / 1A DIV / PRIMA DIVISIONE)
  if (
    combined.includes('1^ DIVISIONE') || 
    combined.includes('1° DIVISIONE') || 
    combined.includes('1A DIVISIONE') || 
    combined.includes('1 DIVISIONE') ||
    combined.includes('PRIMA DIVISIONE')
  ) {
    return 200 + genderOffset;
  }

  // 3. SECONDA DIVISIONE (2^ DIV / 2° DIV / 2A DIV / SECONDA DIVISIONE)
  if (
    combined.includes('2^ DIVISIONE') || 
    combined.includes('2° DIVISIONE') || 
    combined.includes('2A DIVISIONE') || 
    combined.includes('2 DIVISIONE') ||
    combined.includes('SECONDA DIVISIONE')
  ) {
    return 300 + genderOffset;
  }

  // 4. TERZA DIVISIONE (3^ DIV / 3° DIV / 3A DIV / TERZA DIVISIONE)
  if (
    combined.includes('3^ DIVISIONE') || 
    combined.includes('3° DIVISIONE') || 
    combined.includes('3A DIVISIONE') || 
    combined.includes('3 DIVISIONE') ||
    combined.includes('TERZA DIVISIONE')
  ) {
    return 400 + genderOffset;
  }

  // 5. ALTRE DIVISIONI / SENIOR CHE NON SONO GIOVANILI
  const isYouth = 
    cat === 'GIOVANILI' || 
    combined.includes('UNDER') || 
    combined.includes('MINIVOLLEY') || 
    combined.includes('S3') || 
    combined.includes('PRIMI PASSI');

  if (!isYouth && (cat === 'SENIOR' || cat === 'CAMPIONATI_SENIOR' || combined.includes('DIVISIONE') || combined.includes('OPEN') || combined.includes('AMATORI'))) {
    return 500 + genderOffset;
  }

  // 6. GIOVANILI: Ordiniamo per età decrescente (dai più grandi ai più piccoli)
  const underMatch = combined.match(/UNDER\s*(\d+)(?:\s*\/\s*(\d+))?|U(\d+)/i);
  if (underMatch) {
    let age = 15;
    if (underMatch[1]) {
      const primary = parseInt(underMatch[1], 10);
      const secondary = underMatch[2] ? parseInt(underMatch[2], 10) : null;
      age = secondary ? Math.max(primary, secondary) - 0.5 : primary;
    } else if (underMatch[3]) {
      age = parseInt(underMatch[3], 10);
    }
    // Più grande è l'età, minore deve essere il rank per venire prima
    return 600 + Math.max(0, (25 - age)) * 10 + genderOffset;
  }

  // 7. MINIVOLLEY / VOLLEY S3 / PRIMI PASSI
  if (combined.includes('MINIVOLLEY') || combined.includes('S3') || combined.includes('PRIMI PASSI') || combined.includes('CAS') || combined.includes('BABY')) {
    return 800 + genderOffset;
  }

  // Squadre "Da Assegnare" o pool
  if (combined.includes('DA ASSEGNARE') || combined.includes('POOL') || combined.includes('NON ASSEGNATI')) {
    return 9900;
  }

  // Fallback generico
  return 850 + genderOffset;
}

export function sortSquadreByImportance<T extends Partial<RosaSquadra>>(squadre: T[]): T[] {
  return [...squadre].sort((a, b) => {
    const rankA = getSquadraHierarchyRank(a);
    const rankB = getSquadraHierarchyRank(b);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return (a.nome_squadra || '').localeCompare(b.nome_squadra || '', 'it', { sensitivity: 'base' });
  });
}

/**
 * Elenco cariche e ruoli tipici dello staff tecnico e dirigenziale (senza area sanitaria).
 * Può essere integrato o personalizzato liberamente dall'utente.
 */
export const CARICHE_STAFF_DEFAULT: readonly string[] = [
  '1° Allenatore',
  '2° Allenatore',
  'Assistente Tecnico',
  'Aiuto Allenatore',
  'Direttore Tecnico',
  'Responsabile Tecnico',
  'Direttore Sportivo',
  'Dirigente Accompagnatore',
  'Team Manager',
  'Dirigente Responsabile',
  'Scoutman',
  'Rilevatore Statistico',
  'Preparatore Atletico',
  'Segretario Generale',
  'Addetto Arbitri'
];

/**
 * Converte il ruolo del giocatore in declinazione femminile/maschile.
 * Se il ruolo è vuoto o non impostato, restituisce una stringa vuota o il fallback indicato.
 */
export function formatRuoloGiocatore(ruolo?: string | null, genere: string = 'F'): string {
  if (!ruolo) return '';
  const r = ruolo.trim();
  if (!r) return '';

  const isF = genere.toUpperCase() === 'F';
  if (isF) {
    const rLower = r.toLowerCase();
    if (rLower === 'schiacciatore') return 'Schiacciatrice';
    if (rLower === 'palleggiatore') return 'Palleggiatrice';
    if (rLower === 'opposto') return 'Opposta';
    if (rLower === 'centrale') return 'Centrale';
    if (rLower === 'libero') return 'Libero';
    if (rLower === 'universale') return 'Universale';
  } else {
    const rLower = r.toLowerCase();
    if (rLower === 'schiacciatrice') return 'Schiacciatore';
    if (rLower === 'palleggiatrice') return 'Palleggiatore';
    if (rLower === 'opposta') return 'Opposto';
    if (rLower === 'centrale') return 'Centrale';
    if (rLower === 'libero') return 'Libero';
    if (rLower === 'universale') return 'Universale';
  }
  return r;
}

// ============================================================================
// INIZIALIZZAZIONE FIRESTORE & DIAGNOSTICA ERRORI (Zero-Trust Security Pattern)
// ============================================================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

// Determina se stiamo usando i valori segnaposto di default
export const isDemoMode = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('placeholder');

let firebaseApp;
let firestoreDb: any = null;
let firebaseAuth: any = null;
let firebaseStorage: any = null;

if (!isDemoMode) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    try {
      firestoreDb = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        }),
        ignoreUndefinedProperties: true
      });
    } catch (cacheErr) {
      firestoreDb = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)')
        ? getFirestore(firebaseApp)
        : getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    }
    firebaseAuth = getAuth(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);

    // Valida la connessione a Firestore come richiesto dalla skill
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(firestoreDb, 'test_connessione', 'stato'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firebase: Il client è offline. Verifica la tua configurazione di rete o le credenziali.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Errore durante l'inizializzazione reale di Firebase. Avvio in Modalità Demo.", err);
  }
}

export const db = firestoreDb;
export const auth = firebaseAuth;
export const storage = firebaseStorage;
export let analytics: any = null;

if (!isDemoMode && firebaseApp) {
  const isPlaceholderConfig = 
    (firebaseConfig.projectId && firebaseConfig.projectId.includes('placeholder')) || 
    (firebaseConfig.appId && firebaseConfig.appId.includes('placeholder'));

  if (!isPlaceholderConfig && typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(firebaseApp);
        } catch (_) {
          // Analytics caricato tramite gtag.js diretto in index.html
        }
      }
    }).catch(() => {});
  }
}

export async function caricaFileSuStorage(file: File, pathDest: string): Promise<string> {
  const compressImageIfNeeded = (targetFile: File): Promise<string> => {
    return new Promise((resolve) => {
      // If it's not an image (e.g. PDF), fallback to standard DataURL
      if (!targetFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(targetFile);
        return;
      }

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve('');
      reader.readAsDataURL(targetFile);
    });
  };

  if (isDemoMode) {
    return compressImageIfNeeded(file);
  }
  try {
    if (!storage) throw new Error("Storage non inizializzato");
    const storageRef = ref(storage, pathDest);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn("Storage upload fallito, utilizzo fallback compresso:", error);
    return compressImageIfNeeded(file);
  }
}

export async function caricaBlobSuStorage(blob: Blob, pathDest: string): Promise<string> {
  const fallbackToDataURL = (targetBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(targetBlob);
    });
  };

  if (isDemoMode) {
    return fallbackToDataURL(blob);
  }
  try {
    if (!storage) throw new Error("Storage non inizializzato");
    const storageRef = ref(storage, pathDest);

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/webp'
    });
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn("Storage Blob upload fallito, utilizzo fallback DataURL:", error);
    return fallbackToDataURL(blob);
  }
}

/**
 * Converte in modo sicuro una stringa Base64 data-URL in un Blob binario.
 * Gestisce URL-encoding, spazi, newline e chunking per grandi dimensioni.
 */
function dataUrlToBlob(url: string, defaultMime = 'application/pdf'): Blob {
  const parts = url.split(',');
  const meta = parts[0] || '';
  let base64Data = parts[1] || '';

  const mimeMatch = meta.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : defaultMime;

  if (base64Data.includes('%')) {
    try {
      base64Data = decodeURIComponent(base64Data);
    } catch (e) {}
  }
  // Rimuove eventuali whitespace o newline introdotte da encoding o transfer
  base64Data = base64Data.replace(/\s+/g, '');

  const byteCharacters = atob(base64Data);
  const sliceSize = 1024;
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Utility per aprire in una nuova finestra/scheda un documento PDF.
 * Supporta sia URL HTTPS sia data-URI base64 aggirando i blocchi di sicurezza dei browser.
 */
export function openPdfDocument(url: string, fileName?: string): void {
  if (!url) return;
  const cleanName = fileName || 'documento.pdf';
  const finalFileName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

  try {
    if (url.startsWith('data:')) {
      const blob = dataUrlToBlob(url, 'application/pdf');
      const blobUrl = URL.createObjectURL(blob);

      // Prova apertura nativa
      const newWin = window.open(blobUrl, '_blank');
      
      // Fallback in caso di popup blocker o mobile browser: download diretto
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {}
      }, 90000);
      return;
    }

    // URL web standard (Firebase Storage, HTTPS)
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error("Errore durante l'apertura del documento PDF:", err);
    downloadPdfDocument(url, fileName);
  }
}

/**
 * Utility per forzare il download diretto di un documento PDF (data-URI o link HTTPS).
 */
export function downloadPdfDocument(url: string, fileName?: string): void {
  if (!url) return;
  const cleanName = fileName || 'documento.pdf';
  const finalFileName = cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

  try {
    if (url.startsWith('data:')) {
      const blob = dataUrlToBlob(url, 'application/pdf');
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {}
      }, 60000);
      return;
    }

    // Per URL http/https normali
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Errore durante il download del documento PDF:", err);
    window.open(url, '_blank');
  }
}

/**
 * Gestore centralizzato degli errori di sicurezza di Firestore per il debugging dell'applet.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('[Firestore Security Guard] Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// DATI DI BASE PER LA MODALITÀ DEMO (Inizializzati in LocalStorage)
// ============================================================================

const DEFAULT_SOCIETA_INFO: SocietaInfo = {
  id: 'generale',
  nome: "New Volley Academy Forlì",
  anno_fondazione: 2018,
  sede_legale: "Via dell'Appennino 140, 47121 Forlì (FC)",
  partita_iva: "IT09876543210",
  contatti: {
    email: "info@newvolleyacademy.it",
    telefono: "+39 351 321 0332",
    whatsapp: "+39 351 321 0332",
    pec: "newvolleyacademyforli@legalmail.it",
    social_facebook: "https://facebook.com/newvolleyacademyforli",
    social_instagram: "https://instagram.com/newvolleyacademyforli"
  },
  organigramma: {
    presidente: "Walter Gagliardi",
    vice_presidente: "Debora Montanari",
    direttore_tecnico: "",
    responsabile_settore_giovanile: "",
    direttivo: [
      { ruolo: "Presidente", nome: "Walter Gagliardi" },
      { ruolo: "Vice Presidente & Tesoriere", nome: "Debora Montanari" },
      { ruolo: "Direttore Sportivo", nome: "Alessandro Verri" },
      { ruolo: "Responsabile Comunicazione", nome: "Chiara Boscolo" }
    ],
    staff_tecnico: []
  },
  palestre: [
    { nome: "PalaRomiti Forlì (Tana delle Pantere)", indirizzo: "Via dell'Appennino 140, Forlì", capienza: 1200, note: "Campo principale in taraflex, ingresso tifosi lato nord" },
    { nome: "Palasport Ginnasio Forlì", indirizzo: "Viale della Libertà 46, Forlì", capienza: 400, note: "Utilizzato per il settore giovanile e allenamenti Under" }
  ],
  orari_generali: [
    { giorno: "Lunedì", attivita: "Allenamento Serie D Femminile", fascia_oraria: "19:30 - 21:30", palestra: "PalaRomiti Forlì" },
    { giorno: "Martedì", attivita: "Minivolley / S3 (Panterine)", fascia_oraria: "16:30 - 18:00", palestra: "Palasport Ginnasio" },
    { giorno: "Mercoledì", attivita: "Allenamento Serie D Femminile", fascia_oraria: "19:30 - 21:30", palestra: "PalaRomiti Forlì" },
    { giorno: "Giovedì", attivita: "Under 14 & Under 16", fascia_oraria: "18:00 - 20:00", palestra: "PalaRomiti Forlì" },
    { giorno: "Venerdì", attivita: "Rifinitura Serie D", fascia_oraria: "20:00 - 21:30", palestra: "PalaRomiti Forlì" }
  ]
};

const DEFAULT_MODULISTICA: Modulistica[] = [
  { id: "mod_01", titolo_modulo: "Scheda di Iscrizione Minivolley S3 (6-11 anni)", categoria_target: "Minivolley", file_url_storage: "https://firebasestorage.googleapis.com/v0/b/new-volley/o/moduli%2Fiscrizione_s3.pdf?alt=media", descrizione: "Modulo ufficiale da compilare a cura dei genitori per la stagione sportiva in corso, con consenso GDPR e liberatoria privacy.", attivo: true, stato_pubblicazione: "pubblicato" },
  { id: "mod_02", titolo_modulo: "Modulo Iscrizione Settore Giovanile (Under 13 - Under 16)", categoria_target: "Settore Giovanile", file_url_storage: "https://firebasestorage.googleapis.com/v0/b/new-volley/o/moduli%2Fgiovanili_2026.pdf?alt=media", descrizione: "Informativa e modulo di adesione per i campionati giovanili FIPAV e CSI. Richiede allegato certificato medico agonistico.", attivo: true, stato_pubblicazione: "pubblicato" },
  { id: "mod_03", titolo_modulo: "Certificazione Idoneità Sanitaria Non Agonistica", categoria_target: "Tutte le categorie", file_url_storage: "https://firebasestorage.googleapis.com/v0/b/new-volley/o/moduli%2Fcertificato_facsimile.pdf?alt=media", descrizione: "Fac-simile ministeriale da far compilare al pediatra o medico di base per gli atleti sotto gli 11 anni.", attivo: true, stato_pubblicazione: "pubblicato" },
  { id: "mod_04", titolo_modulo: "Richiesta Nulla Osta Trasferimento Atleta", categoria_target: "Prestiti e Trasferimenti", file_url_storage: "https://firebasestorage.googleapis.com/v0/b/new-volley/o/moduli%2Fnulla_osta.pdf?alt=media", descrizione: "Modulo interno per la richiesta di prestito temporaneo o trasferimento definitivo verso altri sodalizi.", attivo: false, stato_pubblicazione: "bozza" }
];

const DEFAULT_SPONSOR: Sponsor[] = [
  { id: "spon_01", nomeSponsor: "Ferramenta Salsep", tipologia: "Main Sponsor", logo: { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&auto=format&fit=crop&q=60", positionY: 50 }, linkSito: "https://www.ferramentasalsep.it", squadreAssociate: [], ordine: 1, attivo: true },
  { id: "spon_02", nomeSponsor: "Fioreria Il Mughetto", tipologia: "Gold Partner", logo: { url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=150&auto=format&fit=crop&q=60", positionY: 50 }, linkSito: "https://www.ilmughettofiori.it", squadreAssociate: [], ordine: 2, attivo: true },
  { id: "spon_03", nomeSponsor: "Studio Fisioterapico San Marco", tipologia: "Gold Partner", logo: { url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=150&auto=format&fit=crop&q=60", positionY: 50 }, linkSito: "https://www.fisioterapiasanmarco.it", squadreAssociate: [], ordine: 3, attivo: true },
  { id: "spon_04", nomeSponsor: "Pizzeria Da Mimmo", tipologia: "Sponsor Tecnico", logo: { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&auto=format&fit=crop&q=60", positionY: 50 }, linkSito: "https://www.damimmopizza.it", squadreAssociate: [], ordine: 4, attivo: true }
];

const DEFAULT_NEWS: NewsBlog[] = [
  {
    id: "news_01",
    titolo: "La prima squadra vola alle Finali Regionali: vittoria decisiva al tie-break!",
    data_pubblicazione: "2026-06-25T18:30:00Z",
    testo: "Un'impresa epica tra le mura amiche del PalaVolley Academy. Sotto di due set, le nostre ragazze della Serie D compiono una rimonta pazzesca superando il Volley Verona al quinto set (15-12). Coach Gulinelli dichiara a fine partita: 'Questo gruppo ha un cuore immenso. Ora testa alle finali regionali di Padova del prossimo mese, vogliamo sognare fino in fondo'. Un grande ringraziamento a tutto il pubblico accorso numeroso a sostenerci!",
    foto_copertina_url: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=800&auto=format&fit=crop&q=80",
    tag_categoria: "Serie D",
    autore: "Chiara Boscolo",
    social_trigger: {
      attivo: true,
      stato_pubblicazione: "completata",
      webhook_url: "https://hooks.zapier.com/hooks/catch/12345/abcde",
      log_invio: [
        { timestamp: "2026-06-25T18:32:00Z", platform: "facebook", status: "success", messageId: "FB_POST_98723" },
        { timestamp: "2026-06-25T18:32:05Z", platform: "instagram", status: "success", messageId: "IG_POST_55124" }
      ]
    }
  },
  {
    id: "news_02",
    titolo: "Presentato il camp estivo 'New Volley Summer Camp 2026' per ragazzi e ragazze",
    data_pubblicazione: "2026-06-15T09:00:00Z",
    testo: "Aperte ufficialmente le iscrizioni per l'evento estivo più atteso dell'anno. Tre settimane all'insegna del divertimento, della pallavolo e del mare, sotto la supervisione del nostro Direttore Tecnico Roberto Baggio e di istruttori federali qualificati. Il camp si terrà presso la struttura marittima di Lignano Sabbiadoro. Sconti speciali per i tesserati dell'Academy e per fratelli/sorelle. Posti limitati!",
    foto_copertina_url: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80",
    tag_categoria: "Eventi",
    autore: "Chiara Boscolo",
    social_trigger: {
      attivo: false,
      stato_pubblicazione: "non_avviata"
    }
  },
  {
    id: "news_03",
    titolo: "Comunicato Ufficiale: Assemblea Generale dei Soci della Pallavolo NVA",
    data_pubblicazione: "2026-06-01T14:00:00Z",
    testo: "Si comunica a tutti i soci che il giorno venerdì 10 luglio 2026 alle ore 19:00 in prima convocazione, e alle ore 20:30 in seconda convocazione, si terrà l'Assemblea Generale Ordinaria dei Soci presso la sala riunioni della sede sociale in Viale dello Sport 44, Padova. All'ordine del giorno l'approvazione del bilancio consuntivo 2025 e l'esposizione dei programmi agonistici per la stagione 2026/2027.",
    foto_copertina_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    tag_categoria: "Comunicato Ufficiale",
    autore: "Silvia Marchetti",
    social_trigger: {
      attivo: true,
      stato_pubblicazione: "completata",
      webhook_url: "https://hooks.zapier.com/hooks/catch/12345/abcde",
      log_invio: [
        { timestamp: "2026-06-01T14:02:12Z", platform: "facebook", status: "success", messageId: "FB_POST_11204" }
      ]
    }
  }
];

const DEFAULT_GIOCATORI: Giocatore[] = [
  { id: "gio_01", nome: "Francesca", cognome: "Zennaro", data_nascita: "2002-04-12", ruolo: "Palleggiatore", altezza: 175, foto_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", numero_maglia: 5, attivo: true },
  { id: "gio_02", nome: "Martina", cognome: "Guerra", data_nascita: "2000-11-23", ruolo: "Schiacciatore", altezza: 182, foto_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80", numero_maglia: 10, attivo: true },
  { id: "gio_03", nome: "Elena", cognome: "Volpato", data_nascita: "2001-08-05", ruolo: "Opposto", altezza: 184, foto_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80", numero_maglia: 8, attivo: true },
  { id: "gio_04", nome: "Chiara", cognome: "Sartori", data_nascita: "1999-03-30", ruolo: "Centrale", altezza: 188, foto_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80", numero_maglia: 11, attivo: true },
  { id: "gio_05", nome: "Sofia", cognome: "Lorenzi", data_nascita: "2004-06-18", ruolo: "Libero", altezza: 168, foto_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80", numero_maglia: 3, attivo: true },
  { id: "gio_06", nome: "Federica", cognome: "Rizzo", data_nascita: "2005-02-14", ruolo: "Schiacciatore", altezza: 178, foto_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&auto=format&fit=crop&q=80", numero_maglia: 2, attivo: true },
  { id: "gio_07", nome: "Alice", cognome: "Marangon", data_nascita: "2006-09-02", ruolo: "Palleggiatore", altezza: 173, foto_url: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300&auto=format&fit=crop&q=80", numero_maglia: 14, attivo: true },
  { id: "gio_08", nome: "Greta", cognome: "Cipriani", data_nascita: "2003-12-01", ruolo: "Centrale", altezza: 185, foto_url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&auto=format&fit=crop&q=80", numero_maglia: 9, attivo: true }
];

const DEFAULT_SQUADRE: RosaSquadra[] = [
  {
    id: "sq_01",
    nome_squadra: "Serie D Femminile",
    stagione: "2025/2026",
    campionato: "FIPAV Emilia-Romagna Serie D - Girone E",
    fipav_url: "https://www.fipav-er.it/risultati-classifiche/scheda-campionato?CampionatoId=4124",
    allenatori: {
      primo: "Ettore Gulinelli",
      secondo: "Davide Contadin",
      dirigente_accompagnatore: "Paolo Bellini"
    },
    id_atleti: ["gio_01", "gio_02", "gio_03", "gio_04", "gio_05", "gio_08"],
    sponsor_abbinato_id: "spon_01",
    cronologia_gare: [
      { avversario: "Volley Cesena", data: "2026-06-24", ora: "20:30", set_vinti: 3, set_persi: 2, casa: true, terminata: true },
      { avversario: "Ravenna Volley Club", data: "2026-06-17", ora: "21:00", set_vinti: 3, set_persi: 0, casa: false, terminata: true },
      { avversario: "Rubicone In Volley", data: "2026-06-10", ora: "20:30", set_vinti: 1, set_persi: 3, casa: true, terminata: true }
    ],
    partite: [
      { id: "p-f-1", giornata: "1ª Giornata", data: "18/10/2025", ora: "20:30", avversario: "Volley Cesena", casa: true, luogo: "PalaMaroncelli, Forlì", risultato: "3 - 2", setNva: 3, setAvversario: 2, parzialiSet: "25-22, 23-25, 25-19, 21-25, 15-11", terminata: true },
      { id: "p-f-2", giornata: "2ª Giornata", data: "25/10/2025", ora: "21:00", avversario: "Ravenna Volley Club", casa: false, luogo: "PalaCosta, Ravenna", risultato: "3 - 0", setNva: 3, setAvversario: 0, parzialiSet: "25-18, 25-17, 25-20", terminata: true },
      { id: "p-f-3", giornata: "3ª Giornata", data: "01/11/2025", ora: "20:30", avversario: "Rubicone In Volley", casa: true, luogo: "PalaMaroncelli, Forlì", risultato: "1 - 3", setNva: 1, setAvversario: 3, parzialiSet: "20-25, 25-22, 19-25, 22-25", terminata: true },
      { id: "p-f-4", giornata: "4ª Giornata", data: "08/11/2025", ora: "18:00", avversario: "Cattolica Volley", casa: false, luogo: "Palasport Comunale, Cattolica", risultato: "", setNva: null, setAvversario: null, terminata: false },
      { id: "p-f-5", giornata: "5ª Giornata", data: "15/11/2025", ora: "20:30", avversario: "Volley Team Bologna", casa: true, luogo: "PalaMaroncelli, Forlì", risultato: "", setNva: null, setAvversario: null, terminata: false }
    ],
    classifica: [
      { pos: 1, squadra: "Rubicone In Volley", punti: 9, giocate: 3, vinte: 3, perse: 0, setVinti: 9, setPersi: 2 },
      { pos: 2, squadra: "New Volley Academy", punti: 5, giocate: 3, vinte: 2, perse: 1, setVinti: 7, setPersi: 5, isMyTeam: true },
      { pos: 3, squadra: "Volley Cesena", punti: 4, giocate: 3, vinte: 1, perse: 2, setVinti: 5, setPersi: 7 },
      { pos: 4, squadra: "Cattolica Volley", punti: 3, giocate: 2, vinte: 1, perse: 1, setVinti: 4, setPersi: 3 },
      { pos: 5, squadra: "Volley Team Bologna", punti: 3, giocate: 2, vinte: 1, perse: 1, setVinti: 3, setPersi: 4 },
      { pos: 6, squadra: "Ravenna Volley Club", punti: 0, giocate: 3, vinte: 0, perse: 3, setVinti: 1, setPersi: 9 }
    ],
    foto_copertina_url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80",
    category: "SERIE_D",
    genere: "F"
  },
  {
    id: "sq_02",
    nome_squadra: "Prima Divisione Femminile",
    stagione: "2025/2026",
    campionato: "CSI Forlì-Cesena Prima Categoria",
    allenatori: {
      primo: "Roberto Baggio",
      dirigente_accompagnatore: "Gianluca Pozzi"
    },
    id_atleti: ["gio_01", "gio_06", "gio_07"],
    sponsor_abbinato_id: "spon_03",
    cronologia_gare: [
      { avversario: "Libertas Forlì", data: "2026-06-22", ora: "20:00", set_vinti: 3, set_persi: 1, casa: false, terminata: true },
      { avversario: "Castrocaro Volley", data: "2026-06-15", ora: "20:30", set_vinti: 2, set_persi: 3, casa: true, terminata: true }
    ],
    foto_copertina_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
    category: "CAMPIONATI_SENIOR",
    genere: "F"
  },
  {
    id: "sq_03",
    nome_squadra: "Under 16 Femminile",
    stagione: "2024/2025",
    campionato: "FIPAV Forlì-Cesena Under 16 - Girone Gold",
    allenatori: {
      primo: "Giulia Neri"
    },
    id_atleti: ["gio_06", "gio_07"],
    sponsor_abbinato_id: "spon_02",
    category: "GIOVANILI",
    genere: "F"
  },
  {
    id: "sq_04",
    nome_squadra: "Serie D Maschile",
    stagione: "2025/2026",
    campionato: "FIPAV Emilia-Romagna Serie D Maschile - Girone A",
    fipav_url: "https://www.fipav-er.it/risultati-classifiche/scheda-campionato?CampionatoId=4123",
    allenatori: {
      primo: "Marco Spazzoli",
      secondo: "Stefano Recine",
      dirigente_accompagnatore: "Valerio Casadei"
    },
    id_atleti: ["gio_03", "gio_04", "gio_08"],
    sponsor_abbinato_id: "spon_02",
    cronologia_gare: [
      { avversario: "Volley Bologna", data: "2026-06-25", ora: "21:00", set_vinti: 3, set_persi: 1, casa: true, terminata: true },
      { avversario: "Imola Volley Club", data: "2026-06-18", ora: "20:30", set_vinti: 2, set_persi: 3, casa: false, terminata: true }
    ],
    partite: [
      { id: "p-m-1", giornata: "1ª Giornata", data: "19/10/2025", ora: "21:00", avversario: "Volley Bologna", casa: true, luogo: "Palasport Comunale, Forlì", risultato: "3 - 1", setNva: 3, setAvversario: 1, parzialiSet: "25-20, 25-23, 20-25, 25-18", terminata: true },
      { id: "p-m-2", giornata: "2ª Giornata", data: "26/10/2025", ora: "20:30", avversario: "Imola Volley Club", casa: false, luogo: "PalaRuggi, Imola", risultato: "2 - 3", setNva: 2, setAvversario: 3, parzialiSet: "25-22, 21-25, 25-20, 18-25, 12-15", terminata: true },
      { id: "p-m-3", giornata: "3ª Giornata", data: "02/11/2025", ora: "20:30", avversario: "Sassuolo Volley", casa: true, luogo: "Palasport Comunale, Forlì", risultato: "", setNva: null, setAvversario: null, terminata: false },
      { id: "p-m-4", giornata: "4ª Giornata", data: "09/11/2025", ora: "18:30", avversario: "Zinella Bologna", casa: false, luogo: "PalaSavena, San Lazzaro", risultato: "", setNva: null, setAvversario: null, terminata: false }
    ],
    classifica: [
      { pos: 1, squadra: "Imola Volley Club", punti: 8, giocate: 3, vinte: 3, perse: 0, setVinti: 9, setPersi: 3 },
      { pos: 2, squadra: "New Volley Academy", punti: 4, giocate: 2, vinte: 1, perse: 1, setVinti: 5, setPersi: 4, isMyTeam: true },
      { pos: 3, squadra: "Sassuolo Volley", punti: 3, giocate: 2, vinte: 1, perse: 1, setVinti: 4, setPersi: 4 },
      { pos: 4, squadra: "Volley Bologna", punti: 3, giocate: 2, vinte: 1, perse: 1, setVinti: 4, setPersi: 5 },
      { pos: 5, squadra: "Zinella Bologna", punti: 0, giocate: 3, vinte: 0, perse: 3, setVinti: 2, setPersi: 9 }
    ],
    foto_copertina_url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
    category: "SERIE_D",
    genere: "M"
  }
];

const DEFAULT_EVENTI: EventiTorneo[] = [
  {
    id: "eve_01",
    nome_evento: "New Volley Academy Cup",
    edizione: "6ª Edizione - Estate 2026",
    categoria: "Under 16 Femminile",
    squadre_partecipanti: ["NVA Blue Academy", "Volley Padova Red", "Junior Verona", "Estense Volley Ferrara"],
    gironi: [
      {
        nome: "Girone Unico",
        squadre: ["NVA Blue Academy", "Volley Padova Red", "Junior Verona", "Estense Volley Ferrara"],
        classifica: [
          { squadra: "NVA Blue Academy", punti: 6, giocate: 2, vinte: 2, perse: 0 },
          { squadra: "Volley Padova Red", punti: 3, giocate: 2, vinte: 1, perse: 1 },
          { squadra: "Junior Verona", punti: 3, giocate: 2, vinte: 1, perse: 1 },
          { squadra: "Estense Volley Ferrara", punti: 0, giocate: 2, vinte: 0, perse: 2 }
        ]
      }
    ],
    albo_oro: [
      { anno: "2025", vincitore: "NVA Blue Academy", secondo: "Volley Verona" },
      { anno: "2024", vincitore: "Junior Verona", secondo: "NVA Red Academy" },
      { anno: "2023", vincitore: "Volley Vicenza", secondo: "Estense Volley Ferrara" }
    ],
    foto_gallery_urls: [
      "https://images.unsplash.com/photo-1592656094267-764a45068526?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600&auto=format&fit=crop&q=80"
    ],
    stato: "in_corso",
    iscrizioni_aperte: true,
    status: "ATTIVO"
  },
  {
    id: "eve_camp_01",
    nome_evento: "Summer Volley Pro & Fun",
    edizione: "Edizione 2026",
    categoria: "Camp",
    squadre_partecipanti: [],
    gironi: [],
    albo_oro: [],
    foto_gallery_urls: [
      "https://images.unsplash.com/photo-1526676023333-d15fae1b2756?w=600&auto=format&fit=crop&q=80"
    ],
    stato: "concluso",
    iscrizioni_aperte: false,
    status: "ATTIVO",
    archivio: {
      partecipanti: 45,
      edizione: "1ª Edizione · Luglio 2026",
      location: "Impianto Sportivo NVA",
      highlight: "Un'edizione spettacolare con ospiti d'eccezione, sold out tecnico in tempi record!",
      foto: [
        "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1592656094267-764a45068526?w=600&auto=format&fit=crop&q=80"
      ]
    }
  }
];

// Funzioni di supporto locale per leggere/scrivere su localStorage per emulare la persistenza offline
function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(`nva_${key}`);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (e) {
    console.error("Errore di lettura dal LocalStorage", e);
  }
  return defaultValue;
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`nva_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error("Errore di scrittura nel LocalStorage", e);
  }
}

// Inizializza LocalStorage con dati di esempio se vuoto
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('nva_societa_info')) setLocalData('societa_info', DEFAULT_SOCIETA_INFO);
  if (!localStorage.getItem('nva_modulistica')) setLocalData('modulistica', DEFAULT_MODULISTICA);
  if (!localStorage.getItem('nva_sponsor')) setLocalData('sponsor', DEFAULT_SPONSOR);
  if (!localStorage.getItem('nva_news')) setLocalData('news', DEFAULT_NEWS);
  if (!localStorage.getItem('nva_giocatori')) setLocalData('giocatori', DEFAULT_GIOCATORI);
  if (!localStorage.getItem('nva_squadre') || JSON.parse(localStorage.getItem('nva_squadre') || '[]').length < 4) setLocalData('squadre', DEFAULT_SQUADRE);
  if (!localStorage.getItem('nva_eventi')) setLocalData('eventi', DEFAULT_EVENTI);
}

// ============================================================================
// 2. FUNZIONI DI LOGICA E QUERY CHIAVE (Firebase SDK v10+ con Fallback Demo)
// ============================================================================

/**
 * 1. getModulisticaAttiva()
 * Recupera tutti i PDF di iscrizione attualmente disponibili per il download.
 * Filtro: attivo == true.
 */
export async function getModulisticaAttiva(): Promise<Modulistica[]> {
  const collectionName = 'modulistica';

  if (isDemoMode) {
    // Modalità Demo Locale
    const lista = getLocalData<Modulistica[]>(collectionName, DEFAULT_MODULISTICA);
    return lista.filter(m => m.attivo === true && m.stato_pubblicazione !== 'bozza');
  }

  // Modalità Firebase Live
  try {
    const ref = collection(db, collectionName);
    // Simple equality query on 'attivo' and 'stato_pubblicazione' to filter drafts at the query level
    const q = query(ref, where('attivo', '==', true), where('stato_pubblicazione', '==', 'pubblicato'));
    const snapshot = await getDocs(q);
    const moduli: Modulistica[] = [];
    snapshot.forEach((docSnap) => {
      moduli.push({ id: docSnap.id, ...docSnap.data() } as Modulistica);
    });
    return moduli;
  } catch (error) {
    // Fallback: in case field doesn't exist yet on some documents or query fails due to index, fetch 'attivo' and filter in JS
    try {
      const ref = collection(db, collectionName);
      const q = query(ref, where('attivo', '==', true));
      const snapshot = await getDocs(q);
      const moduli: Modulistica[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.stato_pubblicazione !== 'bozza') {
          moduli.push({ id: docSnap.id, ...data } as Modulistica);
        }
      });
      return moduli;
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.GET, collectionName);
      return [];
    }
  }
}

/**
 * 2. addNewsConSocialTrigger(datiNews)
 * Inserisce una news nel database e predispone un blocco di commento/placeholder
 * per inserire una chiamata API (webhook verso Make/Zapier) per la pubblicazione
 * automatica del testo e della foto sulle pagine social (Facebook/Instagram).
 */
export async function addNewsConSocialTrigger(datiNews: Omit<NewsBlog, 'id' | 'data_pubblicazione'>): Promise<NewsBlog> {
  const collectionName = 'news_blog';
  const dataCorrente = new Date().toISOString();

  // Predisposizione del blocco social trigger con webhook fittizio o configurato
  const nuovaNewsCompleta: any = {
    ...datiNews,
    stato_pubblicazione: datiNews.stato_pubblicazione || 'pubblicato',
    data_pubblicazione: dataCorrente,
    social_trigger: {
      attivo: datiNews.social_trigger?.attivo ?? true,
      stato_pubblicazione: datiNews.social_trigger?.attivo ? 'completata' : 'non_avviata',
      webhook_url: "https://hooks.make.com/demo-webhook-newvolley-academy",
      log_invio: []
    }
  };

  // Se il social trigger è attivo, simuliamo il webhook/chiamata esterna
  if (nuovaNewsCompleta.social_trigger?.attivo) {
    const logFacebook: SocialTriggerLog = {
      timestamp: new Date().toISOString(),
      platform: 'facebook',
      status: 'success',
      messageId: `FB_POST_${Math.floor(Math.random() * 100000)}`
    };

    const logInstagram: SocialTriggerLog = {
      timestamp: new Date().toISOString(),
      platform: 'instagram',
      status: 'success',
      messageId: `IG_POST_${Math.floor(Math.random() * 100000)}`
    };

    nuovaNewsCompleta.social_trigger.log_invio = [logFacebook, logInstagram];
    nuovaNewsCompleta.social_trigger.stato_pubblicazione = 'completata';
  }

  // Sanitize payload to strip all undefined values before Firestore addDoc
  const cleanPayload = JSON.parse(JSON.stringify(nuovaNewsCompleta));

  if (isDemoMode) {
    const list = getLocalData<NewsBlog[]>('news', DEFAULT_NEWS);
    const nuovaNews: NewsBlog = {
      id: `news_${Math.floor(Math.random() * 100000)}`,
      ...cleanPayload
    };
    list.unshift(nuovaNews); // Metti all'inizio (più recente)
    setLocalData('news', list);
    return nuovaNews;
  }

  try {
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, cleanPayload);
    return {
      id: docRef.id,
      ...cleanPayload
    } as NewsBlog;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

/**
 * 3. creaSquadraEAssociaAtleti(datiSquadra, arrayIDGiocatori)
 * Crea una rosa per la stagione corrente inserendo i riferimenti degli atleti.
 */
export async function creaSquadraEAssociaAtleti(
  datiSquadra: Omit<RosaSquadra, 'id' | 'id_atleti'>,
  arrayIDGiocatori: string[]
): Promise<RosaSquadra> {
  const collectionName = 'rose_squadre';

  const nuovaRosaCompleta: Omit<RosaSquadra, 'id'> = {
    ...datiSquadra,
    id_atleti: arrayIDGiocatori,
    cronologia_gare: datiSquadra.cronologia_gare || []
  };

  // Sanitizzazione per rimuovere tutti i valori undefined che bloccano Firestore
  const cleanPayload = JSON.parse(JSON.stringify(nuovaRosaCompleta));

  if (isDemoMode) {
    const list = getLocalData<RosaSquadra[]>('squadre', DEFAULT_SQUADRE);
    const nuovaSquadra: RosaSquadra = {
      id: `sq_${Math.floor(Math.random() * 100000)}`,
      ...cleanPayload
    };
    list.push(nuovaSquadra);
    setLocalData('squadre', list);
    return nuovaSquadra;
  }

  try {
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, cleanPayload);
    return {
      id: docRef.id,
      ...cleanPayload
    } as RosaSquadra;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

/**
 * 4. getStoricoGiocatore(giocatoreId)
 * Esegue una query sulla collezione 'rose_squadre' per restituire l'elenco cronologico 
 * di tutte le squadre e i campionati in cui l'atleta ha giocato negli anni all'interno della società.
 */
export interface RecordStoricoCarriera {
  id_squadra: string;
  nome_squadra: string;
  stagione: string;
  campionato: string;
  allenatore: string;
}

export async function getStoricoGiocatore(giocatoreId: string): Promise<RecordStoricoCarriera[]> {
  const collectionName = 'rose_squadre';

  if (isDemoMode) {
    const squadre = getLocalData<RosaSquadra[]>('squadre', DEFAULT_SQUADRE);
    const storico: RecordStoricoCarriera[] = [];

    squadre.forEach(s => {
      const sqName = (s.nome_squadra || '').toUpperCase().trim();
      const campName = (s.campionato || '').toUpperCase().trim();
      if (sqName.includes('DA ASSEGNARE') || campName.includes('DA ASSEGNARE')) {
        return;
      }
      if (s.id_atleti.includes(giocatoreId)) {
        storico.push({
          id_squadra: s.id,
          nome_squadra: s.nome_squadra,
          stagione: s.stagione,
          campionato: s.campionato,
          allenatore: s.allenatori.primo ? (typeof s.allenatori.primo === 'string' ? s.allenatori.primo : ((s.allenatori.primo as any).nome || '')) : ''
        });
      }
    });

    // Ordina per stagione decrescente
    return storico.sort((a, b) => b.stagione.localeCompare(a.stagione));
  }

  try {
    const ref = collection(db, collectionName);
    // Nota: in Firestore non si può usare array-contains su più campi contemporaneamente, 
    // ma una query per trovare l'ID dell'atleta dentro l'array 'id_atleti' è pienamente supportata.
    const q = query(ref, where('id_atleti', 'array-contains', giocatoreId));
    const snapshot = await getDocs(q);
    const storico: RecordStoricoCarriera[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as RosaSquadra;
      const sqName = (data.nome_squadra || '').toUpperCase().trim();
      const campName = (data.campionato || '').toUpperCase().trim();
      // Escludi squadre fittizie / di parcheggio ("DA ASSEGNARE")
      if (sqName.includes('DA ASSEGNARE') || campName.includes('DA ASSEGNARE')) {
        return;
      }

      storico.push({
        id_squadra: docSnap.id,
        nome_squadra: data.nome_squadra,
        stagione: data.stagione,
        campionato: data.campionato,
        allenatore: data.allenatori.primo ? (typeof data.allenatori.primo === 'string' ? data.allenatori.primo : ((data.allenatori.primo as any).nome || '')) : ''
      });
    });

    // Ordinamento cronologico decrescente
    return storico.sort((a, b) => b.stagione.localeCompare(a.stagione));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

/**
 * 5. getSponsorPerLivello(livello)
 * Recupera i partner commerciali filtrati per importanza (es. Main Sponsor per la Home Page).
 */
export async function getSponsorPerLivello(livello: 'Main' | 'Gold' | 'Silver' | string): Promise<Sponsor[]> {
  const collectionName = 'sponsors';
  let targetTipo = livello;
  if (livello === 'Main') targetTipo = 'Main Sponsor';
  else if (livello === 'Gold') targetTipo = 'Gold Partner';
  else if (livello === 'Silver') targetTipo = 'Sponsor Tecnico';

  if (isDemoMode) {
    const lista = getLocalData<Sponsor[]>(collectionName, DEFAULT_SPONSOR);
    return lista.filter(s => s.attivo !== false && (s.tipologia === targetTipo || s.tipologia === (livello as any)));
  }

  try {
    const ref = collection(db, collectionName);
    const q = query(ref, where('tipologia', '==', targetTipo), orderBy('ordine', 'asc'));
    const snapshot = await getDocs(q);
    const sponsorFiltrati: Sponsor[] = [];
    snapshot.forEach((docSnap) => {
      sponsorFiltrati.push({ id: docSnap.id, ...docSnap.data() } as Sponsor);
    });
    return sponsorFiltrati;
  } catch (error) {
    // Fallback senza indice composito
    try {
      const ref = collection(db, collectionName);
      const snapshot = await getDocs(ref);
      const sponsorFiltrati: Sponsor[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.tipologia === targetTipo || d.tipologia === livello) {
          sponsorFiltrati.push({ id: docSnap.id, ...d } as Sponsor);
        }
      });
      return sponsorFiltrati.sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.GET, collectionName);
    }
  }
}

// ============================================================================
// ALTRE FUNZIONI DI SUPPORTO PER IL PORTALE (Gestione CMS ed Esplorazione)
// ============================================================================

export async function getSocietaInfo(): Promise<SocietaInfo> {
  const collectionName = 'societa_info';
  if (isDemoMode) {
    return getLocalData<SocietaInfo>('societa_info', DEFAULT_SOCIETA_INFO);
  }
  try {
    const docRef = doc(db, collectionName, 'generale');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SocietaInfo;
      const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
      if (data?.organigramma?.staff_tecnico && Array.isArray(data.organigramma.staff_tecnico)) {
        const isOnlyMock = data.organigramma.staff_tecnico.length > 0 && data.organigramma.staff_tecnico.every((s: any) =>
          mockNames.includes((s.nome || '').toLowerCase().trim())
        );
        if (isOnlyMock) {
          data.organigramma.staff_tecnico = [];
        }
      }
      return { id: docSnap.id, ...data } as SocietaInfo;
    } else {
      // Inizializza con quelli di default se vuoto
      await setDoc(docRef, DEFAULT_SOCIETA_INFO);
      return DEFAULT_SOCIETA_INFO;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/generale`);
  }
}

export async function updateSocietaInfo(info: SocietaInfo): Promise<void> {
  const collectionName = 'societa_info';
  const cleanPayload = JSON.parse(JSON.stringify(info));
  if (isDemoMode) {
    setLocalData('societa_info', cleanPayload);
    return;
  }
  try {
    const docRef = doc(db, collectionName, 'generale');
    await setDoc(docRef, cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/generale`);
  }
}

export async function getConfigHome(version: 'live' | 'draft' = 'live'): Promise<ConfigHome> {
  const default_config: ConfigHome = {
    id: 'generale',
    hero_foto_url: 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=1600&q=80',
    heroBgUrl: 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=1600&q=80',
    heroTagline: 'FORLÌ · PALLAVOLO DAL BASSO IN ALTO',
    heroTitle: 'SI GIOCA IN GIALLO E NERO.',
    heroDescription: "Due prime squadre in Serie D, un settore giovanile che cresce ogni stagione, un'unica maglia. Questa è New Volley Academy.",
    heroBtn1Text: 'SCOPRI LE SQUADRE',
    heroBtn2Text: 'CAMP ESTIVO 2026',
    storyTitle: 'La Nostra Storia',
    storyDescription: "La New Volley Academy Forlì è nata nel 2018 per creare un polo pallavolistico d'eccellenza sul territorio romagnolo. Offriamo percorsi agonistici federali e corsi S3 giovanili per formare non solo grandi atleti, ma solide persone.",
    storyFotoUrl: 'https://images.unsplash.com/photo-1592656094267-764a45157575?w=600&q=80',
    heroBgPositionY: '50'
  };
  if (isDemoMode) {
    const key = version === 'live' ? 'config_home_live' : 'config_home_draft';
    let data = getLocalData<ConfigHome>(key, null as any);
    if (!data) {
      if (version === 'draft') {
        data = getLocalData<ConfigHome>('config_home_live', null as any) || getLocalData<ConfigHome>('config_home', default_config);
      } else {
        data = getLocalData<ConfigHome>('config_home', default_config);
      }
    }
    if (!data.heroBgUrl) data.heroBgUrl = data.hero_foto_url;
    if (data.heroBgPositionY === undefined) data.heroBgPositionY = '50';
    return { ...default_config, ...data };
  }
  try {
    // 1. Prova prima con content/homepage
    const contentRef = doc(db, 'content', 'homepage');
    const contentSnap = await getDoc(contentRef);
    if (contentSnap.exists()) {
      const docData = contentSnap.data();
      const rawData = docData[version] || (version === 'draft' ? (docData['live'] || docData) : docData);
      const fotoUrl = rawData.hero_foto_url || rawData.heroBgUrl || default_config.hero_foto_url;
      return {
        id: 'generale',
        hero_foto_url: fotoUrl,
        heroBgUrl: fotoUrl,
        heroTagline: rawData.heroTagline !== undefined ? rawData.heroTagline : default_config.heroTagline,
        heroTitle: rawData.heroTitle !== undefined ? rawData.heroTitle : default_config.heroTitle,
        heroDescription: rawData.heroDescription !== undefined ? rawData.heroDescription : default_config.heroDescription,
        heroBtn1Text: rawData.heroBtn1Text !== undefined ? rawData.heroBtn1Text : default_config.heroBtn1Text,
        heroBtn2Text: rawData.heroBtn2Text !== undefined ? rawData.heroBtn2Text : default_config.heroBtn2Text,
        storyTitle: rawData.storyTitle !== undefined ? rawData.storyTitle : default_config.storyTitle,
        storyDescription: rawData.storyDescription !== undefined ? rawData.storyDescription : default_config.storyDescription,
        storyFotoUrl: rawData.storyFotoUrl !== undefined ? rawData.storyFotoUrl : default_config.storyFotoUrl,
        heroBgPositionY: rawData.heroBgPositionY !== undefined ? rawData.heroBgPositionY : default_config.heroBgPositionY,
      };
    }

    // 2. Prova poi con config_home/generale
    const docRef = doc(db, 'config_home', 'generale');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      const fotoUrl = rawData.hero_foto_url || rawData.heroBgUrl || default_config.hero_foto_url;
      return {
        id: 'generale',
        hero_foto_url: fotoUrl,
        heroBgUrl: fotoUrl,
        heroTagline: rawData.heroTagline !== undefined ? rawData.heroTagline : default_config.heroTagline,
        heroTitle: rawData.heroTitle !== undefined ? rawData.heroTitle : default_config.heroTitle,
        heroDescription: rawData.heroDescription !== undefined ? rawData.heroDescription : default_config.heroDescription,
        heroBtn1Text: rawData.heroBtn1Text !== undefined ? rawData.heroBtn1Text : default_config.heroBtn1Text,
        heroBtn2Text: rawData.heroBtn2Text !== undefined ? rawData.heroBtn2Text : default_config.heroBtn2Text,
        storyTitle: rawData.storyTitle !== undefined ? rawData.storyTitle : default_config.storyTitle,
        storyDescription: rawData.storyDescription !== undefined ? rawData.storyDescription : default_config.storyDescription,
        storyFotoUrl: rawData.storyFotoUrl !== undefined ? rawData.storyFotoUrl : default_config.storyFotoUrl,
        heroBgPositionY: rawData.heroBgPositionY !== undefined ? rawData.heroBgPositionY : default_config.heroBgPositionY,
      };
    } else {
      await setDoc(contentRef, { live: default_config, draft: default_config });
      await setDoc(docRef, default_config);
      return default_config;
    }
  } catch (error) {
    console.warn("Errore durante il recupero di config_home, restituisco il default:", error);
    return default_config;
  }
}

export async function updateConfigHome(config: ConfigHome, version: 'live' | 'draft' = 'live'): Promise<void> {
  const normConfig = {
    ...config,
    hero_foto_url: config.hero_foto_url || config.heroBgUrl || '',
    heroBgUrl: config.heroBgUrl || config.hero_foto_url || '',
    heroTagline: config.heroTagline || '',
    heroTitle: config.heroTitle || '',
    heroDescription: config.heroDescription || '',
    heroBtn1Text: config.heroBtn1Text || '',
    heroBtn2Text: config.heroBtn2Text || '',
    storyTitle: config.storyTitle || '',
    storyDescription: config.storyDescription || '',
    storyFotoUrl: config.storyFotoUrl || '',
    heroBgPositionY: config.heroBgPositionY !== undefined ? config.heroBgPositionY : '50'
  };
  if (isDemoMode) {
    const key = version === 'live' ? 'config_home_live' : 'config_home_draft';
    setLocalData(key, normConfig);
    setLocalData('config_home', normConfig);
    return;
  }
  try {
    const contentRef = doc(db, 'content', 'homepage');
    await setDoc(contentRef, { [version]: normConfig }, { merge: true });

    if (version === 'live') {
      const docRef = doc(db, 'config_home', 'generale');
      await setDoc(docRef, normConfig, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `content/homepage`);
  }
}

export async function publishDraftToLive(): Promise<void> {
  if (isDemoMode) {
    const draft = getLocalData<ConfigHome>('config_home_draft', null as any);
    if (draft) {
      setLocalData('config_home_live', draft);
      setLocalData('config_home', draft);
    }
    return;
  }
  try {
    const contentRef = doc(db, 'content', 'homepage');
    const contentSnap = await getDoc(contentRef);
    if (contentSnap.exists()) {
      const data = contentSnap.data();
      if (data.draft) {
        await setDoc(contentRef, { live: data.draft }, { merge: true });
        const docRef = doc(db, 'config_home', 'generale');
        await setDoc(docRef, data.draft, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `content/homepage`);
  }
}

export async function discardDraft(): Promise<void> {
  if (isDemoMode) {
    const live = getLocalData<ConfigHome>('config_home_live', null as any) || getLocalData<ConfigHome>('config_home', null as any);
    if (live) {
      setLocalData('config_home_draft', live);
    }
    return;
  }
  try {
    const contentRef = doc(db, 'content', 'homepage');
    const contentSnap = await getDoc(contentRef);
    if (contentSnap.exists()) {
      const data = contentSnap.data();
      if (data.live) {
        await setDoc(contentRef, { draft: data.live }, { merge: true });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `content/homepage`);
  }
}

export async function getProssimaGara(categoria: "Serie D Maschile" | "Serie D Femminile"): Promise<ProssimaGara> {
  const docId = categoria === "Serie D Maschile" ? "serie_d_maschile" : "serie_d_femminile";
  const defaultGara: ProssimaGara = categoria === "Serie D Maschile" ? {
    id: "serie_d_maschile",
    categoria: "Serie D Maschile",
    avversario: "Rubicone In Volley",
    data_ora: "SAB 20:30",
    luogo: "PalaMaroncelli, Forlì",
    giornata: "Girone B - 4ª Giornata",
    casa: true,
    punti_nva: 3,
    punti_avversario: 1
  } : {
    id: "serie_d_femminile",
    categoria: "Serie D Femminile",
    avversario: "Volley Team Bologna",
    data_ora: "DOM 18:00",
    luogo: "Palasport Bellaria, Bologna",
    giornata: "Girone C - 5ª Giornata",
    casa: false,
    punti_nva: 2,
    punti_avversario: 3
  };

  if (isDemoMode) {
    return getLocalData<ProssimaGara>('matches_' + docId, defaultGara);
  }

  try {
    const docRef = doc(db, 'matches', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docId, ...docSnap.data() } as ProssimaGara;
    } else {
      await setDoc(docRef, defaultGara);
      return defaultGara;
    }
  } catch (error) {
    console.warn("Errore getProssimaGara:", error);
    return defaultGara;
  }
}

export async function updateProssimaGara(gara: ProssimaGara): Promise<void> {
  const docId = gara.categoria === "Serie D Maschile" ? "serie_d_maschile" : "serie_d_femminile";
  if (isDemoMode) {
    setLocalData('matches_' + docId, { ...gara, id: docId });
    return;
  }
  try {
    const docRef = doc(db, 'matches', docId);
    await setDoc(docRef, { ...gara, id: docId });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `matches/${docId}`);
  }
}

export interface SocietaSettings {
  logoUrl?: string;
  isMaintenanceMode?: boolean;
  [key: string]: any;
}

export async function getSocietaSettings(): Promise<SocietaSettings> {
  if (isDemoMode) {
    return getLocalData<SocietaSettings>('societa_settings', { logoUrl: '', isMaintenanceMode: false });
  }
  try {
    const docRef = doc(db, 'content', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SocietaSettings;
      return { ...data, isMaintenanceMode: false };
    }
    return { isMaintenanceMode: false };
  } catch (error) {
    console.warn("Errore getSocietaSettings:", error);
    return { isMaintenanceMode: false };
  }
}

export async function updateSocietaSettings(settings: Partial<SocietaSettings>): Promise<void> {
  if (isDemoMode) {
    setLocalData('societa_settings', settings);
    return;
  }
  try {
    const docRef = doc(db, 'content', 'settings');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'content/settings');
  }
}

export async function getGiocatoriAll(): Promise<Giocatore[]> {
  const collectionName = 'giocatori';
  if (isDemoMode) {
    return getLocalData<Giocatore[]>(collectionName, DEFAULT_GIOCATORI);
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    const atleti: Giocatore[] = [];
    snapshot.forEach(docSnap => {
      atleti.push({ id: docSnap.id, ...docSnap.data() } as Giocatore);
    });
    return atleti;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

export async function addGiocatore(giocatore: Omit<Giocatore, 'id'>): Promise<Giocatore> {
  const collectionName = 'giocatori';
  // Sanitizza i dati per evitare campi undefined che bloccano Firestore
  const cleanData: any = JSON.parse(JSON.stringify(giocatore, (_key, val) => (val === undefined ? null : val)));
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null || cleanData[k] === undefined) {
      delete cleanData[k];
    }
  });

  if (isDemoMode) {
    const list = getLocalData<Giocatore[]>(collectionName, DEFAULT_GIOCATORI);
    const nuovo: Giocatore = {
      id: `gio_${Math.floor(Math.random() * 100000)}`,
      ...cleanData
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, cleanData);
    return { id: docRef.id, ...cleanData } as Giocatore;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

export async function getSquadreAll(): Promise<RosaSquadra[]> {
  const collectionName = 'squadre';
  let rawSquadre: RosaSquadra[] = [];
  if (isDemoMode) {
    rawSquadre = getLocalData<RosaSquadra[]>(collectionName, DEFAULT_SQUADRE);
  } else {
    try {
      const ref = collection(db, 'rose_squadre');
      const snapshot = await getDocs(ref);
      const squadre: RosaSquadra[] = [];
      snapshot.forEach(docSnap => {
        squadre.push({ id: docSnap.id, ...docSnap.data() } as RosaSquadra);
      });
      rawSquadre = squadre;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'rose_squadre');
    }
  }

  // Fallback: se category è undefined o mancante, trattalo come 'CAMPIONATI_SENIOR'
  return rawSquadre.map(s => ({
    ...s,
    category: s.category || 'CAMPIONATI_SENIOR'
  }));
}

export async function updateSquadraFipavData(
  squadraId: string, 
  data: Record<string, any>
): Promise<void> {
  const collectionName = 'squadre';
  if (isDemoMode) {
    const list = getLocalData<RosaSquadra[]>(collectionName, DEFAULT_SQUADRE);
    const updated = list.map(sq => {
      if (sq.id === squadraId) {
        return {
          ...sq,
          ...data
        };
      }
      return sq;
    });
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, 'rose_squadre', squadraId);
    // Sanitize to remove any undefined fields before sending to Firestore
    const cleanPayload = JSON.parse(JSON.stringify({
      ...data,
      data_ultimo_aggiornamento: new Date().toISOString()
    }));
    await updateDoc(docRef, cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `rose_squadre/${squadraId}`);
  }
}


export async function getSponsorAll(): Promise<Sponsor[]> {
  const collectionName = 'sponsors';
  if (isDemoMode) {
    return getLocalData<Sponsor[]>(collectionName, DEFAULT_SPONSOR);
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    const sponsor: Sponsor[] = [];
    snapshot.forEach(docSnap => {
      sponsor.push({ id: docSnap.id, ...docSnap.data() } as Sponsor);
    });
    return sponsor.sort((a, b) => (a.ordine || 0) - (b.ordine || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

export async function getNewsAll(includeDrafts: boolean = false): Promise<NewsBlog[]> {
  const collectionName = 'news';
  if (isDemoMode) {
    const list = getLocalData<NewsBlog[]>(collectionName, DEFAULT_NEWS);
    const sorted = list.sort((a, b) => (b.data_pubblicazione || '').localeCompare(a.data_pubblicazione || ''));
    if (includeDrafts) {
      return sorted;
    }
    return sorted.filter(n => n.stato_pubblicazione !== 'bozza');
  }
  try {
    const ref = collection(db, 'news_blog');
    const snapshot = await getDocs(ref);
    const newsList: NewsBlog[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const n = { 
        id: docSnap.id, 
        ...(data as any),
        stato_pubblicazione: data.stato_pubblicazione || 'pubblicato' 
      } as NewsBlog;

      if (includeDrafts || n.stato_pubblicazione !== 'bozza') {
        newsList.push(n);
      }
    });
    // Ordina per data decrescente
    return newsList.sort((a, b) => (b.data_pubblicazione || '').localeCompare(a.data_pubblicazione || ''));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'news_blog');
    return [];
  }
}

export async function getModulisticaAll(): Promise<Modulistica[]> {
  const collectionName = 'modulistica';
  if (isDemoMode) {
    return getLocalData<Modulistica[]>(collectionName, DEFAULT_MODULISTICA);
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    const moduli: Modulistica[] = [];
    snapshot.forEach(docSnap => {
      moduli.push({ id: docSnap.id, ...docSnap.data() } as Modulistica);
    });
    return moduli;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

export async function getEventiAll(): Promise<any[]> {
  return getCampTorneiAll();
}


export async function addSponsor(sponsor: Omit<Sponsor, 'id'>): Promise<Sponsor> {
  const collectionName = 'sponsors';
  if (isDemoMode) {
    const list = getLocalData<Sponsor[]>(collectionName, DEFAULT_SPONSOR);
    const nuovo: Sponsor = {
      id: `spon_${Math.floor(Math.random() * 100000)}`,
      ...sponsor
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const cleanPayload = JSON.parse(JSON.stringify(sponsor));
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, cleanPayload);
    return { id: docRef.id, ...cleanPayload } as Sponsor;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

export async function addModulistica(modulo: Omit<Modulistica, 'id'>): Promise<Modulistica> {
  const collectionName = 'modulistica';
  if (isDemoMode) {
    const list = getLocalData<Modulistica[]>(collectionName, DEFAULT_MODULISTICA);
    const nuovo: Modulistica = {
      id: `mod_${Math.floor(Math.random() * 100000)}`,
      ...modulo
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const cleanPayload = JSON.parse(JSON.stringify(modulo));
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, cleanPayload);
    return { id: docRef.id, ...cleanPayload } as Modulistica;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

export async function addEventiTorneo(evento: Omit<EventiTorneo, 'id'>): Promise<EventiTorneo> {
  const collectionName = 'eventi';
  if (isDemoMode) {
    const list = getLocalData<EventiTorneo[]>(collectionName, DEFAULT_EVENTI);
    const nuovo: EventiTorneo = {
      id: `eve_${Math.floor(Math.random() * 100000)}`,
      ...evento
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const cleanPayload = JSON.parse(JSON.stringify(evento));
    const ref = collection(db, 'eventi_tornei');
    const docRef = await addDoc(ref, cleanPayload);
    return { id: docRef.id, ...cleanPayload } as EventiTorneo;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'eventi_tornei');
  }
}

export async function aggiornaCampoElemento(
  tipo: 'giocatori' | 'sponsor' | 'news' | 'squadre',
  id: string,
  field: string,
  value: any
): Promise<void> {
  if (isDemoMode) {
    const list = getLocalData<any[]>(tipo, []);
    const updated = list.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setLocalData(tipo, updated);
    return;
  }

  try {
    let colName = tipo as string;
    if (tipo === 'news') colName = 'news_blog';
    if (tipo === 'squadre') colName = 'rose_squadre';

    const docRef = doc(db, colName, id);
    await updateDoc(docRef, { [field]: value });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, tipo);
  }
}

export async function eliminaElemento(
  tipo: 'news' | 'squadre' | 'giocatori' | 'sponsor' | 'modulistica' | 'eventi' | 'news_blog' | 'rose_squadre' | 'eventi_tornei',
  id: string
): Promise<void> {
  if (isDemoMode) {
    let localKey = tipo as string;
    if (tipo === 'news' || tipo === 'news_blog') localKey = 'news';
    if (tipo === 'squadre' || tipo === 'rose_squadre') localKey = 'squadre';
    if (tipo === 'giocatori') localKey = 'giocatori';
    if (tipo === 'sponsor') localKey = 'sponsor';
    if (tipo === 'modulistica') localKey = 'modulistica';
    if (tipo === 'eventi' || tipo === 'eventi_tornei') localKey = 'eventi';

    const list = getLocalData<any[]>(localKey, []);
    const updated = list.filter(item => item.id !== id);
    setLocalData(localKey, updated);
    return;
  }

  try {
    let colName = tipo as string;
    if (tipo === 'news') colName = 'news_blog';
    if (tipo === 'squadre') colName = 'rose_squadre';
    if (tipo === 'giocatori') colName = 'giocatori';
    if (tipo === 'sponsor') colName = 'sponsor';
    if (tipo === 'modulistica') colName = 'modulistica';
    if (tipo === 'eventi') colName = 'eventi_tornei';

    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, tipo);
  }
}

export async function aggiornaElementoCompleto(
  tipo: 'news' | 'squadre' | 'giocatori' | 'sponsor' | 'modulistica' | 'eventi' | 'news_blog' | 'rose_squadre' | 'eventi_tornei',
  id: string,
  dati: any
): Promise<void> {
  if (isDemoMode) {
    let localKey = tipo as string;
    if (tipo === 'news' || tipo === 'news_blog') localKey = 'news';
    if (tipo === 'squadre' || tipo === 'rose_squadre') localKey = 'squadre';
    if (tipo === 'giocatori') localKey = 'giocatori';
    if (tipo === 'sponsor') localKey = 'sponsor';
    if (tipo === 'modulistica') localKey = 'modulistica';
    if (tipo === 'eventi' || tipo === 'eventi_tornei') localKey = 'eventi';

    const list = getLocalData<any[]>(localKey, []);
    const updated = list.map(item => item.id === id ? { ...item, ...dati } : item);
    setLocalData(localKey, updated);
    return;
  }

  try {
    let colName = tipo as string;
    if (tipo === 'news') colName = 'news_blog';
    if (tipo === 'squadre') colName = 'rose_squadre';
    if (tipo === 'giocatori') colName = 'giocatori';
    if (tipo === 'sponsor') colName = 'sponsor';
    if (tipo === 'modulistica') colName = 'modulistica';
    if (tipo === 'eventi') colName = 'eventi_tornei';

    const docRef = doc(db, colName, id);
    // Sanitize payload to strip undefined fields
    const cleanPayload = JSON.parse(JSON.stringify(dati));
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, tipo);
  }
}

// ============================================================================
// 3. GESTIONE TESTI & ISCRIZIONI SUMMER CAMP
// ============================================================================

export interface CampTexts {
  titolo: string;
  periodo: string;
  descrizione: string;
  location: string;
  locationDettaglio: string;
  staff: string;
  staffDettaglio: string;
  quota: string;
  quotaDettaglio: string;
  iscrizioni_aperte: boolean;
}

const DEFAULT_CAMP_TEXTS: CampTexts = {
  titolo: 'Summer Volley Pro & Fun',
  periodo: '05 Luglio — 19 Luglio 2026',
  descrizione: 'Il New Volley Summer Camp è l\'esperienza estiva definitiva per atleti e atlete nati/e dal 2008 al 2016. Due settimane di sport, mare, piscina e lezioni tecniche di alta specializzazione tenute dai nostri tecnici federali e da campioni ospiti del panorama nazionale.',
  location: 'EuroCamp Cesenatico',
  locationDettaglio: 'Spiaggia privata, campi indoor e outdoor.',
  staff: 'Direzione Pro',
  staffDettaglio: 'Sotto la guida di Ettore Gulinelli e staff federale.',
  quota: 'A partire da € 420',
  quotaDettaglio: 'Sconti per fratelli e atleti tesserati NVA.',
  iscrizioni_aperte: true
};

export async function getCampTexts(): Promise<CampTexts> {
  const collectionName = 'camp_texts';
  if (isDemoMode) {
    return getLocalData<CampTexts>('camp_texts', DEFAULT_CAMP_TEXTS);
  }
  try {
    const docRef = doc(db, 'camp_config', 'camp_texts');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CampTexts;
    }
    await setDoc(docRef, DEFAULT_CAMP_TEXTS);
    return DEFAULT_CAMP_TEXTS;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'camp_config/camp_texts');
    return DEFAULT_CAMP_TEXTS;
  }
}

export async function updateCampTexts(texts: CampTexts): Promise<void> {
  if (isDemoMode) {
    setLocalData('camp_texts', texts);
    return;
  }
  try {
    const docRef = doc(db, 'camp_config', 'camp_texts');
    await setDoc(docRef, texts);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'camp_config/camp_texts');
  }
}

// ============================================================================
// 3.1 VOLTEX CAMP CONFIGURATION & REGISTRATIONS (camp_config/voltex_camp)
// ============================================================================

export interface VoltexCampDate {
  id: string;
  titolo: string;
  localita: string;
  periodo: string;
  struttura: string;
  destinatari: string;
  posti_totali: number;
  posti_occupati: number;
  quota: string;
  stato: 'aperte' | 'in_esaurimento' | 'chiuse' | 'prossimamente';
  note?: string;
  attivo: boolean;
}

export interface VoltexIscrizione {
  id: string;
  data_richiesta: string;
  nome_atleta: string;
  cognome_atleta: string;
  data_nascita: string;
  sesso: 'M' | 'F';
  ruolo: string;
  livello_squadra: string;
  tappa_selezionata_id: string;
  tappa_nome: string;
  nome_genitore?: string;
  telefono: string;
  email: string;
  taglia_kit: string;
  note?: string;
  stato: 'nuova' | 'contattato' | 'confermata' | 'annullata';
}

export interface VoltexRichiestaInfo {
  id: string;
  data_richiesta: string;
  nome_cognome: string;
  email: string;
  telefono: string;
  richiesta: string;
  stato: 'nuova' | 'gestita' | 'archiviata';
  note_interne?: string;
}

export interface VoltexCampConfig {
  titolo_hero: string;
  sottotitolo_hero: string;
  descrizione_breve: string;
  descrizione_completa: string;
  quote_info: string;
  testimonial_nome: string;
  testimonial_ruolo: string;
  testimonial_bio: string;
  punti_forza: {
    titolo: string;
    valore: string;
    descrizione: string;
  }[];
  programma_tecnico: string[];
  mental_coaching_info: string;
  date_camp: VoltexCampDate[];
  iscrizioni_ricevute: VoltexIscrizione[];
  richieste_info?: VoltexRichiestaInfo[];
  iscrizioni_aperte?: boolean;
  contatti_whatsapp: string;
  instagram_username: string;
  banner_attivo: boolean;
  testo_annuncio: string;
  testo_annuncio_chiuso?: string;
  hero_image_url?: string;
  galleria_foto?: Array<{ url: string; caption?: string }>;
}

export const DEFAULT_VOLTEX_CAMP_CONFIG: VoltexCampConfig = {
  titolo_hero: "VOLTEX ACADEMY",
  sottotitolo_hero: "Il Primo Camp di Alta Specializzazione by Valentina Diouf",
  descrizione_breve: "Un percorso intensivo di perfezionamento tecnico, fisico e mentale ideato da Valentina Diouf per giovani atleti e atlete che puntano all'eccellenza sul campo.",
  descrizione_completa: "Voltex Academy nasce con l'obiettivo di offrire un'esperienza di formazione di livello professionistico. Attraverso sessioni ad alta intensità, analisi video, lavoro sui dettagli biomeccanici e moduli guidati da Mental Coach, ogni partecipante sperimenta l'approccio dei massimi campionati italiani e internazionali.",
  quote_info: "Formule Day Camp & Residenziale all-inclusive con kit tecnico ufficiale Voltex compreso",
  testimonial_nome: "Valentina Diouf",
  testimonial_ruolo: "Opposto Azzurro & Head Coach Voltex",
  testimonial_bio: "Stella della pallavolo internazionale, già opposto della Nazionale Italiana, MVP europea e protagonista nei principali campionati mondiali. Valentina guida gli allenamenti in prima persona per trasferire grinta, metodo e visione.",
  hero_image_url: "/images/voltex/voltex-riccione-cover.jpg",
  galleria_foto: [
    { url: "/images/voltex/voltex-recap-stats.jpg", caption: "Recap Numeri & Risultati" },
    { url: "/images/voltex/voltex-team-group.jpg", caption: "Gruppo Atleti & Coach" },
    { url: "/images/voltex/voltex-sassari-locandina.jpg", caption: "Tappa Sassari 2026" },
    { url: "/images/voltex/voltex-training-diouf.jpg", caption: "Valentina Diouf in Campo" },
    { url: "/images/voltex/voltex-ready-diouf.jpg", caption: "Sessione di Allenamento" }
  ],
  punti_forza: [
    {
      titolo: "Alta Intensità",
      valore: "26H",
      descrizione: "Pallavolo di alta specializzazione sul campo con feedback correttivo istantaneo"
    },
    {
      titolo: "Mental Coaching",
      valore: "10H",
      descrizione: "Sessioni dedicate con Mental Coach su gestione dell'errore, focus e self-talk"
    },
    {
      titolo: "Full Immersion",
      valore: "1 SETTIMANA",
      descrizione: "Crescita tecnica, atletica e umana a stretto contatto con campioni e tecnici federali"
    },
    {
      titolo: "Gruppi Chiusi",
      valore: "1:8",
      descrizione: "Rapporto atleti per coach per garantire attenzione continua ad ogni singolo movimento"
    }
  ],
  programma_tecnico: [
    "Biomeccanica del salto e rincorsa per schiacciatori e opposti",
    "Analisi e pulizia della traiettoria nel palleggio moderno",
    "Piani di rimbalzo, lettura traiettoria e difesa acrobatica per liberi e ricettori",
    "Tempismo di muro, lettura dell'attaccante e tattica di squadra",
    "Preparazione atletica mirata alla prevenzione infortuni e reattività esplosiva"
  ],
  mental_coaching_info: "Nella pallavolo moderna la mente fa la differenza tra un punto vinto e un punto perso. I nostri moduli con Mental Coach aiutano atleti e atlete a gestire l'ansia da prestazione, rimanere lucidi nei momenti caldi del set e costruire una fiducia incrollabile.",
  date_camp: [
    {
      id: "voltex-riccione-2026",
      titolo: "Riccione Summer Masterclass",
      localita: "Riccione (RN)",
      periodo: "05 - 11 Luglio 2026",
      struttura: "Beach Arena & Palasport di Riccione",
      destinatari: "Ragazze e Ragazzi dai 10 ai 18 anni",
      posti_totali: 36,
      posti_occupati: 29,
      quota: "Formula Day Camp o Residenziale",
      stato: "aperte",
      note: "Pernottamento in hotel 3* con trattamento pensione completa per la formula residenziale.",
      attivo: true
    },
    {
      id: "voltex-sassari-2026",
      titolo: "Sassari Specialist Clinic",
      localita: "Sassari (SS)",
      periodo: "28 - 30 Giugno 2026",
      struttura: "Palestra Comunale Sassari",
      destinatari: "Atleti e Atlete Under 14 / Under 16 / Under 18",
      posti_totali: 28,
      posti_occupati: 25,
      quota: "Formula Clinic Intensivo 3 Giorni",
      stato: "in_esaurimento",
      note: "Ultime disponibilità rimaste. Kit tecnico ufficiale Voltex incluso all'accredito.",
      attivo: true
    }
  ],
  iscrizioni_ricevute: [],
  richieste_info: [],
  iscrizioni_aperte: true,
  contatti_whatsapp: "393400000000",
  instagram_username: "voltexcamp",
  banner_attivo: true,
  testo_annuncio: "Iscrizioni ancora aperte! Posti limitati per garantire la massima qualità tecnica.",
  testo_annuncio_chiuso: "Iscrizioni al Camp attualmente chiuse (in arrivo). Compila il modulo sotto per richiedere informazioni e ricevere notifica prioritaria all'apertura!"
};

export async function getVoltexCampConfig(): Promise<VoltexCampConfig> {
  if (isDemoMode) {
    return getLocalData<VoltexCampConfig>('voltex_camp_config', DEFAULT_VOLTEX_CAMP_CONFIG);
  }
  try {
    const docRef = doc(db, 'camp_config', 'voltex_camp');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as VoltexCampConfig;
      return {
        ...DEFAULT_VOLTEX_CAMP_CONFIG,
        ...data,
        date_camp: data.date_camp || DEFAULT_VOLTEX_CAMP_CONFIG.date_camp,
        iscrizioni_ricevute: data.iscrizioni_ricevute || [],
        richieste_info: data.richieste_info || [],
        iscrizioni_aperte: data.iscrizioni_aperte !== undefined ? data.iscrizioni_aperte : true,
        testo_annuncio_chiuso: data.testo_annuncio_chiuso || DEFAULT_VOLTEX_CAMP_CONFIG.testo_annuncio_chiuso,
        hero_image_url: data.hero_image_url || DEFAULT_VOLTEX_CAMP_CONFIG.hero_image_url,
        galleria_foto: data.galleria_foto || DEFAULT_VOLTEX_CAMP_CONFIG.galleria_foto
      };
    }
    try {
      await setDoc(docRef, DEFAULT_VOLTEX_CAMP_CONFIG);
    } catch {}
    return DEFAULT_VOLTEX_CAMP_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'camp_config/voltex_camp');
    return DEFAULT_VOLTEX_CAMP_CONFIG;
  }
}

export async function updateVoltexCampConfig(config: VoltexCampConfig): Promise<void> {
  if (isDemoMode) {
    setLocalData('voltex_camp_config', config);
    return;
  }
  try {
    const docRef = doc(db, 'camp_config', 'voltex_camp');
    await setDoc(docRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'camp_config/voltex_camp');
    throw error;
  }
}

export async function salvaIscrizioneVoltex(iscrizione: VoltexIscrizione): Promise<void> {
  try {
    const currentConfig = await getVoltexCampConfig();
    const iscrizioniEsistenti = currentConfig.iscrizioni_ricevute || [];
    const updatedIscrizioni = [iscrizione, ...iscrizioniEsistenti];
    
    const updatedDate = (currentConfig.date_camp || []).map(d => {
      if (d.id === iscrizione.tappa_selezionata_id) {
        const occupati = (d.posti_occupati || 0) + 1;
        const totali = d.posti_totali || 30;
        return {
          ...d,
          posti_occupati: occupati,
          stato: (occupati >= totali ? 'chiuse' : occupati >= totali - 5 ? 'in_esaurimento' : d.stato) as any
        };
      }
      return d;
    });

    await updateVoltexCampConfig({
      ...currentConfig,
      date_camp: updatedDate,
      iscrizioni_ricevute: updatedIscrizioni
    });
  } catch (error) {
    console.error("Errore salvataggio iscrizione Voltex:", error);
    try {
      const local = getLocalData<VoltexIscrizione[]>('voltex_iscrizioni_pending', []);
      setLocalData('voltex_iscrizioni_pending', [iscrizione, ...local]);
    } catch {}
  }
}

export async function salvaRichiestaInfoVoltex(richiesta: VoltexRichiestaInfo): Promise<void> {
  try {
    const currentConfig = await getVoltexCampConfig();
    const richiesteEsistenti = currentConfig.richieste_info || [];
    const updatedRichieste = [richiesta, ...richiesteEsistenti];

    await updateVoltexCampConfig({
      ...currentConfig,
      richieste_info: updatedRichieste
    });
  } catch (error) {
    console.error("Errore salvataggio richiesta info Voltex:", error);
    try {
      const local = getLocalData<VoltexRichiestaInfo[]>('voltex_richieste_info_pending', []);
      setLocalData('voltex_richieste_info_pending', [richiesta, ...local]);
    } catch {}
  }
}

// ============================================================================
// 4. SISTEMA DI AUTENTICAZIONE & PERMESSI GRANULARI (Firebase Auth + Roles)
// ============================================================================

export interface AdminUser {
  uid: string;
  email: string;
  ruolo: 'Super Admin' | 'Collaboratore/Allenatore';
  squadre_assegnate?: string[];
  password?: string; // Solo per convalida in modalità demo
  profiloId?: string;
}

const DEFAULT_ADMIN_USERS: AdminUser[] = [];

// Inizializza i collaboratori di default solo se esplicitamente in modalità demo
if (typeof window !== 'undefined' && isDemoMode) {
  if (!localStorage.getItem('nva_admin_users')) {
    setLocalData('admin_users', DEFAULT_ADMIN_USERS);
  }
}


// Gestione dei listener nello stato demo
let demoAuthListeners: Array<(user: AdminUser | null) => void> = [];

function getLoggedUserDemo(): AdminUser | null {
  return getLocalData<AdminUser | null>('logged_in_user', null);
}

function notifyDemoListeners() {
  const user = getLoggedUserDemo();
  demoAuthListeners.forEach(cb => cb(user));
}

export function ascoltaStatoAutenticazione(callback: (user: AdminUser | null) => void): () => void {
  if (isDemoMode) {
    demoAuthListeners.push(callback);
    // Esegui subito per allineare lo stato iniziale
    callback(getLoggedUserDemo());
    return () => {
      demoAuthListeners = demoAuthListeners.filter(cb => cb !== callback);
    };
  }

  // Live Firebase
  return fbOnAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    try {
      // Recupera il ruolo dell'utente da Firestore
      const userDocRef = doc(db, 'admin_users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() || {};
        callback({
          uid: fbUser.uid,
          ...data,
          ruolo: data.ruolo || 'Collaboratore/Allenatore'
        } as AdminUser);
      } else {
        // Se il documento non esiste: NON fare setDoc, NON creare utenti fittizi, esegui signOut e callback(null).
        console.warn("Account presente in Authentication ma non censito in admin_users. Accesso negato.");
        await fbSignOut(auth).catch(() => {});
        callback(null);
      }
    } catch (err) {
      console.error("Errore durante il recupero dei permessi dell'utente:", err);
      // Se la lettura fallisce (rete o permessi): signOut e callback(null).
      await fbSignOut(auth).catch(() => {});
      callback(null);
    }
  });
}

export async function loginUtente(email: string, password: string): Promise<AdminUser> {
  if (isDemoMode) {
    const list = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
    const user = list.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!user) {
      throw new Error("Credenziali non valide o collaboratore non censito.");
    }
    setLocalData('logged_in_user', user);
    notifyDemoListeners();
    return user;
  }

  // Live Firebase
  try {
    const credentials = await fbSignInWithEmailAndPassword(auth, email, password);
    const fbUser = credentials.user;

    const userDocRef = doc(db, 'admin_users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data() || {};
      return {
        uid: fbUser.uid,
        ...data,
        ruolo: data.ruolo || 'Collaboratore/Allenatore'
      } as AdminUser;
    } else {
      await fbSignOut(auth).catch(() => {});
      throw new Error("Account non censito come amministratore o collaboratore.");
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Errore durante l'accesso.");
  }
}

export async function logoutUtente(): Promise<void> {
  if (isDemoMode) {
    localStorage.removeItem('nva_logged_in_user');
    setLocalData('logged_in_user', null);
    notifyDemoListeners();
    return;
  }

  // Live Firebase
  await fbSignOut(auth);
}

export async function getAdminUsersAll(): Promise<AdminUser[]> {
  if (isDemoMode) {
    return getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
  }
  try {
    const ref = collection(db, 'admin_users');
    const snapshot = await getDocs(ref);
    const users: AdminUser[] = [];
    snapshot.forEach(docSnap => {
      users.push({ uid: docSnap.id, ...docSnap.data() } as AdminUser);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'admin_users');
    return [];
  }
}

export async function creaNuovoUtenteAmministrativo(
  email: string,
  passwordProvvisoria: string,
  ruolo: 'Super Admin' | 'Collaboratore/Allenatore',
  squadreAssegnate: string[],
  profiloId?: string
): Promise<AdminUser> {
  if (isDemoMode) {
    const list = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
    if (list.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error("Un collaboratore con questa email è già stato registrato.");
    }
    const nuovo: AdminUser = {
      uid: `mock-uid-${Math.floor(Math.random() * 100000)}`,
      email: email.trim(),
      ruolo,
      squadre_assegnate: squadreAssegnate,
      password: passwordProvvisoria,
      profiloId
    };
    list.push(nuovo);
    setLocalData('admin_users', list);
    return nuovo;
  }

  // Live Firebase
  try {
    let uid: string;
    
    try {
      // 1. Prova tramite secondary Firebase App
      const tempAppName = `temp-app-${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await fbCreateUserWithEmailAndPassword(tempAuth, email, passwordProvvisoria);
      uid = userCredential.user.uid;
      
      await fbSignOut(tempAuth);
      await deleteApp(tempApp);
    } catch (authErr: any) {
      console.warn("Creazione tramite SDK tempApp fallita, tento via REST API Identity Toolkit...", authErr);
      // Se fallisce per auth/network-request-failed o simile, proviamo direttamente l'endpoint REST ufficiale
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: passwordProvvisoria,
          returnSecureToken: true
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || authErr?.message || "Errore nella creazione dell'utente.";
        if (errorMsg.includes('EMAIL_EXISTS')) {
          throw new Error("Questa email è già registrata in Firebase Authentication.");
        } else if (errorMsg.includes('WEAK_PASSWORD')) {
          throw new Error("La password deve contenere almeno 6 caratteri.");
        } else if (errorMsg.includes('INVALID_EMAIL')) {
          throw new Error("L'indirizzo email non è valido.");
        } else {
          throw new Error(errorMsg);
        }
      }
      uid = data.localId;
    }

    const adminUserDoc: AdminUser = {
      uid,
      email: email.trim(),
      ruolo,
      squadre_assegnate: squadreAssegnate,
      profiloId
    };
    
    await setDoc(doc(db, 'admin_users', uid), adminUserDoc);
    return adminUserDoc;
  } catch (error) {
    console.error("Errore finale creaNuovoUtenteAmministrativo:", error);
    let msg = error instanceof Error ? error.message : "Impossibile creare l'account amministrativo.";
    if (msg.includes('auth/email-already-in-use') || msg.includes('EMAIL_EXISTS')) {
      msg = "Questa email è già registrata nel sistema.";
    } else if (msg.includes('auth/weak-password') || msg.includes('WEAK_PASSWORD')) {
      msg = "La password temporanea deve contenere almeno 6 caratteri.";
    } else if (msg.includes('auth/invalid-email') || msg.includes('INVALID_EMAIL')) {
      msg = "Indirizzo email non valido.";
    }
    throw new Error(msg);
  }
}

export async function eliminaCollaboratore(uid: string): Promise<void> {
  if (isDemoMode) {
    const list = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
    const filtered = list.filter(u => u.uid !== uid);
    setLocalData('admin_users', filtered);
    return;
  }
  try {
    await deleteDoc(doc(db, 'admin_users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `admin_users/${uid}`);
  }
}

export async function getFipavLinks(): Promise<{ maschile_url: string; femminile_url: string }> {
  const defaultLinks = {
    maschile_url: "https://www.fipav-er.it/risultati-classifiche/scheda-campionato?CampionatoId=4123",
    femminile_url: "https://www.fipav-er.it/risultati-classifiche/scheda-campionato?CampionatoId=4124"
  };
  if (isDemoMode) {
    return getLocalData('fipav_links', defaultLinks);
  }
  try {
    const docRef = doc(db, 'config', 'fipav_links');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { maschile_url: string; femminile_url: string };
    } else {
      await setDoc(docRef, defaultLinks);
      return defaultLinks;
    }
  } catch (error) {
    console.warn("getFipavLinks error:", error);
    return defaultLinks;
  }
}

export async function saveFipavLinks(links: { maschile_url: string; femminile_url: string }): Promise<void> {
  if (isDemoMode) {
    setLocalData('fipav_links', links);
    return;
  }
  try {
    const docRef = doc(db, 'config', 'fipav_links');
    await setDoc(docRef, links);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `config/fipav_links`);
  }
}

// ============================================================================
// 8. NUOVO MODELLO DATI UNIFICATO - eventi_camp_tornei
// ============================================================================

export interface CampSpecific {
  staffTecnico: string;
  staffDettaglio: string;
  quotaIscrizione: string;
  scontiTariffe: string;
  cosaCOffriamo: string[];
}

export interface TorneoSpecific {
  categoria: string;
  numeroSquadre: number;
  statoTorneo: string; // "in_corso", "concluso", "programmato"
}

export interface ArchivioSpecific {
  partecipanti: number;
  etichettaEdizione: string;
  highlight: string;
  foto: string[];
}

export interface EventoCampTorneo {
  id: string;
  tipo: 'CAMP' | 'TORNEO' | 'GENERICO';
  titolo: string;
  sottotitolo?: string;
  descrizione: string;
  dataPeriodo: string; // campo testo libero
  location: string;
  locationDettaglio?: string;
  stato: 'ATTIVO' | 'NASCOSTO' | 'CONCLUSO';
  visibilitaIscrizioni: 'APERTE' | 'CHIUSE' | 'NASCOSTO';
  camp?: CampSpecific;
  torneo?: TorneoSpecific;
  archivio?: ArchivioSpecific;
  ordine: number;
  idModuloCollegato?: string;
  linkIscrizione?: string;
  pdfModuloCartaceoUrl?: string;
  pdfModuloCartaceoNome?: string;
  locandinaUrl?: string;
  locandinaFit?: 'contain' | 'cover';
  locandinaAltezza?: number;
  locandinaPositionY?: number;
  locandinaPositionX?: number;
  fotoGallery?: string[];
  createdAt?: any;
  updatedAt?: any;
}

const DEFAULT_CAMP_TORNEI: EventoCampTorneo[] = [
  {
    id: "eve_camp_01",
    tipo: 'CAMP',
    titolo: "Summer Volley Pro & Fun",
    sottotitolo: "Edizione 2026",
    descrizione: "Il camp estivo ufficiale della New Volley Academy, rivolto a ragazzi e ragazze che vogliono migliorare la propria tecnica sotto la guida di tecnici federali e giocatori professionisti. Sessioni di allenamento giornaliere, tornei interni e tanto divertimento!",
    dataPeriodo: "05 Luglio — 19 Luglio 2026",
    location: "PalaMaroncelli / Impianti NVA",
    locationDettaglio: "Via Maroncelli 15, Forlì",
    stato: 'ATTIVO',
    visibilitaIscrizioni: 'APERTE',
    camp: {
      staffTecnico: "Coach Andrea Rossi",
      staffDettaglio: "Selezionatore Regionale FIPAV, coadiuvato da atleti di Serie A",
      quotaIscrizione: "€ 250 a settimana",
      scontiTariffe: "Sconto 10% per fratelli/sorelle o per iscrizioni a più settimane",
      cosaCOffriamo: [
        "Kit Abbigliamento Ufficiale (2 t-shirt, 1 pantaloncino, sacca)",
        "Pranzo e merenda giornalieri curati da nutrizionista",
        "Assicurazione infortuni inclusa",
        "Scheda di valutazione tecnica personalizzata",
        "Accesso gratuito alle piscine convenzionate"
      ]
    },
    ordine: 1
  },
  {
    id: "eve_torneo_01",
    tipo: 'TORNEO',
    titolo: "New Volley Academy Cup",
    sottotitolo: "6ª Edizione",
    descrizione: "Il torneo giovanile estivo più atteso della regione. Le migliori squadre del territorio si sfidano in una due giorni di grande pallavolo e amicizia.",
    dataPeriodo: "22 Luglio — 23 Luglio 2026",
    location: "Palasport Villa Romiti / Ginnasio Sportivo",
    locationDettaglio: "Forlì (FC)",
    stato: 'ATTIVO',
    visibilitaIscrizioni: 'APERTE',
    torneo: {
      categoria: "Under 16 Femminile",
      numeroSquadre: 12,
      statoTorneo: "programmato"
    },
    ordine: 2
  },
  {
    id: "eve_storico_01",
    tipo: 'CAMP',
    titolo: "Summer Volley Pro & Fun",
    sottotitolo: "Edizione 2025",
    descrizione: "Il camp estivo dell'anno scorso è stato un enorme successo con record di presenze.",
    dataPeriodo: "01 Luglio — 14 Luglio 2025",
    location: "PalaMaroncelli Forlì",
    locationDettaglio: "Forlì",
    stato: 'CONCLUSO',
    visibilitaIscrizioni: 'NASCOSTO',
    archivio: {
      partecipanti: 45,
      etichettaEdizione: "1ª Edizione · Luglio 2025",
      highlight: "Una settimana indimenticabile di sport, crescita tecnica e nuove amicizie nate sul campo.",
      foto: [
        "https://images.unsplash.com/photo-1592656094267-764a45068526?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526676023333-d15fae1b2756?w=600&auto=format&fit=crop&q=80"
      ]
    },
    ordine: 3
  }
];

export function mapToUnifiedEvento(data: any, id: string): EventoCampTorneo {
  const tipo = data.tipo || (
    (data.camp || data.nome_evento?.toLowerCase().includes('camp') || data.categoria?.toLowerCase() === 'camp') ? 'CAMP' : 
    (data.torneo || data.gironi || data.albo_oro) ? 'TORNEO' : 'GENERICO'
  );

  const mapped: EventoCampTorneo = {
    id,
    tipo,
    titolo: data.titolo || data.nome_evento || data.nome || "",
    sottotitolo: data.sottotitolo || data.edizione || "",
    descrizione: data.descrizione || "",
    dataPeriodo: data.dataPeriodo || data.periodo || data.data_ora || "",
    location: data.location || data.luogo || "",
    locationDettaglio: data.locationDettaglio || "",
    stato: data.stato || (
      (data.status === 'STORICO' || data.stato === 'concluso') ? 'CONCLUSO' :
      (data.status === 'NASCOSTO' || data.stato === 'NASCOSTO') ? 'NASCOSTO' : 'ATTIVO'
    ),
    visibilitaIscrizioni: data.visibilitaIscrizioni || (
      data.iscrizioni_aperte === true ? 'APERTE' :
      data.iscrizioni_aperte === false ? 'CHIUSE' : 'NASCOSTO'
    ),
    ordine: typeof data.ordine === 'number' ? data.ordine : 0,
    idModuloCollegato: data.idModuloCollegato || "",
    linkIscrizione: data.linkIscrizione || data.goleeUrl || data.link_iscrizione || "",
    pdfModuloCartaceoUrl: data.pdfModuloCartaceoUrl || "",
    pdfModuloCartaceoNome: data.pdfModuloCartaceoNome || "",
    locandinaUrl: data.locandinaUrl || data.copertinaUrl || data.fotoCopertina || data.foto_url || data.archivio?.foto?.[0] || "",
    locandinaFit: data.locandinaFit || 'contain',
    locandinaAltezza: typeof data.locandinaAltezza === 'number' ? data.locandinaAltezza : 480,
    locandinaPositionY: typeof data.locandinaPositionY === 'number' ? data.locandinaPositionY : 50,
    locandinaPositionX: typeof data.locandinaPositionX === 'number' ? data.locandinaPositionX : 50,
    fotoGallery: Array.isArray(data.fotoGallery) ? data.fotoGallery : (Array.isArray(data.archivio?.foto) ? data.archivio.foto : []),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };

  if (tipo === 'CAMP') {
    mapped.camp = {
      staffTecnico: data.camp?.staffTecnico || data.staffTecnico || data.staff || "",
      staffDettaglio: data.camp?.staffDettaglio || data.staffDettaglio || "",
      quotaIscrizione: data.camp?.quotaIscrizione || data.quotaIscrizione || data.quota || "",
      scontiTariffe: data.camp?.scontiTariffe || data.scontiTariffe || "",
      cosaCOffriamo: Array.isArray(data.camp?.cosaCOffriamo) ? data.camp.cosaCOffriamo : (Array.isArray(data.cosaCOffriamo) ? data.cosaCOffriamo : [])
    };
  } else if (tipo === 'TORNEO') {
    mapped.torneo = {
      categoria: data.torneo?.categoria || data.categoria || "",
      numeroSquadre: typeof data.torneo?.numeroSquadre === 'number' ? data.torneo.numeroSquadre : (Array.isArray(data.squadre_partecipanti) ? data.squadre_partecipanti.length : 0),
      statoTorneo: data.torneo?.statoTorneo || data.statoTorneo || data.stato || "programmato"
    };
  }

  if (mapped.stato === 'CONCLUSO' || data.archivio) {
    mapped.archivio = {
      partecipanti: typeof data.archivio?.partecipanti === 'number' ? data.archivio.partecipanti : 0,
      etichettaEdizione: data.archivio?.etichettaEdizione || data.archivio?.edizione || data.sottotitolo || data.edizione || "Edizione Passata",
      highlight: data.archivio?.highlight || "",
      foto: Array.isArray(data.archivio?.foto) ? data.archivio.foto : (Array.isArray(data.foto_gallery_urls) ? data.foto_gallery_urls : [])
    };
  }

  return mapped;
}

export async function getCampTorneiAll(): Promise<EventoCampTorneo[]> {
  const collectionName = 'eventi_camp_tornei';
  if (isDemoMode) {
    const list = getLocalData<EventoCampTorneo[]>(collectionName, DEFAULT_CAMP_TORNEI);
    return list.map(item => mapToUnifiedEvento(item, item.id)).sort((a, b) => a.ordine - b.ordine);
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    const eventi: EventoCampTorneo[] = [];
    snapshot.forEach(docSnap => {
      eventi.push(mapToUnifiedEvento(docSnap.data(), docSnap.id));
    });
    return eventi.sort((a, b) => a.ordine - b.ordine);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return [];
  }
}

export async function addCampTorneo(evento: Omit<EventoCampTorneo, 'id'>): Promise<EventoCampTorneo> {
  const collectionName = 'eventi_camp_tornei';
  const now = new Date().toISOString();
  const cleanData: any = {};
  Object.entries(evento).forEach(([key, val]) => {
    if (val !== undefined) cleanData[key] = val;
  });
  cleanData.createdAt = now;
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<EventoCampTorneo[]>(collectionName, DEFAULT_CAMP_TORNEI);
    const nuovo: EventoCampTorneo = {
      id: `eve_${Math.floor(Math.random() * 100000)}`,
      ...cleanData
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return mapToUnifiedEvento(nuovo, nuovo.id);
  }
  try {
    const ref = collection(db, collectionName);
    const docRef = doc(ref);
    await setDoc(docRef, cleanData);
    return mapToUnifiedEvento({ ...cleanData, id: docRef.id }, docRef.id);
  } catch (error) {
    console.error("Errore addCampTorneo:", error);
    throw error;
  }
}

export async function updateCampTorneo(id: string, dati: Partial<EventoCampTorneo>): Promise<void> {
  const collectionName = 'eventi_camp_tornei';
  const now = new Date().toISOString();
  const cleanData: any = {};
  Object.entries(dati).forEach(([key, val]) => {
    if (val !== undefined) cleanData[key] = val;
  });
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<EventoCampTorneo[]>(collectionName, DEFAULT_CAMP_TORNEI);
    const updated = list.map(item => item.id === id ? { ...item, ...cleanData } : item);
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Errore updateCampTorneo:", error);
    throw error;
  }
}

export async function deleteCampTorneo(id: string): Promise<void> {
  const collectionName = 'eventi_camp_tornei';
  if (isDemoMode) {
    const list = getLocalData<EventoCampTorneo[]>(collectionName, DEFAULT_CAMP_TORNEI);
    const filtered = list.filter(item => item.id !== id);
    setLocalData(collectionName, filtered);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// ==========================================
// 9. HALL OF FAME / ALBO D'ORO DELLE PANTERE
// ==========================================

export interface PremioVinto {
  id?: string;
  titolo: string;
  anno: string;
  categoria?: string;
  descrizione?: string;
  fotoUrl?: string;
}

export interface AtletaPremiato {
  id: string;
  nome: string;                 // Nome e Cognome
  anno: string;                 // es. "2024/2025" o "2024"
  titoloPremio: string;         // es. "MVP Torneo delle Regioni" o "Miglior Palleggiatrice"
  categoria?: string;           // es. "Serie D", "Under 16", "Under 14", "Giovanili"
  ruolo?: string;               // es. "Palleggiatrice", "Schiacciatrice", "Libero"
  fotoUrl: string;              // Foto nel quadro
  fotoPositionY?: number;       // Centratura verticale (0-100%, default 50%)
  fotoPositionX?: number;       // Centratura orizzontale (0-100%, default 50%)
  descrizione?: string;         // Dettaglio / motivazione del premio
  fotoPremiazioneUrl?: string;  // Foto opzionale del podio / consegna coppa
  ordine?: number;              // Ordinamento sulla parete
  inEvidenza?: boolean;         // Quadro d'onore in evidenza
  wallOffsetX?: number;         // Offset orizzontale facoltativo per composizione artistica
  wallOffsetY?: number;         // Offset verticale facoltativo per composizione artistica
  premi?: PremioVinto[];        // Palmarès completo con tutte le vittorie / titoli conseguiti
  sfondoUrl?: string;           // Foto di sfondo personalizzata per la schermata immersiva (default: /images/palazzetto-sfondo.jpg)
  sfondoPositionY?: number;     // Centratura verticale dello sfondo (0-100%, default 50%)
  giocatoreId?: string;         // ID di collegamento all'atleta della rosa ufficiale
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_HALL_OF_FAME: AtletaPremiato[] = [
  {
    id: "hof_01",
    nome: "Sofia Bianchi",
    anno: "2024/2025",
    titoloPremio: "MVP Campionato Regionale",
    categoria: "Under 16 Femminile",
    ruolo: "Palleggiatrice",
    fotoUrl: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 25,
    fotoPositionX: 50,
    descrizione: "Eletta miglior giocatrice della Final Four Regionale con una prestazione straordinaria in regia e al servizio.",
    inEvidenza: true,
    ordine: 1,
    wallOffsetX: -15,
    wallOffsetY: -20,
    premi: [
      {
        id: "sb_01",
        titolo: "MVP Campionato Regionale",
        anno: "2024/2025",
        categoria: "Under 16 Femminile",
        descrizione: "Eletta miglior giocatrice della Final Four Regionale con una prestazione straordinaria in regia e al servizio."
      },
      {
        id: "sb_02",
        titolo: "Miglior Palleggiatrice Memorial Casadei",
        anno: "2023/2024",
        categoria: "Under 14 Femminile",
        descrizione: "Riconoscimento della giuria tecnica per la gestione tattica e lucidità sotto pressione."
      }
    ]
  },
  {
    id: "hof_02",
    nome: "Aurora Veroi",
    anno: "2024/2025",
    titoloPremio: "Miglior Libero Regionale",
    categoria: "Serie D Femminile",
    ruolo: "Libero",
    fotoUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 30,
    fotoPositionX: 50,
    descrizione: "Percentuale record dell'86% di ricezioni perfette durante i playoff promozione.",
    inEvidenza: true,
    ordine: 2,
    wallOffsetX: 25,
    wallOffsetY: -10,
    premi: [
      {
        id: "av_01",
        titolo: "Miglior Libero Regionale",
        anno: "2024/2025",
        categoria: "Serie D Femminile",
        descrizione: "Percentuale record dell'86% di ricezioni perfette durante i playoff promozione verso la Serie C."
      },
      {
        id: "av_02",
        titolo: "Miglior Difensore Coppa Romagna",
        anno: "2023/2024",
        categoria: "Prima Divisione",
        descrizione: "Protagonista assoluta nella finalissima con 26 difese punto e leadership difensiva."
      },
      {
        id: "av_03",
        titolo: "MVP Campionato Territoriale U18",
        anno: "2022/2023",
        categoria: "Under 18 Femminile",
        descrizione: "Capitano e trascinatrice del gruppo nella cavalcata fino alla medaglia d'oro provinciale."
      }
    ]
  },
  {
    id: "hof_03",
    nome: "Matteo Rossi",
    anno: "2023/2024",
    titoloPremio: "Miglior Schiacciatore U17",
    categoria: "Under 17 Maschile",
    ruolo: "Schiacciatore",
    fotoUrl: "https://images.unsplash.com/photo-1526676023333-d15fae1b2756?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 20,
    fotoPositionX: 50,
    descrizione: "Top scorer del torneo con oltre 120 punti messi a referto in soli 5 match.",
    inEvidenza: false,
    ordine: 3,
    wallOffsetX: -30,
    wallOffsetY: 15
  },
  {
    id: "hof_04",
    nome: "Emma Costa",
    anno: "2023/2024",
    titoloPremio: "MVP Torneo di Primavera",
    categoria: "Under 14 Femminile",
    ruolo: "Centrale",
    fotoUrl: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 35,
    fotoPositionX: 50,
    descrizione: "Dominio assoluto a muro nella finale nazionale contro la selezione toscana.",
    inEvidenza: false,
    ordine: 4,
    wallOffsetX: 10,
    wallOffsetY: 25
  },
  {
    id: "hof_05",
    nome: "Luca Ferrari",
    anno: "2024/2025",
    titoloPremio: "Convocazione Rappresentativa",
    categoria: "Serie D Maschile",
    ruolo: "Opposto",
    fotoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 25,
    fotoPositionX: 50,
    descrizione: "Selezionato per vestire la maglia della Rappresentativa Regionale Emilia-Romagna.",
    inEvidenza: true,
    ordine: 5,
    wallOffsetX: -5,
    wallOffsetY: -35
  },
  {
    id: "hof_06",
    nome: "Giulia Moretti",
    anno: "2022/2023",
    titoloPremio: "Miglior Muro Campionato",
    categoria: "Prima Divisione",
    ruolo: "Centrale",
    fotoUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=800&auto=format&fit=crop&q=80",
    fotoPositionY: 30,
    fotoPositionX: 50,
    descrizione: "45 muri vincenti in campionato e capitana esemplare durante l'intera annata.",
    inEvidenza: false,
    ordine: 6,
    wallOffsetX: 35,
    wallOffsetY: 20
  }
];

export async function getHallOfFameAll(): Promise<AtletaPremiato[]> {
  const collectionName = 'hall_of_fame';
  if (isDemoMode) {
    const list = getLocalData<AtletaPremiato[]>(collectionName, []);
    return list.sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99));
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    if (snapshot.empty) {
      return [];
    }
    const list: AtletaPremiato[] = [];
    snapshot.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AtletaPremiato);
    });
    return list.sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99));
  } catch (error) {
    console.warn("Errore getHallOfFameAll:", error);
    return [];
  }
}

export async function addAtletaPremiato(item: Omit<AtletaPremiato, 'id'>): Promise<AtletaPremiato> {
  const collectionName = 'hall_of_fame';
  const now = new Date().toISOString();
  // Deep sanitize to prevent ANY undefined properties in nested objects or arrays
  const cleanData: any = JSON.parse(JSON.stringify(item, (_key, val) => (val === undefined ? null : val)));
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null || cleanData[k] === undefined) {
      delete cleanData[k];
    }
  });
  cleanData.createdAt = now;
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<AtletaPremiato[]>(collectionName, []);
    const nuovo: AtletaPremiato = {
      id: `hof_${Date.now()}`,
      ...cleanData
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const ref = collection(db, collectionName);
    const docRef = doc(ref);
    await setDoc(docRef, cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    console.error("Errore addAtletaPremiato:", error);
    throw error;
  }
}

export async function updateAtletaPremiato(id: string, dati: Partial<AtletaPremiato>): Promise<void> {
  const collectionName = 'hall_of_fame';
  const now = new Date().toISOString();
  const cleanData: any = JSON.parse(JSON.stringify(dati, (_key, val) => (val === undefined ? null : val)));
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null || cleanData[k] === undefined) {
      delete cleanData[k];
    }
  });
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<AtletaPremiato[]>(collectionName, []);
    const updated = list.map(item => item.id === id ? { ...item, ...cleanData } : item);
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Errore updateAtletaPremiato:", error);
    throw error;
  }
}

export async function deleteAtletaPremiato(id: string): Promise<void> {
  const collectionName = 'hall_of_fame';
  if (isDemoMode) {
    const list = getLocalData<AtletaPremiato[]>(collectionName, []);
    const filtered = list.filter(item => item.id !== id);
    setLocalData(collectionName, filtered);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Errore deleteAtletaPremiato:", error);
    throw error;
  }
}

/**
 * Partecipazione a evento/camp di un Ospite Illustre
 */
export interface EventoOspite {
  anno: string; // es. "2023", "2024", "2025"
  evento: string; // es. "Summer Camp 2023", "Salfep Summer Camp 2024"
  dettaglio?: string; // dettaglio opzionale
}

/**
 * Ospiti Illustri & Leggende passati dalla New Volley Academy
 */
export interface OspiteIllustre {
  id: string;
  nome: string;
  ruoloTitolo: string; // es. "Campione Olimpico", "Campionessa Mondiale", "Giocatore Superlega"
  anno: string; // es. "2024/2025" o "2024" (mantenuto per compatibilità)
  occasione: string; // es. "Summer Camp 2024" (mantenuto per compatibilità)
  eventiPartecipazione?: EventoOspite[]; // Eventi e partecipazioni distinti anno per anno
  testoPassaggio?: string; // Frase 1 personalizzabile (Occasione del passaggio)
  testoIspirazione?: string; // Frase 2 personalizzabile (Ispirazione per la società)
  fotoUrl: string;
  fotoGallery?: string[]; // Galleria di foto aggiuntive per il carosello della scheda dettaglio
  fotoPositionY?: number;
  fotoPositionX?: number;
  descrizione?: string; // Aneddoto o racconto del passaggio
  fotoMomentoUrl?: string; // Foto con i ragazzi o durante l'evento
  sfondoUrl?: string;
  inEvidenza?: boolean;
  ordine?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Utility per estrarre le partecipazioni di un Ospite Illustre,
 * supportando sia il nuovo array strutturato sia il parsing retrocompatibile di stringhe multiple.
 */
export function getEventiOspite(ospite: Partial<OspiteIllustre>): EventoOspite[] {
  if (ospite.eventiPartecipazione && Array.isArray(ospite.eventiPartecipazione) && ospite.eventiPartecipazione.length > 0) {
    return ospite.eventiPartecipazione.filter(e => e.anno?.trim() || e.evento?.trim());
  }

  // Parsing intelligente di fallback da stringhe storiche divise con " - "
  const rawOccasione = ospite.occasione || '';
  const rawAnno = ospite.anno || '';

  if (rawOccasione.includes(' - ') || rawAnno.includes(' - ')) {
    const eventiList = rawOccasione.split(' - ').map(s => s.trim()).filter(Boolean);
    const anniList = rawAnno.split(' - ').map(s => s.trim()).filter(Boolean);

    const maxLength = Math.max(eventiList.length, anniList.length);
    if (maxLength > 0) {
      return Array.from({ length: maxLength }, (_, idx) => ({
        anno: anniList[idx] || anniList[anniList.length - 1] || '',
        evento: eventiList[idx] || eventiList[0] || 'Ospite Speciale NVA'
      }));
    }
  }

  if (rawOccasione || rawAnno) {
    return [{
      anno: rawAnno,
      evento: rawOccasione || 'Ospite Speciale NVA'
    }];
  }

  return [];
}

/**
 * Utility per estrarre tutti gli anni distinti in cui un Ospite Illustre ha partecipato o fatto visita.
 * Separa stringhe concatenate ("2023 - 2024 - 2025 - 2026"), stagioni ("2024/2025") o array di eventi.
 */
export function getAnniOspite(ospite: Partial<OspiteIllustre>): string[] {
  const anniSet = new Set<string>();

  // 1. Dagli eventi di partecipazione
  if (ospite.eventiPartecipazione && Array.isArray(ospite.eventiPartecipazione) && ospite.eventiPartecipazione.length > 0) {
    for (const ev of ospite.eventiPartecipazione) {
      if (ev.anno) {
        const matches = ev.anno.match(/\b(20\d{2})\b/g);
        if (matches) {
          matches.forEach(y => anniSet.add(y));
        } else {
          const trimmed = ev.anno.trim();
          if (trimmed) anniSet.add(trimmed);
        }
      }
    }
  }

  // 2. Dalla stringa legacy/fallback ospite.anno
  if (ospite.anno) {
    const matches = ospite.anno.match(/\b(20\d{2})\b/g);
    if (matches && matches.length > 0) {
      matches.forEach(y => anniSet.add(y));
    } else {
      const parts = ospite.anno.split(/\s*[-,\/]\s*/).map(s => s.trim()).filter(Boolean);
      parts.forEach(p => anniSet.add(p));
    }
  }

  return Array.from(anniSet);
}

/**
 * Estrae tutte le foto associate a un Ospite Illustre:
 * La foto principale (fotoUrl) seguita da tutte le foto della galleria (fotoGallery o legacy).
 * Restituisce una lista deduplicata con la foto principale sempre al primo posto (indice 0).
 */
export function getAllFotoOspite(ospite?: Partial<OspiteIllustre> | null): string[] {
  if (!ospite) return [];
  const list: string[] = [];

  // Foto principale
  if (ospite.fotoUrl && typeof ospite.fotoUrl === 'string' && ospite.fotoUrl.trim()) {
    list.push(ospite.fotoUrl.trim());
  }

  // Foto gallery
  if (Array.isArray(ospite.fotoGallery)) {
    ospite.fotoGallery.forEach(url => {
      if (url && typeof url === 'string' && url.trim() && !list.includes(url.trim())) {
        list.push(url.trim());
      }
    });
  }

  // Supporto retrocompatibile per gallery_foto o fotoMomentoUrl
  if ((ospite as any).gallery_foto && Array.isArray((ospite as any).gallery_foto)) {
    (ospite as any).gallery_foto.forEach((url: string) => {
      if (url && typeof url === 'string' && url.trim() && !list.includes(url.trim())) {
        list.push(url.trim());
      }
    });
  }
  if (ospite.fotoMomentoUrl && typeof ospite.fotoMomentoUrl === 'string' && ospite.fotoMomentoUrl.trim() && !list.includes(ospite.fotoMomentoUrl.trim())) {
    list.push(ospite.fotoMomentoUrl.trim());
  }

  return list;
}

export async function getOspitiIllustriAll(): Promise<OspiteIllustre[]> {
  const collectionName = 'ospiti_illustri';
  if (isDemoMode) {
    const list = getLocalData<OspiteIllustre[]>(collectionName, []);
    return list.sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99));
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    if (snapshot.empty) {
      return [];
    }
    const list: OspiteIllustre[] = [];
    snapshot.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() } as OspiteIllustre);
    });
    return list.sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99));
  } catch (error) {
    console.warn("Errore getOspitiIllustriAll:", error);
    return [];
  }
}

export async function addOspiteIllustre(item: Omit<OspiteIllustre, 'id'>): Promise<OspiteIllustre> {
  const collectionName = 'ospiti_illustri';
  const now = new Date().toISOString();
  const cleanData: any = JSON.parse(JSON.stringify(item, (_key, val) => (val === undefined ? null : val)));
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null || cleanData[k] === undefined) {
      delete cleanData[k];
    }
  });
  cleanData.createdAt = now;
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<OspiteIllustre[]>(collectionName, []);
    const nuovo: OspiteIllustre = {
      id: `ospite_${Date.now()}`,
      ...cleanData
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }
  try {
    const ref = collection(db, collectionName);
    const docRef = doc(ref);
    await setDoc(docRef, cleanData);
    return { id: docRef.id, ...cleanData };
  } catch (error) {
    console.error("Errore addOspiteIllustre:", error);
    throw error;
  }
}

export async function updateOspiteIllustre(id: string, dati: Partial<OspiteIllustre>): Promise<void> {
  const collectionName = 'ospiti_illustri';
  const now = new Date().toISOString();
  const cleanData: any = JSON.parse(JSON.stringify(dati, (_key, val) => (val === undefined ? null : val)));
  Object.keys(cleanData).forEach(k => {
    if (cleanData[k] === null || cleanData[k] === undefined) {
      delete cleanData[k];
    }
  });
  cleanData.updatedAt = now;

  if (isDemoMode) {
    const list = getLocalData<OspiteIllustre[]>(collectionName, []);
    const updated = list.map(item => item.id === id ? { ...item, ...cleanData } : item);
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Errore updateOspiteIllustre:", error);
    throw error;
  }
}

export async function deleteOspiteIllustre(id: string): Promise<void> {
  const collectionName = 'ospiti_illustri';
  if (isDemoMode) {
    const list = getLocalData<OspiteIllustre[]>(collectionName, []);
    const filtered = list.filter(item => item.id !== id);
    setLocalData(collectionName, filtered);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Errore deleteOspiteIllustre:", error);
    throw error;
  }
}

export interface SocietaConfig {
  nomeSocieta: string;
  annoFondazione: string;
  coloriSociali: string;
  codiceFipav: string;
  descrizione: string;
  sedeLegale: string;
  email: string;
  telefono: string;
  pec: string;
  carosello?: {
    foto: Array<{ url: string; positionY: number }>;
    intervallo: number;
  };
  consiglioDirettivo?: Array<{
    id: string;
    ruolo: string;
    nome: string;
    ordine: number;
  }>;
  staffTecnico?: Array<{
    id: string;
    ruolo: string;
    qualifica: string;
    nome: string;
    ordine: number;
    profiloId?: string;
    fotoUrl?: string;
    fotoPositionY?: number;
    fotoPositionX?: number;
  }>;
  palestre?: Array<{
    id: string;
    nome: string;
    indirizzo: string;
    capienza: string;
    note: string;
    ordine: number;
  }>;
  organigramma?: Array<any>;
  storia?: {
    titolo?: string;
    descrizione?: string;
    fotoUrl?: string;
  };
}

export const DEFAULT_SOCIETA_CONFIG: SocietaConfig = {
  nomeSocieta: "New Volley Academy Forlì",
  annoFondazione: "2018",
  coloriSociali: "Giallo-Blu",
  codiceFipav: "080390199",
  descrizione: "La New Volley Academy è la scuola di pallavolo di riferimento per la crescita dei giovani atleti ed atlete, basata su valori sportivi, dedizione e passione.",
  sedeLegale: "Via dell'Appennino 140, 47121 Forlì (FC)",
  email: "info@newvolleyacademy.it",
  telefono: "+39 351 321 0332",
  pec: "newvolleyacademyforli@legalmail.it",
  carosello: {
    foto: [],
    intervallo: 5
  },
  consiglioDirettivo: [
    { id: "dir-1", ruolo: "Presidente", nome: "Walter Gagliardi", ordine: 1 },
    { id: "dir-2", ruolo: "Vice Presidente & Tesoriere", nome: "Debora Montanari", ordine: 2 },
    { id: "dir-3", ruolo: "Direttore Sportivo", nome: "Alessandro Verri", ordine: 3 },
    { id: "dir-4", ruolo: "Responsabile Comunicazione", nome: "Chiara Boscolo", ordine: 4 }
  ],
  staffTecnico: [],
  palestre: [
    { id: "pal-1", nome: "PalaRomiti Forlì (Tana delle Pantere)", indirizzo: "Via dell'Appennino 140, Forlì", capienza: "1200 Spettatori", note: "Campo principale in taraflex, ingresso tifosi lato nord", ordine: 1 },
    { id: "pal-2", nome: "Palasport Ginnasio Forlì", indirizzo: "Viale della Libertà 46, Forlì", capienza: "400 Spettatori", note: "Utilizzato per il settore giovanile and allenamenti Under", ordine: 2 }
  ],
  organigramma: [],
  storia: {
    titolo: "La Nostra Passione, I Nostri Valori",
    descrizione: "La New Volley Academy Forlì è nata nel 2018 per creare un polo pallavolistico d'eccellenza sul territorio romagnolo. Offriamo percorsi agonistici federali e corsi S3 giovanili per formare non solo grandi atleti, ma solide persone."
  }
};

export async function getSocietaConfig(): Promise<SocietaConfig> {
  const collectionName = 'societa_config';
  if (isDemoMode) {
    const local = getLocalData<SocietaConfig>('societa_config', DEFAULT_SOCIETA_CONFIG);
    return local;
  }
  try {
    const docRef = doc(db, collectionName, 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const mockNames = ['roberto baggio', 'ettore gulinelli', 'giulia neri', 'marco de marchi'];
      const rawStaff = Array.isArray(data.staffTecnico) ? data.staffTecnico : [];
      const isOnlyMockStaff = rawStaff.length > 0 && rawStaff.every((s: any) =>
        !s.profiloId && mockNames.includes((s.nome || '').toLowerCase().trim())
      );
      const cleanStaff = isOnlyMockStaff ? [] : rawStaff;

      const merged: SocietaConfig = {
        nomeSocieta: data.nomeSocieta || DEFAULT_SOCIETA_CONFIG.nomeSocieta,
        annoFondazione: data.annoFondazione || DEFAULT_SOCIETA_CONFIG.annoFondazione,
        coloriSociali: data.coloriSociali || DEFAULT_SOCIETA_CONFIG.coloriSociali,
        codiceFipav: data.codiceFipav || DEFAULT_SOCIETA_CONFIG.codiceFipav,
        descrizione: data.descrizione || DEFAULT_SOCIETA_CONFIG.descrizione,
        sedeLegale: data.sedeLegale || DEFAULT_SOCIETA_CONFIG.sedeLegale,
        email: data.email || DEFAULT_SOCIETA_CONFIG.email,
        telefono: data.telefono || DEFAULT_SOCIETA_CONFIG.telefono,
        pec: data.pec || DEFAULT_SOCIETA_CONFIG.pec,
        carosello: data.carosello || DEFAULT_SOCIETA_CONFIG.carosello,
        consiglioDirettivo: data.consiglioDirettivo || DEFAULT_SOCIETA_CONFIG.consiglioDirettivo,
        staffTecnico: cleanStaff,
        palestre: data.palestre || DEFAULT_SOCIETA_CONFIG.palestre,
        organigramma: data.organigramma || DEFAULT_SOCIETA_CONFIG.organigramma,
        storia: data.storia || DEFAULT_SOCIETA_CONFIG.storia,
      };
      return merged;
    } else {
      return DEFAULT_SOCIETA_CONFIG;
    }
  } catch (error) {
    console.error("Errore getSocietaConfig:", error);
    return DEFAULT_SOCIETA_CONFIG;
  }
}

export async function updateSocietaConfig(config: Partial<SocietaConfig>): Promise<void> {
  const collectionName = 'societa_config';
  const cleanPayload = JSON.parse(JSON.stringify(config));
  if (isDemoMode) {
    const current = getLocalData<SocietaConfig>('societa_config', DEFAULT_SOCIETA_CONFIG);
    const updated = { ...current, ...cleanPayload };
    setLocalData('societa_config', updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, 'main');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, { ...DEFAULT_SOCIETA_CONFIG, ...cleanPayload });
    } else {
      await updateDoc(docRef, cleanPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/main`);
  }
}

// ============================================================================
// GALLERIA FOTOGRAFICA
// ============================================================================

export interface FotoItem {
  id: string;
  url: string;
  didascalia?: string;
  focalPoint?: number;
  likes?: number;
}

export interface FotoGalleria {
  id: string;
  url: string;
  titolo: string;
  didascalia?: string;
  squadra: string; // Dropdown con squadre ufficiali + "Generale"
  categoria?: string;
  tagMood: "Esultanze & Grinta" | "Dietro le Quinte" | "In Tribuna" | "Premiazioni";
  isScattoDelMese: boolean;
  isHighlight: boolean;
  ordine: number;
  likes: number;
  fotoPositionY?: number; // Posizione d'interesse Y (0% - 100%, default 50%)
  coverIndex?: number;
  fotos?: FotoItem[];
  createdAt?: any;
  updatedAt?: any;
}

const DEFAULT_GALLERIA_FOTO: FotoGalleria[] = [
  {
    id: "foto_01",
    url: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=1600&auto=format&fit=crop&q=80",
    titolo: "Trionfo in Finale di Coppa",
    didascalia: "L'abbraccio esplosivo al punto decisivo del quinto set. Campionesse regionali!",
    squadra: "Serie C Femminile",
    tagMood: "Premiazioni",
    isScattoDelMese: true,
    isHighlight: true,
    ordine: 1,
    likes: 142,
    coverIndex: 0,
    fotos: [
      { id: "foto_01_a", url: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=1600&auto=format&fit=crop&q=80", didascalia: "L'abbraccio esplosivo al punto decisivo del quinto set.", focalPoint: 50, likes: 98 },
      { id: "foto_01_b", url: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=1200&auto=format&fit=crop&q=80", didascalia: "La coppa sollevata dalle ragazze!", focalPoint: 40, likes: 44 }
    ]
  },
  {
    id: "foto_02",
    url: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=1200&auto=format&fit=crop&q=80",
    titolo: "Muro d'Acciaio a Rete",
    didascalia: "Impenetrabile muro difensivo a due durante il derby battuto a punteggio pieno.",
    squadra: "Serie C Femminile",
    tagMood: "Esultanze & Grinta",
    isScattoDelMese: false,
    isHighlight: true,
    ordine: 2,
    likes: 89,
    coverIndex: 0,
    fotos: [
      { id: "foto_02_a", url: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=1200&auto=format&fit=crop&q=80", didascalia: "Muro invalicabile a due a filo rete.", focalPoint: 50, likes: 89 }
    ]
  },
  {
    id: "foto_03",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    titolo: "Concentrazione Negli Spogliatoi",
    didascalia: "Ultimo briefing tattico del coach prima dell'ingresso in campo.",
    squadra: "Under 18 Femminile",
    tagMood: "Dietro le Quinte",
    isScattoDelMese: false,
    isHighlight: true,
    ordine: 3,
    likes: 64,
    coverIndex: 0,
    fotos: [
      { id: "foto_03_a", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80", didascalia: "Analisi della lavagna tattica prima della partita.", focalPoint: 50, likes: 64 }
    ]
  },
  {
    id: "foto_04",
    url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&auto=format&fit=crop&q=80",
    titolo: "La Curva Pantere in Festa",
    didascalia: "Incrocio di tamburi e bandiere al Palasport per sostenere le nostre ragazze.",
    squadra: "Generale",
    tagMood: "In Tribuna",
    isScattoDelMese: false,
    isHighlight: true,
    ordine: 4,
    likes: 115,
    coverIndex: 0,
    fotos: [
      { id: "foto_04_a", url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&auto=format&fit=crop&q=80", didascalia: "I tifosi cantano allo stremo delle forze.", focalPoint: 50, likes: 115 }
    ]
  },
  {
    id: "foto_05",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop&q=80",
    titolo: "Battuta Flot in Salto",
    didascalia: "Tecnica e potenza sul filo della linea di fondo.",
    squadra: "Under 16 Femminile",
    tagMood: "Esultanze & Grinta",
    isScattoDelMese: false,
    isHighlight: false,
    ordine: 5,
    likes: 52,
    coverIndex: 0,
    fotos: [
      { id: "foto_05_a", url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop&q=80", didascalia: "Battuta ad altissima velocità.", focalPoint: 50, likes: 52 }
    ]
  },
  {
    id: "foto_06",
    url: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&auto=format&fit=crop&q=80",
    titolo: "Sorrisi e Medaglie al Torneo Estivo",
    didascalia: "I giovanissimi talenti festeggiano la conclusione del camp di perfezionamento.",
    squadra: "Volley S3 / Minivolley",
    tagMood: "Premiazioni",
    isScattoDelMese: false,
    isHighlight: true,
    ordine: 6,
    likes: 98,
    coverIndex: 0,
    fotos: [
      { id: "foto_06_a", url: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&auto=format&fit=crop&q=80", didascalia: "Premiazione finale del torneo giovanile.", focalPoint: 50, likes: 98 }
    ]
  },
  {
    id: "foto_07",
    url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80",
    titolo: "Riscaldamento Pre-Gara",
    didascalia: "Concentrazione massima e routine di bagher prima della prima battuta.",
    squadra: "Under 14 Femminile",
    tagMood: "Dietro le Quinte",
    isScattoDelMese: false,
    isHighlight: false,
    ordine: 7,
    likes: 43,
    coverIndex: 0,
    fotos: [
      { id: "foto_07_a", url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1200&auto=format&fit=crop&q=80", didascalia: "Routine di attacco e difesa durante il riscaldamento.", focalPoint: 50, likes: 43 }
    ]
  },
  {
    id: "foto_08",
    url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80",
    titolo: "Coreografia dei Genitori",
    didascalia: "Sciarpe e cori personalizzati per la trasferta pirotecnica.",
    squadra: "Generale",
    tagMood: "In Tribuna",
    isScattoDelMese: false,
    isHighlight: false,
    ordine: 8,
    likes: 77,
    coverIndex: 0,
    fotos: [
      { id: "foto_08_a", url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80", didascalia: "Incrocio di striscioni e tifo organizzato.", focalPoint: 50, likes: 77 }
    ]
  }
];

export async function getGalleriaFotoAll(): Promise<FotoGalleria[]> {
  const collectionName = 'galleria_foto';
  if (isDemoMode) {
    const local = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    return local.map(item => {
      const rawFotos: FotoItem[] = Array.isArray(item.fotos) && item.fotos.length > 0
        ? item.fotos.map((f: any, idx: number) => ({
            id: f.id || `${item.id}_${idx}`,
            url: f.url || '',
            didascalia: f.didascalia || '',
            focalPoint: typeof f.focalPoint === 'number' ? f.focalPoint : (typeof f.fotoPositionY === 'number' ? f.fotoPositionY : 50),
            likes: typeof f.likes === 'number' ? f.likes : 0
          }))
        : [{
            id: `${item.id}_0`,
            url: item.url || '',
            didascalia: item.didascalia || '',
            focalPoint: typeof item.fotoPositionY === 'number' ? item.fotoPositionY : 50,
            likes: typeof item.likes === 'number' ? item.likes : 0
          }];
      const coverIdx = typeof item.coverIndex === 'number' ? Math.min(Math.max(0, item.coverIndex), rawFotos.length - 1) : 0;
      const coverPhoto = rawFotos[coverIdx] || rawFotos[0];
      return {
        ...item,
        url: coverPhoto?.url || item.url || '',
        fotoPositionY: coverPhoto?.focalPoint ?? item.fotoPositionY ?? 50,
        coverIndex: coverIdx,
        fotos: rawFotos
      };
    }).sort((a, b) => a.ordine - b.ordine);
  }
  try {
    const ref = collection(db, collectionName);
    const snapshot = await getDocs(ref);
    if (snapshot.empty) {
      return DEFAULT_GALLERIA_FOTO.sort((a, b) => a.ordine - b.ordine);
    }
    const list: FotoGalleria[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const rawFotos: FotoItem[] = Array.isArray(data.fotos) && data.fotos.length > 0
        ? data.fotos.map((f: any, idx: number) => ({
            id: f.id || `${docSnap.id}_${idx}`,
            url: f.url || '',
            didascalia: f.didascalia || '',
            focalPoint: typeof f.focalPoint === 'number' ? f.focalPoint : (typeof f.fotoPositionY === 'number' ? f.fotoPositionY : 50),
            likes: typeof f.likes === 'number' ? f.likes : 0
          }))
        : [{
            id: `${docSnap.id}_0`,
            url: data.url || '',
            didascalia: data.didascalia || '',
            focalPoint: typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50,
            likes: typeof data.likes === 'number' ? data.likes : 0
          }];

      const coverIdx = typeof data.coverIndex === 'number' ? Math.min(Math.max(0, data.coverIndex), rawFotos.length - 1) : 0;
      const coverPhoto = rawFotos[coverIdx] || rawFotos[0];

      list.push({
        id: docSnap.id,
        url: coverPhoto?.url || data.url || '',
        titolo: data.titolo || 'Senza titolo',
        didascalia: coverPhoto?.didascalia || data.didascalia || '',
        squadra: data.categoria || data.squadra || 'Generale',
        categoria: data.categoria || data.squadra || 'Generale',
        tagMood: data.tagMood || 'Esultanze & Grinta',
        isScattoDelMese: !!data.isScattoDelMese,
        isHighlight: !!data.isHighlight,
        ordine: typeof data.ordine === 'number' ? data.ordine : 0,
        likes: rawFotos.reduce((sum, f) => sum + (f.likes || 0), typeof data.likes === 'number' ? data.likes : 0),
        fotoPositionY: coverPhoto?.focalPoint ?? (typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50),
        coverIndex: coverIdx,
        fotos: rawFotos,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      });
    });
    return list.sort((a, b) => a.ordine - b.ordine);
  } catch (error) {
    console.error("Errore getGalleriaFotoAll:", error);
    return DEFAULT_GALLERIA_FOTO.sort((a, b) => a.ordine - b.ordine);
  }
}

export async function addGalleriaFoto(foto: Omit<FotoGalleria, 'id'>): Promise<FotoGalleria> {
  const collectionName = 'galleria_foto';
  const now = new Date().toISOString();
  const dataConMeta = {
    ...foto,
    likes: foto.likes || 0,
    createdAt: now,
    updatedAt: now
  };

  if (isDemoMode) {
    let list = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    if (foto.isScattoDelMese) {
      list = list.map(item => ({ ...item, isScattoDelMese: false }));
    }
    const nuovo: FotoGalleria = {
      id: `foto_${Math.floor(Math.random() * 100000)}`,
      ...dataConMeta
    };
    list.push(nuovo);
    setLocalData(collectionName, list);
    return nuovo;
  }

  try {
    const ref = collection(db, collectionName);

    // Se il nuovo album è "Scatto del Mese", azzera lo scatto del mese sulle altre foto
    if (foto.isScattoDelMese) {
      const snapshot = await getDocs(ref);
      snapshot.forEach(async (docSnap) => {
        if (docSnap.data().isScattoDelMese) {
          await updateDoc(doc(db, collectionName, docSnap.id), { isScattoDelMese: false });
        }
      });
    }

    const docRef = await addDoc(ref, dataConMeta);
    return { ...dataConMeta, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
    throw error;
  }
}

export async function updateGalleriaFoto(id: string, updates: Partial<FotoGalleria>): Promise<void> {
  const collectionName = 'galleria_foto';
  const now = new Date().toISOString();
  const dataConMeta = {
    ...updates,
    updatedAt: now
  };

  if (isDemoMode) {
    let list = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    if (updates.isScattoDelMese) {
      list = list.map(item => ({ ...item, isScattoDelMese: false }));
    }
    const updated = list.map(item => item.id === id ? { ...item, ...dataConMeta } : item);
    setLocalData(collectionName, updated);
    return;
  }

  try {
    const ref = collection(db, collectionName);
    if (updates.isScattoDelMese) {
      const snapshot = await getDocs(ref);
      for (const docSnap of snapshot.docs) {
        if (docSnap.id !== id && docSnap.data().isScattoDelMese) {
          await updateDoc(doc(db, collectionName, docSnap.id), { isScattoDelMese: false });
        }
      }
    }
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, dataConMeta, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function deleteGalleriaFoto(id: string): Promise<void> {
  const collectionName = 'galleria_foto';
  if (isDemoMode) {
    const list = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    const updated = list.filter(item => item.id !== id);
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export async function likeGalleriaFoto(id: string, isLike: boolean = true): Promise<void> {
  const collectionName = 'galleria_foto';
  const delta = isLike ? 1 : -1;
  if (isDemoMode) {
    const list = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    const updated = list.map(item => item.id === id ? { ...item, likes: Math.max(0, (item.likes || 0) + delta) } : item);
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, id);
    if (!isLike) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const cur = snap.data()?.likes || 0;
        await updateDoc(docRef, { likes: Math.max(0, cur - 1) });
      }
    } else {
      await updateDoc(docRef, { likes: increment(1) });
    }
  } catch (error) {
    console.error("Errore likeGalleriaFoto:", error);
  }
}

export async function likeFotoInAlbum(albumId: string, photoIdOrIndex: string | number, isLike: boolean = true): Promise<void> {
  const collectionName = 'galleria_foto';
  const targetKey = String(photoIdOrIndex);
  const delta = isLike ? 1 : -1;
  if (isDemoMode) {
    const list = getLocalData<FotoGalleria[]>(collectionName, DEFAULT_GALLERIA_FOTO);
    const updated = list.map(item => {
      if (item.id === albumId) {
        const rawFotos = item.fotos || [{
          id: `${item.id}_0`,
          url: item.url,
          didascalia: item.didascalia,
          focalPoint: item.fotoPositionY ?? 50,
          likes: item.likes || 0
        }];
        const updatedFotos = rawFotos.map((f, idx) => 
          (f.id === targetKey || String(idx) === targetKey) ? { ...f, likes: Math.max(0, (f.likes || 0) + delta) } : f
        );
        const totalLikes = updatedFotos.reduce((sum, f) => sum + (f.likes || 0), 0);
        return { ...item, fotos: updatedFotos, likes: totalLikes };
      }
      return item;
    });
    setLocalData(collectionName, updated);
    return;
  }
  try {
    const docRef = doc(db, collectionName, albumId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawFotos: FotoItem[] = Array.isArray(data.fotos) && data.fotos.length > 0
        ? data.fotos
        : [{
            id: `${albumId}_0`,
            url: data.url || '',
            didascalia: data.didascalia || '',
            focalPoint: typeof data.fotoPositionY === 'number' ? data.fotoPositionY : 50,
            likes: typeof data.likes === 'number' ? data.likes : 0
          }];
      const updatedFotos = rawFotos.map((f, idx) => 
        (f.id === targetKey || String(idx) === targetKey) ? { ...f, likes: Math.max(0, (f.likes || 0) + delta) } : f
      );
      const totalLikes = updatedFotos.reduce((sum, f) => sum + (f.likes || 0), 0);
      await setDoc(docRef, { fotos: updatedFotos, likes: totalLikes }, { merge: true });
    } else {
      if (isLike) {
        await updateDoc(docRef, { likes: increment(1) });
      }
    }
  } catch (error) {
    console.error("Errore likeFotoInAlbum:", error);
  }
}

// ============================================================================
// STATISTICHE VISITE & ANALYTICS NATIVO
// ============================================================================

export async function tracciaVisitaPagina(path: string): Promise<void> {
  // Ignora tracciamento interno delle rotte admin e risorse
  if (path.startsWith('/admin') || path.startsWith('/login') || path.includes('.')) return;

  try {
    const rawKey = path === '/' ? 'home' : path.replace(/^\//, '').split('/')[0] || 'home';
    const today = new Date().toISOString().split('T')[0];

    // Local snapshot
    try {
      const localRaw = localStorage.getItem('nva_stats_local_v1');
      const stats = localRaw ? JSON.parse(localRaw) : { pages: {}, days: {}, total: 0 };
      stats.total = (stats.total || 0) + 1;
      stats.pages[rawKey] = (stats.pages[rawKey] || 0) + 1;
      stats.days[today] = (stats.days[today] || 0) + 1;
      localStorage.setItem('nva_stats_local_v1', JSON.stringify(stats));
    } catch (err) {}

    // Firestore counter update
    if (!isDemoMode && db) {
      const statsRef = doc(db, 'statistiche_visite', 'panoramica');
      try {
        await updateDoc(statsRef, {
          totaleVisite: increment(1),
          [`pagine.${rawKey}`]: increment(1),
          [`giorni.${today}`]: increment(1),
          ultimoAccesso: new Date().toISOString()
        });
      } catch (err) {
        await setDoc(statsRef, {
          totaleVisite: increment(1),
          pagine: { [rawKey]: 1 },
          giorni: { [today]: 1 },
          ultimoAccesso: new Date().toISOString()
        }, { merge: true });
      }
    }
  } catch (e) {
    // Non-blocking telemetry error suppression
  }
}

export async function getStatisticheVisite(): Promise<any> {
  const defaultInitial = {
    totaleVisite: 2840,
    pagine: {
      home: 1137,
      squadre: 888,
      news: 124,
      societa: 102,
      'camp-tornei': 86,
      'albo-d-oro': 85,
      blog: 68,
      galleria: 55,
      voltex: 38,
      sponsor: 36,
      modulistica: 26
    },
    giorni: {},
    ultimoAccesso: new Date().toISOString()
  };

  if (!isDemoMode && db) {
    try {
      const docRef = doc(db, 'statistiche_visite', 'panoramica');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        if (rawData) {
          // Normalize both nested maps and potential flat dot keys for total robustness
          const giorni: Record<string, number> = { ...(rawData.giorni || {}) };
          const pagine: Record<string, number> = { ...(rawData.pagine || {}) };
          
          for (const [k, v] of Object.entries(rawData)) {
            if (k.startsWith('giorni.')) {
              const dKey = k.replace('giorni.', '');
              giorni[dKey] = (giorni[dKey] || 0) + Number(v || 0);
            } else if (k.startsWith('pagine.')) {
              const pKey = k.replace('pagine.', '');
              pagine[pKey] = (pagine[pKey] || 0) + Number(v || 0);
            }
          }

          return {
            ...rawData,
            totaleVisite: Number(rawData.totaleVisite || 0),
            giorni,
            pagine
          };
        }
      }
    } catch (e) {
      console.warn("Errore getStatisticheVisite:", e);
    }
  }
  return defaultInitial;
}





// ============================================================================
// ARCHIVIO STORICO SQUADRE & FORMAZIONI D'EPOCA
// ============================================================================

export interface AtletaRosterStorico {
  id?: string;
  nome: string;
  numero?: number | string;
  ruolo?: string;
  capitano?: boolean;
  giocatoreId?: string;
}

export interface SquadraStorica {
  id: string; // es. "storico_seried_2023_2024"
  nome_squadra: string; // es. "Serie D Maschile"
  stagione: string; // es. "2023/2024"
  categoria: 'SERIE_D' | 'CAMPIONATI_SENIOR' | 'GIOVANILI';
  foto_ufficiale_url: string; // Foto di squadra / rosa completa
  gallery_foto?: string[]; // Foto aggiuntive della stagione (festa, coppa, gare) per il carosello
  fotoPositionY?: number;
  fotoPositionX?: number;
  traguardo?: string; // es. "Promozione Storica in Serie D - 1° Posto Girone B"
  note_storiche?: string; // Aneddoto o cronistoria
  allenatori: {
    primo: string;
    secondo?: string;
    dirigente?: string;
  };
  roster: AtletaRosterStorico[];
  createdAt?: string;
  updatedAt?: string;
}

const STORICO_SQUADRE_CACHE_KEY = 'nva_storico_squadre_cache';

export async function getStoricoSquadreAll(): Promise<SquadraStorica[]> {
  // 1. Prova dalla cache locale istantanea
  try {
    const cached = localStorage.getItem(STORICO_SQUADRE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Avvia refresh in background se collegato
        fetchStoricoSquadreFirestore().then(fresh => {
          if (fresh && fresh.length > 0) {
            localStorage.setItem(STORICO_SQUADRE_CACHE_KEY, JSON.stringify(fresh));
          }
        }).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {}

  return await fetchStoricoSquadreFirestore();
}

async function fetchStoricoSquadreFirestore(): Promise<SquadraStorica[]> {
  if (!db || isDemoMode) {
    return getStoricoSquadreDefault();
  }

  try {
    const colRef = collection(db, 'storico_squadre');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const defs = getStoricoSquadreDefault();
      // Inizializza con i default se vuoto
      for (const item of defs) {
        await setDoc(doc(db, 'storico_squadre', item.id), item);
      }
      localStorage.setItem(STORICO_SQUADRE_CACHE_KEY, JSON.stringify(defs));
      return defs;
    }

    const items: SquadraStorica[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<SquadraStorica, 'id'>)
    }));

    // Ordina per stagione decrescente
    items.sort((a, b) => (b.stagione || '').localeCompare(a.stagione || ''));
    localStorage.setItem(STORICO_SQUADRE_CACHE_KEY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.warn("Errore fetchStoricoSquadreFirestore:", error);
    try {
      const cached = localStorage.getItem(STORICO_SQUADRE_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return getStoricoSquadreDefault();
  }
}

export async function saveStoricoSquadra(item: Omit<SquadraStorica, 'id'>, id?: string): Promise<string> {
  const finalId = id || `storico_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullItem: SquadraStorica = {
    ...item,
    id: finalId,
    updatedAt: new Date().toISOString()
  };

  if (!fullItem.createdAt) {
    fullItem.createdAt = new Date().toISOString();
  }

  // Aggiorna subito la cache locale (0ms UI latency)
  try {
    const cached = localStorage.getItem(STORICO_SQUADRE_CACHE_KEY);
    let list: SquadraStorica[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(x => x.id === finalId);
    if (idx >= 0) {
      list[idx] = fullItem;
    } else {
      list.unshift(fullItem);
    }
    list.sort((a, b) => (b.stagione || '').localeCompare(a.stagione || ''));
    localStorage.setItem(STORICO_SQUADRE_CACHE_KEY, JSON.stringify(list));
  } catch (e) {}

  if (db && !isDemoMode) {
    try {
      const docRef = doc(db, 'storico_squadre', finalId);
      await setDoc(docRef, fullItem, { merge: true });
    } catch (error) {
      console.error("Errore salvataggio storico_squadre su Firestore:", error);
      throw error;
    }
  }

  return finalId;
}

export async function deleteStoricoSquadra(id: string): Promise<void> {
  // Rimuovi subito dalla cache locale
  try {
    const cached = localStorage.getItem(STORICO_SQUADRE_CACHE_KEY);
    if (cached) {
      let list: SquadraStorica[] = JSON.parse(cached);
      list = list.filter(x => x.id !== id);
      localStorage.setItem(STORICO_SQUADRE_CACHE_KEY, JSON.stringify(list));
    }
  } catch (e) {}

  if (db && !isDemoMode) {
    try {
      const docRef = doc(db, 'storico_squadre', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Errore eliminazione storico_squadre da Firestore:", error);
      throw error;
    }
  }
}

export function getStoricoSquadreDefault(): SquadraStorica[] {
  return [
    {
      id: "storico_seried_maschile_2023_2024",
      nome_squadra: "Serie D Maschile",
      stagione: "2023/2024",
      categoria: "SERIE_D",
      foto_ufficiale_url: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80",
      gallery_foto: [
        "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&auto=format&fit=crop&q=80"
      ],
      fotoPositionY: 40,
      traguardo: "Promozione Storica in Serie D & Campioni Regionali FIPAV",
      note_storiche: "Una cavalcata leggendaria conclusa al palazzetto di Forlì davanti a oltre 400 tifosi delle Pantere. 22 vittorie su 24 gare disputate.",
      allenatori: {
        primo: "Marco Bellini",
        secondo: "Davide Ravaioli",
        dirigente: "Fabrizio Casadei"
      },
      roster: [
        { nome: "Lorenzo Casadei", numero: 1, ruolo: "Palleggiatore", capitano: true },
        { nome: "Andrea Turchi", numero: 4, ruolo: "Schiacciatore" },
        { nome: "Matteo Ravaioli", numero: 7, ruolo: "Centrale" },
        { nome: "Federico Rossi", numero: 9, ruolo: "Opposto" },
        { nome: "Giacomo Monti", numero: 11, ruolo: "Schiacciatore" },
        { nome: "Luca Fabbri", numero: 14, ruolo: "Libero" },
        { nome: "Simone Zoli", numero: 18, ruolo: "Centrale" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "storico_u16_femminile_2022_2023",
      nome_squadra: "Under 16 Femminile",
      stagione: "2022/2023",
      categoria: "GIOVANILI",
      foto_ufficiale_url: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&auto=format&fit=crop&q=80",
      fotoPositionY: 35,
      traguardo: "Campionesse Provinciali & Final Four Regionale",
      note_storiche: "La generazione d'oro delle giovani Pantere che ha conquistato il titolo provinciale imbattuta in tutte le partite di campionato.",
      allenatori: {
        primo: "Elena Valenti",
        dirigente: "Simona Gardini"
      },
      roster: [
        { nome: "Sofia Bianchi", numero: 3, ruolo: "Schiacciatrice", capitano: true },
        { nome: "Martina Conti", numero: 6, ruolo: "Palleggiatrice" },
        { nome: "Chiara Moretti", numero: 8, ruolo: "Centrale" },
        { nome: "Giulia Ricci", numero: 10, ruolo: "Libero" },
        { nome: "Alice Ferri", numero: 12, ruolo: "Opposto" },
        { nome: "Sara Melandri", numero: 15, ruolo: "Schiacciatrice" }
      ],
      createdAt: new Date().toISOString()
    }
  ];
}


// ============================================================================
// 19. INSTAGRAM FEED LIVE (Modello Dati & Sincronizzazione da Make.com / Admin)
// ============================================================================

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  permalink: string;
  timestamp?: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
  visibile: boolean;
  data_creazione?: string;
  createdAt?: string;
  updatedAt?: string;
}

const INSTAGRAM_CACHE_KEY = "nva_instagram_feed_cache";

export function getInstagramPostsDefault(): InstagramPost[] {
  return [
    {
      id: "ig_demo_01",
      caption: "Vittoria al cardiopalma al quinto set! Le nostre ragazze della Serie D espugnano il campo avversario con grinta e carattere. Grazie al pubblico fantastico accorso a sostenerci! 💛🖤 #NewVolleyAcademy #Pantere #SerieD #VolleyForli",
      media_url: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      permalink: "https://www.instagram.com/p/C-example1/",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      like_count: 142,
      comments_count: 18,
      visibile: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ig_demo_02",
      caption: "Concentrazione, passione e spirito di squadra. Pomeriggio di allenamento intenso per il settore giovanile al PalaNVA. Il futuro è qui! 🏐⚡️ #NVAfamily #VolleyLove #Minivolley #ForliVolley",
      media_url: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      permalink: "https://www.instagram.com/p/C-example2/",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
      like_count: 98,
      comments_count: 9,
      visibile: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ig_demo_03",
      caption: "Aperte le iscrizioni per i Summer Camp 2026! Una settimana di volley, tecnica individuale, tornei e tanto divertimento. Posti limitati, link in bio! ☀️🏐 #SummerCamp #Voltex #VolleySummer #NVA",
      media_url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      permalink: "https://www.instagram.com/p/C-example3/",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
      like_count: 185,
      comments_count: 24,
      visibile: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ig_demo_04",
      caption: "Momenti rubati dalla festa di inizio stagione. Essere una squadra significa lottare insieme su ogni pallone. Sempre forza Pantere! 🖤💛 #PantereForli #FIPAV #PallavoloRomagna",
      media_url: "https://images.unsplash.com/photo-1592656094267-764a45068526?w=800&auto=format&fit=crop&q=80",
      media_type: "IMAGE",
      permalink: "https://www.instagram.com/p/C-example4/",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      like_count: 210,
      comments_count: 31,
      visibile: true,
      createdAt: new Date().toISOString()
    }
  ];
}

export async function getInstagramPostsAll(includeHidden: boolean = false): Promise<InstagramPost[]> {
  const collectionName = "instagram_posts";
  
  if (isDemoMode) {
    const list = getLocalData<InstagramPost[]>(collectionName, getInstagramPostsDefault());
    return includeHidden ? list : list.filter(p => p.visibile !== false);
  }

  // Cache immediata per caricamento a 0ms
  try {
    const cached = localStorage.getItem(INSTAGRAM_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as InstagramPost[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Avvia il sync asincrono in background
        fetchAndCacheInstagramPosts(collectionName, includeHidden);
        return includeHidden ? parsed : parsed.filter(p => p.visibile !== false);
      }
    }
  } catch (e) {
    // ignore
  }

  return await fetchAndCacheInstagramPosts(collectionName, includeHidden);
}

async function fetchAndCacheInstagramPosts(collectionName: string, includeHidden: boolean): Promise<InstagramPost[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const defaults = getInstagramPostsDefault();
      localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const list: InstagramPost[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        ...data
      } as InstagramPost);
    });

    // Ordina per timestamp più recente
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.data_creazione || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.data_creazione || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(list));
    return includeHidden ? list : list.filter(p => p.visibile !== false);
  } catch (error) {
    console.warn("Errore getInstagramPostsAll da Firestore, uso fallback:", error);
    const defaults = getInstagramPostsDefault();
    return defaults;
  }
}

export async function saveInstagramPost(post: Partial<InstagramPost> & { id?: string }): Promise<InstagramPost> {
  const collectionName = "instagram_posts";
  const now = new Date().toISOString();
  const postId = post.id || `ig_${Date.now()}`;
  
  const cleanData: any = JSON.parse(JSON.stringify(post, (_key, val) => (val === undefined ? null : val)));
  delete cleanData.id;
  cleanData.visibile = post.visibile !== false;
  cleanData.updatedAt = now;
  if (!cleanData.createdAt) cleanData.createdAt = now;

  if (isDemoMode) {
    const list = getLocalData<InstagramPost[]>(collectionName, getInstagramPostsDefault());
    const idx = list.findIndex(p => p.id === postId);
    const updated: InstagramPost = { id: postId, ...cleanData };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    setLocalData(collectionName, list);
    localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(list));
    return updated;
  }

  try {
    const docRef = doc(db, collectionName, postId);
    await setDoc(docRef, cleanData, { merge: true });
    
    // Aggiorna cache locale
    try {
      const cached = localStorage.getItem(INSTAGRAM_CACHE_KEY);
      let list: InstagramPost[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex(p => p.id === postId);
      const updated: InstagramPost = { id: postId, ...cleanData };
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(list));
    } catch(e) {}

    return { id: postId, ...cleanData };
  } catch (error) {
    console.error("Errore saveInstagramPost:", error);
    throw error;
  }
}

export async function deleteInstagramPost(id: string): Promise<void> {
  const collectionName = "instagram_posts";
  
  if (isDemoMode) {
    const list = getLocalData<InstagramPost[]>(collectionName, []);
    const filtered = list.filter(p => p.id !== id);
    setLocalData(collectionName, filtered);
    localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(filtered));
    return;
  }

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    // Aggiorna cache locale
    try {
      const cached = localStorage.getItem(INSTAGRAM_CACHE_KEY);
      if (cached) {
        const list = (JSON.parse(cached) as InstagramPost[]).filter(p => p.id !== id);
        localStorage.setItem(INSTAGRAM_CACHE_KEY, JSON.stringify(list));
      }
    } catch(e) {}
  } catch (error) {
    console.error("Errore deleteInstagramPost:", error);
    throw error;
  }
}

export async function toggleVisibilityInstagramPost(id: string, visibile: boolean): Promise<void> {
  await saveInstagramPost({ id, visibile });
}

// =========================================================================
// PAGINA RICERCA SPONSOR & RICHIESTE PARTNERSHIP
// =========================================================================

export interface SponsorPageConfig {
  id?: string;
  titoloHero: string;
  sottotitoloHero: string;
  mantra: string;
  descrizioneIntro: string;
  brochurePdfUrl?: string;
  emailReferenteSponsor: string;
  telefonoReferenteSponsor: string;
  nomeReferenteSponsor: string;
  // Statistiche in evidenza
  numeroAtleti: string;
  numeroGruppi: string;
  numeroPartite: string;
  numeroStaff: string;
  numeroEventi: string;
  numeroFamiglie: string;
}

export const DEFAULT_SPONSOR_PAGE_CONFIG: SponsorPageConfig = {
  titoloHero: "PLAY WITH US",
  sottotitoloHero: "Unisciti alle Pantere. Fai crescere il tuo brand legandolo all'energia, ai valori e alla passione del volley a Forlì e in tutta la Romagna.",
  mantra: "Tutti devono poter giocare a pallavolo",
  descrizioneIntro: "New Volley Academy è molto più di una società sportiva: è una comunità che unisce eccellenza tecnica, inclusione sociale e grande visibilità. Dalla Serie D Regionale fino ai campioni del domani nel minivolley, offriamo alle aziende partner un palcoscenico dinamico, credibile e ad alto impatto umano.",
  emailReferenteSponsor: "sponsor@newvolleyacademy.it",
  telefonoReferenteSponsor: "+39 351 321 0332",
  nomeReferenteSponsor: "Segreteria & Relazioni Esterne NVA",
  brochurePdfUrl: "",
  numeroAtleti: "387+",
  numeroGruppi: "10+",
  numeroPartite: "280+",
  numeroStaff: "20+",
  numeroEventi: "10",
  numeroFamiglie: "500+"
};

export interface RichiestaSponsor {
  id: string;
  nomeAzienda: string;
  referente: string;
  telefono: string;
  email: string;
  categoriaInteresse: string;
  messaggio?: string;
  dataRichiesta: string;
  stato: 'nuovo' | 'contattato' | 'completato';
  noteInterne?: string;
}

const SPONSOR_CONFIG_CACHE_KEY = 'nva_sponsor_page_config_cache';
const RICHIESTE_SPONSOR_CACHE_KEY = 'nva_richieste_sponsor_cache';

export async function getSponsorPageConfig(): Promise<SponsorPageConfig> {
  const collectionName = 'configurazioni';
  const docId = 'sponsor_page';

  if (isDemoMode) {
    const local = getLocalData<SponsorPageConfig>(SPONSOR_CONFIG_CACHE_KEY, DEFAULT_SPONSOR_PAGE_CONFIG);
    return local;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<SponsorPageConfig>;
      const merged = { ...DEFAULT_SPONSOR_PAGE_CONFIG, ...data };
      setLocalData(SPONSOR_CONFIG_CACHE_KEY, merged);
      return merged;
    } else {
      return DEFAULT_SPONSOR_PAGE_CONFIG;
    }
  } catch (err) {
    console.warn("Errore getSponsorPageConfig, utilizzo fallback cache:", err);
    return getLocalData<SponsorPageConfig>(SPONSOR_CONFIG_CACHE_KEY, DEFAULT_SPONSOR_PAGE_CONFIG);
  }
}

export async function updateSponsorPageConfig(config: Partial<SponsorPageConfig>): Promise<void> {
  const collectionName = 'configurazioni';
  const docId = 'sponsor_page';

  const current = await getSponsorPageConfig();
  const merged: SponsorPageConfig = { ...current, ...config };

  setLocalData(SPONSOR_CONFIG_CACHE_KEY, merged);

  if (isDemoMode) return;

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, merged, { merge: true });
  } catch (err) {
    console.error("Errore updateSponsorPageConfig:", err);
    throw err;
  }
}

export async function inviaRichiestaSponsor(richiesta: Omit<RichiestaSponsor, 'id' | 'dataRichiesta' | 'stato'>): Promise<string> {
  const collectionName = 'richieste_sponsor';
  const nuovaRichiesta: RichiestaSponsor = {
    ...richiesta,
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dataRichiesta: new Date().toISOString(),
    stato: 'nuovo'
  };

  // Salva subito in cache locale
  const cached = getLocalData<RichiestaSponsor[]>(RICHIESTE_SPONSOR_CACHE_KEY, []);
  setLocalData(RICHIESTE_SPONSOR_CACHE_KEY, [nuovaRichiesta, ...cached]);

  if (isDemoMode) {
    return nuovaRichiesta.id;
  }

  try {
    const colRef = collection(db, collectionName);
    const docAdded = await addDoc(colRef, {
      ...nuovaRichiesta,
      createdAt: serverTimestamp ? serverTimestamp() : new Date()
    });
    return docAdded.id;
  } catch (err) {
    console.error("Errore inviaRichiestaSponsor:", err);
    // Anche se firestore fallisce o è offline, abbiamo salvato in locale
    return nuovaRichiesta.id;
  }
}

export async function getRichiesteSponsor(): Promise<RichiestaSponsor[]> {
  const collectionName = 'richieste_sponsor';
  if (isDemoMode) {
    return getLocalData<RichiestaSponsor[]>(RICHIESTE_SPONSOR_CACHE_KEY, []);
  }

  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, orderBy('dataRichiesta', 'desc'));
    const snapshot = await getDocs(q);
    const list: RichiestaSponsor[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        nomeAzienda: data.nomeAzienda || '',
        referente: data.referente || '',
        telefono: data.telefono || '',
        email: data.email || '',
        categoriaInteresse: data.categoriaInteresse || 'Generale',
        messaggio: data.messaggio || '',
        dataRichiesta: data.dataRichiesta || new Date().toISOString(),
        stato: data.stato || 'nuovo',
        noteInterne: data.noteInterne || ''
      });
    });

    setLocalData(RICHIESTE_SPONSOR_CACHE_KEY, list);
    return list;
  } catch (err) {
    console.warn("Errore getRichiesteSponsor, recupero da local cache:", err);
    return getLocalData<RichiestaSponsor[]>(RICHIESTE_SPONSOR_CACHE_KEY, []);
  }
}

export async function updateStatoRichiestaSponsor(id: string, stato: 'nuovo' | 'contattato' | 'completato', noteInterne?: string): Promise<void> {
  const collectionName = 'richieste_sponsor';

  // Aggiorna cache locale
  const cached = getLocalData<RichiestaSponsor[]>(RICHIESTE_SPONSOR_CACHE_KEY, []);
  const updated = cached.map(r => r.id === id ? { ...r, stato, ...(noteInterne !== undefined ? { noteInterne } : {}) } : r);
  setLocalData(RICHIESTE_SPONSOR_CACHE_KEY, updated);

  if (isDemoMode) return;

  try {
    const docRef = doc(db, collectionName, id);
    const updateData: any = { stato };
    if (noteInterne !== undefined) updateData.noteInterne = noteInterne;
    await updateDoc(docRef, updateData);
  } catch (err) {
    console.error("Errore updateStatoRichiestaSponsor:", err);
    throw err;
  }
}

export async function eliminaRichiestaSponsor(id: string): Promise<void> {
  const collectionName = 'richieste_sponsor';

  const cached = getLocalData<RichiestaSponsor[]>(RICHIESTE_SPONSOR_CACHE_KEY, []);
  setLocalData(RICHIESTE_SPONSOR_CACHE_KEY, cached.filter(r => r.id !== id));

  if (isDemoMode) return;

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Errore eliminaRichiestaSponsor:", err);
    throw err;
  }
}

