const readline = require('readline');

class Carta {
    constructor(numero, seme, valore) {
        this.numero = numero;
        this.seme = seme;
        this.valore = valore;
    }

    toString() {
        return `${this.numero} di ${this.seme} (valore: ${this.valore})`;
    }
}

class Mazzo {
    constructor() {
        this.semi = ['coppe', 'ori', 'spade', 'bastoni'];
        this.numeri = ['1', '3', '10', '9', '8', '7', '6', '5', '4', '2'];
        this.valori = { '1': 11, '2': 0, '3': 10, '4': 0, '5': 0, '6': 0, '7': 0, '8': 2, '9': 3, '10': 4 };
        this.mazzo = [];
        this.inizializzaMazzo();
        this.mescola();
    }

    inizializzaMazzo() {
        this.semi.forEach(seme => {
            this.numeri.forEach(numero => {
                this.mazzo.push(new Carta(numero, seme, this.valori[numero]));
            });
        });
    }

    mescola() {
        for (let i = this.mazzo.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.mazzo[i], this.mazzo[j]] = [this.mazzo[j], this.mazzo[i]];
        }
    }

    pesca() {
        return this.mazzo.pop();
    }
}

class Mano {
    constructor() {
        this.carte = [];
    }

    aggiungiCarta(carta) {
        this.carte.push(carta);
    }

    isSemeChiamato(seme, semeChiamato){
        if(seme === semeChiamato)
            return true;
        return false;
    }

    riordina(numeri, semeChiamato) {
        let carteChiamate = this.carte.filter(carta => carta.seme === semeChiamato);
        let altreCarte = this.carte.filter(carta => carta.seme !== semeChiamato);

        // Ordinare le carte del seme chiamato per valore (usare numeri per l'ordine se necessario)
        carteChiamate.sort((a, b) => {
            if (a.valore === b.valore) {
                return numeri.indexOf(a.numero) - numeri.indexOf(b.numero);
            }
            return b.valore - a.valore;
        });

        // Ordinare le altre carte per valore (usare numeri per l'ordine se necessario)
        altreCarte.sort((a, b) => {
            if (a.valore === b.valore) {
                return numeri.indexOf(a.numero) - numeri.indexOf(b.numero);
            }
            return b.valore - a.valore;
        });

        // Unire le due liste
        this.carte = [...carteChiamate, ...altreCarte];
    }

    mostra() {
        return this.carte.map(carta => `${carta.numero} di ${carta.seme}`).join(', ');
    }

    giocaCarta(numero, seme) {
        const indice = this.carte.findIndex(carta => carta.numero === numero && carta.seme === seme);
        if (indice !== -1) {
            return this.carte.splice(indice, 1)[0];
        }
        return null;
    }

    calcolaPunteggio() {
        return this.carte.reduce((totale, carta) => totale += carta.valore, 0);
    }

    haQuattroDue() {
        return this.carte.filter(carta => carta.numero === '2').length === 4;
    }
}

class Giocatore {
    constructor(nome) {
        this.nome = nome;
        this.mano = new Mano();
    }

    riceviCarta(carta) {
        this.mano.aggiungiCarta(carta);
    }

    mostraMano() {
        return this.mano.mostra();
    }

    calcolaPunteggio() {
        return this.mano.calcolaPunteggio();
    }

    haQuattroDue() {
        return this.mano.haQuattroDue();
    }
}

class Gioco {
    constructor() {
        this.mazzo = new Mazzo();
        this.giocatori = {
            'giocatore': new Giocatore('giocatore'),
            'bot1': new Giocatore('bot1'),
            'bot2': new Giocatore('bot2'),
            'bot3': new Giocatore('bot3'),
            'bot4': new Giocatore('bot4')
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.faseGioco = 'chiamataCarte';
        this.chiamate = [];
        this.distribuisciCarte();
        this.semeChiamato = '';
        this.numeroChiamato = 0;
        (async () => {
            await this.riordinaMano();
        })();
    }

    distribuisciCarte() {
        for (let i = 0; i < 8; i++) {
            for (let giocatore in this.giocatori) {
                this.giocatori[giocatore].riceviCarta(this.mazzo.pesca());
            }
        }
    }

    async riordinaMano() {
        for (let giocatore in this.giocatori) {
            let semeDominante = await this.calcolaSemeDominante(this.giocatori[giocatore].mano)
            this.giocatori[giocatore].mano.riordina(this.mazzo.numeri, semeDominante);
        }
    }

    riordinaMani() {
        for (let giocatore in this.giocatori) {
            this.giocatori[giocatore].mano.riordina(this.mazzo.numeri, this.semeChiamato);
        }
    }

    verificaGiocatori() {
        for (let giocatore in this.giocatori) {
            let punteggio = this.giocatori[giocatore].calcolaPunteggio();
            if (punteggio <= 6 || this.giocatori[giocatore].haQuattroDue()) {
                return false;
            }
        }
        return true;
    }

    async faseChiamata() {
        if (this.verificaGiocatori()) {
            console.log("Tutti i giocatori possono giocare.");
            await this.giocatori['giocatore'].riordinaMano;
            console.log("Le tue carte:", this.giocatori['giocatore'].mostraMano());
        } else {
            console.log("Gioco annullato. Uno o più giocatori non soddisfano le condizioni per giocare.");
            for (let giocatore in this.giocatori) {
                let punteggio = this.giocatori[giocatore].calcolaPunteggio();
                if (punteggio <= 6 || this.giocatori[giocatore].haQuattroDue()) {
                    console.log(`${giocatore} ha annullato il gioco. Le sue carte: ${this.giocatori[giocatore].mostraMano()}`);
                }
            }
            return;
        }

        let cartaMassimaChiamata = { '0': 12};
        let punteggioMassimo = 60;
        let giocatoriInGioco = Object.keys(this.giocatori);

        while (giocatoriInGioco.length > 1) {
            for (let giocatore of giocatoriInGioco) {
                if (giocatore === 'giocatore') {
                    if (this.faseGioco === 'chiamataCarte') {
                        try {
                            const cartaChiamata = await this.chiediCartaChiamata(giocatore, cartaMassimaChiamata);
                            if (cartaChiamata === 'L') {
                                giocatoriInGioco = giocatoriInGioco.filter(g => g !== giocatore);
                                console.log(`${giocatore} ha lasciato.`);
                            } else if (cartaChiamata === '2') {
                                this.chiamate.push({ giocatore, tipo: 'carta', valore: cartaChiamata });
                                cartaMassimaChiamata = cartaChiamata;
                                this.faseGioco = 'chiamataPunti';
                                chiamataBot.tipo = 'punti'
                            } else {
                                this.chiamate.push({ giocatore, tipo: 'carta', valore: cartaChiamata });
                                cartaMassimaChiamata = cartaChiamata;
                            }
                        } catch (error) {
                            console.error(error.message);
                        }
                    } else if (this.faseGioco === 'chiamataPunti') {
                        try {
                            const punteggioChiamata = await this.chiediPunteggioChiamata(giocatore, punteggioMassimo);
                            if (punteggioChiamata === 'L') {
                                giocatoriInGioco = giocatoriInGioco.filter(g => g !== giocatore);
                                console.log(`${giocatore} ha lasciato.`);
                            } else {
                                this.chiamate.push({ giocatore, tipo: 'punti', valore: punteggioChiamata });
                                punteggioMassimo = punteggioChiamata;
                            }
                        } catch (error) {
                            console.error(error.message);
                        }
                    }
                } else {
                    const chiamataBot = this.pianificaChiamataBot(giocatore, this.giocatori[giocatore].mano, cartaMassimaChiamata, punteggioMassimo);
                    this.chiamate.push({ giocatore, tipo: chiamataBot.tipo, valore: chiamataBot.valore });

                    if (chiamataBot.valore === 'L') {
                        giocatoriInGioco = giocatoriInGioco.filter(g => g !== giocatore);
                        console.log(`${giocatore} ha lasciato.`);
                    } else {
                        if (chiamataBot.tipo === 'carta') {
                            cartaMassimaChiamata = chiamataBot.valore;
                            if (cartaMassimaChiamata === '2') {
                                this.faseGioco = 'chiamataPunti';
                                chiamataBot.tipo = 'punti';
                            }
                        } else if (chiamataBot.tipo === 'punti') {
                            punteggioMassimo = chiamataBot.valore;
                        }
                    }

                    if (giocatoriInGioco.length === 1) {
                        this.faseGioco = 'gioco';
                        break;
                    }
                }
            }
        }

        console.log("Chiamate effettuate:", this.chiamate);
        const chiamante = giocatoriInGioco[0];
        let semeBriscola = '';
        if(chiamante === 'giocatore1'){
            semeBriscola = await this.chiediSemeBriscola('giocatore1');
       }else{
        semeBriscola = await this.calcolaSemeDominante(this.giocatori[chiamante].mano);
       }
        console.log(`${chiamante} chiama il ${cartaMassimaChiamata} di ${semeBriscola} a ${punteggioMassimo} punti.`);
        this.semeChiamato = semeBriscola;
        this.numeroChiamato = cartaMassimaChiamata.numero
        this.riordinaMani();
        this.Gioco();
    }

    async chiediCartaChiamata(giocatore, cartaMassimaChiamata) {
        return new Promise((resolve, reject) => {
            this.rl.question(`${giocatore}, inserisci la carta da chiamare (numero da 1 a 10, oppure L per lasciare): `, (input) => {
                const cartaChiamata = input.trim().toUpperCase();
                if ((this.verificaCartaValida(cartaChiamata, cartaMassimaChiamata) && cartaChiamata <= 10 && cartaChiamata >= 1) || cartaChiamata === 'L') {
                    resolve(cartaChiamata);
                } else {
                    console.log('Carta non valida.');
                    this.chiediCartaChiamata(giocatore, cartaMassimaChiamata).then(resolve);
                }
            });
        });
    }

    async chiediPunteggioChiamata(giocatore, punteggioMassimo) {
        return new Promise((resolve, reject) => {
            this.rl.question(`${giocatore}, inserisci il punteggio da chiamare (superiore a ${punteggioMassimo}, oppure L per lasciare): `, (input) => {
                const punteggioChiamata = input.trim().toUpperCase();
                if ((parseInt(punteggioChiamata, 10) > punteggioMassimo && parseInt(punteggioChiamata, 10) <= 120) || punteggioChiamata === 'L') {
                    resolve(punteggioChiamata);
                } else {
                    reject(new Error('Punteggio non valido.'));
                }
            });
        });
    }

    async chiediSemeBriscola(giocatore) {
        return new Promise((resolve) => {
            this.rl.question(`${giocatore}, scegli il seme della briscola (coppe, ori, spade, bastoni): `, (input) => {
                const semeBriscola = input.trim().toLowerCase();
                if (['coppe', 'ori', 'spade', 'bastoni'].includes(semeBriscola)) {
                    resolve(semeBriscola);
                } else {
                    console.log('Seme non valido, scegli tra coppe, ori, spade, bastoni.');
                    this.chiediSemeBriscola(giocatore).then(resolve);
                }
            });
        });
    }

    verificaCartaValida(cartaChiamata, cartaMassimaChiamata) {
        const numeriValidi = ['2', '4', '5', '6', '7', '8', '9', '10', '3', '1', 'L', '12'];
        return numeriValidi.includes(cartaChiamata) && (cartaChiamata <=  cartaMassimaChiamata || numeriValidi.indexOf(cartaChiamata) < numeriValidi.indexOf(cartaMassimaChiamata) && numeriValidi.indexOf(cartaChiamata) <= 10);
    }

    async calcolaSemeDominante(mano) {
        const punteggiSemi = { 'coppe': 0, 'ori': 0, 'spade': 0, 'bastoni': 0 };
        mano.carte.forEach(carta => {
            const valoreChiamata = carta.valore === 0 ? 1 : carta.valore;
            punteggiSemi[carta.seme] += valoreChiamata;
        });
        return Object.keys(punteggiSemi).reduce((a, b) => punteggiSemi[a] > punteggiSemi[b] ? a : b);
    }

    trovaCartaPiuAltaCheManca(mano, seme, cartaMassimaChiamata) {
        const cartePresenti = mano.carte.filter(carta => carta.seme === seme).map(carta => carta.numero);
        for (let valore of this.mazzo.numeri) {
            if (!cartePresenti.includes(valore) && this.mazzo.numeri.indexOf(valore) > this.mazzo.numeri.indexOf(cartaMassimaChiamata)) {
                return valore;
            }
        }
        return null;
    }

    contaPuntiSeme(mano, semeDominante){
        let puntiBriscola = 0

        for(let carta of mano.carte) {
            if (carta.seme === semeDominante){
                puntiBriscola += carta.valore
                if(carta.valore === 0){
                    puntiBriscola++;
                }
            }
        }

        return puntiBriscola;
    }

    calcolaPuntiMassimi(mano, semeDominante) {    
        let puntiBriscola = 0;
        for (let carta of mano.carte) {
            if (carta.seme === semeDominante) {
                puntiBriscola += carta.valore;
            }
        }
    
        let puntiAltro = 0;
        for (let carta of mano.carte) {
            if (carta.seme !== semeDominante) {
                puntiAltro += carta.valore;
            }
        }
    
        if(puntiAltro >= puntiBriscola){

        } else if (puntiAltro >= 22){
            switch (true) {
                case puntiBriscola >= 33:
                    return 120;
                case puntiBriscola >= 30:
                    return 110;
                case puntiBriscola >= 27:
                    return 90;
                case puntiBriscola >= 24:
                    return 75;
                case puntiBriscola >= 21:
                    return 70;
                case puntiBriscola >= 18:
                    return 65;
                default: return 60;
            }

        }else if (puntiAltro >= 13){
            switch (true) {
                case puntiBriscola >= 33:
                    return 120;
                case puntiBriscola >= 30:
                    return 110;
                case puntiBriscola >= 27:
                    return 90;
                case puntiBriscola >= 24:
                    return 78;
                case puntiBriscola >= 21:
                    return 73;
                case puntiBriscola >= 18:
                    return 68;
                case puntiBriscola >= 15:
                    return 63; 
                default: return 60;
            }
        } else {
            switch (true) {
                case puntiBriscola >= 33:
                    return 120;
                case puntiBriscola >= 30:
                    return 110;
                case puntiBriscola >= 27:
                    return 100;
                case puntiBriscola >= 24:
                    return 90;
                case puntiBriscola >= 21:
                    return 80;
                case puntiBriscola >= 18:
                    return 75;
                case puntiBriscola >= 15:
                    return 70;
                case puntiBriscola >= 12:
                    return 65;
                default:
                    return 60;
            }
        }
    }

    pianificaChiamataBot(giocatore, mano, cartaMassimaChiamata, punteggioMassimo, chiamataForzata) {
        const semeDominante = this.calcolaSemeDominante(mano);
        const cartaChiamata = this.trovaCartaPiuAltaCheManca(mano, semeDominante, cartaMassimaChiamata);
    
        if (cartaChiamata) {
            console.log(`${giocatore} chiama ${cartaChiamata}.`);
            return { tipo: 'carta', valore: cartaChiamata };
        } else {
            const chiamataMassima = this.calcolaPuntiMassimi(mano, semeDominante);
            if (chiamataMassima > punteggioMassimo) {
                const puntiChiamata = ++punteggioMassimo;
                console.log(`${giocatore} chiama a ${puntiChiamata} punti.`);
                return { tipo: 'punti', valore: puntiChiamata };
            } else {
                return { tipo: 'punti', valore: 'L' };
            }
        }
    }

    async Gioco() {
        console.log("Inizia la fase di gioco.");
        let giocatoreCorrente = 'giocatore';
        let vincitoreTurno = null;
        let manoCorrente = 1;
        
        while (this.giocatori[giocatoreCorrente].mano.carte.length > 0) {
            console.log(`Inizia la mano ${manoCorrente}.`);
            const giocatoriInOrdine = this.ordinaGiocatoriPerTurnoDiCarte(giocatoreCorrente);
            console.log("Ordine dei giocatori:", giocatoriInOrdine.join(", "));
    
            let carteGiocate = {};
            let cartePossibili = [...this.giocatori[giocatoreCorrente].mano.carte];
            
            // Mostra le carte giocate fino a quel punto
            for (let giocatore of giocatoriInOrdine) {
                if (carteGiocate[giocatore]) {
                    console.log(`${giocatore} ha giocato: ${carteGiocate[giocatore].numero} di ${carteGiocate[giocatore].seme}`);
                } else if (giocatore !== 'giocatore') {
                    console.log(`${giocatore} deve ancora giocare.`);
                }
            }
            
            // Turno del giocatore corrente
            if (giocatoreCorrente === 'giocatore') {
                console.log(`Le tue carte: ${this.giocatori['giocatore'].mostraMano()}`);
                const cartaGiocata = await this.chiediCartaDaGiocare('giocatore', cartePossibili);
                carteGiocate['giocatore'] = cartaGiocata;
                console.log(`Hai giocato: ${cartaGiocata.numero} di ${cartaGiocata.seme}`);
            } else {
                const cartaGiocataBot = this.scegliCartaDaGiocareBot(giocatoreCorrente, cartePossibili);
                carteGiocate[giocatoreCorrente] = cartaGiocataBot;
                console.log(`${giocatoreCorrente} ha giocato: ${cartaGiocataBot.numero} di ${cartaGiocataBot.seme}`);
            }
            
            cartePossibili = cartePossibili.filter(carta => carta !== carteGiocate[giocatoreCorrente]);
            
            // Verifica chi ha vinto il turno
            if (!vincitoreTurno || this.vinceCarta(carteGiocate[giocatoreCorrente], carteGiocate[vincitoreTurno])) {
                vincitoreTurno = giocatoreCorrente;
            }
            
            // Cambio del giocatore corrente
            giocatoreCorrente = this.prossimoGiocatore(giocatoreCorrente);
            console.log(`È il turno di ${giocatoreCorrente}.`);
            
            // Se tutti i giocatori hanno giocato, determina il vincitore della mano e aggiorna il turno
            if (Object.keys(carteGiocate).length === Object.keys(this.giocatori).length) {
                console.log(`La mano è terminata. Vince ${vincitoreTurno}.`);
                manoCorrente++;
                giocatoreCorrente = vincitoreTurno;
                vincitoreTurno = null;
            }
        }
        
        console.log("La fase di gioco è terminata.");
    }
    
    async chiediCartaDaGiocare(giocatore, cartePossibili) {
        return new Promise((resolve, reject) => {
            this.rl.question(`${giocatore}, quale carta vuoi giocare? Inserisci l'indice della carta (0 - ${cartePossibili.length - 1}): `, (input) => {
                const indiceCarta = parseInt(input.trim(), 10);
                if (Number.isInteger(indiceCarta) && indiceCarta >= 0 && indiceCarta < cartePossibili.length) {
                    console.log(`Il giocatore ${giocatore} ha giocato: ${cartePossibili[indiceCarta].mostra}`)
                    resolve(cartePossibili[indiceCarta]);
                } else {
                    console.log('Indice non valido. Riprova.');
                    this.chiediCartaDaGiocare(giocatore, cartePossibili).then(resolve);
                }
            });
        });
    }

    scegliCartaDaGiocareBot(giocatoreCorrente, cartePossibili) {
       const bot = this.giocatori[giocatoreCorrente]
       const briscolaChiamata = { 'numero': this.numeroChiamato,'seme': this.semeChiamato, 'valore': 0 }

        const haBriscolaChiamata = bot.mano.carte.some(carta => carta.seme === briscolaChiamata);
        const isChiamante = giocatoreCorrente === this.chiamante;
        const isSocio = bot.mano.carte.includes(briscolaChiamata)
        const isNonSocio = !isSocio;

        let cartaScelta;
        if (haBriscolaChiamata) {
            // Se il bot è il chiamante, cerca di prendere il maggior numero di mani possibili, con il maggior numero di punti possibili
            // Se è il socio, prova a dare più punti possibili al chiamante, oppure di prendere il maggior numero possibile di punti dai non soci
            // Altrimenti, prova a prendere la mano con la briscola chiamata, in base alla posizione nel giro ed al numero di non soci che ha dietro, in caso dietro ci sia il chiamante, esso potrebbe caricare
            cartaScelta = this.scegliCartaSocio(bot, cartePossibili, isChiamante);
        } else if (isNonSocio) {
            // Se il bot è un non socio, cerca di capire chi è il socio e gioca contro di lui e il chiamante
            cartaScelta = this.scegliCartaDaNonSocio(bot, cartePossibili);
        } else {
            // Altrimenti, il bot in questione è il chiamante, sceglie le carte da giocare in modo da evitare strozzi troppo rischiosi, oppure per cercar di far mangiare le briscole ai non soci, oppure per prendere il maggior numero possibile di punti
            cartaScelta = this.segliCartaChiamante(bot, cartePossibili);
        }

        return cartaScelta;
    }

    scegliCartaSocio(bot, cartePossibili, isChiamante) {
        // Se il bot è il chiamante, vuol dire che il bot si è chiamato in mano, e dovrà giocare da solo
        if (isChiamante) {
            // Implementa la logica per cercare di dare più punti possibili al chiamante
            // Se non ci sono carte che possono dare punti al chiamante, gioca una carta a caso
            const cartePunti = this.trovaCartePunti(bot.mano.carte);
            if (cartePunti.length > 0) {
                return this.scegliCartaMigliorePerPunti(cartePunti, cartePossibili);
            }
        }
    
        // Altrimenti, se ci sono in banco tanti punti e  il chiamante è dopo, carica, solo se non ci sono briscole e/o sono basse
        //se non ci sono in banco punti prova a strozzare, oppure vai liscio
        //se ci sono tanti punti e hai tante briscole prendi di briscola, decidi se uscire con quella del socio per far capire che sei socio, oppure usarne un altra

        const briscoleChiamata = bot.mano.carte.filter(carta => carta.seme === this.briscola.chiamata);
        const cartaMigliore = this.scegliCartaMigliorePerPunti(briscoleChiamata, cartePossibili);
        if (cartaMigliore) {
            return cartaMigliore;
        }
    
        // Se non ci sono briscole chiamate o non è possibile dare punti al chiamante, gioca una carta a caso
        return cartePossibili[Math.floor(Math.random() * cartePossibili.length)];
    }
    
    scegliCartaDaNonSocio(bot, cartePossibili) {
        // Implementa la logica per capire chi è il socio e gioca contro di lui e il chiamante
        // Puoi considerare la posizione nel giro, le carte già giocate, ecc.
        // Per ora, gioca una carta casuale
        return cartePossibili[Math.floor(Math.random() * cartePossibili.length)];
    }
    
    scegliCartaMigliorePerPunti(carte, cartePossibili) {
        // Implementa la logica per scegliere la carta migliore in base ai punti
        // Puoi considerare le carte già giocate, la posizione nel giro, ecc.
        // Per ora, restituisci la carta con il punteggio più alto tra quelle disponibili
        // Se non ci sono carte che possono dare punti, restituisci null
        // Questo è solo un esempio di implementazione, dovresti adattarlo alle tue esigenze specifiche
        // Puoi utilizzare una logica simile a questa per implementare la tua funzione
        let cartaMigliore = null;
        let punteggioMigliore = 0;
        for (let carta of carte) {
            const punteggioCarta = this.calcolaPunteggioCarta(carta);
            if (punteggioCarta > punteggioMigliore && cartePossibili.includes(carta)) {
                cartaMigliore = carta;
                punteggioMigliore = punteggioCarta;
            }
        }
        return cartaMigliore;
    }
    
    trovaCartePunti(carte) {
        // Restituisce tutte le carte che possono dare punti
        // Implementa questa funzione in base alle regole del tuo gioco
        // Questo è solo un esempio di implementazione, dovresti adattarlo alle tue esigenze specifiche
        return carte.filter(carta => carta.valore > 10); // Ad esempio, restituisce le carte con valore maggiore di 10
    }
    
    calcolaPunteggioCarta(carta) {
        // Calcola il punteggio della carta
        // Implementa questa funzione in base alle regole del tuo gioco
        // Questo è solo un esempio di implementazione, dovresti adattarlo alle tue esigenze specifiche
        return carta.valore; // Ad esempio, restituisce il valore della carta come punteggio
    }

    ordinaGiocatoriPerTurnoDiCarte(giocatoreCorrente) {
        const giocatori = Object.keys(this.giocatori);
        const index = giocatori.indexOf(giocatoreCorrente);
        return [...giocatori.slice(index), ...giocatori.slice(0, index)];
    }
    
    vinceCarta(cartaA, cartaB) {
        // Logica per determinare quale carta vince tra due carte
        // Qui dovresti implementare la logica per stabilire quale carta vince tra due carte
        // Ad esempio, potresti confrontare i valori delle carte, considerando la briscola e il seme chiamato
        // e restituire true se cartaA vince su cartaB, altrimenti false
        // Questo è solo un esempio di implementazione, potrebbe essere necessaria una logica più complessa
        return cartaA.valore > cartaB.valore;
    }
    
    prossimoGiocatore(giocatoreCorrente) {
        // Logica per determinare il prossimo giocatore
        // Qui dovresti implementare la logica per determinare il prossimo giocatore
        // Ad esempio, potresti avere un array predefinito dell'ordine dei giocatori
        // e ciclare attraverso di esso per trovare il prossimo giocatore
        // Questo è solo un esempio di implementazione, potrebbe essere necessaria una logica più complessa
        const giocatori = Object.keys(this.giocatori);
        const index = giocatori.indexOf(giocatoreCorrente);
        return giocatori[(index + 1) % giocatori.length];
    }    
}

const gioco = new Gioco();
gioco.faseChiamata();
