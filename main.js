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

    riordina(numeri) {
        this.carte.sort((a, b) => {
            if (a.valore === b.valore) {
                return numeri.indexOf(a.numero) - numeri.indexOf(b.numero);
            }
            return b.valore - a.valore;
        });
    }

    mostra() {
        return this.carte.map(carta => carta.toString()).join(', ');
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
        this.riordinaMani();
    }

    distribuisciCarte() {
        for (let i = 0; i < 8; i++) {
            for (let giocatore in this.giocatori) {
                this.giocatori[giocatore].riceviCarta(this.mazzo.pesca());
            }
        }
    }

    riordinaMani() {
        for (let giocatore in this.giocatori) {
            this.giocatori[giocatore].mano.riordina(this.mazzo.numeri);
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

        let chiamataEffettuata = false;
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
                        chiamataEffettuata = true;
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
            semeBriscola = await this.chiediSemeBriscola();
       }else{
        semeBriscola = await this.calcolaSemeDominante(this.giocatori[chiamante].mano);
       }
        console.log(`${chiamante} chiama il ${cartaMassimaChiamata} di ${semeBriscola} a ${punteggioMassimo} punti.`);
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
        const numeriValidi = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'L'];
        return numeriValidi.includes(cartaChiamata) && (cartaChiamata.valore <=  cartaMassimaChiamata.valore || cartaChiamata.numero < cartaMassimaChiamata.numero);
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
}

const gioco = new Gioco();
gioco.faseChiamata();