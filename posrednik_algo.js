class Supplier {
    constructor(id, name, supply, buyPrice) {
        this.id = id;
        this.name = name;
        this.supply = supply;
        this.buyPrice = buyPrice;
        this.isDummy = false;
    }
}

class Receiver {
    constructor(id, name, demand, sellPrice) {
        this.id = id;
        this.name = name;
        this.demand = demand;
        this.sellPrice = sellPrice;
        this.isDummy = false;
    }
}

function solveIntermediary(suppliers, receivers, transportCosts, blockedRoutes = []) {
    
    let workSuppliers = suppliers.map(s => ({...s}));
    let workReceivers = receivers.map(r => ({...r}));

    let totalSupply = workSuppliers.reduce((sum, s) => sum + s.supply, 0);
    let totalDemand = workReceivers.reduce((sum, r) => sum + r.demand, 0);

    if (totalSupply > totalDemand) {
        workReceivers.push({
            id: workReceivers.length,
            name: "Odbiorca FIKCYJNY",
            demand: totalSupply - totalDemand,
            sellPrice: 0,
            isDummy: true
        });
    } else if (totalDemand > totalSupply) {
        workSuppliers.push({
            id: workSuppliers.length,
            name: "Dostawca FIKCYJNY",
            supply: totalDemand - totalSupply,
            buyPrice: 0,
            isDummy: true
        });
    }

    let workCosts = transportCosts.map(row => [...row]);
    if (totalSupply > totalDemand) workCosts.forEach(row => row.push(0));
    if (totalDemand > totalSupply) workCosts.push(new Array(workReceivers.length).fill(0));

    let routes = [];
    let currentSupply = workSuppliers.map(s => s.supply);
    let currentDemand = workReceivers.map(r => r.demand);

    const isBlocked = (i, j) => {
        if (workSuppliers[i].isDummy || workReceivers[j].isDummy) return false;
        return blockedRoutes.some(r => r[0] === workSuppliers[i].id && r[1] === workReceivers[j].id);
    };


    let receiversWithBlocks = [];
    for (let j = 0; j < workReceivers.length; j++) {
        for (let i = 0; i < workSuppliers.length; i++) {
            if (isBlocked(i, j) && !receiversWithBlocks.includes(j)) {
                receiversWithBlocks.push(j);
            }
        }
    }
    receiversWithBlocks.sort((a, b) => a - b);

    for (let j of receiversWithBlocks) {
        for (let i = 0; i < workSuppliers.length; i++) {
            if (currentDemand[j] > 0 && currentSupply[i] > 0 && !isBlocked(i, j)) {
                let amount = Math.min(currentSupply[i], currentDemand[j]);
                currentSupply[i] -= amount;
                currentDemand[j] -= amount;
                routes.push({ supplierIdx: i, receiverIdx: j, amount: amount });
            }
        }
    }


    let i = 0;
    let j = 0;
    while (i < workSuppliers.length && j < workReceivers.length) {
        if (currentSupply[i] === 0) { 
            i++; 
            continue; 
        }

        if (currentDemand[j] === 0) { 
            j++; 
            continue; 
        }

        if (isBlocked(i, j)) {
            j++;
            continue;
        }

        let amount = Math.min(currentSupply[i], currentDemand[j]);
        currentSupply[i] -= amount;
        currentDemand[j] -= amount;

        routes.push({ supplierIdx: i, receiverIdx: j, amount: amount });

        if (currentSupply[i] === 0 && currentDemand[j] === 0) {
            i++;
            j++;
        } else if (currentSupply[i] === 0) {
            i++;
        } else {
            j++;
        }
    }


    let totalPurchaseCost = 0;
    let totalTransportCost = 0;
    let totalRevenue = 0;
    const BIG_M = 999999;

    for (let route of routes) {
        let s = workSuppliers[route.supplierIdx];
        let r = workReceivers[route.receiverIdx];
        
        let amount = route.amount;
        
        let costT = isBlocked(route.supplierIdx, route.receiverIdx) ? BIG_M : workCosts[route.supplierIdx][route.receiverIdx];
        
        if (!s.isDummy && !r.isDummy) {
            totalPurchaseCost += amount * s.buyPrice;
            totalTransportCost += amount * costT;
            totalRevenue += amount * r.sellPrice;
        }
    }

    let totalProfit = totalRevenue - totalPurchaseCost - totalTransportCost;

    return {
        suppliers: workSuppliers,
        receivers: workReceivers,
        activeRoutes: routes.filter(r => r.amount > 0),
        financials: { totalPurchaseCost, totalTransportCost, totalRevenue, totalProfit }
    };
}

module.exports = { Supplier, Receiver, solveIntermediary };