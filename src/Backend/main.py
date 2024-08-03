from Stockfish.game import begin_game

def display_menu():
    """Display the main menu."""
    print("Welcome to the Chess Game!")
    print("1. Start a new game")
    print("2. Exit")



def main():
    while True:
        display_menu()
        choice = input("Enter your choice (1 or 2): ")

        if choice == '1':
            begin_game()
            break
        elif choice == '2':
            print("Exiting the game. Goodbye!")
            break
        else:
            print("Invalid choice. Please enter 1 or 2.")

#main calling
main()
