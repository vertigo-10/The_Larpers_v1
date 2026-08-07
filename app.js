/* ============================================================
   SentryNet dashboard logic.
   Currently runs on MOCK DATA so the UI works standalone.
   To connect your real PyTorch model backend:
     1. Stand up an API that returns JSON like the shape in
        MOCK_PREDICTION() below (score, connections, table rows).
     2. Set CONFIG.apiUrl (or use the Settings page, which
        stores it in localStorage as 'sentrynet_api').
     3. Replace fetchData() body with the real fetch() call
        (a commented example is included below).
   ============================================================ */

const CONFIG = {
  apiUrl: localStorage.getItem('sentrynet_api') || null,
  pollMs: parseInt(localStorage.getItem('sentrynet_poll')) || 2000,
};

const MAX_POINTS = 30;
const scoreHistory = Array.from({length: MAX_POINTS}, () => Math.random()*0.3);
const labels = Array.from({length: MAX_POINTS}, (_,i) => i);

// ---- Chart.js setup ----
const ctx = document.getElementById('threatChart').getContext('2d');
const threatChart = new Chart(ctx, {
  type: 'line',
  data: { labels, datasets: [{
    data: scoreHistory, borderColor:'#00e6a8', borderWidth:2,
    pointRadius:0, tension:.3, fill:true,
    backgroundColor:'rgba(0,230,168,0.08)'
  }]},
  options: {
    animation:false,
    plugins:{ legend:{display:false} },
    scales:{
      x:{ display:false },
      y:{ min:0, max:1, grid:{color:'#1c2230'}, ticks:{color:'#7c8698'} }
    }
  }
});

const donutCtx = document.getElementById('trafficDonut').getContext('2d');
const trafficDonut = new Chart(donutCtx, {
  type:'doughnut',
  data:{ labels:['Benign','Suspicious','Malicious'],
    datasets:[{ data:[80,14,6], backgroundColor:['#00e6a8','#ffb020','#ff4d5e'], borderWidth:0 }]},
  options:{ plugins:{ legend:{display:false} }, cutout:'70%' }
});

// ---- Mock data generator (swap for real API) ----
function MOCK_PREDICTION(){
  const attackTick = Math.random() < 0.08;
  const score = attackTick ? 0.75 + Math.random()*0.25 : Math.random()*0.35;
  const rows = [];
  const routers = ['edge-r1','edge-r2','core-sw1'];
  for(let i=0;i<8;i++){
    const mal = Math.random() < (attackTick ? 0.4 : 0.03);
    rows.push({
      ip: `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      port: Math.floor(Math.random()*60000)+1024,
      duration: (Math.random()*12).toFixed(2)+'s',
      packets: Math.floor(Math.random()*(mal?9000:400)),
      router: routers[Math.floor(Math.random()*routers.length)],
      cls: mal ? 'alert' : (Math.random()<0.1?'warn':'safe')
    });
  }
  return {
    score, attackTick,
    connections: Math.floor(400 + Math.random()*300),
    packetsPerSec: Math.floor(2000 + Math.random()*8000 + (attackTick?20000:0)),
    rows
  };
}

async function fetchData(){
  if (CONFIG.apiUrl){
    // --- Real backend example ---
    // const res = await fetch(CONFIG.apiUrl);
    // return await res.json();
  }
  return MOCK_PREDICTION();
}

let attackCount = 0;

function classLabel(c){ return c==='alert'?'Malicious':(c==='warn'?'Suspicious':'Benign'); }

async function tick(){
  const data = await fetchData();

  // update chart
  scoreHistory.shift(); scoreHistory.push(data.score);
  threatChart.data.datasets[0].data = scoreHistory;
  threatChart.data.datasets[0].borderColor = data.score>0.7 ? '#ff4d5e' : '#00e6a8';
  threatChart.data.datasets[0].backgroundColor = data.score>0.7 ? 'rgba(255,77,94,0.1)' : 'rgba(0,230,168,0.08)';
  threatChart.update();

  // update stat cards
  document.getElementById('statConns').textContent = data.connections;
  document.getElementById('statPkts').textContent = data.packetsPerSec.toLocaleString();
  const scoreEl = document.getElementById('statScore');
  scoreEl.textContent = data.score.toFixed(2);
  scoreEl.className = 'value ' + (data.score>0.7?'alert':'safe');

  if (data.attackTick) attackCount++;
  document.getElementById('statAttacks').textContent = attackCount;

  // status pill
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (data.score>0.7){ dot.style.background='#ff4d5e'; dot.style.boxShadow='0 0 6px #ff4d5e'; txt.textContent='Attack pattern detected'; }
  else { dot.style.background='#00e6a8'; dot.style.boxShadow='0 0 6px #00e6a8'; txt.textContent='Model connected · monitoring'; }

  // table
  const tbody = document.getElementById('liveTable');
  tbody.innerHTML = data.rows.map(r => `
    <tr>
      <td>${r.ip}</td>
      <td>${r.port}</td>
      <td>${r.duration}</td>
      <td>${r.packets.toLocaleString()}</td>
      <td>${r.router}</td>
      <td><span class="badge ${r.cls}">${classLabel(r.cls)}</span></td>
    </tr>`).join('');
  document.getElementById('tableUpdated').textContent = 'updated ' + new Date().toLocaleTimeString();
}

tick();
setInterval(tick, CONFIG.pollMs);
