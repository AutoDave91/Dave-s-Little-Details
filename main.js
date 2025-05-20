const MODULE_ID = "daves-little-details";

Hooks.once("init", () => {
    console.log(`${MODULE_ID} | Initializing settings...`);

    game.settings.register(MODULE_ID, "enableDoorMacro", {
        name: "Enable Door Lock Status Macro",
        hint: "Allows players to use the Door Lock Status macro.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register(MODULE_ID, "enableLootMacro", {
        name: "Enable Loot Generator Macro",
        hint: "Allows players to use the Loot Generator macro.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register(MODULE_ID, "enableDeadJimMacro", {
        name: "Enable 'He's Dead, Jim' Macro",
        hint: "Allows the GM to manually run a script to make dead tokens lootable.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });
});

Hooks.once("ready", async () => {
    const macrosToCreate = [];

    // Utility for creating macros only if not present
    async function createMacro({ name, path, img = null }) {
        if (game.macros.getName(name)) return;

        const command = await (await fetch(`modules/${MODULE_ID}/${path}`)).text();
        const macroData = {
            name,
            type: "script",
            command,
            scope: "global",
            permission: { default: 1 },
            img: img || "icons/svg/mystery-man.svg"
        };
        const macro = await Macro.create(macroData);
        macrosToCreate.push(macro);
    }

    if (game.settings.get(MODULE_ID, "enableDoorMacro")) {
        await createMacro({
            name: "Door Lock Status",
            path: "macros/door-lock-status.js",
            img: "icons/svg/door-closed.svg"
        });
    }

    if (game.settings.get(MODULE_ID, "enableLootMacro")) {
        await createMacro({
            name: "Loot Generator",
            path: "macros/loot-generator.js",
            img: "icons/svg/chest.svg"
        });
    }

    if (game.settings.get(MODULE_ID, "enableDeadJimMacro")) {
        await createMacro({
            name: "He's Dead, Jim",
            path: "macros/hes-dead-jim.js",
            img: "icons/svg/skull.svg"
        });
    }

    if (macrosToCreate.length > 0) {
        ui.notifications.info("Dave's Little Details: Macros created.");
    }
});
