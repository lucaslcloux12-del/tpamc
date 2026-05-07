import { world, system } from "@minecraft/server";

// Mapa para armazenar pedidos: [Nome_do_Alvo, Nome_de_Quem_Pediu]
const tpaQueue = new Map();

world.beforeEvents.chatSend.subscribe((data) => {
    const { message, sender } = data;
    const args = message.trim().split(" ");
    const cmd = args[0].toLowerCase();

    // COMANDO !SPAWN
    if (cmd === "!spawn") {
        data.cancel = true;
        system.run(() => {
            const spawn = world.getDefaultSpawnLocation();
            sender.teleport(spawn, { dimension: sender.dimension });
            sender.sendMessage("§a[!] Teleportado para o Spawn do Mundo.");
        });
        return;
    }

    // COMANDO !TPA <NOME>
    if (cmd === "!tpa") {
        data.cancel = true;
        const targetName = args.slice(1).join(" ");
        const target = world.getAllPlayers().find(p => p.name.toLowerCase() === targetName.toLowerCase());

        if (!target) {
            sender.sendMessage("§c[!] Jogador não encontrado.");
            return;
        }

        if (target.name === sender.name) {
            sender.sendMessage("§c[!] Você não pode pedir TPA para você mesmo.");
            return;
        }

        tpaQueue.set(target.name, sender.name);
        sender.sendMessage(`§ePedido enviado para §f${target.name}§e. Expira em 30s.`);
        target.sendMessage(`§6[TPA] §f${sender.name} §equer se teleportar para você.\n§aDigite !tpaccept ou !tpdeny.`);

        // Expiração automática em 30 segundos (600 ticks)
        system.runTimeout(() => {
            if (tpaQueue.get(target.name) === sender.name) {
                tpaQueue.delete(target.name);
            }
        }, 600);
        return;
    }

    // COMANDO !TPACCEPT
    if (cmd === "!tpaccept") {
        data.cancel = true;
        const requesterName = tpaQueue.get(sender.name);
        const requester = world.getAllPlayers().find(p => p.name === requesterName);

        if (requester) {
            system.run(() => {
                requester.teleport(sender.location, { dimension: sender.dimension });
                requester.sendMessage(`§aPedido aceito por §f${sender.name}§a. Teleportando...`);
                sender.sendMessage(`§aVocê aceitou o TPA de §f${requesterName}§a.`);
                tpaQueue.delete(sender.name);
            });
        } else {
            sender.sendMessage("§c[!] Você não tem pedidos pendentes.");
        }
        return;
    }

    // COMANDO !TPDENY
    if (cmd === "!tpdeny") {
        data.cancel = true;
        const requesterName = tpaQueue.get(sender.name);
        if (requesterName) {
            const req = world.getAllPlayers().find(p => p.name === requesterName);
            req?.sendMessage(`§c[!] Seu pedido de TPA foi negado por §f${sender.name}§c.`);
            sender.sendMessage(`§eVocê negou o pedido de §f${requesterName}§e.`);
            tpaQueue.delete(sender.name);
        } else {
            sender.sendMessage("§c[!] Nenhum pedido para negar.");
        }
        return;
    }
});
