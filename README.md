# Dave's Little Details

A utility module for FoundryVTT that provides three handy macros:

## Macros

### 1. Door Lock Status
- Displays the lock status of a clicked door next to the active token.

### 2. Loot Generator
- Asks for the budget in Gold Pieces
- Creates a loot actor
- Adds loot from the compendium to bring the loot up to the specified maximum total imputed
- Places a token for the loot actor and sets ownership to Observer for all players to give them access making it lootable.

### 3. "He's Dead, Jim"
- Asks for the name of the dead (player) token
- generates a new loot actor
- copies the dead token's loot (including coins) into the new loot actor
- Hides the dead token and places the loot actor's token in it's place
- Sets the token ownership to allow all players to loot
- sends message in chat

## Installation

1. Upload the module to your `/modules` directory.
2. Enable **Dave's Little Details** from the FoundryVTT setup menu.
3. Access the macros from the Macros Directory.

## License

MIT
