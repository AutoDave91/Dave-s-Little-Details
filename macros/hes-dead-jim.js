if (!game.user.isGM) {
    ui.notifications.warn("Only the GM can run this loot conversion.");
    return;
}

// Get all non-NPC tokens on the scene
const tokens = canvas.tokens.placeables.filter(t => t.actor?.type !== "npc");

if (tokens.length === 0) {
    ui.notifications.warn("No non-NPC tokens found on the scene.");
    return;
}

// Build dropdown options
const options = tokens.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

new Dialog({
    title: "Convert Token to Loot",
    content: `
    <p>Select a non-NPC token to convert into a loot actor:</p>
    <select id="token-select" style="width:100%">${options}</select>
  `,
    buttons: {
        ok: {
            label: "Convert",
            callback: async (html) => {
                const tokenId = html.find("#token-select").val();
                const token = canvas.tokens.get(tokenId);
                if (!token) {
                    ui.notifications.error("Selected token could not be found.");
                    return;
                }

                const actor = token.actor;
                if (!actor) {
                    ui.notifications.error(`Token "${token.name}" has no actor.`);
                    return;
                }

                // Prevent duplicate conversion
                if (actor.getFlag("world", "lootConverted")) {
                    ui.notifications.info(`${actor.name} has already been converted to loot.`);
                    return;
                }
                await actor.setFlag("world", "lootConverted", true);

                // Copy items and coins
                const items = actor.items.map(item => item.toObject());
                const coins = foundry.utils.deepClone(actor.system.currencies || actor.system.coinage || {});
                console.log(items);

                // Create loot actor with open permissions
                const lootData = {
                    name: `${actor.name}'s Loot`,
                    type: "loot",
                    img: actor.img,
                    token: {
                        name: `${actor.name}'s Loot`,
                        img: token.texture.src,
                        disposition: -1,
                        actorLink: false,
                        width: token.document.width,
                        height: token.document.height,
                        x: token.document.x,
                        y: token.document.y
                    },
                    items: items,
                    system: {
                        coins: coins
                    },
                    ownership: {
                        default: 2 // Everyone can observe/interact
                    }
                };

                const lootActor = await Actor.create(lootData, { renderSheet: false });
                if (!lootActor) {
                    ui.notifications.error("Failed to create loot actor.");
                    return;
                }

                console.log(lootActor);

                // Drop loot token on canvas
                const tokenData = lootActor.prototypeToken.toObject();
                tokenData.actorId = lootActor.id;
                tokenData.x = token.document.x;
                tokenData.y = token.document.y;
                tokenData.disposition = -1;
                tokenData.actorLink = false;

                await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);

                // Delete the original token
                await token.document.delete();

                // Post chat message
                ChatMessage.create({
                    speaker: { alias: "System" },
                    content: `<strong>${actor.name}'s possessions have been dropped as loot.</strong>`,
                    type: CONST.CHAT_MESSAGE_TYPES.OOC
                });
            }
        },
        cancel: {
            label: "Cancel"
        }
    },
    default: "ok"
}).render(true);