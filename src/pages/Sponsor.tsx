import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Users } from 'lucide-react';
import { db, isDemoMode, getSquadreAll, getSocietaConfig } from '../firebase-societa';

interface SponsorDoc {
  id: string;
  nomeSponsor: string;
  linkSito: string;
  tipologia: 'Main Sponsor' | 'Gold Partner' | 'Sponsor Tecnico' | 'Partner Locale';
  logo: { url: string; positionY: number };
  squadreAssociate: string[];
  ordine: number;
}

export default function SponsorPage() {
  const [sponsors, setSponsors] = useState<SponsorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState(false);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const [contactEmail, setContactEmail] = useState<string>("info@newvolleyacademy.it");

  // Load teams and contact email once
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        const teams = await getSquadreAll();
        const mapping: Record<string, string> = {};
        teams.forEach((t) => {
          mapping[t.id] = t.nome_squadra;
        });
        setTeamNames(mapping);
      } catch (err) {
        console.error("Errore nel caricamento squadre:", err);
      }

      try {
        const config = await getSocietaConfig();
        if (config && config.email) {
          setContactEmail(config.email);
        }
      } catch (err) {
        console.error("Errore nel caricamento societa config:", err);
      }
    };
    fetchAuxiliaryData();
  }, []);

  // Fetch sponsors from Firestore
  useEffect(() => {
    const fetchSponsors = async () => {
      setLoading(true);
      setErrore(false);
      try {
        let fetched: SponsorDoc[] = [];
        if (!isDemoMode && db) {
          const sponsorsRef = collection(db, 'sponsors');
          const q = query(sponsorsRef, orderBy('ordine', 'asc'));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            const docData = docSnap.data();
            const mapped: SponsorDoc = {
              id: docSnap.id,
              nomeSponsor: docData.nomeSponsor || docData.nome || '',
              linkSito: docData.linkSito || docData.sito_web || '',
              tipologia: docData.tipologia || (docData.livello === 'Main' ? 'Main Sponsor' : docData.livello === 'Gold' ? 'Gold Partner' : 'Partner Locale'),
              logo: docData.logo || { url: docData.logo_url || '', positionY: docData.logoPositionY ?? 50 },
              squadreAssociate: docData.squadreAssociate || [],
              ordine: typeof docData.ordine === 'number' ? docData.ordine : 99,
            };
            fetched.push(mapped);
          });
        } else {
          // Demo fallback
          const local = localStorage.getItem('cms_sponsors');
          if (local) {
            fetched = JSON.parse(local);
          } else {
            fetched = [
              {
                id: "spon_01",
                nomeSponsor: "Ferramenta Salsep",
                linkSito: "https://www.ferramentasalsep.it",
                tipologia: "Main Sponsor",
                logo: { url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=80", positionY: 50 },
                squadreAssociate: ["squadra_seried_2025_2026"],
                ordine: 1
              },
              {
                id: "spon_02",
                nomeSponsor: "Fioreria Il Mughetto",
                linkSito: "https://www.ilmughettofiori.it",
                tipologia: "Gold Partner",
                logo: { url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=80", positionY: 50 },
                squadreAssociate: [],
                ordine: 2
              },
              {
                id: "spon_03",
                nomeSponsor: "Studio Fisioterapico San Marco",
                linkSito: "https://www.fisioterapiasanmarco.it",
                tipologia: "Gold Partner",
                logo: { url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80", positionY: 50 },
                squadreAssociate: [],
                ordine: 3
              },
              {
                id: "spon_04",
                nomeSponsor: "Macro Sport Tec",
                linkSito: "",
                tipologia: "Sponsor Tecnico",
                logo: { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80", positionY: 50 },
                squadreAssociate: [],
                ordine: 4
              },
              {
                id: "spon_05",
                nomeSponsor: "Pizzeria Da Mimmo",
                linkSito: "https://www.damimmopizza.it",
                tipologia: "Partner Locale",
                logo: { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80", positionY: 50 },
                squadreAssociate: [],
                ordine: 5
              }
            ];
            localStorage.setItem('cms_sponsors', JSON.stringify(fetched));
          }
        }
        setSponsors(fetched);
      } catch (err) {
        console.error("Errore nel caricamento sponsor:", err);
        setErrore(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSponsors();
  }, []);

  // Filter groups
  const mainSponsors = sponsors.filter(s => s.tipologia === 'Main Sponsor');
  const goldPartners = sponsors.filter(s => s.tipologia === 'Gold Partner');
  const techSponsors = sponsors.filter(s => s.tipologia === 'Sponsor Tecnico');
  const localPartners = sponsors.filter(s => s.tipologia === 'Partner Locale');

  // Loading skeleton state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse bg-slate-200 rounded h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errore) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <p className="font-inter text-red-600 text-sm font-medium">
            Non è stato possibile caricare i dati degli sponsor. Riprova più tardi.
          </p>
        </div>
      </div>
    );
  }

  // No sponsors state
  if (sponsors.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center py-12 max-w-md">
          <p className="font-inter text-slate-500 text-sm font-medium">
            Nessun partner registrato al momento. Torna a trovarci presto.
          </p>
        </div>
      </div>
    );
  }

  // Render function for cards to ensure clean layout and no code replication
  const renderCardInner = (sponsor: SponsorDoc, logoHeightClass: string, isMain = false) => {
    return (
      <>
        {/* Contenitore immagine con altezza specifica per tipologia */}
        <div className={`${logoHeightClass} overflow-hidden bg-white relative flex items-center justify-center`}>
          {sponsor.logo?.url ? (
            <img
              src={sponsor.logo.url}
              alt={`Logo ${sponsor.nomeSponsor}`}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              style={{ objectPosition: `center ${sponsor.logo?.positionY ?? 50}%` }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
              }}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <span className="font-inter text-slate-300 text-xs uppercase tracking-widest">
                Logo non disponibile
              </span>
            </div>
          )}
        </div>

        {/* Nome del Main Sponsor in evidenza sotto il logo */}
        {isMain && (
          <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-4 text-center">
            <h3 className="font-barlow font-semibold text-xl text-slate-900 uppercase tracking-tight">
              {sponsor.nomeSponsor}
            </h3>
          </div>
        )}

        {/* Footer card */}
        <div className="border-t border-slate-100 px-4 py-3 bg-white">
          <div className="font-inter font-semibold text-slate-900 text-sm truncate">
            {sponsor.nomeSponsor}
          </div>
          {sponsor.linkSito && (
            <div className="font-inter text-[#F5D800] text-xs font-semibold mt-0.5 group-hover:underline">
              Visita il sito →
            </div>
          )}
          {sponsor.squadreAssociate && sponsor.squadreAssociate.length > 0 && (
            <div className="font-inter text-slate-400 text-[10px] mt-2 flex items-center gap-1.5 border-t border-slate-50 pt-1.5">
              <Users className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">
                Partner di: {sponsor.squadreAssociate.map(id => teamNames[id] || id).join(', ')}
              </span>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderCard = (sponsor: SponsorDoc, logoHeightClass: string, isMain = false) => {
    if (sponsor.linkSito) {
      return (
        <a
          key={sponsor.id}
          href={sponsor.linkSito}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#F5D800] hover:shadow-lg transition-all duration-200"
        >
          {renderCardInner(sponsor, logoHeightClass, isMain)}
        </a>
      );
    } else {
      return (
        <div key={sponsor.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {renderCardInner(sponsor, logoHeightClass, isMain)}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <Link to="/" className="font-inter text-xs text-slate-400 hover:text-[#F5D800] mb-6 inline-block transition-colors font-medium">
            ← Home
          </Link>
          <h1 className="font-barlow font-bold uppercase tracking-wide text-3xl md:text-4xl text-slate-900">
            I NOSTRI PARTNER & SPONSOR
          </h1>
          <p className="font-inter text-slate-500 text-base mt-3 max-w-2xl leading-relaxed">
            Le aziende e le realtà che sostengono il progetto New Volley Academy, rendendo possibile la crescita della pallavolo a Forlì e sul territorio.
          </p>
          <div className="border-b-2 border-[#F5D800] mt-8 mb-10" />
        </div>

        {/* Gruppo "Main Sponsor" */}
        {mainSponsors.length > 0 && (
          <div className="mb-16">
            <span className="font-bebas text-[#F5D800] text-sm tracking-widest uppercase bg-[#121212] px-3 py-1 inline-block mb-6 rounded">
              MAIN SPONSOR
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {mainSponsors.map(sponsor => renderCard(sponsor, "h-56", true))}
            </div>
          </div>
        )}

        {/* Gruppo "Gold Partner" */}
        {goldPartners.length > 0 && (
          <div className="mb-16">
            <span className="bg-amber-100 text-amber-800 font-bebas text-sm tracking-widest px-3 py-1 inline-block mb-6 rounded">
              GOLD PARTNER
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {goldPartners.map(sponsor => renderCard(sponsor, "h-40", false))}
            </div>
          </div>
        )}

        {/* Gruppo "Sponsor Tecnico" */}
        {techSponsors.length > 0 && (
          <div className="mb-16">
            <span className="bg-blue-50 text-blue-700 font-bebas text-sm tracking-widest px-3 py-1 inline-block mb-6 rounded">
              SPONSOR TECNICO
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {techSponsors.map(sponsor => renderCard(sponsor, "h-28", false))}
            </div>
          </div>
        )}

        {/* Gruppo "Partner Locale" */}
        {localPartners.length > 0 && (
          <div className="mb-16">
            <span className="bg-slate-100 text-slate-600 font-bebas text-sm tracking-widest px-3 py-1 inline-block mb-6 rounded">
              PARTNER LOCALE
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {localPartners.map(sponsor => renderCard(sponsor, "h-24", false))}
            </div>
          </div>
        )}

        {/* Sezione Contatto in Fondo */}
        <div className="bg-[#121212] rounded-2xl p-10 text-center mt-12 shadow-xl border border-zinc-800/50">
          <h2 className="font-barlow font-bold uppercase text-white text-2xl tracking-wide">
            VUOI DIVENTARE PARTNER?
          </h2>
          <p className="font-inter text-slate-400 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            Supporta la New Volley Academy e fai conoscere la tua azienda al mondo dello sport forlivese. Contattaci per scoprire le opportunità di partnership.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="bg-[#F5D800] text-black font-bebas text-base tracking-wider px-8 py-3 inline-block mt-6 hover:bg-white transition-colors duration-200 rounded font-bold"
          >
            CONTATTACI
          </a>
        </div>

      </div>
    </div>
  );
}
