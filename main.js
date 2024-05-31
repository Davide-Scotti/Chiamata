const semi = ['coppe', 'ori', 'spade', 'bastoni'];
const valori = ['1', '3', '10', '9', '8', '7', '6', '5', '4', '2'];
const punteggi = {'1': 11, '2': 0, '3': 10, '4': 0, '5': 0, '6': 0, '7': 0, '8': 2, '9': 3, '10': 4};
const readline = require('readline');

let mazzo = [];

const giocatori = {
    'giocatore': [],
    'bot1': [],
    'bot2': [],
    'bot3': [],
    'bot4': []
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

semi.forEach(seme => {
    valori.forEach(valore => {
        mazzo.push({valore: valore, seme: seme});
    });
});

function mescola(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

mescola(mazzo);

for (let i = 0; i < 8; i++) {
    for (let giocatore in giocatori) {
        giocatori[giocatore].push(mazzo.pop());
    }
}

function mostraMano(mano) {
    return mano.map(carta => `${carta.valore} di ${carta.seme}`).join(', ');
}

function calcolaPunteggio(mano, punteggi) {
    let punteggio = 0;
    mano.forEach(carta => {
        punteggio += punteggi[carta.valore];
    });
    return punteggio;
}

function haQuattroDue(mano) {
    let countDue = mano.filter(carta => carta.valore === '2').length;
    return countDue === 4;
}

function verificaGiocatori(giocatori, punteggi) {
    for (let giocatore in giocatori) {
        let mano = giocatori[giocatore];
        let punteggio = calcolaPunteggio(mano, punteggi);
        if (punteggio <= 6 || haQuattroDue(mano)) {
            return false;
        }
    }
    return true;
}

if (verificaGiocatori(giocatori, punteggi)) {
    console.log("Tutti i giocatori possono giocare.");
    console.log("Le tue carte:", mostraMano(giocatori['giocatore']));
} else {
    console.log("Gioco annullato. Uno o più giocatori non soddisfano le condizioni per giocare.");
    for (let giocatore in giocatori) {
        let mano = giocatori[giocatore];
        let punteggio = calcolaPunteggio(mano, punteggi);
        if (punteggio <= 6 || haQuattroDue(mano)) {
            console.log(`${giocatore} ha annullato il gioco. Le sue carte: ${mostraMano(mano)}`);
        }
    }
}

function calcolaSemeDominante(mano) {
    const punteggiSemi = {'coppe': 0, 'ori': 0, 'spade': 0, 'bastoni': 0};
    mano.forEach(carta => {
        punteggiSemi[carta.seme] += (carta.valore === '2') ? 1 : punteggi[carta.valore];
    });
    return Object.keys(punteggiSemi).reduce((a, b) => punteggiSemi[a] > punteggiSemi[b] ? a : b);
}

function trovaCartaPiuAltaCheManca(mano, seme, cartaMassimaChiamata) {
    const cartePresenti = mano.filter(carta => carta.seme === seme).map(carta => carta.valore);
    for (let valore of valori) {
        if (!cartePresenti.includes(valore) && valori.indexOf(valore) < valori.indexOf(cartaMassimaChiamata)) {
            return valore;
        }
    }
    return null;
}

function pianificaChiamataBot(giocatore, mano, cartaMassimaChiamata, punteggioMassimo) {
    const semeDominante = calcolaSemeDominante(mano);
    const cartaChiamata = trovaCartaPiuAltaCheManca(mano, semeDominante, cartaMassimaChiamata);

    if (cartaChiamata) {
        console.log(`${giocatore} chiama ${cartaChiamata}.`);
        return { tipo: 'carta', valore: cartaChiamata };
    } else {
        const puntiChiamata = Math.max(punteggioMassimo + 1, 60);
        console.log(`${giocatore} chiama a ${puntiChiamata} punti.`);
        return { tipo: 'punti', valore: puntiChiamata };
    }
}

let faseGioco = 'chiamataCarte';
let chiamate = [];

async function faseChiamata(giocatori) {
    let chiamataEffettuata = false;
    let giro = 1;
    let cartaMassimaChiamata = '0';
    let punteggioMassimo = 0;

    while (!chiamataEffettuata) {
        console.log(`Giro ${giro}:`);
        for (let giocatore in giocatori) {
            if (giocatore === 'giocatore') {
                if (faseGioco === 'chiamataCarte') {
                    try {
                        const cartaChiamata = await chiediCartaChiamata(giocatore, cartaMassimaChiamata);
                        chiamate.push({ giocatore, tipo: 'carta', valore: cartaChiamata });
                        cartaMassimaChiamata = cartaChiamata;
                        faseGioco = 'chiamataPunti';
                    } catch (error) {
                        console.error(error.message);
                    }
                } else if (faseGioco === 'chiamataPunti') {
                    try {
                        const punteggioChiamata = await chiediPunteggioChiamata(giocatore, punteggioMassimo);
                        chiamate.push({ giocatore, tipo: 'punti', valore: punteggioChiamata });
                        punteggioMassimo = punteggioChiamata;
                        chiamataEffettuata = true;
                    } catch (error) {
                        console.error(error.message);
                    }
                }
            } else {
                const chiamataBot = pianificaChiamataBot(giocatore, giocatori[giocatore], cartaMassimaChiamata, punteggioMassimo);
                chiamate.push({ giocatore, tipo: chiamataBot.tipo, valore: chiamataBot.valore });

                if (chiamataBot.tipo === 'carta') {
                    cartaMassimaChiamata = chiamataBot.valore;
                } else {
                    punteggioMassimo = chiamataBot.valore;
                }

                if (faseGioco === 'chiamataCarte' && chiamataBot.tipo === 'punti') {
                    faseGioco = 'chiamataPunti';
                }

                if (faseGioco === 'chiamataPunti') {
                    chiamataEffettuata = true;
                }
            }
        }
        giro++;
    }
    console.log("Chiamate effettuate:", chiamate);
}

async function chiediCartaChiamata(giocatore, cartaMassimaChiamata) {
    return new Promise((resolve, reject) => {
        rl.question(`${giocatore}, inserisci il numero della carta da chiamare (1-10, inserisci '0' per lasciare): `, (cartaChiamata) => {
            const numeroCarta = parseInt(cartaChiamata);
            if (numeroCarta >= 0 && numeroCarta <= 10) {
                if (numeroCarta === 0) {
                    console.log(`${giocatore} ha lasciato.`);
                    resolve(0);
                } else {
                    const valoreCarta = valori[numeroCarta - 1];
                    if (valori.indexOf(valoreCarta) < valori.indexOf(cartaMassimaChiamata)) {
                        console.log("Devi chiamare una carta con un valore maggiore o uguale alla carta precedente.");
                        reject(new Error("Input non valido."));
                    } else {
                        console.log(`${giocatore} chiama ${valoreCarta}.`);
                        resolve(valoreCarta);
                    }
                }
            } else {
                console.log("Input non valido. Devi inserire un numero tra 1 e 10 o '0' per lasciare.");
                reject(new Error("Input non valido."));
            }
        });
    });
}

async function chiediPunteggioChiamata(giocatore, punteggioMassimo) {
    return new Promise((resolve, reject) => {
        rl.question(`${giocatore}, inserisci il punteggio da chiamare (60, 61, 62, ...): `, (punteggioChiamata) => {
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

faseChiamata(giocatori).then(() => {
    rl.close();
});

