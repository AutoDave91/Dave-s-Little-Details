(async () => {
    // ==== USER INPUT ====
    const maxBudget = await Dialog.prompt({
        title: "Max Budget",
        content: "<p>Enter max budget for loot:</p><input type='number' id='max-budget' value='750'/>",
        callback: (html) => parseInt(html.find("#max-budget").val())
    });

    if (isNaN(maxBudget)) {
        ui.notifications.error("Invalid input.");
        return;
    }

    // Inform the user that loot generation has started
    ui.notifications.info("Generating loot...");

    let lootValueRemaining = maxBudget;

    // ==== Load and Filter Compendium ====
    const rarityRank = ["common", "uncommon", "rare", "unique"];
    const rarityLimitIndex = rarityRank.indexOf("uncommon");

    const pack = game.packs.get("pf2e.equipment-srd");
    if (!pack) {
        ui.notifications.error("Compendium 'pf2e.equipment-srd' not found.");
        return;
    }
    await pack.getIndex();

    const validItems = pack.index.contents;

    if (!validItems.length) {
        ui.notifications.warn("No items found in the compendium.");
        return;
    }

    const lootItems = [];
    const maxTries = 200;
    let attempts = 0;

    while (lootValueRemaining > 0 && attempts < maxTries) {
        const entry = validItems[Math.floor(Math.random() * validItems.length)];
        const item = await pack.getDocument(entry._id);

        let rarityValue = item?.system?.traits?.rarity ?? "common";
        let price = item?.system?.price?.value?.gp ?? 0;

        // Skip items with rarity higher than limit
        if (rarityRank.indexOf(rarityValue) > rarityLimitIndex) {
            attempts++;
            continue;
        }

        if (price > 0 && price <= lootValueRemaining) {
            const itemData = item.toObject();

            // Mystify if uncommon or higher
            if (rarityRank.indexOf(rarityValue) >= rarityRank.indexOf("uncommon")) {
                itemData.system.identification = {
                    status: "unidentified",
                    unidentified: {
                        name: "Unknown Item",
                        img: "systems/pf2e/icons/default-icons/unknown-item.svg"
                    }
                };
            }

            lootItems.push(itemData);
            lootValueRemaining -= price;
        }
        attempts++;
    }

    // ==== Create Loot Actor ====
    const imgSrc = "https://assets.forge-vtt.com/bazaar/systems/pf2e/assets/icons/default-icons/loot.svg";

    const lootActor = await Actor.create({
        name: `Room Loot`,
        type: "loot",
        img: imgSrc,
        system: {},
        ownership: { default: 2 } // Set to Observer for all players
    });

    await lootActor.update({ "prototypeToken.img": imgSrc });

    // ==== Drop Token (Loot Chest) ====
    const center = canvas.scene._viewPosition;
    const tokenData = {
        name: lootActor.name,
        actorId: lootActor.id,
        x: center.x,
        y: center.y,
        img: imgSrc,
        width: 1,
        height: 1,
        scale: 1,
        vision: false,
        actorLink: true,
        disposition: 0,
        locked: false,
        hidden: false
    };

    await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);

    // ==== Add Items to Loot ====
    if (lootItems.length > 0) {
        await Item.createDocuments(lootItems, { parent: lootActor });
    }

    const spent = maxBudget - lootValueRemaining;
    ui.notifications.info(`Loot generated: ${lootItems.length} items (~${spent} gp). Items of uncommon+ rarity are unidentified.`);
})();