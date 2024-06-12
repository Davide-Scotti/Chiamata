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
        
        void Scrivi() const { cout << numero << " di " << seme << endl; }
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
        vector<Carta> carte;
    public: 
        Mano() { }

        void aggiungiCarta(const Carta& carta) {
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
        }

         Carta giocaCarta(int numero, char seme) {
            auto it = find_if(carte.begin(), carte.end(), [numero, seme](const Carta& carta) {
                return carta.getNumero() == numero && carta.getSeme() == seme;
            });
            if (it != carte.end()) {
                Carta cartaGiocata = *it;
                carte.erase(it);
                return cartaGiocata;
            }
            throw runtime_error("Carta non trovata!");
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
        Carta cartaChiamata;
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
                return chiediCartaChiamata(giocatore, cartaMassimaChiamata); // Richiama la funzione per chiedere un'altra carta
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
                return chiediCartaChiamata(giocatore, cartaMassimaChiamata); // Richiama la funzione per chiedere un'altra carta
            }
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
                            } else {
                                cartaAttuale = numeroChiamato;
                                ++it;
                            }
                        } catch (runtime_error) {
                            cout << "Errore nella fase chiamata numeri";
                        }
                    }
                }
            }while(giocatoriInGioco.size() > 1);

            if (!giocatoriInGioco.size() == 1) {
                cout << "Il vincitore è " << giocatoriInGioco[0].getNome() << " con la mano:\n";
                giocatoriInGioco[0].mostraMano();
            }
        }
};

int main() {
    Gioco gioco;
    gioco.faseChiamata();

    return 0; 
}
