import random

class Card:
    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank

    def __repr__(self):
        return f"{self.rank} di {self.suit}"

    def value(self):
        if self.rank == 1:
            return 11
        elif self.rank == 3:
            return 10
        elif self.rank == 10:
            return 4
        elif self.rank == 9:
            return 3
        elif self.rank == 8:
            return 2
        else:
            return 0

class Deck:
    def __init__(self):
        self.cards = [Card(suit, rank) for suit in ['Coppe', 'Bastoni', 'Spade', 'Denari'] for rank in range(1, 11)]
        random.shuffle(self.cards)

    def deal(self, num_players, cards_per_player):
        hands = [[] for _ in range(num_players)]
        for _ in range(cards_per_player):
            for hand in hands:
                hand.append(self.cards.pop())
        return hands

class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []

    def choose_briscola(self):
        print(f"\nLe tue carte: {self.hand}")
        choice = int(input("Quale carta vuoi chiamare come briscola? (0-7): "))
        return self.hand[choice]

    def play_card(self):
        print(f"\nLe tue carte: {self.hand}")
        choice = int(input(f"Quale carta vuoi giocare? (0-{len(self.hand) - 1}): "))
        return self.hand.pop(choice)

class Bot(Player):
    def choose_briscola(self, current_bid):
        # Implementazione dell'IA per chiamare una carta
        valid_cards = [card for card in self.hand if card.value() < current_bid]
        if not valid_cards:
            return None

        # Scegliere la carta con il valore più alto tra quelle valide
        best_card = max(valid_cards, key=lambda card: card.value())
        return best_card

    def play_card(self):
        card_index = random.randint(0, len(self.hand) - 1)
        return self.hand.pop(card_index)

def main():
    num_players = 5
    cards_per_player = 8
    deck = Deck()
    players = [Player("Player"), Bot("Bot1"), Bot("Bot2"), Bot("Bot3"), Bot("Bot4")]

    hands = deck.deal(num_players, cards_per_player)
    for player, hand in zip(players, hands):
        player.hand = hand

    # Chiamata della briscola (asta al ribasso)
    print("Fase di chiamata della briscola (asta al ribasso)")
    remaining_players = players[:]
    current_bid = 12  # Un valore iniziale più alto della carta più alta
    briscola_choice = None

    while len(remaining_players) > 1:
        for player in remaining_players[:]:
            if isinstance(player, Player):
                print(f"\nLe tue carte: {player.hand}")
                choice = int(input(f"Quale carta vuoi chiamare come briscola (valore inferiore a {current_bid})? (0-{len(player.hand) - 1}): "))
                briscola_choice = player.hand[choice]
                if briscola_choice.value() >= current_bid:
                    print(f"Valore della carta non valido, devi chiamare una carta inferiore a {current_bid}")
                    continue
                print(f"{player.name} chiama {briscola_choice}")
                current_bid = briscola_choice.value()
                response = input("Vuoi continuare l'asta? (s/n): ").strip().lower()
                if response == 'n':
                    remaining_players.remove(player)
            else:
                briscola_choice = player.choose_briscola(current_bid)
                if not briscola_choice or briscola_choice.value() >= current_bid:
                    remaining_players.remove(player)
                else:
                    print(f"{player.name} chiama {briscola_choice}")
                    current_bid = briscola_choice.value()

    chiamante = remaining_players[0]
    print(f"\n{chiamante.name} è il chiamante e la briscola è {briscola_choice}")

    # Rimozione della carta chiamata come briscola dalle mani dei giocatori
    for player in players:
        player.hand = [card for card in player.hand if card != briscola_choice]

    # Gioco
    rounds = len(players[0].hand)
    for i in range(rounds):
        print(f"\nRound {i + 1}")
        for player in players:
            card_played = player.play_card()
            print(f"{player.name} gioca {card_played}")
            print(f"{player.name} ha {len(player.hand)} carte rimaste.")

if __name__ == "__main__":
    main()
