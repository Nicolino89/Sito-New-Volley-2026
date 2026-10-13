import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, FileText, Lock, Users, Eye, HelpCircle, History, Cookie, Sliders } from 'lucide-react';

const Privacy: React.FC = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      num: "1",
      title: "Titolare del Trattamento",
      icon: <Shield className="w-5 h-5 text-slate-700" />,
      content: (
        <p className="font-inter text-slate-600 leading-relaxed text-sm">
          <strong>New Volley Academy S.S.D. a R.L.</strong>, con sede legale in Forlì (FC). Per esercitare i tuoi diritti o per qualsiasi informazione relativa al trattamento dei tuoi dati personali, puoi scrivere all'indirizzo email ufficiale della società.
        </p>
      )
    },
    {
      num: "2",
      title: "Tipologia di dati raccolti",
      icon: <Users className="w-5 h-5 text-slate-700" />,
      content: (
        <div className="font-inter text-slate-600 leading-relaxed text-sm space-y-3">
          <p>La società raccoglie e tratta le seguenti categorie di dati personali:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Dati identificativi e di contatto:</strong> nome, cognome, codice fiscale, data e luogo di nascita, indirizzo di residenza, indirizzo email, numero di telefono.
            </li>
            <li>
              <strong>Per gli atleti minorenni:</strong> gli stessi dati sopra indicati riferiti al minore, più i dati identificativi e di contatto del genitore o tutore legale che esercita la responsabilità genitoriale.
            </li>
            <li>
              <strong>Dati sanitari:</strong> esclusivamente i certificati medici di idoneità sportiva non agonistica o agonistica, obbligatori per il tesseramento federale. Questi dati sono trattati come dati particolari ai sensi dell'art. 9 GDPR e sono accessibili solo al personale autorizzato.
            </li>
          </ul>
        </div>
      )
    },
    {
      num: "3",
      title: "Finalità e base giuridica del trattamento",
      icon: <FileText className="w-5 h-5 text-slate-700" />,
      content: (
        <div className="font-inter text-slate-600 leading-relaxed text-sm space-y-3">
          <p>I dati sono trattati per le seguenti finalità:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Gestione del tesseramento FIPAV</strong> e delle coperture assicurative obbligatorie (base giuridica: adempimento di obblighi di legge ai sensi dell'art. 6.1.c GDPR).
            </li>
            <li>
              <strong>Iscrizione e gestione della partecipazione</strong> a corsi, camp estivi e tornei organizzati dalla società (base giuridica: esecuzione del contratto di associazione sportiva ai sensi dell'art. 6.1.b GDPR).
            </li>
            <li>
              <strong>Comunicazioni logistiche</strong> relative ad allenamenti, convocazioni e variazioni di calendario (base giuridica: legittimo interesse della società ai sensi dell'art. 6.1.f GDPR).
            </li>
          </ul>
        </div>
      )
    },
    {
      num: "4",
      title: "Trattamento dei dati di minori",
      icon: <Eye className="w-5 h-5 text-slate-700" />,
      content: (
        <p className="font-inter text-slate-600 leading-relaxed text-sm">
          Particolare attenzione è riservata al trattamento dei dati personali di atleti minorenni (sotto i 18 anni di età). In conformità all'art. 8 del GDPR e alla normativa italiana vigente, il trattamento dei dati di un minore è subordinato al consenso espresso da chi esercita la responsabilità genitoriale (genitore o tutore legale). All'atto dell'iscrizione, il genitore o tutore legale sottoscrive apposita liberatoria che autorizza il trattamento dei dati del minore per le finalità indicate nel presente documento. I dati dei minori non sono in alcun caso comunicati a terzi non autorizzati né utilizzati per finalità diverse da quelle strettamente necessarie all'attività sportiva.
        </p>
      )
    },
    {
      num: "5",
      title: "Conservazione e sicurezza dei dati",
      icon: <Lock className="w-5 h-5 text-slate-700" />,
      content: (
        <p className="font-inter text-slate-600 leading-relaxed text-sm">
          I dati raccolti tramite il portale della società sono conservati in modo sicuro sulla piattaforma cloud Firebase (Google LLC), con infrastruttura server situata all'interno dell'Unione Europea. L'accesso ai dati è cifrato tramite protocollo HTTPS/TLS ed è limitato esclusivamente ai membri del direttivo e allo staff tecnico autorizzato, tramite pannello amministrativo protetto da credenziali personali. I dati cartacei (moduli di iscrizione, certificati medici) sono conservati presso la sede sociale in armadi chiusi a chiave, accessibili solo al personale autorizzato. I dati vengono conservati per tutta la durata del rapporto associativo e per i successivi 10 anni, salvo diversi obblighi di legge.
        </p>
      )
    },
    {
      num: "6",
      title: "Diritti dell'interessato",
      icon: <HelpCircle className="w-5 h-5 text-slate-700" />,
      content: (
        <p className="font-inter text-slate-600 leading-relaxed text-sm">
          Ai sensi degli artt. 15–22 del GDPR, ogni interessato (o, nel caso di minori, il genitore/tutore legale) ha il diritto di: accedere ai propri dati personali trattati dalla società; richiedere la rettifica di dati inesatti o incompleti; richiedere la cancellazione dei dati (diritto all'oblio) nei casi previsti dalla legge; richiedere la limitazione del trattamento; opporsi al trattamento per motivi legittimi. Per esercitare questi diritti è sufficiente inviare una richiesta scritta all'indirizzo email ufficiale della società. La società si impegna a rispondere entro 30 giorni dal ricevimento della richiesta.
        </p>
      )
    },
    {
      num: "7",
      title: "Modifiche alla presente informativa",
      icon: <History className="w-5 h-5 text-slate-700" />,
      content: (
        <p className="font-inter text-slate-600 leading-relaxed text-sm">
          La società si riserva il diritto di modificare la presente informativa in qualsiasi momento, in caso di variazioni normative o operative. Le modifiche saranno pubblicate su questa pagina con aggiornamento della data indicata in cima al documento.
        </p>
      )
    },
    {
      num: "8",
      title: "Cookie e Strumenti di Tracciamento",
      icon: <Cookie className="w-5 h-5 text-slate-700" />,
      content: (
        <div className="font-inter text-slate-600 leading-relaxed text-sm space-y-4">
          <p>
            Questo portale fa uso di cookie tecnici essenziali e, previo consenso espresso dell'utente, di cookie analitici (Google Analytics 4) conformemente alle <em>Linee guida cookie e altri strumenti di tracciamento</em> del Garante della Privacy e al Regolamento UE 2016/679 (GDPR).
          </p>
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Categorie di cookie impiegate:</h5>
            <ul className="list-disc list-inside space-y-2 pl-2 text-xs">
              <li>
                <strong>Cookie Tecnici e Funzionali (Strettamente Necessari):</strong> garantiscono la sicurezza, la gestione delle sessioni autenticate dell'Area Riservata (Firebase Auth) e il caricamento istantaneo a 0ms dei dati mediante cache locale (LocalStorage). Questi strumenti non richiedono il consenso preventivo.
              </li>
              <li>
                <strong>Cookie Analitici e di Misurazione (Opzionali):</strong> gestiti tramite <em>Google Analytics 4 (Google LLC)</em> con mascheramento IP e blocco preventivo tramite Google Consent Mode v2. Vengono attivati unicamente qualora l'utente abbia cliccato "Accetta Tutti" o abbia abilitato la relativa voce nel pannello preferenze.
              </li>
            </ul>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('nva_open_cookie_preferences'))}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase font-sport tracking-wider transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Modifica le tue Preferenze Cookie</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 px-4 md:px-8" id="privacy-policy-page">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation / Back button */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#F5D800] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Link>
          <span className="text-xs font-mono text-slate-400">GDPR Compliance</span>
        </div>

        {/* Page Header */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F5D800]" />
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold font-barlow text-slate-900 tracking-tight uppercase">
              INFORMATIVA SULLA PRIVACY
            </h1>
            <p className="text-sm text-slate-500 font-inter">
              Ai sensi del Regolamento UE 2016/679 (GDPR)
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-mono text-slate-600 shrink-0">
            <span className="font-bold">Ultimo aggiornamento:</span> <span className="text-slate-800">3 Luglio 2026</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((sec) => (
            <div
              key={sec.num}
              className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 space-y-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3 border-l-4 border-[#F5D800] pl-3">
                <span className="text-xl font-black text-slate-400 font-mono select-none">
                  {sec.num.padStart(2, '0')}
                </span>
                <h3 className="text-md font-semibold font-barlow uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  {sec.icon}
                  {sec.title}
                </h3>
              </div>
              <div className="pt-1">
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Contact Info */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 text-center space-y-4">
          <h4 className="font-barlow font-bold uppercase tracking-wider text-sm text-[#F5D800]">
            Contatti e Supporto Privacy
          </h4>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            Per qualunque dubbio o per esercitare i tuoi diritti di accesso, rettifica, opposizione o cancellazione dei dati, puoi metterti in contatto diretto con il nostro Titolare del Trattamento.
          </p>
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs text-slate-200 font-mono">
            <Mail className="w-4 h-4 text-[#F5D800]" />
            <span>info@newvolleyacademy.it</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
