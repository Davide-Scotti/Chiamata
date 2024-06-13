#include <iostream>
#include <vector>
#include <algorithm>
#include <random>
#include <chrono>
#include <string.h>
#include <unordered_map>
#include <string>

using namespace std;

class Carta {
    private: 
        int numero;
        char seme;
        
    public: 
        int valore;
        Carta() : numero(0), seme('\0'), valore(0) {}
        Carta(int n, char s, int v) : numero(n), seme(s), valore(v) {}
        
        int getNumero() const { return numero; }
        char getSeme() const { return seme; }
        int getValore() const { return valore; }
        
        void Scrivi() const { cout << numero << seme << ", "; }
};

class Mazzo {
    private: 
        vector<int> numeri = { 1, 3, 10, 9, 8, 7, 6, 5, 4, 2 };
        vector<char> semi = { 'C', 'O', 'S', 'B' };
        vector<int> valori = { 11, 10, 4, 3, 2, 0, 0, 0, 0, 0 };
        vector<Carta> mazzo;

    public:
        Mazzo() {
            for(int j = 0; j < 4; j++) {
                for(int i = 0; i < 10; i++) {
                    mazzo.push_back(Carta(numeri[i], semi[j], valori[i]));
                }
            }
        }

        void Mescola() {
            unsigned seed = chrono::system_clock::now().time_since_epoch().count();
            shuffle(mazzo.begin(), mazzo.end(), default_random_engine(seed));
        }

        const vector<int>& getNumeri() const { return numeri; }

        Carta Pesca() {
            if (!mazzo.empty()) {
                Carta cartaPescata = mazzo.back();
                mazzo.pop_back();
                return cartaPescata;
            } else {
                throw runtime_error("Il mazzo è vuoto!");
            }
        }
};

class Mano {
    private:
        mutable vector<Carta> carte;
    public: 
        Mano() { }

        void aggiungiCarta(const Carta& carta) {
            carte.push_back(carta);
        }

        void aggiungiCarta(const Carta& carta) const {
            carte.push_back(carta);
        }

        bool isSemeChiamato(char seme, char semeChiamato) {
            return seme == semeChiamato;
        }

        void riordina(const vector<int>& numeri, char semeChiamato) const {
            vector<Carta>& carteModificabile = const_cast<vector<Carta>&>(carte);
            vector<Carta> carteChiamate, altreCarte;

            for (const auto& carta : carteModificabile) {
                if (carta.getSeme() == semeChiamato) {
                    carteChiamate.push_back(carta);
                } else {
                    altreCarte.push_back(carta);
                }
            }

            sort(carteChiamate.begin(), carteChiamate.end(), [&numeri](const Carta& a, const Carta& b) {
                if (a.getValore() == b.getValore()) {
                    return find(numeri.begin(), numeri.end(), a.getNumero()) < find(numeri.begin(), numeri.end(), b.getNumero());
                }
                return b.getValore() < a.getValore();
            });

            sort(altreCarte.begin(), altreCarte.end(), [&numeri](const Carta& a, const Carta& b) {
                if (a.getValore() == b.getValore()) {
                    return find(numeri.begin(), numeri.end(), a.getNumero()) < find(numeri.begin(), numeri.end(), b.getNumero());
                }
                return b.getValore() < a.getValore();
            });

            carteModificabile.clear();
            carteModificabile.insert(carteModificabile.end(), carteChiamate.begin(), carteChiamate.end());
            carteModificabile.insert(carteModificabile.end(), altreCarte.begin(), altreCarte.end());
        }

        void ScriviMano() const {
            for (const auto& carta : carte) {
                carta.Scrivi();
            }

            cout << endl;
        }

        Carta giocaCartaPerPosizione(int posizione) const {
            Carta giocata = carte[posizione - 1];
            carte.erase(carte.begin() + posizione - 1);
            return giocata;
        }

        int calcolaPunteggio() const {
            int totale = 0;
            for (const auto& carta : carte) {
                totale += carta.getValore();
            }
            return totale;
        }

        bool haQuattroDue() const {
            return count_if(carte.begin(), carte.end(), [](const Carta& carta) {
                return carta.getNumero() == 2;
            }) == 4;
        }

        const vector<Carta>& getCarte() const { return carte; }
};

class Giocatore {
    private: 
        string nome;
        Mano mano;
        Mano mazzetto;
    public:
        Giocatore() { }
        Giocatore(const string& nome) : nome(nome) { }

        void riceviCarta(const Carta& carta) {
            mano.aggiungiCarta(carta);
        }

        void mostraMano() const {
            mano.ScriviMano();
        }

        bool contaDue() const {
            return mano.haQuattroDue();
        }

        int calcolaPunteggioMano() const {
            return mano.calcolaPunteggio();
        }

        int calcolaPunteggioMazzetto() const {
            return mazzetto.calcolaPunteggio();
        }

        const Mano& getMano() const { return mano; }

        const Mano& getMazzetto() const { return mazzetto; }

        const string& getNome() const { return nome; }

        bool operator==(const Giocatore& other) const {
            return this->nome == other.nome;
        }
};

class Gioco {
    private:
        Mazzo mazzo;
        vector<Giocatore> giocatori;
        string fase = "C"; // "C" chiama carte, "P" chiama punti, "G" gioco;
        string chiamante;
        int numeroCarta;
        char semeCarta;
        int puntiChiamati = 60;
    public:
        Gioco(){
            giocatori.push_back(Giocatore("giocatore1"));
            giocatori.push_back(Giocatore("giocatore2"));
            giocatori.push_back(Giocatore("giocatore3"));
            giocatori.push_back(Giocatore("giocatore4"));
            giocatori.push_back(Giocatore("giocatore5"));

            distribuisciCarte();
        }

        void distribuisciCarte(){
            mazzo.Mescola();
            for (int i = 0; i < 8; i++) {
                for (auto& giocatore : giocatori) {
                    giocatore.riceviCarta(mazzo.Pesca());
                }
            }
        }

        void riordinaMani(){
            for (auto& giocatore : giocatori) {
                char semeDominante = calcolaSemeDominante(giocatore.getMano());
                giocatore.getMano().riordina(mazzo.getNumeri(), semeDominante);
            }
        }

        char calcolaSemeDominante(const Mano& mano) {
            unordered_map<char, int> punteggiSemi = { {'C', 0}, {'O', 0}, {'S', 0}, {'B', 0} };
            const vector<Carta>& carte = mano.getCarte();

            for (const auto& carta : carte) {
                int valoreChiamata = (carta.getValore() == 0) ? 1 : carta.getValore();
                punteggiSemi[carta.getSeme()] += valoreChiamata;
            }

            char semeDominante = 'C';
            for (const auto& coppia : punteggiSemi) {
                if (coppia.second > punteggiSemi[semeDominante]) {
                    semeDominante = coppia.first;
                }
            }

            return semeDominante;
        }

        bool verificaGiocatori() const {
            for (auto& giocatore : giocatori) {
                int punteggio = giocatore.calcolaPunteggioMano();
                if(punteggio <= 6 || giocatore.contaDue()) {
                    return false;
                }
            }

            return true;
        }

        int chiediCartaChiamata(string giocatore, int cartaMassimaChiamata) {
            cout << giocatore << ", inserisci la carta da chiamare (numero da 0 a 10, oppure 0 per lasciare): ";
            int n;
            cin >> n;

            if (n == 0) {
                return 0;
            }

            if (n < 0 || n > 10) {
                cout << "Valore non valido. Inserire un numero compreso tra 0 e 10." << endl;
                return chiediCartaChiamata(giocatore, cartaMassimaChiamata); 
            }

            int ordine[] = {1, 3, 10, 9, 8, 7, 6, 5, 4, 2, 0};
            int indexN = -1, indexM = -1;
            bool cartaOk = false;

            for (int i = 0; i < 11; i++) {
                if (cartaMassimaChiamata == ordine[i]) {
                    indexM = i;
                }
                if (n == ordine[i]) {
                    indexN = i;
                }
            }

            if (indexN >= indexM) {
                cartaOk = true;
            }

            if (cartaOk) {
                cout << "Carta valida." << endl;
                return n;
            } else {
                cout << "Carta non valida. Devi chiamare una carta di valore maggiore o uguale alla carta massima chiamata." << endl;
                return chiediCartaChiamata(giocatore, cartaMassimaChiamata);
            }
        }

        int chiediPuntiChiamati(string giocatore, int puntiMassimiChiamati){
            cout << giocatore << ", inserisci i punti che vuoi chiamare(numero da " << puntiMassimiChiamati << " a 120, oppure 0 per lasciare): ";
            int n;
            cin >> n;

             if (n == 0) {
                return 0;
            }

            if (n < puntiMassimiChiamati || n > 120) {
                cout << "Valore non valido. Inserire un numero compreso tra " << puntiMassimiChiamati << " e 120 oppure lascia." << endl;
                return chiediCartaChiamata(giocatore, puntiMassimiChiamati); 
            }

            return n;
        }

        void faseChiamata() {
            if (verificaGiocatori()) {
                cout << "Tutti i giocatori possono giocare.\n";
                riordinaMani();
                for (auto& giocatore : giocatori) {
                    cout << "Le carte di " << giocatore.getNome() << " : ";
                    giocatore.mostraMano();
                }
            } else {
                cout << "Gioco annullato. Qualcuno ha mandato a monte! \n";
                for (auto& giocatore : giocatori) {
                    cout << "Le carte di " << giocatore.getNome() << " : ";
                    giocatore.mostraMano();
                }
                return;
            }

            int cartaAttuale = -1;
            vector<Giocatore> giocatoriInGioco = giocatori;
            int puntiAttuali = 60;

            do{
                for (auto it = giocatoriInGioco.begin(); it != giocatoriInGioco.end();) {
                    auto& giocatore = *it;
                    if (fase == "C") {
                        try {
                            int numeroChiamato = chiediCartaChiamata(giocatore.getNome(), cartaAttuale);
                            if (numeroChiamato == 0) {
                                cout << giocatore.getNome() << " ha lasciato." << endl;
                                it = giocatoriInGioco.erase(it);
                            } else if (numeroChiamato == 2) {
                                cartaAttuale = numeroChiamato;
                                fase = "P";
                                ++it;
                            } else {
                                cartaAttuale = numeroChiamato;
                                ++it;
                            }
                        } catch (runtime_error) {
                            cout << "Errore nella fase chiamata numeri";
                        }
                    } else {
                        int puntiChiesti = chiediPuntiChiamati(giocatore.getNome(), puntiAttuali);
                        if(puntiChiesti == 0) {
                            cout << giocatore.getNome() << " ha lasciato." << endl;
                            it = giocatoriInGioco.erase(it);
                        }else{
                            puntiAttuali = puntiChiesti;
                            ++it;
                        }
                    }

                    if (giocatoriInGioco.size() == 1) {
                        cout << "Il vincitore è " << giocatoriInGioco[0].getNome() << " e sceglie il seme:\n";
                        cin >> semeCarta;
                        puntiChiamati = puntiAttuali;
                        numeroCarta = cartaAttuale;
                        chiamante = giocatoriInGioco[0].getNome();

                        cout << chiamante << " ha chiamato il: " << numeroCarta << " di " << semeCarta << " al " << puntiChiamati << endl;
                        break; 
                    }
                }
            }while(giocatoriInGioco.size() > 1);

            faseGioco();
        }

        void faseGioco() {
            int turno = 0; // Il turno iniziale è del primo giocatore
            int numeroGiri = 8; // Ogni giocatore ha 8 carte iniziali
            char semeChiamato = semeCarta; // Il seme della carta chiamata
            int numeroChiamato = numeroCarta; // Il numero della carta chiamata
            Giocatore* chiamanteGiocatore = nullptr; // Puntatore al giocatore chiamante
            Giocatore* proprietarioCartaChiamata = nullptr; // Puntatore al giocatore che possiede la carta chiamata

            // Troviamo il giocatore chiamante e il proprietario della carta chiamata
            for (auto& giocatore : giocatori) {
                if (giocatore.getNome() == chiamante) {
                    chiamanteGiocatore = &giocatore;
                }

                for (const auto& carta : giocatore.getMano().getCarte()) {
                    if (carta.getNumero() == numeroChiamato && carta.getSeme() == semeChiamato) {
                        proprietarioCartaChiamata = &giocatore;
                    }
                }
            }

            // Inizia la fase di gioco
            for (int i = 0; i < numeroGiri; i++) {
                vector<pair<Giocatore*, Carta>> carteGiocate; // Per memorizzare le carte giocate in ogni giro
                char semeMano;
                bool primoGiro = true;
                int posizione; 
                
                // Ogni giocatore gioca una carta
                for (auto& giocatore : giocatori) {
                    giocatore.mostraMano();
                    cout << giocatore.getNome() << ", inserisci la posizione della carta da giocare (1-8): ";
                    cin >> posizione;

                        Carta cartaGiocata = giocatore.getMano().giocaCartaPerPosizione(posizione);
                        carteGiocate.push_back({&giocatore, cartaGiocata});

                        if (primoGiro) {
                            semeMano = cartaGiocata.getSeme();
                            primoGiro = false;
                        }

                        cout << giocatore.getNome() << " ha giocato ";
                        cartaGiocata.Scrivi();
                        cout << endl;
                }

                // Determiniamo il vincitore della mano
                auto cartaVincente = carteGiocate[0];
                for (const auto& cartaGiocata : carteGiocate) {
                    if (cartaGiocata.second.getSeme() == semeChiamato) {
                        if (cartaVincente.second.getSeme() != semeChiamato || cartaGiocata.second.getValore() > cartaVincente.second.getValore() ||
                            (cartaGiocata.second.getValore() == cartaVincente.second.getValore() && cartaGiocata.second.getNumero() > cartaVincente.second.getNumero())) {
                            cartaVincente = cartaGiocata;
                        }
                    } else if (cartaGiocata.second.getSeme() == semeMano) {
                        if (cartaVincente.second.getSeme() != semeChiamato && 
                            (cartaVincente.second.getSeme() != semeMano || cartaGiocata.second.getValore() > cartaVincente.second.getValore() ||
                            (cartaGiocata.second.getValore() == cartaVincente.second.getValore() && cartaGiocata.second.getNumero() > cartaVincente.second.getNumero()))) {
                            cartaVincente = cartaGiocata;
                        }
                    }
                }

                cout << cartaVincente.first->getNome() << " ha vinto la mano con ";
                cartaVincente.second.Scrivi();
                cout << endl;

                // Aggiungiamo le carte giocate al mazzetto del vincitore
                for (const auto& cartaGiocata : carteGiocate) {
                    cartaVincente.first->getMazzetto().aggiungiCarta(cartaGiocata.second);
                }
            }

            // Calcoliamo i punti e determiniamo se il chiamante ha vinto
            int puntiTotali = chiamanteGiocatore->calcolaPunteggioMazzetto() + proprietarioCartaChiamata->calcolaPunteggioMazzetto();
            cout << "Punti totali del chiamante e del compagno: " << puntiTotali << endl;

            if (puntiTotali >= puntiChiamati) {
                cout << chiamante << " ha vinto la partita!" << endl;
            } else {
                cout << chiamante << " ha perso la partita!" << endl;
            }
        }
};

int main() {
    Gioco gioco;
    gioco.faseChiamata();

    return 0; 
}