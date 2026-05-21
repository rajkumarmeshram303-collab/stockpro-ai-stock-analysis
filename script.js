// --- Mock Data ---
const initialStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 1.2, volume: '50M', trend: 'increasing', rsi: 65 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 310.50, change: -0.5, volume: '30M', trend: 'decreasing', rsi: 45 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.00, change: 0.8, volume: '10M', trend: 'stable', rsi: 55 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.10, change: 2.1, volume: '15M', trend: 'increasing', rsi: 72 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 750.00, change: -3.5, volume: '40M', trend: 'decreasing', rsi: 85 },
  { symbol: 'META', name: 'Meta Platforms', price: 330.00, change: 0.0, volume: '20M', trend: 'stable', rsi: 50 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 220.50, change: 5.4, volume: '60M', trend: 'increasing', rsi: 78 }
];

const tradingQuotes = [
  "\"The stock market is filled with individuals who know the price of everything, but the value of nothing.\" – Philip Fisher",
  "\"In investing, what is comfortable is rarely profitable.\" – Robert Arnott",
  "\"How many millionaires do you know who have become wealthy by investing in savings accounts? I rest my case.\" – Robert G. Allen",
  "\"The individual investor should act consistently as an investor and not as a speculator.\" – Ben Graham",
  "\"Risk comes from not knowing what you're doing.\" – Warren Buffett"
];

// Initialize LocalStorage Data if not present
if (!localStorage.getItem('stocks')) {
  localStorage.setItem('stocks', JSON.stringify(initialStocks));
}
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify([]));
}
if (!localStorage.getItem('transactions')) {
  localStorage.setItem('transactions', JSON.stringify([]));
}
if (!localStorage.getItem('portfolio')) {
  localStorage.setItem('portfolio', JSON.stringify({ balance: 100000, holdings: {} })); // $100,000 starting paper money
}

// --- Utility Functions ---
function getStocks() { return JSON.parse(localStorage.getItem('stocks')); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('currentUser')); }
function getPortfolio() { return JSON.parse(localStorage.getItem('portfolio')); }
function savePortfolio(portfolio) { localStorage.setItem('portfolio', JSON.stringify(portfolio)); }
function getTransactions() { return JSON.parse(localStorage.getItem('transactions')); }
function saveTransactions(transactions) { localStorage.setItem('transactions', JSON.stringify(transactions)); }

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function showNotification(message, type = 'success') {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;

  container.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// --- Global Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Remove loading screen if exists
  const loader = document.getElementById('loading-screen');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }, 500);
  }

  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  // Inject Global Search & Modal into topbar if it exists (not on index.html)
  if (page !== 'index.html') {
    setupGlobalSearchAndModal();
  } else {
    // Show random positive thought on index entry
    const quote = tradingQuotes[Math.floor(Math.random() * tradingQuotes.length)];
    setTimeout(() => {
      showNotification(quote, 'success');
    }, 1000);
  }

  // Auth Guard
  const user = getCurrentUser();
  if (!user && page !== 'index.html') {
    window.location.href = 'index.html';
    return;
  }
  if (user && page === 'index.html') {
    window.location.href = 'dashboard.html';
    return;
  }

  // Set User Info
  const userNameEl = document.getElementById('user-name');
  if (userNameEl && user) {
    userNameEl.textContent = user.name;
  }

  // Logout Logic
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  }

  // Highlight Active Sidebar Link
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === page) {
      link.classList.add('active');
    }
  });

  // Page Specific Logic Routing
  if (page === 'index.html') initAuth();
  if (page === 'dashboard.html') initDashboard();
  if (page === 'market.html') initMarket();
  if (page === 'portfolio.html') initPortfolio();
  if (page === 'ai-recommendation.html') initAI();
  if (page === 'about.html') initAbout();
});

// --- Global Search & Modal Logic ---
function setupGlobalSearchAndModal() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  // Insert Search Bar
  const searchHtml = `
    <div class="global-search" style="margin-left: 20px; flex: 1; max-width: 400px;">
      <i class="fas fa-search"></i>
      <input type="text" id="global-search-input" placeholder="Search any stock symbol & get AI prediction...">
    </div>
  `;
  const topbarTitle = topbar.querySelector('h2');
  if (topbarTitle) {
    topbarTitle.insertAdjacentHTML('afterend', searchHtml);
  }

  // Insert Modal
  const modalHtml = `
    <div class="modal-overlay" id="search-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-stock-title">Stock Details</h2>
          <button class="modal-close" id="close-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="chart-section">
            <h3>Live Chart</h3>
            <div class="chart-container" id="tv-chart-container"></div>
          </div>
          <div class="ai-section">
            <div class="card" style="margin-bottom: 20px; text-align: center;">
              <h3>Buyer Sentiment</h3>
              <div id="sentiment-chart-container"></div>
              <div class="sentiment-label" id="sentiment-text">--</div>
            </div>
            <div class="card" style="text-align: center;">
              <h3>AI Recommendation</h3>
              <div id="ai-global-decision" style="font-size: 2rem; margin-top: 10px; font-weight: bold;">--</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const searchInput = document.getElementById('global-search-input');
  const modal = document.getElementById('search-modal');
  const closeBtn = document.getElementById('close-modal');

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== '') {
      const symbol = searchInput.value.trim().toUpperCase();
      openStockModal(symbol);
      searchInput.value = '';
    }
  });
}

function openStockModal(symbol) {
  const modal = document.getElementById('search-modal');
  document.getElementById('modal-stock-title').innerHTML = `<i class="fas fa-chart-bar"></i> ${symbol} Analysis`;
  modal.classList.add('active');

  const tvContainer = document.getElementById('tv-chart-container');
  tvContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; margin-top: 200px;">Loading live data from Alpha Vantage...<br><small>(Note: Free API is limited to 25 requests/day)</small></div>';

  // Load Chart.js and Plugins dynamically if needed, then fetch data
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
    script.onload = () => {
      // Load Hammer.js for panning/gestures
      const hammerScript = document.createElement('script');
      hammerScript.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8';
      document.head.appendChild(hammerScript);
      hammerScript.onload = () => {
        // Load Zoom Plugin
        const zoomScript = document.createElement('script');
        zoomScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js';
        document.head.appendChild(zoomScript);
        zoomScript.onload = () => fetchAndRenderAlphaVantage(symbol, tvContainer, 'alpha-chart', true);
      };
    };
  } else {
    fetchAndRenderAlphaVantage(symbol, tvContainer, 'alpha-chart', true);
  }
}

async function fetchAndRenderAlphaVantage(symbol, container, canvasId, isModal = false) {
  const apiKey = 'X20LENP25AN15KFT';

  try {
    // Fetch Time Series Data for Chart
    const tsRes = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
    const tsData = await tsRes.json();

    // Check for API limits
    if (tsData.Information || tsData.Note || !tsData['Time Series (Daily)']) {
      throw new Error(tsData.Information || tsData.Note || 'API Rate Limit Reached or Invalid Symbol');
    }

    const timeSeries = tsData['Time Series (Daily)'];
    const dates = Object.keys(timeSeries).slice(0, 30).reverse(); // Last 30 days
    const prices = dates.map(d => parseFloat(timeSeries[d]['4. close']));
    const opens = dates.map(d => parseFloat(timeSeries[d]['1. open']));
    const volumes = dates.map(d => parseFloat(timeSeries[d]['5. volume']));

    // Calculate mock RSI based on prices (simplified)
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2] || currentPrice;
    const isUp = currentPrice > prevPrice;
    const randTrend = isUp ? 'increasing' : 'decreasing';
    const randRsi = isUp ? Math.floor(Math.random() * 20) + 50 : Math.floor(Math.random() * 20) + 30;
    const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const volMillions = (avgVol / 1000000).toFixed(1);

    // Calculate diffs for red/green bars
    const diffs = prices.map((close, i) => close - opens[i]);
    const bgColors = diffs.map(diff => diff >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'); // Green/Red
    const borderColors = diffs.map(diff => diff >= 0 ? '#059669' : '#dc2626');

    // Render Chart
    container.innerHTML = `<canvas id="${canvasId}"></canvas>`;
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates.map(d => d.substring(5)), // MM-DD
        datasets: [
          {
            label: `${symbol} Price`,
            data: diffs,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Volume',
            data: volumes,
            backgroundColor: 'rgba(148, 163, 184, 0.3)', // light gray/slate for volume
            borderColor: 'rgba(148, 163, 184, 0.5)',
            borderWidth: 1,
            yAxisID: 'y1',
            type: 'bar' // explicitly set to bar though the whole chart is bar
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#1e293b' } },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x', // Allow panning horizontally
              modifierKey: 'ctrl' // Need to hold ctrl for panning if zooming is wheel
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x', // Allow zooming horizontally
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#475569' },
            grid: { color: '#e2e8f0' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'right', // Price axis on right like TradingView
            ticks: { color: '#475569' },
            grid: { color: '#e2e8f0' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'left', // Volume axis on left
            grid: { drawOnChartArea: false }, // Prevent grid lines overlaying
            min: 0,
            // Adjust max so volume bars only take up bottom 20% of chart
            max: Math.max(...volumes) * 5,
            ticks: {
              display: false // Hide volume numbers to keep it clean
            }
          }
        }
      }
    });

    // Run AI Evaluation only if in Modal
    if (isModal) {
      evaluateAndRenderAI(symbol, randTrend, volMillions, randRsi);
    }

  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center; margin-top: 100px;">
      <i class="fas fa-exclamation-triangle fa-2x"></i><br>
      Error loading live data: ${err.message}.<br><br>
      <small>Showing simulated AI Prediction instead due to API limits.</small>
    </div>`;

    if (isModal) {
      const rTrend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
      evaluateAndRenderAI(symbol, rTrend, 35, 60);
    }
  }
}

function evaluateAndRenderAI(symbol, trend, volumeM, rsi) {
  // Generate Mock Sentiment
  const sentimentPercent = trend === 'increasing' ? (Math.floor(Math.random() * 30) + 60) : (Math.floor(Math.random() * 40) + 10);

  // Render Circular Bar
  const isGoodSentiment = sentimentPercent >= 50;
  const colorClass = isGoodSentiment ? 'green' : 'red';
  const circleHtml = `
    <svg viewBox="0 0 36 36" class="circular-chart ${colorClass}">
      <path class="circle-bg"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path class="circle"
        stroke-dasharray="${sentimentPercent}, 100"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.831
          a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <text x="18" y="20.35" class="percentage">${sentimentPercent}%</text>
    </svg>
  `;
  document.getElementById('sentiment-chart-container').innerHTML = circleHtml;
  document.getElementById('sentiment-text').textContent = `${sentimentPercent}% Buying`;

  // Detailed AI Logic
  let aiDecision = 'HOLD';
  let detailedText = '';
  const portfolio = getPortfolio() || { balance: 100000 };
  const recAmount = formatCurrency(portfolio.balance * 0.15); // Recommend 15% of balance

  if (trend === 'increasing' && rsi < 70) {
    aiDecision = 'BUY';
    detailedText = `<strong>Prediction:</strong> Previously, ${symbol} may have seen fluctuations, but current live data indicates an upward momentum. <br><br>
      <strong>Reasoning:</strong> The RSI is optimal at ${rsi}, meaning it is not overbought. Combined with a healthy average trading volume of ${volumeM}M shares and an increasing price trend, our Rule-Based Expert System triggers a strong BUY signal.<br><br>
      <strong>Action:</strong> We recommend allocating approximately ${recAmount} (15% of your available balance) to minimize risk while capturing upside potential.`;
  } else if (trend === 'decreasing' && rsi > 50) {
    aiDecision = 'SELL';
    detailedText = `<strong>Prediction:</strong> The momentum for ${symbol} has shifted downwards. <br><br>
      <strong>Reasoning:</strong> With an RSI of ${rsi} and a decreasing trend, the stock is showing signs of weakness and potential overvaluation. It is highly probable that the price will continue to correct.<br><br>
      <strong>Action:</strong> If you hold this stock, we recommend selling immediately to prevent further losses.`;
  } else {
    detailedText = `<strong>Prediction:</strong> ${symbol} is currently showing mixed signals in the live market data. <br><br>
      <strong>Reasoning:</strong> The RSI stands at ${rsi} with a ${trend} trend. Neither our strong BUY nor strong SELL rules have been completely fulfilled by the current facts in the Knowledge Base.<br><br>
      <strong>Action:</strong> Wait for a clearer breakout or breakdown. Keep your capital safe.`;
  }

  const decisionEl = document.getElementById('ai-global-decision');

  // Create detailed HTML
  const aiHtml = `
    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 10px;" class="${aiDecision === 'BUY' ? 'text-success' : (aiDecision === 'SELL' ? 'text-danger' : 'text-warning')}">${aiDecision}</div>
    <div class="ai-detailed-output" style="text-align: left; font-size: 1rem;">
      ${detailedText}
    </div>
  `;

  decisionEl.innerHTML = aiHtml;
}

// --- Page Implementations ---

// 1. Auth Page
function initAuth() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');

  showSignupBtn.addEventListener('click', () => {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('signup-box').classList.remove('hidden');
  });

  showLoginBtn.addEventListener('click', () => {
    document.getElementById('signup-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === pass);

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } else {
      showNotification('Invalid email or password', 'danger');
    }
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-password').value;

    const users = JSON.parse(localStorage.getItem('users'));
    if (users.find(u => u.email === email)) {
      showNotification('Email already exists', 'danger');
      return;
    }

    users.push({ name, email, password: pass });
    localStorage.setItem('users', JSON.stringify(users));
    showNotification('Account created! Please login.');
    showLoginBtn.click();
  });
}

// 2. Dashboard Page
function initDashboard() {
  const portfolio = getPortfolio();
  document.getElementById('balance-display').textContent = formatCurrency(portfolio.balance);

  // Calculate total portfolio value
  const stocks = getStocks();
  let totalHoldingsValue = 0;
  for (const sym in portfolio.holdings) {
    const stock = stocks.find(s => s.symbol === sym);
    if (stock) {
      totalHoldingsValue += stock.price * portfolio.holdings[sym].qty;
    }
  }

  document.getElementById('holdings-value-display').textContent = formatCurrency(totalHoldingsValue);
  document.getElementById('total-value-display').textContent = formatCurrency(portfolio.balance + totalHoldingsValue);

  // Initialize Alpha Vantage Live Chart for Dashboard
  const chartContainer = document.getElementById('market-chart').parentElement;

  // Ensure plugins are loaded for Dashboard too
  if (typeof Chart === 'undefined' || !window.Hammer) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
    script.onload = () => {
      const hammerScript = document.createElement('script');
      hammerScript.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8';
      document.head.appendChild(hammerScript);
      hammerScript.onload = () => {
        const zoomScript = document.createElement('script');
        zoomScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom/dist/chartjs-plugin-zoom.min.js';
        document.head.appendChild(zoomScript);
        zoomScript.onload = () => fetchAndRenderAlphaVantage('AAPL', chartContainer, 'market-chart', false);
      };
    };
  } else {
    fetchAndRenderAlphaVantage('AAPL', chartContainer, 'market-chart', false);
  }

  // Populate Watchlist
  const watchlistTbody = document.getElementById('watchlist-body');
  stocks.slice(0, 5).forEach(stock => {
    const isPositive = stock.change >= 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${stock.symbol}</strong></td>
      <td>${formatCurrency(stock.price)}</td>
      <td class="${isPositive ? 'text-success' : 'text-danger'}">
        ${isPositive ? '+' : ''}${stock.change}%
      </td>
    `;
    watchlistTbody.appendChild(tr);
  });
}

// 3. Market Page
function initMarket() {
  const stocks = getStocks();
  const tbody = document.getElementById('market-body');
  const searchInput = document.getElementById('market-search');

  function renderMarket(data) {
    tbody.innerHTML = '';
    data.forEach(stock => {
      const isPositive = stock.change >= 0;
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.onclick = () => window.location.href = `portfolio.html?symbol=${stock.symbol}`;
      tr.innerHTML = `
        <td><strong>${stock.symbol}</strong></td>
        <td>${stock.name}</td>
        <td>${formatCurrency(stock.price)}</td>
        <td class="${isPositive ? 'text-success' : 'text-danger'}">
          ${isPositive ? '+' : ''}${stock.change}%
        </td>
        <td>${stock.volume}</td>
        <td><button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='portfolio.html?symbol=${stock.symbol}'">Trade</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderMarket(stocks);

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = stocks.filter(s =>
      s.symbol.toLowerCase().includes(val) ||
      s.name.toLowerCase().includes(val)
    );
    renderMarket(filtered);
  });
}

// 4. Portfolio Page
function initPortfolio() {
  const portfolio = getPortfolio();
  const stocks = getStocks();
  const urlParams = new URLSearchParams(window.location.search);
  const tradeSymbol = urlParams.get('symbol');

  document.getElementById('avail-balance').textContent = formatCurrency(portfolio.balance);

  // Render Holdings
  const tbody = document.getElementById('holdings-body');
  for (const sym in portfolio.holdings) {
    const holding = portfolio.holdings[sym];
    const stock = stocks.find(s => s.symbol === sym);
    if (stock && holding.qty > 0) {
      const currentVal = stock.price * holding.qty;
      const costBasis = holding.avgPrice * holding.qty;
      const pl = currentVal - costBasis;
      const isPositive = pl >= 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${sym}</strong></td>
        <td>${holding.qty}</td>
        <td>${formatCurrency(holding.avgPrice)}</td>
        <td>${formatCurrency(stock.price)}</td>
        <td>${formatCurrency(currentVal)}</td>
        <td class="${isPositive ? 'text-success' : 'text-danger'}">
          ${isPositive ? '+' : ''}${formatCurrency(pl)}
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Setup Trading Form
  const tradeSelect = document.getElementById('trade-symbol');
  stocks.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.symbol;
    opt.textContent = `${s.symbol} - ${s.name} (${formatCurrency(s.price)})`;
    tradeSelect.appendChild(opt);
  });

  if (tradeSymbol) {
    tradeSelect.value = tradeSymbol;
  }

  document.getElementById('trade-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const sym = tradeSelect.value;
    const type = document.getElementById('trade-type').value;
    const qty = parseInt(document.getElementById('trade-qty').value);
    const stock = stocks.find(s => s.symbol === sym);

    if (!stock || qty <= 0) return;

    const total = stock.price * qty;

    if (type === 'buy') {
      if (total > portfolio.balance) {
        showNotification('Insufficient funds!', 'danger');
        return;
      }
      portfolio.balance -= total;

      if (!portfolio.holdings[sym]) {
        portfolio.holdings[sym] = { qty: 0, avgPrice: 0 };
      }

      const oldQty = portfolio.holdings[sym].qty;
      const oldAvg = portfolio.holdings[sym].avgPrice;
      const newQty = oldQty + qty;
      const newAvg = ((oldQty * oldAvg) + total) / newQty;

      portfolio.holdings[sym].qty = newQty;
      portfolio.holdings[sym].avgPrice = newAvg;

      showNotification(`Bought ${qty} shares of ${sym} for ${formatCurrency(total)}`);

    } else { // sell
      if (!portfolio.holdings[sym] || portfolio.holdings[sym].qty < qty) {
        showNotification('Not enough shares to sell!', 'danger');
        return;
      }
      portfolio.balance += total;
      portfolio.holdings[sym].qty -= qty;

      if (portfolio.holdings[sym].qty === 0) {
        delete portfolio.holdings[sym];
      }

      showNotification(`Sold ${qty} shares of ${sym} for ${formatCurrency(total)}`);
    }

    // Save transaction
    const trans = getTransactions();
    trans.push({ type, symbol: sym, qty, price: stock.price, total, date: new Date().toLocaleString() });
    saveTransactions(trans);

    savePortfolio(portfolio);
    setTimeout(() => window.location.reload(), 1500);
  });
}

// 5. AI Expert System Page
function initAI() {
  const stocks = getStocks();
  const select = document.getElementById('ai-stock-select');
  stocks.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.symbol;
    opt.textContent = `${s.symbol} - ${s.name}`;
    select.appendChild(opt);
  });

  // EXPERT SYSTEM RULES
  // Rule 1: IF trend == 'increasing' AND volume > 20M AND rsi < 70 THEN BUY
  // Rule 2: IF trend == 'decreasing' AND rsi > 70 THEN SELL
  // Rule 3: IF trend == 'stable' THEN HOLD

  function checkBuy(stock) {
    const volNum = parseFloat(stock.volume); // e.g. '50M' -> 50
    return stock.trend === 'increasing' && volNum > 20 && stock.rsi < 70;
  }

  function checkSell(stock) {
    return stock.trend === 'decreasing' && stock.rsi > 70;
  }

  document.getElementById('analyze-btn').addEventListener('click', () => {
    const sym = select.value;
    const stock = stocks.find(s => s.symbol === sym);
    if (!stock) return;

    // --- Forward Chaining ---
    // Start with data, apply rules to reach conclusion
    let decision = 'HOLD';
    let fcSteps = `1. Analyzing Data: Price=${stock.price}, Trend=${stock.trend}, Volume=${stock.volume}, RSI=${stock.rsi}<br>`;

    fcSteps += `2. Checking Rule 1 (BUY conditions)...<br>`;
    if (checkBuy(stock)) {
      decision = 'BUY';
      fcSteps += `   -> Conditions Met! Conclusion: BUY<br>`;
    } else {
      fcSteps += `   -> Conditions NOT Met.<br>`;
      fcSteps += `3. Checking Rule 2 (SELL conditions)...<br>`;
      if (checkSell(stock)) {
        decision = 'SELL';
        fcSteps += `   -> Conditions Met! Conclusion: SELL<br>`;
      } else {
        fcSteps += `   -> Conditions NOT Met.<br>`;
        fcSteps += `4. Defaulting to Rule 3: HOLD<br>`;
      }
    }

    document.getElementById('fc-output').innerHTML = fcSteps;
    document.getElementById('ai-decision').innerHTML = `<h3 class="${decision === 'BUY' ? 'text-success' : decision === 'SELL' ? 'text-danger' : 'text-warning'}">${decision}</h3>`;

    // --- Backward Chaining ---
    // Start with goal/decision, verify conditions
    let bcSteps = `Goal: Prove why decision is ${decision}.<br>`;
    if (decision === 'BUY') {
      bcSteps += `1. To prove BUY, we need: Trend == 'increasing' AND Volume > 20M AND RSI < 70.<br>`;
      bcSteps += `2. Verifying Trend: '${stock.trend}' == 'increasing' -> ${stock.trend === 'increasing' ? 'TRUE' : 'FALSE'}.<br>`;
      bcSteps += `3. Verifying Volume: ${parseFloat(stock.volume)} > 20 -> ${parseFloat(stock.volume) > 20 ? 'TRUE' : 'FALSE'}.<br>`;
      bcSteps += `4. Verifying RSI: ${stock.rsi} < 70 -> ${stock.rsi < 70 ? 'TRUE' : 'FALSE'}.<br>`;
      bcSteps += `Conclusion: All conditions are TRUE. The rule is fired.`;
    } else if (decision === 'SELL') {
      bcSteps += `1. To prove SELL, we need: Trend == 'decreasing' AND RSI > 70.<br>`;
      bcSteps += `2. Verifying Trend: '${stock.trend}' == 'decreasing' -> ${stock.trend === 'decreasing' ? 'TRUE' : 'FALSE'}.<br>`;
      bcSteps += `3. Verifying RSI: ${stock.rsi} > 70 -> ${stock.rsi > 70 ? 'TRUE' : 'FALSE'}.<br>`;
      bcSteps += `Conclusion: All conditions are TRUE. The rule is fired.`;
    } else {
      bcSteps += `1. To prove HOLD, we check if BUY and SELL rules failed.<br>`;
      bcSteps += `2. Did BUY fail? YES.<br>`;
      bcSteps += `3. Did SELL fail? YES.<br>`;
      bcSteps += `Conclusion: Since no strong signals found, HOLD is the safe state.`;
    }

    document.getElementById('bc-output').innerHTML = bcSteps;
  });
}

function initAbout() {
  // Static page, no dynamic js needed besides what's handled globally
}
