const http = require('http');
const fs = require('fs');
const path = require('path');
const { Supplier, Receiver, solveIntermediary } = require('./posrednik_algo.js');

const PORT = 3000;

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });

        req.on('error', reject);
    });
}

function buildMatrixData(result, transportCosts, blockedRoutes) {
    const suppliers = result.suppliers;
    const receivers = result.receivers;

    const transportMatrix = [];
    const profitMatrix = [];
    const solutionMatrix = [];
    

    for (let i = 0; i < suppliers.length; i++) {
        transportMatrix[i] = [];
        profitMatrix[i] = [];
        solutionMatrix[i] = [];

        for (let j = 0; j < receivers.length; j++) {
            const isBlocked = (i, j) => {
                return blockedRoutes.some(route => route[0] === i && route[1] === j);
            };
            const transportCost = transportCosts[i]?.[j] ?? 0;

            transportMatrix[i][j] = transportCost;

            if (isBlocked(i, j)) {
                profitMatrix[i][j] = "X";
            } else if (suppliers[i].isDummy || receivers[j].isDummy) {
                profitMatrix[i][j] = 0;
            } else {
                profitMatrix[i][j] =
                    receivers[j].sellPrice -
                    suppliers[i].buyPrice -
                    transportCost;
            }

            solutionMatrix[i][j] = 0;
        }
    }

    for (const route of result.activeRoutes) {
        solutionMatrix[route.supplierIdx][route.receiverIdx] = route.amount;
    }

    return {
        transportMatrix,
        profitMatrix,
        solutionMatrix
    };
}

function buildGraphData(result) {
    const visNodes = [];
    const visEdges = [];

    const realSuppliers = result.suppliers.filter(s => !s.isDummy);
    const realReceivers = result.receivers.filter(r => !r.isDummy);

    realSuppliers.forEach((s, idx) => {
        visNodes.push({
            id: 'S' + s.id,
            label: `${s.name}\nPodaż: ${s.supply}\nCena zakupu: ${s.buyPrice} zł`,
            x: 0,
            y: (idx - realSuppliers.length / 2) * 130,
            shape: 'box',
            color: { background: '#e3f2fd', border: '#1565c0' },
            font: { face: 'monospace', size: 14 }
        });
    });

    realReceivers.forEach((r, idx) => {
        visNodes.push({
            id: 'R' + r.id,
            label: `${r.name}\nPopyt: ${r.demand}\nCena sprz.: ${r.sellPrice} zł`,
            x: 600,
            y: (idx - realReceivers.length / 2) * 130,
            shape: 'box',
            color: { background: '#f3e5f5', border: '#6a1b9a' },
            font: { face: 'monospace', size: 14 }
        });
    });

    result.activeRoutes.forEach(route => {
        const supplier = result.suppliers[route.supplierIdx];
        const receiver = result.receivers[route.receiverIdx];

        if (supplier.isDummy || receiver.isDummy) return;

        visEdges.push({
            from: 'S' + supplier.id,
            to: 'R' + receiver.id,
            label: `${route.amount} szt.`,
            font: {
                align: 'middle',
                background: '#ffffff',
                strokeWidth: 2,
                strokeColor: '#ffffff'
            },
            arrows: 'to',
            color: { color: '#2e7d32', highlight: '#1b5e20' },
            width: 2,
            smooth: false
        });
    });

    return {
        nodesData: visNodes,
        edgesData: visEdges
    };
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'GET' && req.url === '/') {
            const htmlTemplatePath = path.join(__dirname, 'index.html');
            const htmlContent = fs.readFileSync(htmlTemplatePath, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(htmlContent);
            return;
        }

        if (req.method === 'POST' && req.url === '/solve') {
            const body = await readRequestBody(req);

            const suppliers = body.suppliers.map((s, index) => {
                return new Supplier(
                    index,
                    s.name,
                    Number(s.supply),
                    Number(s.buyPrice)
                );
            });

            const receivers = body.receivers.map((r, index) => {
                return new Receiver(
                    index,
                    r.name,
                    Number(r.demand),
                    Number(r.sellPrice)
                );
            });

            const transportCosts = body.transportCosts.map(row =>
                row.map(value => Number(value))
            );

            const blockedRoutes = body.blockedRoutes || [];

            const result = solveIntermediary(
                suppliers,
                receivers,
                transportCosts,
                blockedRoutes
            );

            const graphData = buildGraphData(result);
            const matrixData = buildMatrixData(result, transportCosts, blockedRoutes);

            const response = {
                suppliers: result.suppliers,
                receivers: result.receivers,
                activeRoutes: result.activeRoutes,
                financials: result.financials,
                ...graphData,
                ...matrixData
            };

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(response));
            return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');

    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            error: error.message,
            stack: error.stack
        }));
    }
});

server.listen(PORT, () => {
    console.log(`Serwer działa na: http://localhost:${PORT}`);
});