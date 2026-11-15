import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Play, 
  Save, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Tv, 
  Eye, 
  Clock, 
  Video, 
  RefreshCw,
  Share2,
  Calendar,
  MapPin,
  Shield,
  Download,
  Layers,
  Flame
} from 'lucide-react';
import { 
  DirettaStreaming, 
  CanaleDiretta,
  DEFAULT_DIRETTA_STREAMING, 
  getDirettaStreaming, 
  salvaDirettaStreaming, 
  extractYouTubeVideoId,
  getProssimaGara,
  ProssimaGara,
  RosaSquadra,
  OFFICIAL_NVA_LOGO,
  getKnownTeamLogo,
  cleanTeamDisplayName
} from '../../../firebase-societa';
import { downloadLocandinaMatch, LocandinaMatchData } from '../../../utils/locandinaGenerator';

interface TabDirettaStreamingProps {
  squadreAll?: RosaSquadra[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TabDirettaStreaming({ squadreAll = [], showToast }: TabDirettaStreamingProps) {
  const [diretta, setDiretta] = useState<DirettaStreaming>(DEFAULT_DIRETTA_STREAMING);
  const [garaMaschile, setGaraMaschile] = useState<ProssimaGara | null>(null);
  const [garaFemminile, setGaraFemminile] = useState<ProssimaGara | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCanale, setCopiedCanale] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [isGeneratingLocandina, setIsGeneratingLocandina] = useState(false);

  // Sezione principale attiva: 'seried' (Serie D Maschile & Femminile) o 'altre' (Altre Squadre & Giovanili)
  const [mainSection, setMainSection] = useState<'seried' | 'altre'>('seried');
  const [copiedTitleExtra, setCopiedTitleExtra] = useState(false);
  const [copiedDescriptionExtra, setCopiedDescriptionExtra] = useState(false);
  const [copiedExtraUrl, setCopiedExtraUrl] = useState(false);

  // Tab per canale selezionato in modalità doppia diretta ('canale_1' o 'canale_2')
  const [activeChannelKey, setActiveChannelKey] = useState<'canale_1' | 'canale_2'>('canale_1');

  useEffect(() => {
    Promise.all([
      getDirettaStreaming(),
      getProssimaGara("Serie D Maschile"),
      getProssimaGara("Serie D Femminile")
    ]).then(([d, gm, gf]) => {
      // Inizializza i canali se assenti
      const initialized: DirettaStreaming = {
        ...d,
        canale_1: d.canale_1 || {
          id: 'maschile',
          titolo_canale: 'Serie D Maschile',
          attiva: d.attiva,
          stato: d.stato,
          url_youtube: d.url_youtube,
          url_video_presentazione: d.url_video_presentazione || '',
          titolo: d.titolo,
          sottotitolo: d.sottotitolo || '',
          data_ora: d.data_ora || '',
          luogo: d.luogo || '',
          squadra_casa: d.squadra_casa || '',
          squadra_ospite: d.squadra_ospite || '',
          logo_casa: d.logo_casa || '',
          logo_ospite: d.logo_ospite || '',
          categoria: d.categoria || 'Serie D Maschile',
          mostra_chat: d.mostra_chat || false,
          descrizione: d.descrizione || '',
          locandina_url: '/images/locandina_serie_d_maschile.jpg'
        },
        canale_2: d.canale_2 || {
          id: 'femminile',
          titolo_canale: 'Serie D Femminile',
          attiva: false,
          stato: 'terminata',
          url_youtube: '',
          url_video_presentazione: '',
          titolo: 'Serie D Femminile: New Volley Academy vs CONSAR TEODORA',
          sottotitolo: '4ª Giornata di Campionato Regionale FIPAV - Girone C',
          squadra_casa: 'New Volley Academy',
          squadra_ospite: 'CONSAR TEODORA',
          logo_casa: OFFICIAL_NVA_LOGO,
          logo_ospite: '/images/teams/teodora-ravenna.png',
          categoria: 'Serie D Femminile',
          luogo: 'Centro Polisportivo Giulianini — Via XIII Novembre 129, Villafranca di Forlì',
          data_ora: '06/11/26 21:15',
          mostra_chat: false,
          descrizione: 'Guarda la partita di Serie D Femminile in diretta streaming!',
          locandina_url: '/images/locandina_serie_d_femminile.jpg'
        },
        canale_extra: d.canale_extra || {
          id: 'altre_squadre',
          titolo_canale: 'Altre Squadre & Giovanili',
          attiva: false,
          stato: 'in_programma',
          url_youtube: '',
          url_video_presentazione: '',
          titolo: 'Match Day: New Volley Academy',
          sottotitolo: 'Campionato Volley',
          squadra_casa: 'New Volley Academy',
          squadra_ospite: 'Squadra Avversaria',
          logo_casa: OFFICIAL_NVA_LOGO,
          logo_ospite: '',
          categoria: 'Under 16 Femminile',
          luogo: '',
          data_ora: '',
          mostra_chat: false,
          descrizione: 'Guarda la partita in diretta streaming!',
          locandina_url: '/images/locandina-bg-clean.jpg',
          squadra_id: '',
          avversario_tipo: 'campionato'
        }
      };
      setDiretta(initialized);
      setGaraMaschile(gm);
      setGaraFemminile(gf);
    }).catch(err => {
      console.warn("Errore caricamento dati diretta:", err);
    }).finally(() => setIsLoading(false));
  }, []);

  const isDoppia = Boolean(diretta.doppia_diretta);

  // Canali correnti con fallback sicuri
  const c1: CanaleDiretta = diretta.canale_1 || {
    id: 'maschile',
    titolo_canale: 'Serie D Maschile',
    attiva: diretta.attiva,
    stato: diretta.stato,
    url_youtube: diretta.url_youtube,
    url_video_presentazione: diretta.url_video_presentazione || '',
    titolo: diretta.titolo,
    sottotitolo: diretta.sottotitolo || '',
    data_ora: diretta.data_ora || '',
    luogo: diretta.luogo || '',
    squadra_casa: diretta.squadra_casa || '',
    squadra_ospite: diretta.squadra_ospite || '',
    logo_casa: diretta.logo_casa || '',
    logo_ospite: diretta.logo_ospite || '',
    categoria: diretta.categoria || 'Serie D Maschile',
    mostra_chat: diretta.mostra_chat || false,
    descrizione: diretta.descrizione || '',
    locandina_url: '/images/locandina_serie_d_maschile.jpg'
  };

  const c2: CanaleDiretta = diretta.canale_2 || {
    id: 'femminile',
    titolo_canale: 'Serie D Femminile',
    attiva: false,
    stato: 'terminata',
    url_youtube: '',
    url_video_presentazione: '',
    titolo: 'Serie D Femminile: New Volley Academy vs CONSAR TEODORA',
    sottotitolo: '4ª Giornata di Campionato Regionale FIPAV - Girone C',
    squadra_casa: 'New Volley Academy',
    squadra_ospite: 'CONSAR TEODORA',
    logo_casa: OFFICIAL_NVA_LOGO,
    logo_ospite: '/images/teams/teodora-ravenna.png',
    categoria: 'Serie D Femminile',
    luogo: 'Centro Polisportivo Giulianini — Via XIII Novembre 129, Villafranca di Forlì',
    data_ora: '06/11/26 21:15',
    mostra_chat: false,
    descrizione: 'Guarda la partita di Serie D Femminile in diretta streaming!',
    locandina_url: '/images/locandina_serie_d_femminile.jpg'
  };

  // Riferimento al canale correntemente visualizzato/modificato
  const currentCanale: CanaleDiretta = isDoppia ? (activeChannelKey === 'canale_2' ? c2 : c1) : {
    id: 'singolo',
    titolo_canale: diretta.categoria || 'Partita Live',
    attiva: diretta.attiva,
    stato: diretta.stato,
    url_youtube: diretta.url_youtube,
    url_video_presentazione: diretta.url_video_presentazione || '',
    titolo: diretta.titolo,
    sottotitolo: diretta.sottotitolo || '',
    data_ora: diretta.data_ora || '',
    luogo: diretta.luogo || '',
    squadra_casa: diretta.squadra_casa || '',
    squadra_ospite: diretta.squadra_ospite || '',
    logo_casa: diretta.logo_casa || '',
    logo_ospite: diretta.logo_ospite || '',
    categoria: diretta.categoria || '',
    mostra_chat: diretta.mostra_chat || false,
    descrizione: diretta.descrizione || '',
    locandina_url: diretta.locandina_url || (diretta.categoria?.toLowerCase().includes('femm') ? '/images/locandina_serie_d_femminile.jpg' : '/images/locandina_serie_d_maschile.jpg')
  };

  const updateCurrentCanale = (patch: Partial<CanaleDiretta>) => {
    if (!isDoppia) {
      setDiretta(prev => ({ ...prev, ...patch }));
    } else {
      if (activeChannelKey === 'canale_1') {
        const updatedC1 = { ...c1, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_1: updatedC1,
          url_youtube: updatedC1.url_youtube || prev.url_youtube,
          titolo: updatedC1.titolo || prev.titolo,
          categoria: updatedC1.categoria || prev.categoria,
          attiva: Boolean(updatedC1.attiva || c2.attiva),
          stato: (updatedC1.stato === 'live' || c2.stato === 'live') ? 'live' : (updatedC1.stato === 'in_programma' || c2.stato === 'in_programma') ? 'in_programma' : 'terminata'
        }));
      } else {
        const updatedC2 = { ...c2, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_2: updatedC2,
          attiva: Boolean(c1.attiva || updatedC2.attiva),
          stato: (c1.stato === 'live' || updatedC2.stato === 'live') ? 'live' : (c1.stato === 'in_programma' || updatedC2.stato === 'in_programma') ? 'in_programma' : 'terminata'
        }));
      }
    }
  };

  const cExtra: CanaleDiretta = diretta.canale_extra || {
    id: 'altre_squadre',
    titolo_canale: 'Altre Squadre & Giovanili',
    attiva: false,
    stato: 'in_programma',
    url_youtube: '',
    url_video_presentazione: '',
    titolo: 'Match Day: New Volley Academy',
    sottotitolo: 'Campionato Volley',
    squadra_casa: 'New Volley Academy',
    squadra_ospite: 'Squadra Avversaria',
    logo_casa: OFFICIAL_NVA_LOGO,
    logo_ospite: '',
    categoria: 'Under 16 Femminile',
    luogo: '',
    data_ora: '',
    mostra_chat: false,
    descrizione: '',
    locandina_url: '/images/locandina-bg-clean.jpg',
    squadra_id: '',
    avversario_tipo: 'campionato'
  };

  const updateCanaleExtra = (patch: Partial<CanaleDiretta>) => {
    setDiretta(prev => ({
      ...prev,
      canale_extra: {
        ...(prev.canale_extra || cExtra),
        ...patch
      }
    }));
  };

  // Squadre disponibili per la tendina (giovanili, CSI, 1a divisione, etc.)
  const altreSquadreList = useMemo(() => {
    const list = (squadreAll || []).filter(s => {
      const name = (s.nome_squadra || '').toLowerCase();
      return !name.includes('serie d');
    });
    return list.length > 0 ? list : (squadreAll || []);
  }, [squadreAll]);

  // Squadra attualmente selezionata nell'area neutra
  const selectedExtraSquadra = useMemo(() => {
    if (!cExtra.squadra_id) return altreSquadreList[0] || null;
    return (squadreAll || []).find(s => s.id === cExtra.squadra_id) || altreSquadreList[0] || null;
  }, [squadreAll, cExtra.squadra_id, altreSquadreList]);

  // Squadre avversarie ricavate dalla classifica e dalle partite del girone
  const availableOpponentsExtra = useMemo(() => {
    if (!selectedExtraSquadra) return [];
    const fromClass = (selectedExtraSquadra.classifica || [])
      .map(r => cleanTeamDisplayName(r.squadra))
      .filter(name => name && !name.toLowerCase().includes('new volley') && !name.toLowerCase().includes('nva') && !name.toLowerCase().includes('salfep'));

    const fromPartite = (selectedExtraSquadra.partite || [])
      .map(p => cleanTeamDisplayName(p.avversario))
      .filter(name => name && !name.toLowerCase().includes('new volley') && !name.toLowerCase().includes('nva') && !name.toLowerCase().includes('salfep'));

    return Array.from(new Set([...fromClass, ...fromPartite])).sort();
  }, [selectedExtraSquadra]);

  const isNvaCasaExtra = useMemo(() => {
    return (cExtra.squadra_casa || '').toLowerCase().includes('new volley') || (cExtra.squadra_casa || '').toLowerCase().includes('academy');
  }, [cExtra.squadra_casa]);

  const extraVideoId = extractYouTubeVideoId(cExtra.url_youtube);

  // Titolo e Descrizione YouTube per Altre Squadre (sintetica, senza location)
  const youtubeTitleExtra = `🔴 LIVE: ${cExtra.categoria || 'Match Day'} | ${cExtra.squadra_casa || 'New Volley Academy'} vs ${cExtra.squadra_ospite || 'Avversario'}`;

  const youtubeDescriptionExtra = `🔴 DIRETTA STREAMING MATCH DAY
🏐 Campionato: ${cExtra.categoria || 'Volley'}
⚔️ ${cExtra.squadra_casa || 'New Volley Academy'} vs ${cExtra.squadra_ospite || 'Avversario'}
${cExtra.data_ora ? `📅 Data & Ora: ${cExtra.data_ora}\n` : ''}
Sostieni le nostre pantere in campo! Iscriviti al canale YouTube e attiva le notifiche 🔔

👉 Portale Ufficiale: https://www.newvolleyacademy.it`;

  const handleCopyTitleExtra = () => {
    navigator.clipboard.writeText(youtubeTitleExtra).then(() => {
      setCopiedTitleExtra(true);
      showToast("Titolo YouTube copiato negli appunti!", "success");
      setTimeout(() => setCopiedTitleExtra(false), 2000);
    }).catch(() => {});
  };

  const handleCopyDescriptionExtra = () => {
    navigator.clipboard.writeText(youtubeDescriptionExtra).then(() => {
      setCopiedDescriptionExtra(true);
      showToast("Descrizione rapida (senza location) copiata negli appunti!", "success");
      setTimeout(() => setCopiedDescriptionExtra(false), 2000);
    }).catch(() => {});
  };

  const handleCopyPublicUrlExtra = () => {
    const url = `${window.location.origin}/diretta?canale=extra`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedExtraUrl(true);
      showToast("Link diretta altra squadra copiato negli appunti!", "info");
      setTimeout(() => setCopiedExtraUrl(false), 2500);
    }).catch(() => {});
  };

  const handleDownloadLocandinaExtra = async () => {
    setIsGeneratingLocandina(true);
    try {
      const isCasaNva = isNvaCasaExtra;
      const logoCasa = isCasaNva 
        ? (cExtra.logo_casa || OFFICIAL_NVA_LOGO) 
        : (cExtra.logo_casa || getKnownTeamLogo(cExtra.squadra_casa) || '');
      const logoOspite = !isCasaNva 
        ? (cExtra.logo_ospite || OFFICIAL_NVA_LOGO) 
        : (cExtra.logo_ospite || getKnownTeamLogo(cExtra.squadra_ospite) || '');

      const matchData: LocandinaMatchData = {
        categoria: cExtra.categoria || 'Campionato Volley',
        giornata: cExtra.sottotitolo ? cExtra.sottotitolo.split('•')[0].trim() : '',
        squadraCasa: cExtra.squadra_casa || (isCasaNva ? 'New Volley Academy' : 'Avversario'),
        squadraOspite: cExtra.squadra_ospite || (!isCasaNva ? 'New Volley Academy' : 'Avversario'),
        logoCasa,
        logoOspite,
        dataOra: cExtra.data_ora || 'Inizio Gara',
        luogo: '' // Nessuna location come richiesto
      };
      await downloadLocandinaMatch(matchData);
      showToast("Locandina Match (16:9 HD) scaricata con successo!", "success");
    } catch (err: any) {
      console.error("Errore generazione locandina:", err);
      showToast("Errore durante la generazione della locandina: " + (err.message || ''), "error");
    } finally {
      setIsGeneratingLocandina(false);
    }
  };

  const videoId = extractYouTubeVideoId(currentCanale.url_youtube);
  const teaserVideoId = extractYouTubeVideoId(currentCanale.url_video_presentazione);

  const handleImportMatchData = (gara: ProssimaGara) => {
    const isCasa = gara.casa ?? true;
    const isMaschile = gara.categoria === 'Serie D Maschile';
    const titoloDefault = `${gara.categoria}: ${isCasa ? 'New Volley Academy vs ' + gara.avversario : gara.avversario + ' vs New Volley Academy'}`;
    const sottotitoloDefault = `${gara.giornata || 'Campionato FIPAV'} • ${isCasa ? 'In Casa al Palazzetto' : 'In Trasferta'}`;
    
    const myLogo = OFFICIAL_NVA_LOGO;
    const oppLogo = gara.logo_avversario || getKnownTeamLogo(gara.avversario) || '';

    const patch: Partial<CanaleDiretta> = {
      titolo: titoloDefault,
      categoria: gara.categoria,
      squadra_casa: isCasa ? 'New Volley Academy' : gara.avversario,
      squadra_ospite: isCasa ? gara.avversario : 'New Volley Academy',
      logo_casa: isCasa ? myLogo : oppLogo,
      logo_ospite: isCasa ? oppLogo : myLogo,
      data_ora: gara.data_ora || '',
      luogo: gara.luogo || '',
      sottotitolo: sottotitoloDefault,
      attiva: true,
      stato: 'in_programma',
      locandina_url: isMaschile ? '/images/locandina_serie_d_maschile.jpg' : '/images/locandina_serie_d_femminile.jpg'
    };

    if (isDoppia) {
      if (isMaschile) {
        setActiveChannelKey('canale_1');
        const updatedC1 = { ...c1, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_1: updatedC1,
          url_youtube: updatedC1.url_youtube || prev.url_youtube,
          titolo: updatedC1.titolo || prev.titolo,
          attiva: true
        }));
      } else {
        setActiveChannelKey('canale_2');
        const updatedC2 = { ...c2, ...patch };
        setDiretta(prev => ({
          ...prev,
          canale_2: updatedC2,
          attiva: true
        }));
      }
    } else {
      setDiretta(prev => ({
        ...prev,
        ...patch,
        attiva: true
      }));
    }
    showToast(`Dati e loghi di ${gara.categoria} caricati! Clicca "Salva" per confermare.`, "success");
  };

  const handleToggleAttiva = async (newAttiva: boolean) => {
    let updated: DirettaStreaming;
    if (isDoppia) {
      if (activeChannelKey === 'canale_1') {
        const updatedC1 = { ...c1, attiva: newAttiva };
        updated = {
          ...diretta,
          canale_1: updatedC1,
          attiva: Boolean(newAttiva || c2.attiva)
        };
      } else {
        const updatedC2 = { ...c2, attiva: newAttiva };
        updated = {
          ...diretta,
          canale_2: updatedC2,
          attiva: Boolean(c1.attiva || newAttiva)
        };
      }
    } else {
      updated = { ...diretta, attiva: newAttiva };
    }
    setDiretta(updated);
    try {
      await salvaDirettaStreaming(updated);
      showToast(
        newAttiva 
          ? "✅ Canale streaming ATTIVATO sul sito!" 
          : "⏸️ Canale streaming DISATTIVATO.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio: " + (err.message || ''), "error");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const isSerieDAttiva = isDoppia ? Boolean(c1.attiva || c2.attiva) : Boolean(diretta.attiva);
      const isExtraAttiva = Boolean(cExtra.attiva);
      const isAnyAttiva = isSerieDAttiva || isExtraAttiva;

      const payload: DirettaStreaming = {
        ...diretta,
        canale_1: c1,
        canale_2: c2,
        canale_extra: cExtra,
        attiva: isAnyAttiva,
        stato: (c1.stato === 'live' || c2.stato === 'live' || cExtra.stato === 'live')
          ? 'live' 
          : ((c1.stato === 'in_programma' || c2.stato === 'in_programma' || cExtra.stato === 'in_programma') ? 'in_programma' : 'terminata'),
        url_youtube: isDoppia 
          ? (c1.url_youtube || c2.url_youtube || diretta.url_youtube) 
          : (diretta.url_youtube || cExtra.url_youtube),
        titolo: isDoppia 
          ? (c1.titolo || diretta.titolo) 
          : (diretta.titolo || cExtra.titolo)
      };
      await salvaDirettaStreaming(payload);
      showToast(
        payload.attiva 
          ? "Configurazione salvata: la diretta è ATTIVA sul sito!" 
          : "Configurazione salvata: la diretta è DISATTIVA (nessun banner visibile).", 
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast("Errore durante il salvataggio della diretta: " + (err.message || ''), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPublicUrl = (channelParam?: string) => {
    const url = channelParam 
      ? `${window.location.origin}/diretta?canale=${channelParam}`
      : `${window.location.origin}/diretta`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setCopiedCanale(channelParam || 'all');
      setTimeout(() => {
        setCopied(false);
        setCopiedCanale(null);
      }, 2500);
      showToast(`Link ${channelParam ? `canale ${channelParam}` : 'diretta'} copiato negli appunti!`, "info");
    }).catch(() => {});
  };

  const channelParam = isDoppia ? (activeChannelKey === 'canale_1' ? 'maschile' : 'femminile') : '';
  const publicLiveUrl = channelParam 
    ? `https://newvolleyacademy.it/diretta?canale=${channelParam}`
    : `https://newvolleyacademy.it/diretta`;

  const youtubeTitle = `🔴 LIVE | ${currentCanale.categoria || 'Match Day'}: ${currentCanale.squadra_casa || 'New Volley Academy'} vs ${currentCanale.squadra_ospite || 'Avversario'}${currentCanale.sottotitolo ? ` (${currentCanale.sottotitolo.split('•')[0].trim()})` : ''}`;

  const youtubeDescription = `🏐 DIRETTA STREAMING UFFICIALE • NEW VOLLEY ACADEMY FORLÌ
🏆 ${currentCanale.categoria || 'Campionato FIPAV'} ${currentCanale.sottotitolo ? `• ${currentCanale.sottotitolo}` : ''}
⚔️ ${currentCanale.squadra_casa || 'New Volley Academy'} vs ${currentCanale.squadra_ospite || 'Avversario'}
📅 Data e Ora: ${currentCanale.data_ora || 'Ore 21:15'}
📍 Impianto: ${currentCanale.luogo || 'Palasport Comunale'}

▶ Segui la diretta e il livescore anche sul nostro portale ufficiale:
👉 ${publicLiveUrl}

💛🖤 SOSTIENI LE PANTERE! Iscriviti al canale e attiva la campanella per non perdere nessun match!
#NVA #NewVolleyAcademy #Pallavolo #VolleyForli #FIPAV #LiveMatch`;

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(youtubeTitle).then(() => {
      setCopiedTitle(true);
      showToast("Titolo YouTube copiato negli appunti!", "success");
      setTimeout(() => setCopiedTitle(false), 2000);
    }).catch(() => {});
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(youtubeDescription).then(() => {
      setCopiedDescription(true);
      showToast("Descrizione YouTube copiata negli appunti!", "success");
      setTimeout(() => setCopiedDescription(false), 2000);
    }).catch(() => {});
  };

  const handleDownloadLocandina = async () => {
    setIsGeneratingLocandina(true);
    try {
      const matchData: LocandinaMatchData = {
        categoria: currentCanale.categoria || 'Serie D Maschile',
        giornata: currentCanale.sottotitolo ? currentCanale.sottotitolo.split('•')[0].trim() : '',
        squadraCasa: currentCanale.squadra_casa || 'New Volley Academy',
        squadraOspite: currentCanale.squadra_ospite || 'Avversario',
        logoCasa: currentCanale.logo_casa || OFFICIAL_NVA_LOGO,
        logoOspite: currentCanale.logo_ospite || '',
        dataOra: currentCanale.data_ora || 'Ore 21:15',
        luogo: currentCanale.luogo || 'Palasport Comunale'
      };
      await downloadLocandinaMatch(matchData);
      showToast("Locandina Match (16:9 HD) scaricata con successo!", "success");
    } catch (err: any) {
      console.error("Errore generazione locandina:", err);
      showToast("Errore durante la generazione della locandina: " + (err.message || ''), "error");
    } finally {
      setIsGeneratingLocandina(false);
    }
  };

  return (
    <div className="space-y-6 text-xs max-w-5xl mx-auto pb-12 animate-fade-in" id="admin-tab-diretta">
      
      {/* 0. SELETTORE AREA: SERIE D vs ALTRE SQUADRE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setMainSection('seried')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg font-sport font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainSection === 'seried'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🦁</span>
            <span>Serie D Maschile & Femminile</span>
            {(c1.attiva || c2.attiva || diretta.attiva) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainSection('altre')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg font-sport font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainSection === 'altre'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏐</span>
            <span>Altre Squadre & Giovanili (Area Neutra)</span>
            {cExtra.attiva && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-inter px-3 hidden lg:block">
          {mainSection === 'seried'
            ? 'Gestione canali principali Serie D'
            : 'Sezione neutra per Under, CSI, 1ª Divisione'}
        </div>
      </div>

      {mainSection === 'seried' && (
        <div className="space-y-6">
      
      {/* 1. HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              diretta.attiva 
                ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Radio className={`w-6 h-6 ${diretta.attiva && diretta.stato === 'live' ? 'animate-pulse text-red-500' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-sport italic">
                  Diretta Streaming Match
                </h3>
                {diretta.attiva ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 font-mono animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    ONLINE SUL SITO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    DISATTIVA
                  </span>
                )}
              </div>
              <p className="font-inter text-xs text-slate-400 mt-0.5">
                Trasmetti la partita sul portale ufficiale per dare visibilità agli sponsor e raccogliere visite.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPublicUrl}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copiato!' : 'Copia Link /diretta'}</span>
            </button>
            <a
              href="/diretta"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Vedi Pagina Live</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 1.5 IMPORTA DATI DALLA PROSSIMA PARTITA (1-CLICK SYNC) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-900/5 border border-amber-300/40 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-sport font-black uppercase text-sm tracking-wider text-slate-900">
              ⚡ Carica Dati Istantaneamente dalle Prossime Gare FIPAV
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Compila titolo, avversario, palazzetto e orario con 1 solo clic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {garaMaschile && (
            <button
              type="button"
              onClick={() => handleImportMatchData(garaMaschile)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs font-sport uppercase tracking-wider text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🏐 Serie D Maschile
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {garaMaschile.data_ora || 'Prossima Gara'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                vs {garaMaschile.avversario}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{garaMaschile.luogo}</span>
              </div>
            </button>
          )}

          {garaFemminile && (
            <button
              type="button"
              onClick={() => handleImportMatchData(garaFemminile)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs font-sport uppercase tracking-wider text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🏐 Serie D Femminile
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                  {garaFemminile.data_ora || 'Prossima Gara'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                vs {garaFemminile.avversario}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{garaFemminile.luogo}</span>
              </div>
            </button>
          )}
        </div>
      </div>

            {/* 1.8 SELETTORE MODALITÀ DIRETTA (SINGOLA VS DOPPIA SIMULTANEA) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-sport font-black uppercase text-sm tracking-wider text-white">
              Modalità Diretta Streaming
            </h4>
            <p className="text-[11px] text-slate-400 font-inter">
              Scegli se gestire un singolo canale o due dirette simultanee con schede e link indipendenti.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setDiretta(prev => ({ ...prev, doppia_diretta: false }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all cursor-pointer ${
              !isDoppia 
                ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📺 Singola Diretta
          </button>
          <button
            type="button"
            onClick={() => setDiretta(prev => ({ ...prev, doppia_diretta: true }))}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-sport uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              isDoppia 
                ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>⚡ Doppia Diretta</span>
          </button>
        </div>
      </div>

      {/* SCHEDE CANALI SEPARATI (QUANDO DOPPIA DIRETTA È ATTIVA) */}
      {isDoppia && (
        <div className="space-y-3 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Due Canali Indipendenti (Due Telefoni / Due Link Dedicati)
            </span>
            <span className="text-[10px] text-slate-400 font-inter hidden sm:inline">
              Fai clic sulla scheda per regolare il link YouTube e i dettagli del rispettivo match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CANALE 1 (MASCHILE) */}
            <button
              type="button"
              onClick={() => setActiveChannelKey('canale_1')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeChannelKey === 'canale_1'
                  ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-lg'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-sport font-black uppercase text-xs tracking-wider flex items-center gap-1.5 ${
                  activeChannelKey === 'canale_1' ? 'text-amber-400' : 'text-slate-900'
                }`}>
                  🏐 Canale 1: {c1.titolo_canale || 'Serie D Maschile'}
                </span>
                {c1.attiva ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ONLINE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    OFF
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold truncate ${activeChannelKey === 'canale_1' ? 'text-slate-200' : 'text-slate-700'}`}>
                {c1.titolo || 'Serie D Maschile'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                <span className="truncate">{c1.data_ora || 'Ore 21:30'}</span>
                <span className="font-mono text-amber-400 font-bold">/diretta?canale=maschile</span>
              </div>
            </button>

            {/* CANALE 2 (FEMMINILE) */}
            <button
              type="button"
              onClick={() => setActiveChannelKey('canale_2')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeChannelKey === 'canale_2'
                  ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 text-white shadow-lg'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-sport font-black uppercase text-xs tracking-wider flex items-center gap-1.5 ${
                  activeChannelKey === 'canale_2' ? 'text-amber-400' : 'text-slate-900'
                }`}>
                  🏐 Canale 2: {c2.titolo_canale || 'Serie D Femminile'}
                </span>
                {c2.attiva ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ONLINE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    OFF
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold truncate ${activeChannelKey === 'canale_2' ? 'text-slate-200' : 'text-slate-700'}`}>
                {c2.titolo || 'Serie D Femminile'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                <span className="truncate">{c2.data_ora || 'Ore 21:15'}</span>
                <span className="font-mono text-amber-400 font-bold">/diretta?canale=femminile</span>
              </div>
            </button>
          </div>

          {/* BANNER LINK DIRETTO DEL CANALE ATTIVO */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">
                Link Condivisione {activeChannelKey === 'canale_1' ? 'Serie D Maschile' : 'Serie D Femminile'}:
              </span>
              <code className="text-amber-400 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                https://newvolleyacademy.it/diretta?canale={activeChannelKey === 'canale_1' ? 'maschile' : 'femminile'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyPublicUrl(activeChannelKey === 'canale_1' ? 'maschile' : 'femminile')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedCanale === (activeChannelKey === 'canale_1' ? 'maschile' : 'femminile') ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>Copia Link Canale</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. KIT RAPIDO YOUTUBE STUDIO (COPIA TITOLO, DESCRIZIONE & SCARICA LOCANDINA 16:9 HD) */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-7 rounded-3xl text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-sport font-black uppercase text-base tracking-wider text-white flex flex-wrap items-center gap-2">
                <span>🎬 Kit Rapido YouTube Studio</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {currentCanale.titolo_canale || currentCanale.categoria || 'Match Day'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 font-inter mt-0.5">
                Tutto pronto da copiare e caricare su YouTube Studio in 1 secondo per la live di oggi.
              </p>
            </div>
          </div>

          <a
            href="https://studio.youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Apri YouTube Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TITOLO YOUTUBE */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  1. Titolo dello Stream
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">Obbligatorio YouTube</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 select-all line-clamp-3">
                {youtubeTitle}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyTitle}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copiedTitle
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
            >
              {copiedTitle ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedTitle ? 'Titolo Copiato!' : 'Copia Titolo YouTube'}</span>
            </button>
          </div>

          {/* DESCRIZIONE YOUTUBE */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  2. Descrizione dello Stream
                </span>
                <span className="text-[10px] font-mono text-slate-400">Con link live & hashtag</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 h-24 overflow-y-auto whitespace-pre-line leading-relaxed">
                {youtubeDescription}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyDescription}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copiedDescription
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
            >
              {copiedDescription ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDescription ? 'Descrizione Copiata!' : 'Copia Descrizione YouTube'}</span>
            </button>
          </div>
        </div>

        {/* LOCANDINA / MINIATURA 16:9 HD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sport font-black uppercase text-sm tracking-wider text-white">
                  3. Miniatura / Locandina Match (16:9 Full HD)
                </span>
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                  1920 × 1080
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-inter mt-0.5">
                Generata all'istante con Pantera NVA, loghi ufficiali ({currentCanale.squadra_casa} vs {currentCanale.squadra_ospite}), data e palazzetto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadLocandina}
            disabled={isGeneratingLocandina}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black font-sport italic uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isGeneratingLocandina ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Generazione in corso...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>Scarica Locandina Match HD (16:9)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. FORM CONFIGURAZIONE */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTROLLI PRINCIPALI */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-slate-900 uppercase font-sport tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-500" />
                <span>
                  {isDoppia 
                    ? `Regolazione: ${activeChannelKey === 'canale_1' ? '🏐 Canale 1 (Serie D Maschile)' : '🏐 Canale 2 (Serie D Femminile)'}`
                    : 'Parametri Trasmissione YouTube'}
                </span>
              </h4>
              {isDoppia && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Scheda Indipendente {activeChannelKey === 'canale_1' ? '#1' : '#2'}
                </span>
              )}
            </div>

            {/* SWITCH ATTIVAZIONE CANALE */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {isDoppia 
                    ? `Attiva questo canale (${activeChannelKey === 'canale_1' ? 'Maschile' : 'Femminile'}) sul Sito` 
                    : 'Attiva Diretta Streaming sul Sito'}
                </span>
                <p className="text-[11px] text-slate-500 font-inter">
                  Se attivo, la diretta risulterà visibile sul sito e nella pagina <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/diretta</code>.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={Boolean(currentCanale.attiva)}
                  onChange={e => handleToggleAttiva(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {/* STATO DELLA DIRETTA */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 mb-2">
                Stato Trasmissione {isDoppia ? (activeChannelKey === 'canale_1' ? 'Canale 1' : 'Canale 2') : ''}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'live', attiva: true });
                    showToast("🔴 Canale impostato su 'IN DIRETTA ORA'!", "success");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'live' && currentCanale.attiva
                      ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentCanale.stato === 'live' && currentCanale.attiva ? 'bg-white animate-ping' : 'bg-red-500'}`} />
                  <span>🔴 In Diretta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'in_programma', attiva: true });
                    showToast("⏰ Canale impostato su 'IN PROGRAMMA'!", "success");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'in_programma' && currentCanale.attiva
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>⏰ In Programma</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentCanale({ stato: 'terminata', attiva: false });
                    showToast("⏹️ Canale impostato su 'CONCLUSA'.", "info");
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    currentCanale.stato === 'terminata' || !currentCanale.attiva
                      ? 'bg-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>⏹️ Conclusa</span>
                </button>
              </div>
            </div>

            {/* URL YOUTUBE */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700">
                Link YouTube della Diretta / Video {isDoppia ? `(${activeChannelKey === 'canale_1' ? 'Telefono Maschile' : 'Telefono Femminile'})` : ''}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentCanale.url_youtube || ''}
                  onChange={e => updateCurrentCanale({ url_youtube: e.target.value })}
                  placeholder="Incolla il link YouTube della diretta per questa partita..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {videoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Accetta qualsiasi formato di link YouTube (link da app cellulare `youtu.be`, `youtube.com/watch?v=...`, `youtube.com/live/...`).
                {videoId && (
                  <span className="text-emerald-700 font-bold ml-1 font-mono">
                    ✓ ID Video riconosciuto: {videoId}
                  </span>
                )}
              </p>
            </div>

            {/* VIDEO PRESENTAZIONE / TEASER ATTESA */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-mono font-bold uppercase text-slate-700 flex items-center justify-between">
                <span>Video Teaser / Presentazione Societaria (Opzionale nell'attesa)</span>
                <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Consigliato</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentCanale.url_video_presentazione || ''}
                  onChange={e => updateCurrentCanale({ url_video_presentazione: e.target.value })}
                  placeholder="Es. https://www.youtube.com/watch?v=... video promo, presentazione o trailer"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono transition-colors outline-none pr-10"
                />
                {teaserVideoId && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-inter">
                Se inserito, gli utenti prima dell'inizio potranno riprodurre questo video mentre vedono il conto alla rovescia e gli sponsor!
              </p>
            </div>

            {/* DETTAGLI PARTITA */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <h5 className="text-xs font-bold text-slate-900 uppercase font-sport tracking-wider text-slate-500">
                Informazioni del Match
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Titolo Partita / Evento
                  </label>
                  <input
                    type="text"
                    value={currentCanale.titolo || ''}
                    onChange={e => updateCurrentCanale({ titolo: e.target.value })}
                    placeholder="Es. Serie D: NVA vs Avversario"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Categoria Squadra
                  </label>
                  <input
                    type="text"
                    value={currentCanale.categoria || ''}
                    onChange={e => updateCurrentCanale({ categoria: e.target.value })}
                    placeholder="Es. Serie D Maschile - Girone B"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Data e Orario
                  </label>
                  <input
                    type="text"
                    value={currentCanale.data_ora || ''}
                    onChange={e => updateCurrentCanale({ data_ora: e.target.value })}
                    placeholder="Es. Venerdì 6 Novembre • Ore 21:30"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Luogo / Palazzetto
                  </label>
                  <input
                    type="text"
                    value={currentCanale.luogo || ''}
                    onChange={e => updateCurrentCanale({ luogo: e.target.value })}
                    placeholder="Es. Palazzetto Villaggio del Fanciullo, Bologna"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">
                  Sottotitolo / Dettagli Aggiuntivi (Opzionale)
                </label>
                <input
                  type="text"
                  value={currentCanale.sottotitolo || ''}
                  onChange={e => updateCurrentCanale({ sottotitolo: e.target.value })}
                  placeholder="Es. 4ª Giornata di Campionato Regionale • Ingresso Libero"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-inter"
                />
              </div>

              {/* SQUADRE E LOGHI UFFICIALI */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h6 className="text-[11px] font-bold text-slate-800 uppercase font-sport tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Squadre e Loghi Ufficiali Scontro Diretto</span>
                </h6>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SQUADRA CASA */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-600 block">
                      Squadra di Casa
                    </span>
                    <input
                      type="text"
                      value={currentCanale.squadra_casa || ''}
                      onChange={e => updateCurrentCanale({ squadra_casa: e.target.value })}
                      placeholder="Es. CPMI SAVENA VOLLEY"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {((currentCanale.logo_casa && currentCanale.logo_casa !== '/logo.png') || getKnownTeamLogo(currentCanale.squadra_casa)) ? (
                          <img 
                            src={(currentCanale.logo_casa && currentCanale.logo_casa !== '/logo.png') ? currentCanale.logo_casa : getKnownTeamLogo(currentCanale.squadra_casa)} 
                            alt="Logo Casa" 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentCanale.logo_casa || ''}
                        onChange={e => updateCurrentCanale({ logo_casa: e.target.value })}
                        placeholder="URL Logo Casa"
                        className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  {/* SQUADRA OSPITE */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-600 block">
                      Squadra Ospite
                    </span>
                    <input
                      type="text"
                      value={currentCanale.squadra_ospite || ''}
                      onChange={e => updateCurrentCanale({ squadra_ospite: e.target.value })}
                      placeholder="Es. New Volley Academy"
                      className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        {((currentCanale.logo_ospite && currentCanale.logo_ospite !== '/logo.png') || getKnownTeamLogo(currentCanale.squadra_ospite)) ? (
                          <img 
                            src={(currentCanale.logo_ospite && currentCanale.logo_ospite !== '/logo.png') ? currentCanale.logo_ospite : getKnownTeamLogo(currentCanale.squadra_ospite)} 
                            alt="Logo Ospite" 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <Shield className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={currentCanale.logo_ospite || ''}
                        onChange={e => updateCurrentCanale({ logo_ospite: e.target.value })}
                        placeholder="URL Logo Ospite"
                        className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTONE SALVATAGGIO */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4 text-amber-400" />}
                <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Tutte le Configurazioni Diretta'}</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ANTEPRIMA & GUIDA PRATICA */}
        <div className="space-y-6">
          
          {/* LIVE EMBED PREVIEW */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-slate-900 uppercase font-sport tracking-wider flex items-center justify-between">
              <span>📺 Anteprima Player {isDoppia ? `(${activeChannelKey === 'canale_1' ? 'Canale 1' : 'Canale 2'})` : ''}</span>
              {videoId ? (
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Pronto</span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">In attesa link</span>
              )}
            </h4>

            <div className="aspect-video w-full rounded-2xl bg-black overflow-hidden border border-slate-200 flex items-center justify-center text-slate-500">
              {videoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1`}
                  title="Anteprima YouTube"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <Video className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[11px] text-slate-400">
                    Incolla il link di YouTube per vedere l'anteprima del video.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block font-sport uppercase">
                {currentCanale.titolo || 'Titolo Partita'}
              </span>
              <p className="text-slate-500 text-[10px]">
                {currentCanale.categoria} • {currentCanale.luogo}
              </p>
            </div>
          </div>

          {/* GUIDA RAPIDA PER LE DUE DIRETTE */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-3xl space-y-4 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2 text-amber-400 font-sport font-black uppercase text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{isDoppia ? 'Guida 2 Telefoni Simultanei' : 'Come Usarlo Domani (3 Passi)'}</span>
            </div>

            {isDoppia ? (
              <ol className="space-y-3 text-[11px] text-slate-300 list-decimal pl-4">
                <li>
                  <b>Due Telefoni con l'app YouTube</b> sullo stesso canale NVA: ogni telefono avvia una live streaming distinta (es. Telefono A a Bologna per il Maschile, Telefono B a Villafranca per il Femminile).
                </li>
                <li>
                  <b>Incolla i due link nelle rispettive schede</b>:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-400">
                    <li>Scheda <b>Canale 1</b> ➔ incolla link live Maschile</li>
                    <li>Scheda <b>Canale 2</b> ➔ incolla link live Femminile</li>
                  </ul>
                </li>
                <li>
                  <b>Condividi i link dedicati</b>:
                  <br />
                  Storie Maschile: <code className="text-amber-400 font-mono text-[10px]">/diretta?canale=maschile</code>
                  <br />
                  Storie Femminile: <code className="text-amber-400 font-mono text-[10px]">/diretta?canale=femminile</code>
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-[11px] text-slate-300 list-decimal pl-4">
                <li>
                  <b>Avvia lo streaming YouTube</b> dal cellulare o dalla videocamera al palazzetto.
                </li>
                <li>
                  <b>Copia il link del video</b> da YouTube, incollalo qui nel campo sopra e metti lo stato su <b>🔴 In Diretta Ora</b>. Clicca <i>Salva</i>.
                </li>
                <li>
                  <b>Condividi su Instagram/WhatsApp</b>:
                  <br />
                  Metti nelle storie lo sticker link che punta a <code className="text-amber-400 font-mono text-[10px]">/diretta</code>.
                </li>
              </ol>
            )}

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic">
              Entrambe le partite offriranno massima visibilità agli sponsor e permetteranno a tutti i tifosi di seguire le nostre pantere!
            </div>
          </div>

        </div>

      </form>
    </div>
  )}

  {/* SEZIONE ALTRE SQUADRE & GIOVANILI (AREA NEUTRA) */}
  {mainSection === 'altre' && (
    <div className="space-y-6">
      {/* 1. HEADER CARD ALTRE SQUADRE */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              cExtra.attiva 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Tv className={`w-6 h-6 ${cExtra.attiva && cExtra.stato === 'live' ? 'animate-pulse text-red-500' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-sport italic">
                  Diretta Altre Squadre & Giovanili
                </h3>
                {cExtra.attiva ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ONLINE SUL SITO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    DISATTIVA
                  </span>
                )}
              </div>
              <p className="font-inter text-xs text-slate-400 mt-0.5">
                Area neutra e indipendente: trasmetti live le partite di Under, CSI e campionati giovanili senza interferire con la Serie D.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPublicUrlExtra}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedExtraUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedExtraUrl ? 'Copiato!' : 'Copia Link Canale'}</span>
            </button>
            <a
              href="/diretta?canale=extra"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-sport italic skew-x-[-6deg] uppercase tracking-wider px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Vedi Pagina Live</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* BARRA STATO & ATTIVAZIONE */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* TOGGLE ATTIVA */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(cExtra.attiva)}
              onChange={(e) => updateCanaleExtra({ attiva: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 relative shadow-inner"></div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-white uppercase font-sport tracking-wider">
                {cExtra.attiva ? '⚡ Diretta Attiva sul Portale' : 'Diretta Spenta'}
              </span>
              <span className="text-[10px] text-slate-400 font-inter">
                {cExtra.attiva ? 'Visibile sulla pagina /diretta' : 'Nessun flusso in onda per questo canale'}
              </span>
            </div>
          </label>

          {/* STATO GARA (IN PROGRAMMA, LIVE, TERMINATA) */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => updateCanaleExtra({ stato: 'in_programma' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sport uppercase tracking-wider transition-all cursor-pointer ${
                cExtra.stato === 'in_programma'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⏳ In Programma
            </button>
            <button
              type="button"
              onClick={() => updateCanaleExtra({ stato: 'live' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sport uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                cExtra.stato === 'live'
                  ? 'bg-red-500 text-white shadow-sm animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              🔴 In Diretta Ora
            </button>
            <button
              type="button"
              onClick={() => updateCanaleExtra({ stato: 'terminata' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sport uppercase tracking-wider transition-all cursor-pointer ${
                cExtra.stato === 'terminata'
                  ? 'bg-slate-700 text-slate-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏁 Terminata
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARD SELEZIONE SQUADRA E AVVERSARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-amber-500" />
              <h4 className="font-sport font-black uppercase text-sm tracking-wider text-slate-900">
                Configura Squadre del Match
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TENDINA LA NOSTRA SQUADRA */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide flex items-center gap-1">
                  <span>🦁 La Nostra Squadra</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={cExtra.squadra_id || (selectedExtraSquadra ? selectedExtraSquadra.id : '')}
                  onChange={(e) => {
                    const sqId = e.target.value;
                    const sq = (squadreAll || []).find(x => x.id === sqId);
                    if (sq) {
                      const isCasa = isNvaCasaExtra;
                      const rawName = (sq.nome_squadra || '').trim();
                      const ourName = (/new\s*volley/i.test(rawName) || /volley\s*academy/i.test(rawName))
                        ? rawName
                        : `New Volley Academy ${rawName || 'Academy'}`;
                      const oppName = isCasa ? (cExtra.squadra_ospite || 'Avversario') : (cExtra.squadra_casa || 'Avversario');
                      updateCanaleExtra({
                        squadra_id: sq.id,
                        categoria: sq.nome_squadra,
                        sottotitolo: sq.campionato || 'Campionato Volley',
                        squadra_casa: isCasa ? ourName : oppName,
                        squadra_ospite: !isCasa ? ourName : oppName,
                        logo_casa: isCasa ? OFFICIAL_NVA_LOGO : (cExtra.logo_casa || getKnownTeamLogo(oppName) || ''),
                        logo_ospite: !isCasa ? OFFICIAL_NVA_LOGO : (cExtra.logo_ospite || getKnownTeamLogo(oppName) || ''),
                        titolo: `${sq.nome_squadra}: ${isCasa ? ourName + ' vs ' + oppName : oppName + ' vs ' + ourName}`
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                >
                  {altreSquadreList.map(sq => (
                    <option key={sq.id} value={sq.id}>
                      {sq.nome_squadra} {sq.campionato ? `(${sq.campionato})` : ''}
                    </option>
                  ))}
                </select>
                {selectedExtraSquadra && selectedExtraSquadra.campionato && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Campionato: {selectedExtraSquadra.campionato}
                  </p>
                )}
              </div>

              {/* CASA O TRASFERTA */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide">
                  Luogo Partita (Casa / Trasferta)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rawName = (selectedExtraSquadra?.nome_squadra || '').trim();
                      const ourName = (/new\s*volley/i.test(rawName) || /volley\s*academy/i.test(rawName))
                        ? rawName
                        : `New Volley Academy ${rawName || 'Academy'}`;
                      const oppName = isNvaCasaExtra ? cExtra.squadra_ospite : cExtra.squadra_casa;
                      updateCanaleExtra({
                        squadra_casa: ourName,
                        logo_casa: OFFICIAL_NVA_LOGO,
                        squadra_ospite: oppName || 'Avversario',
                        logo_ospite: getKnownTeamLogo(oppName) || ''
                      });
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                      isNvaCasaExtra
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏠 In Casa (NVA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rawName = (selectedExtraSquadra?.nome_squadra || '').trim();
                      const ourName = (/new\s*volley/i.test(rawName) || /volley\s*academy/i.test(rawName))
                        ? rawName
                        : `New Volley Academy ${rawName || 'Academy'}`;
                      const oppName = isNvaCasaExtra ? cExtra.squadra_ospite : cExtra.squadra_casa;
                      updateCanaleExtra({
                        squadra_casa: oppName || 'Avversario',
                        logo_casa: getKnownTeamLogo(oppName) || '',
                        squadra_ospite: ourName,
                        logo_ospite: OFFICIAL_NVA_LOGO
                      });
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold font-sport uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                      !isNvaCasaExtra
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🚗 In Trasferta</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SQUADRA AVVERSARIA */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide flex items-center gap-1">
                    <span>🏐 Squadra Avversaria</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-inter">
                    {availableOpponentsExtra.length > 0 
                      ? `${availableOpponentsExtra.length} avversari nel girone`
                      : 'Inserimento libero al momento'}
                  </span>
                </div>

                <select
                  value={cExtra.avversario_tipo === 'custom' ? '__CUSTOM__' : (isNvaCasaExtra ? cExtra.squadra_ospite : cExtra.squadra_casa)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CUSTOM__') {
                      updateCanaleExtra({ avversario_tipo: 'custom' });
                    } else {
                      const oppLogo = getKnownTeamLogo(val) || '';
                      if (isNvaCasaExtra) {
                        updateCanaleExtra({
                          squadra_ospite: val,
                          logo_ospite: oppLogo,
                          avversario_tipo: 'campionato'
                        });
                      } else {
                        updateCanaleExtra({
                          squadra_casa: val,
                          logo_casa: oppLogo,
                          avversario_tipo: 'campionato'
                        });
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                >
                  <option value="__CUSTOM__">✏️ Inserisci Altra Squadra (Al momento / Personalizzata)...</option>
                  {availableOpponentsExtra.length > 0 && (
                    <optgroup label="Squadre dal Campionato / Classifica">
                      {availableOpponentsExtra.map(opp => (
                        <option key={opp} value={opp}>{opp}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* CAMPO TESTO DIGITABILE SE PERSONALIZZATA */}
              {(cExtra.avversario_tipo === 'custom' || !availableOpponentsExtra.includes(isNvaCasaExtra ? (cExtra.squadra_ospite || '') : (cExtra.squadra_casa || ''))) && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-300 rounded-2xl space-y-2">
                  <label className="text-[11px] font-bold text-amber-950 font-sport uppercase tracking-wider block">
                    Digita Nome Squadra Avversaria al Momento:
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Libertas Volley Forlì / Pallavolo Ravenna..."
                    value={isNvaCasaExtra ? (cExtra.squadra_ospite || '') : (cExtra.squadra_casa || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const oppLogo = getKnownTeamLogo(val) || '';
                      if (isNvaCasaExtra) {
                        updateCanaleExtra({ squadra_ospite: val, logo_ospite: oppLogo });
                      } else {
                        updateCanaleExtra({ squadra_casa: val, logo_casa: oppLogo });
                      }
                    }}
                    className="w-full bg-white border border-amber-400 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-800 flex items-center gap-1.5 font-inter">
                    <span>✨</span>
                    <span>Se non ha logo caricato, verrà applicato automaticamente lo scudetto volley con monogramma societario.</span>
                  </p>
                </div>
              )}
            </div>

            {/* DATA E ORA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide">
                  Data & Ora Inizio (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. 18/11/26 20:30 o Stasera ore 20:30"
                  value={cExtra.data_ora || ''}
                  onChange={(e) => updateCanaleExtra({ data_ora: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide">
                  Categoria / Campionato Mostrato
                </label>
                <input
                  type="text"
                  placeholder="Es. Under 16 Femminile / CSI Misto"
                  value={cExtra.categoria || ''}
                  onChange={(e) => updateCanaleExtra({ categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* LINK YOUTUBE */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 font-sport uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🔴 Link Diretta YouTube</span>
                  <span className="text-red-500">*</span>
                </span>
                {extraVideoId && (
                  <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Video ID: {extraVideoId}
                  </span>
                )}
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                value={cExtra.url_youtube || ''}
                onChange={(e) => updateCanaleExtra({ url_youtube: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: KIT RAPIDO YOUTUBE STUDIO E LOCANDINA */}
        <div className="space-y-5">
          {/* KIT RAPIDO YOUTUBE */}
          <div className="bg-gradient-to-br from-amber-400/10 via-amber-300/5 to-slate-900/5 border border-amber-300 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-sport font-black uppercase text-sm tracking-wider text-slate-900">
                  Kit Rapido YouTube Studio
                </h4>
                <p className="text-[10px] text-slate-500 font-inter">
                  Copia e incolla in 1 clic per avviare la live su YouTube
                </p>
              </div>
            </div>

            {/* TITOLO YOUTUBE RAPIDO */}
            <div className="p-3 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-sport uppercase tracking-wider text-slate-500">
                  Titolo Stream
                </span>
                <button
                  type="button"
                  onClick={handleCopyTitleExtra}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[10px] font-sport uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  {copiedTitleExtra ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTitleExtra ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <div className="text-xs font-bold text-slate-800 font-mono line-clamp-2 select-all bg-slate-50 p-2 rounded-xl border border-slate-200">
                {youtubeTitleExtra}
              </div>
            </div>

            {/* DESCRIZIONE BREVE (SENZA LOCATION) */}
            <div className="p-3 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-sport uppercase tracking-wider text-slate-500">
                  Descrizione Breve (No Location)
                </span>
                <button
                  type="button"
                  onClick={handleCopyDescriptionExtra}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[10px] font-sport uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  {copiedDescriptionExtra ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDescriptionExtra ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                {youtubeDescriptionExtra}
              </pre>
            </div>

            {/* LOCANDINA GENERATOR BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadLocandinaExtra}
                disabled={isGeneratingLocandina}
                className="w-full bg-slate-950 hover:bg-black text-amber-400 border border-amber-400/50 hover:border-amber-400 font-sport uppercase tracking-wider font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isGeneratingLocandina ? 'animate-bounce text-amber-400' : 'text-amber-400'}`} />
                <span>
                  {isGeneratingLocandina ? 'Generazione Locandina in corso...' : 'Scarica Locandina Match (16:9 HD)'}
                </span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5 italic">
                Genera la grafica 1920×1080 con pantera stealth, scudetti e categoria
              </p>
            </div>
          </div>

          {/* ANTEPRIMA VIDEO PLAYER YOUTUBE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold font-sport uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-red-500" />
              Anteprima Flusso YouTube
            </span>
            <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
              {extraVideoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${extraVideoId}?modestbranding=1`}
                  title="Anteprima Live Altra Squadra"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-4 space-y-1.5">
                  <Tv className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                  <p className="text-[11px] text-slate-400">
                    Incolla il link YouTube per vedere il player qui in tempo reale.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PULSANTE SALVA IN BASSO */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-sport uppercase tracking-wider text-sm font-black px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Salvataggio in corso...' : 'Salva Configurazione Diretta'}</span>
        </button>
      </div>
    </div>
  )}
    </div>
  );
}
