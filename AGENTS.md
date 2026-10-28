# Linee Guida per Assistenti AI (Antigravity)

## 🔄 Regola di Sincronizzazione Multi-PC (Priorità Assoluta)
Questo progetto viene sviluppato e mantenuto dall'utente su due computer diversi.

Per evitare divergenze, sovrascritture o conflitti:
1. **Avvio di una sessione o prima di ogni nuovo task**:
   - Esegui sempre un controllo dello stato git ed effettua `git pull origin master` per allineare immediatamente il codice locale con l'ultima versione presente su GitHub.
2. **Al termine di ogni implementazione completata**:
   - Assicurati di effettuare `git add`, `git commit` e `git push origin master` in modo che l'altro computer trovi sempre il lavoro allineato al 100%.
