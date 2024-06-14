#include <unordered_map>
#include <vector>
#include <utility>

using Stato = std::vector<int>;
using Azione = int;

std::unordered_map<Stato, std::unordered_map<Azione, douuble>> Q;

double alfa = 0.1;
double gamma = 0.9;

Azione scegliAzione(const Stato& stato, double epsilon) {
    if((double)rand() / RAND_MAX < epsilon) {
        return stato[rand() % stato.size()]
    } else {
        auto it = Q.find(stato)
        if(it = Q.end()) {
            return stato[rand() % stato.size()];
        } else {
            double maxQ = -1e9;
            Azione miglioreAzione = -1;
            for (const auto& coppia : it -> second) {
                if(coppia.second > maxQ) {
                    maxQ = coppia.second;
                    miglioreAzione = coppia.first;
                }
            }
            return miglioreAzione;
        }
    }
}

void aggiornaQ(const Stato& stato, Azione azione, double ricompensa, const Stato& nuovoStato){
    double maxQNuovoStato = 0;
    auto it = Q.find(nuovoStato);
    if(it != Q.end()) {
        for (const auto& coppia : it->second) {
            if(coppia.second > maxQNuovoStato) {
                maxQNuovoStato = coppia.second;
            }
        }
    }
    Q[stato][azione] = (1 - alfa) * Q[stato][azione] + alfa * (ricompensa + gamma * maxQNuovoStato);
}