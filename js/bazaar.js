var API_KEY = "f7e71d5d-ebc0-4add-bdc7-ce1b859c2ad7"

const bazaar_req = new Request("https://api.hypixel.net/v2/skyblock/bazaar?key=" + API_KEY);
const mayor_req = new Request("https://api.hypixel.net/v2/resources/skyblock/election?key=" + API_KEY);
const item_req = new Request("https://api.hypixel.net/v2/resources/skyblock/items?key=" + API_KEY);



const nFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0 });

var displayedItems = [];
var apiResponse = [];
var bazaarItems = [];
var skyblockItems = [];

var npcProfitTrades = []; // items profiteables de npc

var bazaarWeek = []; // Historico
var bazaarDay = []; // Historico
var bazaarHour = []; // Historico

var madeRequest = false;



function main() {
    console.log("Loaded main()");
    APIRequest();
    setInterval(() => {
        if (madeRequest) {

            CreateTrade();
            madeRequest = false;
            console.log(bazaarWeek);
            createSearchBar()

            /* console.log("precio venta start: " + bazaarWeek["ENCHANTED_RED_MUSHROOM"][81].maxSell);
             console.log("precio venta end: " + bazaarWeek["ENCHANTED_RED_MUSHROOM"][0].maxSell);
             var projectedPrice = f_GetProjectedGrowth(bazaarWeek["ENCHANTED_RED_MUSHROOM"]);
             console.log(projectedPrice);
             */
        }
    }, 2000); //ms
}

function UpdateData() {
    const div = document.getElementById("Trades");
    while(div.firstChild){
        div.removeChild(div.lastChild);
    }
    var apiResponse = [];
    var bazaarItems = [];
    var skyblockItems = [];
    APIRequest()
}

function APIRequest() {
    fetch(bazaar_req)
        .then((response) => response.json())
        .then((data) => {
            apiResponse = data;
            bazaarItems = Object.values(apiResponse.products);
        });
    fetch(item_req)
        .then((response) => response.json())
        .then((data) => {
            skyblockItems = data.items;
        });

    madeRequest = true;
}

// test de searchbar + suggestions (no creo que ande. no puedo prometer nada. TODO por las dudas)

function createSearchBar() {
    const searchInput = document.getElementById("search");
    const suggestionsBox = document.getElementById("suggestions");

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        suggestionsBox.innerText = "";

        if (query) {
            const filtered = bazaarItems.filter(item => item.product_id.toLowerCase().startsWith(query))

            filtered.forEach(item => {
                const div = document.createElement("div");
                div.classList.add("suggestion-item");
                div.textContent = item.product_id;
                div.addEventListener("click", () => {
                    searchInput.value = item.product_id;
                    suggestionsBox.innerHTML = '';
                })
                suggestionsBox.appendChild(div);
            });
        }
    })

    /*
    document.addEventListener("click", (e) => {
        if (!document.getElementById("search-container").contains(e.target)) {
            suggestionsBox.innerHTML = "";
        }
    })
    */
}

function PickItem() {
    const searchInput = document.getElementById("search");
    CreateCardForSpecificItem(searchInput.value)
}

function CreateCardForSpecificItem(itemName) {
    const div = document.getElementById("ItemSearcher");
    item = bazaarItems.find(item => item.product_id == itemName);
    if (!displayedItems.includes(itemName)) {
        div.appendChild(NPCTradesViewer(item))
    }
}



function GetHistoryWeek(itemName) {
    fetch("https://sky.coflnet.com/api/bazaar/" + itemName + "/history/week")
        .then((response) => response.json())
        .then((data) => {
            bazaarWeek[itemName] = Object.values(data); // risky
        });

    madeRequest = true;
}

function GetHistoryDay(itemName) {
    fetch("https://sky.coflnet.com/api/bazaar/" + itemName + "/history/day")
        .then((response) => response.json())
        .then((data) => {
            bazaarDay[itemName] = data; // risky
            console.log(bazaarDay);
        });

    madeRequest = true;
}

function GetHistoryHour(itemName) {
    fetch("https://sky.coflnet.com/api/bazaar/" + itemName + "/history/hour")
        .then((response) => response.json())
        .then((data) => {
            bazaarHour[itemName] = data; // risky
            console.log(bazaarHour);
        });

    madeRequest = true;
}

function SortNPCProfits() {
    var i = 0;
    bazaarItems.forEach(element => {
        var npc_profit = GetNPCProfit(element);
        if (npc_profit > 0) {
            npcProfitTrades[i] = element;
            npcProfitTrades[i].profit = npc_profit;
            i++;
        }
    });
    npcProfitTrades.sort(function (a, b) { return b.profit - a.profit });
}

function CalcProfit(item) {
    var sellPrice = Math.ceil(item.quick_status.sellPrice);
    var buyPrice = Math.ceil(item.quick_status.buyPrice);
    if (buyPrice == 0) return 0;
    return buyPrice - sellPrice;
}

function f_GetProjectedGrowth(itemHistory, itemName) { //fast_GetProjectedGrowth -> menos preciso pero muchisimo menos calculo
    // TODO: intentar implementarlo en diferentes threads, 
    // podria ser una tool muy util para trades cortos
    // idealmente usariamos el metodo preciso para la proyeccion a largo plazo
    // y la rapida para la proyeccion a corto plazo
    //
    // METODO ACTUAL: USANDO ALTOS EN START Y END

    var weekEnd = itemHistory[itemName][0];
    var weekStart = itemHistory[itemName][81];

    var weekEndSellPeak = weekEnd.maxSell;
    var weekEndBuyPeak = weekEnd.maxBuy;
    var weekEndSellLow = weekEnd.minSell;
    var weekEndBuyLow = weekEnd.minBuy;

    var weekStartSellPeak = weekStart.maxSell;
    var weekStartBuyPeak = weekStart.maxBuy;
    var weekStartSellLow = weekStart.minSell;
    var weekStartBuyLow = weekStart.minBuy;

    // Podemos solucionar ese pequenio problemita usando solo los altos de start y end
    var hourlyChange = (weekEndSellPeak - weekStartSellPeak) / 82;
    var projectedGrowth = itemHistory[0].sell + (hourlyChange * 84);

    if (projectedGrowth <= 0) return 0;

    //Proyeccion de una semana siguiendo la misma tendencia
    return projectedGrowth;
}

function p_GetProjectedGrowth(item_history) { //precise_GetProjectedGrowth
    //TODO: implementar, calcularlos en diferentes threads para mayor rendimiento?
    return 0;
}

function GetNPCProfit(item) {
    // Si el volumen de venta es mayor a 50.000 por semana
    // sellVolume -> supply
    // sellMovingWeek -> instasells
    // buyVolume -> demand
    // buyMovingWeek -> instabuys
    var sellPrice = item.quick_status.sellPrice;
    if (sellPrice < 400) return 0; // No queremos items gigabaratos porque son producto de manipulacion o bugs de API
    var instasells = item.quick_status.sellMovingWeek;
    var npc_diff = GetNPCDiff(item)
    if (instasells > 50000 && npc_diff > 0) {
        var estimated_profit = Math.ceil((instasells / 168) * npc_diff);
        return estimated_profit;
    }
    else return 0;
}

function GetNPCDiff(item) { //TODO: arreglar
    var buyPrice = 0;
    var npcSell = 0;
    var diff;

    var x = skyblockItems.findIndex(i => i.id == item.product_id);

    if (x == -1) { return 0; }
    //npcSell tiene que ser mayor a buyPrice para que haya profit, por ende
    //diff = npcSell - buyPrice -> si diff es positivo, return diff
    //si no, al no haber posibilidad de profit ya queda descartado y devolvemos 0
    if (skyblockItems[x].npc_sell_price == 1) { return 0; }

    npcSell = skyblockItems[x].npc_sell_price;
    sellPrice = Math.ceil(item.quick_status.sellPrice);
    diff = npcSell - sellPrice;

    if (diff > 0) { return diff; }
    return 0;
}

function GetInstantOrderDiff(item) {
    var sellOrders = Math.ceil(item.quick_status.sellOrders);
    var buyOrders = Math.ceil(item.quick_status.buyOrders);
    var diffRaw = buyOrders - sellOrders;

    var diff = diffRaw / sellOrders;
    if (diff == Infinity) return 0;
    return Math.ceil(diff);
}

function CreateTrade() {
    SortNPCProfits();
    const list = document.getElementById("Trades");
    npcProfitTrades.forEach(item => {
        list.appendChild(NPCTradesViewer(item));
        //var image = TODO (lo hace el gordo esto kkkkkkkkkkk)
    });
    madeRequest = false;
}

function NPCTradesViewer(gameItem) {
    var imgItem = document.createElement("img");
    imgItem.src = "https://sky.coflnet.com/static/icon/" + gameItem.product_id;
    var productIdText = document.createElement("P");
    productIdText.textContent = gameItem.product_id.replace(/_/g, " ");
    productIdText.id = "ProductID";
    var buyPriceText = document.createElement("p");
    buyPriceText.textContent = "BUY: " + nFormat.format(Math.ceil(gameItem.quick_status.sellPrice));
    var npcSellText = document.createElement("p");
    npcSellText.textContent = "NPC SELL: " + nFormat.format(Math.ceil(GetNPCDiff(gameItem) + gameItem.quick_status.sellPrice));
    var hourlyProfitText = document.createElement("p");
    hourlyProfitText.textContent = "PROFIT/h: " + nFormat.format(gameItem.profit);

    var weekInstasellsText = document.createElement("p");
    weekInstasellsText.textContent = "INSTASELLS/h: " + nFormat.format(Math.ceil(gameItem.quick_status.sellMovingWeek / 168));



    var divMain = document.createElement("div");
    divMain.id = "TradesMainDiv";
    divMain.appendChild(imgItem);
    divMain.appendChild(productIdText);
    divMain.appendChild(buyPriceText);
    divMain.appendChild(npcSellText);
    divMain.appendChild(hourlyProfitText);
    divMain.appendChild(weekInstasellsText);
    displayedItems.push(gameItem.product_id);

    if (gameItem.profit > 50000000) {
        divMain.className = "ManipulatedItem"
    }

    return divMain;
}
