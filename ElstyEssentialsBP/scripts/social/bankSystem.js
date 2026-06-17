import { system, world, ActionFormData, ModalFormData } from "../core.js";
import { ScoreboardDB } from "../board/data.js";
import { getMoney, addMoney, removeMoney, formatNumber } from "../function/moneySystem.js";

const CURRENCY_DEFAULT = "$";

let currencySymbol = CURRENCY_DEFAULT;

system.runInterval(() => {
    try {
        currencySymbol = ScoreboardDB.get("ScoreboardDBConfig-currency") ?? CURRENCY_DEFAULT;
    } catch {
        currencySymbol = CURRENCY_DEFAULT;
    }
}, 100);

function getBankPropertyKey(player) {
    return `bank_balance_${player.name}`;
}

export function getBank(player) {
    const val = player.getDynamicProperty(getBankPropertyKey(player));
    return val !== undefined ? BigInt(String(val)) : 0n;
}

export function setBank(player, amount) {
    player.setDynamicProperty(getBankPropertyKey(player), String(amount));
}

export function addBank(player, amount) {
    setBank(player, getBank(player) + BigInt(amount));
}

export function removeBank(player, amount) {
    const current = getBank(player);
    const amt = BigInt(amount);
    if (amt > current) return false;
    setBank(player, current - amt);
    return true;
}

const TRANSACTION_HISTORY_KEY = (player) => `bank_transactions_${player.name}`;
const TRANSACTION_HISTORY_LIMIT = 10;

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString();
}

export function addTransaction(player, text) {
    const key = TRANSACTION_HISTORY_KEY(player);
    let arr = [];
    try {
        const raw = player.getDynamicProperty(key);
        if (raw) arr = JSON.parse(String(raw));
    } catch { }
    arr.push(`${getCurrentTime()} - ${text}`);
    if (arr.length > TRANSACTION_HISTORY_LIMIT) arr = arr.slice(-TRANSACTION_HISTORY_LIMIT);
    player.setDynamicProperty(key, JSON.stringify(arr));
}

export function getTransactions(player) {
    const key = TRANSACTION_HISTORY_KEY(player);
    try {
        const raw = player.getDynamicProperty(key);
        if (raw) return JSON.parse(String(raw));
    } catch { }
    return [];
}

export function Bank(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    
    new ActionFormData()
        .title("§6§lBANK MENU")
        .body(`§fMoney: §e${currencySymbol}${formatNumber(money.toString())}\n§fBank: §e${currencySymbol}${formatNumber(bank.toString())}`)
        .button("§2§lDeposit", "textures/menu/bank/deposit.png")
        .button("§2§lWithdraw", "textures/menu/bank/withdraw.png")
        .button("§6§lTransactions", "textures/ui/lock_color.png")
        .button("§b§lTransfer", "textures/ui/FriendsIcon.png")
        .button("§c§lExit", "textures/ui/cancel.png")
        .show(player)
        .then(res => {
            if (res.canceled) return;
            switch (res.selection) {
                case 0: handleDeposit(player); break;
                case 1: handleWithdraw(player); break;
                case 2: showTransactions(player); break;
                case 3: handleBankTransfer(player); break;
                case 4: player.playSound("note.bass"); break;
            }
        })
        .catch(() => {
            player.sendMessage("§c§l[BANK] Error displaying menu. Please try again.");
        });
}

function handleBankTransfer(player) {
    const onlinePlayers = world.getPlayers().filter(p => p.name !== player.name);
    if (onlinePlayers.length === 0) {
        player.sendMessage("§c§l[BANK] No other players online.");
        player.playSound("note.bass");
        return;
    }
    
    new ActionFormData()
        .title("§b§lBANK TRANSFER")
        .body("§eSelect a player to transfer to:")
        .show(player)
        .then(res => {
            if (res.canceled) { Bank(player); return; }
            const target = onlinePlayers[res.selection];
            if (target) {
                handleBankTransferAmount(player, target);
            }
        });
}

function handleBankTransferAmount(player, target, errorMsg = "") {
    const bank = getBank(player);
    if (bank <= 0n) {
        player.sendMessage("§c§l[BANK] No money in bank to transfer.");
        player.playSound("note.bass");
        return;
    }
    
    const infoText = `To: ${target.name}\nYour Bank: ${currencySymbol}${formatNumber(bank.toString())}`;
    
    new ModalFormData()
        .title("§b§lBANK TRANSFER")
        .textField("§eInfo", infoText)
        .textField("§eAmount", "Enter amount")
        .show(player)
        .then(result => {
            if (result.canceled) { Bank(player); return; }
            
            const input = result.formValues[1];
            if (!input || !/^[0-9,]+$/.test(String(input).replace(/,/g, ""))) {
                player.sendMessage("§c§lPlease enter a valid amount.");
                handleBankTransferAmount(player, target);
                return;
            }
            
            const amount = BigInt(String(input).replace(/,/g, ""));
            if (amount <= 0n) {
                player.sendMessage("§c§lAmount must be greater than 0.");
                handleBankTransferAmount(player, target);
                return;
            }
            if (amount > bank) {
                player.sendMessage(`§c§lInsufficient funds. Bank: ${currencySymbol}${formatNumber(bank.toString())}`);
                handleBankTransferAmount(player, target);
                return;
            }
            
            const stillOnline = world.getPlayers().find(p => p.name === target.name);
            if (!stillOnline) {
                player.sendMessage("§c§lPlayer is no longer online.");
                Bank(player);
                return;
            }
            
            removeBank(player, amount);
            addBank(stillOnline, amount);
            addTransaction(player, `- ${currencySymbol}${formatNumber(amount.toString())} to ${target.name}`);
            addTransaction(stillOnline, `+ ${currencySymbol}${formatNumber(amount.toString())} from ${player.name}`);
            
            player.sendMessage(`§a§l[BANK] Transferred ${currencySymbol}${formatNumber(amount.toString())} to ${target.name}`);
            stillOnline.sendMessage(`§a§l[BANK] Received ${currencySymbol}${formatNumber(amount.toString())} from ${player.name}`);
            
            player.playSound("random.levelup");
            stillOnline.playSound("random.levelup");
            Bank(player);
        });
}

function handleDeposit(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    
    new ActionFormData()
        .title("§2§lDEPOSIT")
        .body(`§fMoney: §e${currencySymbol}${formatNumber(money.toString())}\n§fBank: §e${currencySymbol}${formatNumber(bank.toString())}\n\n§eSelect amount to deposit:`)
        .button("§d§lCUSTOM", "textures/ui/settings_glyph_color_2x.png")
        .button(`§a${currencySymbol}100`, "textures/ui/icon_map.png")
        .button(`§a${currencySymbol}1,000`, "textures/ui/icon_map.png")
        .button(`§a${currencySymbol}10,000`, "textures/ui/icon_map.png")
        .button(`§a${currencySymbol}100,000`, "textures/ui/icon_map.png")
        .button(`§a${currencySymbol}1,000,000`, "textures/ui/icon_map.png")
        .button("§a25%", "textures/ui/book_back.png")
        .button("§a50%", "textures/ui/book_back.png")
        .button("§aALL", "textures/ui/icon_map.png")
        .button("§c§lCANCEL", "textures/ui/cancel.png")
        .show(player)
        .then(res => {
            if (res.canceled || res.selection === 9) return;
            
            let amount = 0n;
            switch (res.selection) {
                case 0: handleCustomDeposit(player); return;
                case 1: amount = 100n; break;
                case 2: amount = 1000n; break;
                case 3: amount = 10000n; break;
                case 4: amount = 100000n; break;
                case 5: amount = 1000000n; break;
                case 6: amount = money / 4n; break;
                case 7: amount = money / 2n; break;
                case 8: amount = money; break;
            }
            
            if (amount > money) {
                player.sendMessage("§c§lInsufficient funds in wallet.");
                return;
            }
            
            if (removeMoney(player, amount)) {
                addBank(player, amount);
                player.sendMessage(`§a§l[BANK] Deposited ${currencySymbol}${formatNumber(amount.toString())}`);
                addTransaction(player, `+ ${currencySymbol}${formatNumber(amount.toString())}`);
                player.playSound("random.levelup");
            } else {
                player.sendMessage("§c§lFailed to process transaction.");
            }
        });
}

function handleCustomDeposit(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    
    new ModalFormData()
        .title("§2§lCUSTOM DEPOSIT")
        .textField(`§eBalance Info\n§fMoney: §a${currencySymbol}${formatNumber(money.toString())}\n§fBank: §a${currencySymbol}${formatNumber(bank.toString())}\n\n§eEnter amount`, "Enter amount")
        .show(player)
        .then(res => {
            if (res.canceled) { handleDeposit(player); return; }
            
            const input = res.formValues[0];
            if (!input || !/^[0-9,]+$/.test(String(input).replace(/,/g, ""))) {
                player.sendMessage("§c§lPlease enter a valid amount.");
                handleCustomDeposit(player);
                return;
            }
            
            const amount = BigInt(String(input).replace(/,/g, ""));
            if (amount <= 0n) {
                player.sendMessage("§c§lAmount must be greater than 0.");
                handleCustomDeposit(player);
                return;
            }
            if (amount > money) {
                player.sendMessage("§c§lInsufficient funds in wallet.");
                handleCustomDeposit(player);
                return;
            }
            
            if (removeMoney(player, amount)) {
                addBank(player, amount);
                player.sendMessage(`§a§l[BANK] Deposited ${currencySymbol}${formatNumber(amount.toString())}`);
                addTransaction(player, `+ ${currencySymbol}${formatNumber(amount.toString())}`);
                player.playSound("random.levelup");
                handleDeposit(player);
            }
        });
}

function handleWithdraw(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    
    if (bank <= 0n) {
        player.sendMessage("§c§l[BANK] No money in bank.");
        return;
    }
    
    new ActionFormData()
        .title("§2§lWITHDRAW")
        .body(`§fMoney: §e${currencySymbol}${formatNumber(money.toString())}\n§fBank: §e${currencySymbol}${formatNumber(bank.toString())}\n\n§eSelect amount to withdraw:`)
        .button("§d§lCUSTOM", "textures/ui/settings_glyph_color_2x.png")
        .button(`§a${currencySymbol}100`, "textures/ui/icon_book_writable.png")
        .button(`§a${currencySymbol}1,000`, "textures/ui/icon_book_writable.png")
        .button(`§a${currencySymbol}10,000`, "textures/ui/icon_book_writable.png")
        .button(`§a${currencySymbol}100,000`, "textures/ui/icon_book_writable.png")
        .button(`§a${currencySymbol}1,000,000`, "textures/ui/icon_book_writable.png")
        .button("§a25%", "textures/ui/book_back.png")
        .button("§a50%", "textures/ui/book_back.png")
        .button("§aALL", "textures/ui/icon_book_writable.png")
        .button("§c§lCANCEL", "textures/ui/cancel.png")
        .show(player)
        .then(res => {
            if (res.canceled || res.selection === 9) return;
            
            let amount = 0n;
            switch (res.selection) {
                case 0: handleCustomWithdraw(player); return;
                case 1: amount = 100n; break;
                case 2: amount = 1000n; break;
                case 3: amount = 10000n; break;
                case 4: amount = 100000n; break;
                case 5: amount = 1000000n; break;
                case 6: amount = bank / 4n; break;
                case 7: amount = bank / 2n; break;
                case 8: amount = bank; break;
            }
            
            if (amount > bank) {
                player.sendMessage("§c§lInsufficient funds in bank.");
                return;
            }
            
            removeBank(player, amount);
            addMoney(player, amount);
            player.sendMessage(`§a§l[BANK] Withdrew ${currencySymbol}${formatNumber(amount.toString())}`);
            addTransaction(player, `- ${currencySymbol}${formatNumber(amount.toString())}`);
            player.playSound("random.levelup");
        });
}

function handleCustomWithdraw(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    
    if (bank <= 0n) {
        player.sendMessage("§c§l[BANK] No money in bank.");
        return;
    }
    
    new ModalFormData()
        .title("§2§lCUSTOM WITHDRAW")
        .textField(`§eBalance Info\n§fMoney: §a${currencySymbol}${formatNumber(money.toString())}\n§fBank: §a${currencySymbol}${formatNumber(bank.toString())}\n\n§eEnter amount`, "Enter amount")
        .show(player)
        .then(res => {
            if (res.canceled) { handleWithdraw(player); return; }
            
            const input = res.formValues[0];
            if (!input || !/^[0-9,]+$/.test(String(input).replace(/,/g, ""))) {
                player.sendMessage("§c§lPlease enter a valid amount.");
                handleCustomWithdraw(player);
                return;
            }
            
            const amount = BigInt(String(input).replace(/,/g, ""));
            if (amount <= 0n) {
                player.sendMessage("§c§lAmount must be greater than 0.");
                handleCustomWithdraw(player);
                return;
            }
            if (amount > bank) {
                player.sendMessage("§c§lInsufficient funds in bank.");
                handleCustomWithdraw(player);
                return;
            }
            
            removeBank(player, amount);
            addMoney(player, amount);
            player.sendMessage(`§a§l[BANK] Withdrew ${currencySymbol}${formatNumber(amount.toString())}`);
            addTransaction(player, `- ${currencySymbol}${formatNumber(amount.toString())}`);
            player.playSound("random.levelup");
            handleWithdraw(player);
        });
}

function showTransactions(player) {
    const money = getMoney(player);
    const bank = getBank(player);
    const transactions = getTransactions(player);
    
    new ActionFormData()
        .title("§6§lTRANSACTIONS")
        .body(`§fMoney: §e${currencySymbol}${formatNumber(money.toString())}\n§fBank: §e${currencySymbol}${formatNumber(bank.toString())}\n\n§7(Max 10 latest)\n\n${transactions.length > 0 ? transactions.join("\n") : "§7No transactions yet."}`)
        .button("§c§lBack", "textures/ui/arrow_dark_left_stretch.png")
        .show(player)
        .then(() => Bank(player));
}

// Run bank menu when player has "bank" tag
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        if (player.hasTag("bank")) {
            Bank(player);
            player.removeTag("bank");
        }
    }
}, 20);
