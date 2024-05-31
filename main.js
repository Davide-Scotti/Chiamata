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
        this.valori = {'1': 11, '2': 0, '3': 10, '4': 0, '5': 0, '6': 0, '7': 0, '8': 2, '9': 3, '10': 4};
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

    riordina() {
        this.carte.sort((a, b) => {
            if (a.valore === b.valore) {
                return this.numeri.indexOf(a.numero) - this.numeri.indexOf(b.numero);
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
            this.giocatori[giocatore].mano.riordina();
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
        let giro = 1;
        let cartaMassimaChiamata = '0';
        let punteggioMassimo = 0;

        while (!chiamataEffettuata) {
            console.log(`Giro ${giro}:`);
            for (let giocatore in this.giocatori) {
                if (giocatore === 'giocatore') {
                    if (this.faseGioco === 'chiamataCarte') {
                        try {
                            const cartaChiamata = await this.chiediCartaChiamata(giocatore, cartaMassimaChiamata);
                            this.chiamate.push({ giocatore, tipo: 'carta', valore: cartaChiamata });
                            cartaMassimaChiamata = cartaChiamata;
                            this.faseGioco = 'chiamataPunti';
                        } catch (error) {
                            console.error(error.message);
                        }
                    } else if (this.faseGioco === 'chiamataPunti') {
                        try {
                            const punteggioChiamata = await this.chiediPunteggioChiamata(giocatore, punteggioMassimo);
                            this.chiamate.push({ giocatore, tipo: 'punti', valore: punteggioChiamata });
                            punteggioMassimo = punteggioChiamata;
                            chiamataEffettuata = true;
                        } catch (error) {
                            console.error(error.message);
                        }
                    }
                } else {
                    const chiamataBot = this.pianificaChiamataBot(giocatore, this.giocatori[giocatore].mano, cartaMassimaChiamata, punteggioMassimo);
                    this.chiamate.push({ giocatore, tipo: chiamataBot.tipo, valore: chiamataBot.valore });

                    if (chiamataBot.tipo === 'carta') {
                        cartaMassimaChiamata = chiamataBot.valore;
                    } else {
                        punteggioMassimo = chiamataBot.valore;
                    }

                    if (this.faseGioco === 'chiamataCarte' && chiamataBot.tipo === 'punti') {
                        this.faseGioco = 'chiamataPunti';
                    }

                    if (this.faseGioco === 'chiamataPunti') {
                        chiamataEffettuata = true;
                    }
                }
            }
            giro++;
        }
        console.log("Chiamate effettuate:", this.chiamate);
    }

    async chiediCartaChiamata(giocatore, cartaMassimaChiamata) {
        return new Promise((resolve, reject) => {
            this.rl.question(`${giocatore}, inserisci il numero della carta da chiamare (1-10, inserisci '0' per lasciare): `, (cartaChiamata) => {
                const numeroCarta = parseInt(cartaChiamata);
                if (numeroCarta >= 0 && numeroCarta <= 10) {
                    if (numeroCarta === 0) {
                        console.log(`${giocatore} ha lasciato.`);
                        resolve(0);
                    } else {
                        const valoreCarta = this.mazzo.valori[numeroCarta - 1];
                        if (this.mazzo.numeri.indexOf(valoreCarta) > this.mazzo.numeri.indexOf(cartaMassimaChiamata)) {
                            console.log(`${giocatore} chiama ${numeroCarta}.`);
                            resolve(numeroCarta);
                        } else {
                            console.log("Devi chiamare una carta con un valore maggiore della carta precedente.");
                            reject(new Error("Input non valido."));
                        }
                    }
                } else {
                    console.log("Input non valido. Devi inserire un numero tra 1 e 10 o '0' per lasciare.");
                    reject(new Error("Input non valido."));
                }
            });
        });
    }

    async chiediPunteggioChiamata(giocatore, punteggioMassimo) {
        return new Promise((resolve, reject) => {
            this.rl.question(`${giocatore}, inserisci il punteggio da chiamare (60, 61, 62, ...): `, (punteggioChiamata) => {
                const punti = parseInt(punteggioChiamata);
                if (punti >= punteggioMassimo + 1) {
                    console.log(`${giocatore} chiama a ${punti} punti.`);
                    resolve(punti);
                } else {
                    console.log(`Devi chiamare un punteggio maggiore di ${punteggioMassimo}.`);
                    reject(new Error("Input non valido."));
                }
            });
        });
    }

    calcolaSemeDominante(mano) {
        const punteggiSemi = {'coppe': 0, 'ori': 0, 'spade': 0, 'bastoni': 0};
        mano.carte.forEach(carta => {
            punteggiSemi[carta.seme] += (carta.numero === '2') ? 1 : carta.valore;
        });
        return Object.keys(punteggiSemi).reduce((a, b) => punteggiSemi[a] > punteggiSemi[b] ? a : b);
    }

    trovaCartaPiuAltaCheManca(mano, seme, cartaMassimaChiamata) {
        const cartePresenti = mano.carte.filter(carta => carta.seme === seme).map(carta => carta.numero);
        for (let valore of this.mazzo.numeri) {
            if (!cartePresenti.includes(valore) && this.mazzo.numeri.indexOf(valore) < this.mazzo.numeri.indexOf(cartaMassimaChiamata)) {
                return valore;
            }
        }
        return null;
    }

    pianificaChiamataBot(giocatore, mano, cartaMassimaChiamata, punteggioMassimo) {
        const semeDominante = this.calcolaSemeDominante(mano);
        const cartaChiamata = this.trovaCartaPiuAltaCheManca(mano, semeDominante, cartaMassimaChiamata);

        if (cartaChiamata) {
            console.log(`${giocatore} chiama ${cartaChiamata}.`);
            return { tipo: 'carta', valore: cartaChiamata };
        } else {
            const puntiChiamata = Math.max(punteggioMassimo + 1, 60);
            console.log(`${giocatore} chiama a ${puntiChiamata} punti.`);
            return { tipo: 'punti', valore: puntiChiamata };
        }
    }
}

const gioco = new Gioco();
gioco.faseChiamata().then(() => {
    gioco.rl.close();
});
