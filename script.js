// ==== LOGIN VALIDATION ====
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "123") {
    window.location.href = "dashboard.html";
  } else {
    alert("Username atau password salah!");
  }
}

// ==== TRADING PLAN GENERATOR & LOGIC ====
// Variabel global untuk menyimpan data trading plan dan pagination state
let tradingPlanData = [];
let currentPage = 1;
const rowsPerPage = 5; // Jumlah baris per halaman

function generateTradingPlan() {
  const initialCapital = parseFloat(
    document.getElementById("initialCapital").value
  );
  const positionPercent = parseFloat(
    document.getElementById("positionSize").value
  );
  const totalTradesToGenerate = 5; // Awalnya hanya generate 5 baris

  if (isNaN(initialCapital) || isNaN(positionPercent)) {
    alert("Masukkan nilai valid untuk kapital dan posisi!");
    return;
  }

  // Reset data plan dan halaman saat generate ulang
  tradingPlanData = [];
  currentPage = 1;

  const positionTotal = (positionPercent / 100) * initialCapital;

  for (let i = 1; i <= totalTradesToGenerate; i++) {
    const positionSize = positionTotal / totalTradesToGenerate; // Ukuran posisi per trade
    const leverage = 25; // Dari catatan Anda, leverage 25 digunakan
    const loss = positionSize * 0.02 * leverage;
    const profit = positionSize * 0.04 * leverage;

    tradingPlanData.push({
      id: i,
      coin: `Trade ${i}`,
      positionSize: positionSize,
      loss: loss,
      profit: profit,
      result: "pending", // 'pending', 'win', 'lose'
      pnl: 0, // Profit/Loss aktual untuk baris ini
      date: null, // Tambahkan properti tanggal, akan diisi saat trade selesai
    });
  }

  renderTable(); // Panggil fungsi untuk merender tabel
  updateProfitSummary(); // Update summary PnL
}

// Fungsi baru untuk menambah baris
function addRow() {
  const initialCapital = parseFloat(
    document.getElementById("initialCapital").value
  );
  const positionPercent = parseFloat(
    document.getElementById("positionSize").value
  );

  if (isNaN(initialCapital) || isNaN(positionPercent)) {
    alert("Harap generate trading plan terlebih dahulu.");
    return;
  }

  const currentTotalTrades = tradingPlanData.length;
  const leverage = 25; // Leverage yang digunakan

  // Hitung ulang posisi per trade berdasarkan total trade yang ada + 1
  const positionTotal = (positionPercent / 100) * initialCapital;
  const newTotalTrades = currentTotalTrades + 1;

  // Distribusikan ulang posisi size, loss, dan profit untuk semua trade yang sudah ada
  tradingPlanData.forEach((trade) => {
    trade.positionSize = positionTotal / newTotalTrades;
    trade.loss = trade.positionSize * 0.02 * leverage;
    trade.profit = trade.positionSize * 0.04 * leverage;
  });

  // Tambahkan trade baru
  const newId = newTotalTrades; // ID baris baru
  const newPositionSize = positionTotal / newTotalTrades;
  const newLoss = newPositionSize * 0.02 * leverage;
  const newProfit = newPositionSize * 0.04 * leverage;

  tradingPlanData.push({
    id: newId,
    coin: `Trade ${newId}`,
    positionSize: newPositionSize,
    loss: newLoss,
    profit: newProfit,
    result: "pending",
    pnl: 0,
    date: null, // Tanggal diatur null dulu, diisi saat updateResult
  });

  // Pindah ke halaman terakhir jika baris baru melebihi batas halaman saat ini
  const totalPages = Math.ceil(tradingPlanData.length / rowsPerPage);
  currentPage = totalPages;

  renderTable(); // Render ulang tabel untuk menampilkan baris baru
  updateProfitSummary(); // Update summary PnL
}

// Fungsi untuk merender tabel berdasarkan tradingPlanData dan currentPage
function renderTable() {
  const planBody = document.getElementById("planBody");
  planBody.innerHTML = "";

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const tradesToDisplay = tradingPlanData.slice(startIndex, endIndex);

  tradesToDisplay.forEach((trade) => {
    const row = document.createElement("tr");
    row.setAttribute("data-id", trade.id); // Simpan ID untuk memudahkan update
    row.setAttribute("data-result", trade.result);
    row.innerHTML = `
            <td>${trade.id}</td>
            <td><input type="text" value="${
              trade.coin
            }" class="trade-coin-input" onchange="updateCoinName(${
      trade.id
    }, this.value)"></td>
            <td>${trade.positionSize.toFixed(2)} USDT</td>
            <td>${trade.loss.toFixed(2)} USDT</td>
            <td>${trade.profit.toFixed(2)} USDT</td>
            <td>
                <button class="win-btn" onclick="updateResult(this, ${
                  trade.id
                }, true)">Win</button>
                <button class="lose-btn" onclick="updateResult(this, ${
                  trade.id
                }, false)">Lose</button>
                ${
                  trade.result === "win"
                    ? `<div style="margin-top:5px;color:#28a745;font-weight:bold;">Win (${trade.pnl.toFixed(
                        2
                      )} USDT)</div>`
                    : ""
                }
                ${
                  trade.result === "lose"
                    ? `<div style="margin-top:5px;color:#dc3545;font-weight:bold;">Lose (${trade.pnl.toFixed(
                        2
                      )} USDT)</div>`
                    : ""
                }
            </td>
        `;
    planBody.appendChild(row);
  });

  renderPagination(); // Panggil fungsi untuk merender pagination
}

// Fungsi untuk mengupdate nama koin saat input diubah
function updateCoinName(tradeId, newCoinName) {
  const trade = tradingPlanData.find((t) => t.id === tradeId);
  if (trade) {
    trade.coin = newCoinName;
  }
}

// Modifikasi fungsi updateResult untuk menggunakan tradingPlanData
function updateResult(button, tradeId, isWin) {
  const trade = tradingPlanData.find((t) => t.id === tradeId);
  if (!trade) return;

  // Jika hasil sudah ditetapkan dan tidak ada perubahan, keluar
  if (trade.result === (isWin ? "win" : "lose")) {
    return;
  }

  trade.pnl = isWin ? trade.profit : -trade.loss;
  trade.result = isWin ? "win" : "lose";
  trade.date = new Date().toISOString().slice(0, 10); // Simpan tanggal saat trade di-update

  // Perbarui tampilan di tabel
  const row = button.closest("tr");
  const resultCell = row.cells[5]; // Kolom ke-6 (indeks 5) adalah kolom Result

  resultCell.innerHTML = `
        <button class="win-btn" onclick="updateResult(this, ${tradeId}, true)">Win</button>
        <button class="lose-btn" onclick="updateResult(this, ${tradeId}, false)">Lose</button>
        <div style="margin-top:5px;color:${
          isWin ? "#28a745" : "#dc3545"
        };font-weight:bold;">${isWin ? "Win" : "Lose"} (${trade.pnl.toFixed(
    2
  )} USDT)</div>
    `;

  updateProfitSummary(); // Panggil untuk update total PnL
}

// Fungsi untuk update Current Capital dan PnL summary
function updateProfitSummary() {
  const initialCapital = parseFloat(
    document.getElementById("initialCapital").value
  );
  let totalPnl = 0;

  tradingPlanData.forEach((trade) => {
    totalPnl += trade.pnl;
  });

  const newCapital = initialCapital + totalPnl;
  document.getElementById(
    "currentCapital"
  ).innerText = `Current Capital: ${newCapital.toFixed(2)} USDT`;
  document.getElementById("profitResult").innerText = `${
    totalPnl >= 0 ? "+" : ""
  }${totalPnl.toFixed(2)} USDT`;
  document.getElementById("profitResult").style.color =
    totalPnl >= 0 ? "#28a745" : "#dc3545"; // Green for profit, red for loss
}

// Fungsi untuk merender kontrol pagination
function renderPagination() {
  const paginationControls = document.getElementById("pagination-controls");
  paginationControls.innerHTML = "";

  const totalPages = Math.ceil(tradingPlanData.length / rowsPerPage);

  if (totalPages <= 1 && tradingPlanData.length <= rowsPerPage) {
    return;
  }

  // Tombol Previous
  const prevButton = document.createElement("button");
  prevButton.innerText = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };
  paginationControls.appendChild(prevButton);

  // Nomor Halaman
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.innerText = i;
    pageButton.classList.add("page-button");
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.onclick = () => {
      currentPage = i;
      renderTable();
    };
    paginationControls.appendChild(pageButton);
  }

  // Tombol Next
  const nextButton = document.createElement("button");
  nextButton.innerText = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
  paginationControls.appendChild(nextButton);
}

// ==== RECAPITULATION FUNCTIONS ====
function showRecapModal() {
  const modal = document.getElementById("recapModal");
  modal.classList.remove("hidden");
  modal.style.display = "flex"; // Make it visible and centered
  generateRecap(); // Generate recap on modal open by default
}

function hideRecapModal() {
  const modal = document.getElementById("recapModal");
  modal.classList.add("hidden");
  modal.style.display = "none"; // Hide it
}

function generateRecap() {
  const filterDateInput = document.getElementById("recapDate");
  const filterDate = filterDateInput.value; // Format YYYY-MM-DD

  let filteredTrades = tradingPlanData.filter(
    (trade) => trade.result !== "pending" && trade.date !== null
  );

  if (filterDate) {
    filteredTrades = filteredTrades.filter(
      (trade) => trade.date === filterDate
    );
  }

  // Sort trades by date for better recap display
  filteredTrades.sort((a, b) => new Date(a.date) - new Date(b.date));

  displayDailyRecap(filteredTrades);
  displayMonthlyRecap(filteredTrades);
  displayYearlyRecap(filteredTrades);
}

function displayDailyRecap(trades) {
  const dailyRecapDiv = document.getElementById("dailyRecap");
  dailyRecapDiv.innerHTML = ""; // Clear previous results
  const dailyData = {};

  trades.forEach((trade) => {
    if (trade.date) {
      if (!dailyData[trade.date]) {
        dailyData[trade.date] = { win: 0, lose: 0, pnl: 0 };
      }
      if (trade.result === "win") {
        dailyData[trade.date].win++;
      } else if (trade.result === "lose") {
        dailyData[trade.date].lose++;
      }
      dailyData[trade.date].pnl += trade.pnl;
    }
  });

  if (Object.keys(dailyData).length === 0) {
    dailyRecapDiv.innerHTML =
      "<span>Belum ada trade yang diselesaikan pada rentang tanggal ini.</span>";
    return;
  }

  // Sort dates to display chronologically
  Object.keys(dailyData)
    .sort()
    .forEach((date) => {
      const data = dailyData[date];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      dailyRecapDiv.innerHTML += `
            <span><strong>Tanggal: ${date}</strong></span>
            <span>Win: ${data.win}, Lose: ${data.lose}</span>
            <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            <br>
        `;
    });
}

function displayMonthlyRecap(trades) {
  const monthlyRecapDiv = document.getElementById("monthlyRecap");
  monthlyRecapDiv.innerHTML = ""; // Clear previous results
  const monthlyData = {};

  trades.forEach((trade) => {
    if (trade.date) {
      const monthYear = trade.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { win: 0, lose: 0, pnl: 0 };
      }
      if (trade.result === "win") {
        monthlyData[monthYear].win++;
      } else if (trade.result === "lose") {
        monthlyData[monthYear].lose++;
      }
      monthlyData[monthYear].pnl += trade.pnl;
    }
  });

  if (Object.keys(monthlyData).length === 0) {
    monthlyRecapDiv.innerHTML =
      "<span>Belum ada trade yang diselesaikan pada rentang tanggal ini.</span>";
    return;
  }

  // Sort month-years to display chronologically
  Object.keys(monthlyData)
    .sort()
    .forEach((monthYear) => {
      const data = monthlyData[monthYear];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      monthlyRecapDiv.innerHTML += `
            <span><strong>Bulan: ${monthYear}</strong></span>
            <span>Win: ${data.win}, Lose: ${data.lose}</span>
            <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            <br>
        `;
    });
}

function displayYearlyRecap(trades) {
  const yearlyRecapDiv = document.getElementById("yearlyRecap");
  yearlyRecapDiv.innerHTML = ""; // Clear previous results
  const yearlyData = {};

  trades.forEach((trade) => {
    if (trade.date) {
      const year = trade.date.substring(0, 4); // YYYY
      if (!yearlyData[year]) {
        yearlyData[year] = { win: 0, lose: 0, pnl: 0 };
      }
      if (trade.result === "win") {
        yearlyData[year].win++;
      } else if (trade.result === "lose") {
        yearlyData[year].lose++;
      }
      yearlyData[year].pnl += trade.pnl;
    }
  });

  if (Object.keys(yearlyData).length === 0) {
    yearlyRecapDiv.innerHTML =
      "<span>Belum ada trade yang diselesaikan pada rentang tanggal ini.</span>";
    return;
  }

  // Sort years to display chronologically
  Object.keys(yearlyData)
    .sort()
    .forEach((year) => {
      const data = yearlyData[year];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      yearlyRecapDiv.innerHTML += `
            <span><strong>Tahun: ${year}</strong></span>
            <span>Win: ${data.win}, Lose: ${data.lose}</span>
            <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            <br>
        `;
    });
}

function exportRecapCsv() {
  const filterDateInput = document.getElementById("recapDate");
  const filterDate = filterDateInput.value;

  let filteredTrades = tradingPlanData.filter(
    (trade) => trade.result !== "pending" && trade.date !== null
  );

  if (filterDate) {
    filteredTrades = filteredTrades.filter(
      (trade) => trade.date === filterDate
    );
  }

  // Prepare CSV data
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent +=
    "ID,Coin,Position Size,Risk (Loss),Reward (Profit),Result,PnL,Date\n";

  filteredTrades.forEach((trade) => {
    const row = [
      trade.id,
      `"${trade.coin}"`, // Wrap coin name in quotes to handle commas
      trade.positionSize.toFixed(2),
      trade.loss.toFixed(2),
      trade.profit.toFixed(2),
      trade.result,
      trade.pnl.toFixed(2),
      trade.date || "", // Use empty string if date is null
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `trading_recap_${filterDate || "all"}.csv`);
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link); // Clean up
}

// ==== TRADINGVIEW CHART LOADING ====
function loadChart() {
  const coin = document.getElementById("coinId").value.toUpperCase();
  if (!coin) {
    alert("Masukkan nama coin terlebih dahulu.");
    return;
  }
  // Baris ini DIKOMENTARI agar toolbar tetap tersembunyi
  // document.getElementById("toolbar").classList.remove("hidden");
  document.getElementById("tvChart").innerHTML = ""; // Clear existing chart

  new TradingView.widget({
    container_id: "tvChart",
    width: "100%",
    height: 500,
    symbol: `BINANCE:${coin}`,
    interval: "30",
    timezone: "Asia/Jakarta",
    theme: "dark", // Mengubah tema ke gelap agar serasi dengan background
    style: "1",
    locale: "id",
    hide_top_toolbar: false,
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    studies: [
      "MACD@tv-basicstudies",
      "Volume@tv-basicstudies",
      "MAExp@tv-basicstudies",
    ],
    details: true,
    hotlist: true,
  });
}

// ==== TOOLBAR ACTIONS (jika diaktifkan) ====
// Fungsi renderToolbar ini tidak akan otomatis terpanggil karena toolbar hidden
// Jika Anda ingin mengaktifkan toolbar, Anda perlu menambahkan tombol atau event yang memanggil fungsi ini
function renderToolbar() {
  const toolbar = document.getElementById("toolbar");
  // toolbar.classList.remove("hidden"); // Anda bisa mengaktifkan baris ini jika ingin tombol 'Cari' menampilkan toolbar
  toolbar.innerHTML = `
        <h4>✏️ Tools</h4>
        <button onclick="drawLine()">📏 Trendline</button>
        <button onclick="drawText()">▭ Rectangle</button>
        <button onclick="clearDrawing()">— H Line</button>
    `;
}

function drawLine() {
  alert("🔧 Fitur gambar garis akan aktif di versi selanjutnya...");
}

function drawText() {
  alert("📝 Fitur teks dummy...");
}

function clearDrawing() {
  document.getElementById("tvChart").innerHTML = "";
  // Jika Anda ingin toolbar hilang setelah clear, tambahkan:
  // document.getElementById("toolbar").classList.add("hidden");
}

// Memastikan Trading Plan ter-generate saat halaman pertama kali dimuat
document.addEventListener("DOMContentLoaded", generateTradingPlan);
