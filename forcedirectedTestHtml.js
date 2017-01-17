const writeFile = require('fs').writeFile;

const createGraph = require('ngraph.graph');
const ngraphLayout = require('ngraph.forcelayout.v2');

let graph;
let layout;

function getRandomNum(max) {
  return Math.round(Math.random() * (max - 1) + 1);
}

function makeGraph(numOfNodes, percent) {
  for (let i = 0; i < numOfNodes; i++) {
    graph.addNode(`#${i}`);
  }

  const numOfNeighbours = Math.round(numOfNodes * (percent / 100));

  for (let i = 0; i < numOfNodes; i++) {
    for (let j = 0; j < numOfNeighbours; j++) {
      graph.addLink(`#${i}`, `#${getRandomNum(numOfNodes)}`);
    }
  }

  layout = ngraphLayout(graph);
}

function iterate(max) {
  for (let i = 0; i < max; i++) {
    layout.step();
  }
}

// ############################################################################

let htmls = [];

const numOfNodes = [
  10, 30, 50, 70
  , 100, 150, 200, 300
  , 400, 500
  // , 750, 1000, 1500, 2000
]
numOfNodes.forEach(n => {
  for(let perc = 10; perc <= 10; perc += 10) { // <= 20
    graph = createGraph();
    makeGraph(n, perc);
    let iterations = 0;
    for(let iterationCoeff = 1; iterationCoeff <= 10 && (iterations < 1 || (n * perc * iterationCoeff <= 2000)); iterationCoeff += 1) { // <= 10
      iterate(n * perc);
      // --------------------------------
      calcLayout(htmls, layout, graph, n, perc, iterationCoeff);
      //
      iterations++;
    }
    htmls.push('<br/>==============================<br/>');
  }
});

//const fileName = `./test/test_src/Test_forcelayouts.html`;
const fileName = `./Test_forcelayouts.html`;
writeFile(fileName, htmls.join('<br/>------------------------------<br/>'), (err) => {
  if (err) {
    console.log(`Error writing HTML file: '${fileName}'.`);
    console.log(err);
  }
  console.log(`HTML file written: '${fileName}'`);
});

function calcLayout(htmls, layout, graph, n, perc, iterationCoeff) {
  let nodes = [];
  graph.forEachNode(node => {
    const nodePos = layout.getNodePosition(node.id);
    nodes.push({x: Math.round(nodePos.x), y: Math.round(nodePos.y)});
  });
  let links = [];
  graph.forEachLink(link => {
    const linkPos = layout.getLinkPosition(link.id);
    links.push({
      from: {x: Math.round(linkPos.from.x), y: Math.round(linkPos.from.y)},
      to: {x: Math.round(linkPos.to.x), y: Math.round(linkPos.to.y)}
    });
  });
  // calc scaleFactor
  const scaleFactor = [
    {nLte: 20, scaleFactor: 1},
    {nLte: 100, scaleFactor: 2},
    {nLte: 500, scaleFactor: 2.5},
    {nLte: 1000, scaleFactor: 3},
    {nLte: 1000000, scaleFactor: 4}
  ].find(({nLte, scaleFactor}) => n < nLte).scaleFactor;
  //
  console.log("%%%%%%%%%%%%%%%%%%%%%%%%");
  console.log(JSON.stringify(nodes, null, 2));
  htmls.push(getHtml(nodes, links, n, perc, iterationCoeff,
    `topology layout for ${n} nodes, ${perc}% connections and ${n * perc * iterationCoeff} iterations`,
    scaleFactor
  ));
}

function getHtml(nodes, links, n, perc, iterationCoeff, testCaseName, scaleFactor) {
    console.log("### " + testCaseName);
    const xMargin = 30;
    const yMargin = 30;
    //const scaleFactor = 3;
    const boxWidth = 20;
    const boxHeight = 20;
    let xArr = nodes.map((node) => node.x).sort((a, b) => a - b);
    console.log(xArr);
    let yArr = nodes.map((node) => node.y).sort((a, b) => a - b);
    console.log(yArr);
    const widthShift = (xArr[0] < 0) ? (0 - xArr[0]) : 0;
    const heightShift = (yArr[0] < 0) ? (0 - yArr[0]) : 0;
    const width = xArr.slice(-1)[0] + widthShift; // + 2 * xMargin;
    const height = yArr.slice(-1)[0] + heightShift; // + 2 * yMargin;
    console.log(`widthShift: ${widthShift} -> width: ${width},^nheightShift: ${heightShift} -> height: ${height}`);
    // recalculates coordinates using widthShift & heightShift
    nodes = nodes.map(node => {
      return {
        x: scaleFactor * (node.x + widthShift) + xMargin,
        y: scaleFactor * (node.y + heightShift) + yMargin
      };
    });
    links = links.map(link => {
      return {
        from: {
          x: scaleFactor * (link.from.x + widthShift) + xMargin,
          y: scaleFactor * (link.from.y + heightShift) + yMargin
        },
        to: {
          x: scaleFactor * (link.to.x + widthShift) + xMargin,
          y: scaleFactor * (link.to.y + heightShift) + yMargin
        }
      };
    });
    console.log(JSON.stringify(nodes, null, 2));
    //console.log(JSON.stringify(links, null, 2));
    //return;
    let toFile = "";
    toFile += `<p>${testCaseName}</p>\n`;
    toFile += `<p>width="${width}" height="${height}"</p><p>${(new Date()).toLocaleString()}</p>\n`;
    toFile += `<svg width="${scaleFactor * width + 2 * xMargin}" height="${scaleFactor * height + 2 * yMargin}">\n`;
    // light gray = node box
    toFile += nodes.map(({ x, y }, index) => `<g>
  <rect x="${x - boxWidth / 2}" y="${y - boxHeight / 2}" width="${boxWidth}" height="${boxHeight}" style="fill:gray;stroke:gray;stroke-width:1;fill-opacity:0.5;stroke-opacity:0.5" />
  <text x="${x - boxWidth / 2}" y="${y - boxHeight / 2}" font-family="Verdana" font-size="15" fill="blue" >${index}</text>
</g>
`).join(' ') + "\n";
    // black line
    toFile += links.map(({ from, to }) => {
        return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke-width="1" stroke="black" />`
      }).join(' ') + "\n";
    // blue = center
    toFile += nodes.map(({ x, y }) => `<circle r="2" cx= "${x}" cy= "${y}" fill= "blue" />`).join(' ') + "\n";
    toFile += '</svg>';
    //console.log(toFile);
    console.log("### " + testCaseName);
    return toFile;
}