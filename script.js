function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "123") {
    window.location.href = "dashboard.html";
  } else {
    alert("Username atau password salah!");
  }
}

let tradingPlanData = JSON.parse(localStorage.getItem("tradingPlanData")) || [];
let currentPage = 1;
const rowsPerPage = 5;
let initialCapital =
  parseFloat(localStorage.getItem("initialCapitalInput")) || 100;
let tvWidget = null;
let datepickerRecap = null;
let datepickerOnly = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("initialCapital").value = initialCapital;
  updateProfitSummary();
  renderTable();
  loadChart();
});

function generateTradingPlan() {
  initialCapital = parseFloat(document.getElementById("initialCapital").value);
  const positionPercent = parseFloat(
    document.getElementById("positionSize").value
  );
  const totalTradesToGenerate = 5;

  if (isNaN(initialCapital) || isNaN(positionPercent)) {
    alert("Masukkan nilai valid untuk kapital dan posisi!");
    return;
  }

  localStorage.setItem("initialCapitalInput", initialCapital);
  tradingPlanData = [];
  currentPage = 1;

  const positionTotal = (positionPercent / 100) * initialCapital;
  const leverage = 25;

  for (let i = 1; i <= totalTradesToGenerate; i++) {
    const positionSize = positionTotal / totalTradesToGenerate;
    const loss = positionSize * 0.02 * leverage;
    const profit = positionSize * 0.04 * leverage;

    tradingPlanData.push({
      id: i,
      coin: `Trade ${i}`,
      positionSize: positionSize,
      loss: loss,
      profit: profit,
      result: "pending",
      pnl: 0,
      date: null,
    });
  }

  localStorage.setItem("tradingPlanData", JSON.stringify(tradingPlanData));
  renderTable();
  updateProfitSummary();
  alert("Rencana Trading baru telah dibuat!");
}

function addRow() {
  const currentInitialCapital = parseFloat(
    document.getElementById("initialCapital").value
  );
  const positionPercent = parseFloat(
    document.getElementById("positionSize").value
  );

  if (isNaN(currentInitialCapital) || isNaN(positionPercent)) {
    alert(
      "Harap generate trading plan terlebih dahulu atau masukkan nilai yang valid."
    );
    return;
  }

  const currentTotalTrades = tradingPlanData.length;
  const leverage = 25;
  const positionTotal = (positionPercent / 100) * currentInitialCapital;
  const newTotalTrades = currentTotalTrades + 1;

  tradingPlanData.forEach((trade) => {
    trade.positionSize = positionTotal / newTotalTrades;
    trade.loss = trade.positionSize * 0.02 * leverage;
    trade.profit = trade.positionSize * 0.04 * leverage;
    if (trade.result === "win") {
      trade.pnl = trade.profit;
    } else if (trade.result === "lose") {
      trade.pnl = -trade.loss;
    }
  });

  const newId = newTotalTrades;
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
    date: null,
  });

  const totalPages = Math.ceil(tradingPlanData.length / rowsPerPage);
  currentPage = totalPages;

  localStorage.setItem("tradingPlanData", JSON.stringify(tradingPlanData));
  renderTable();
  updateProfitSummary();
}

function renderTable() {
  const planBody = document.getElementById("planBody");
  planBody.innerHTML = "";

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const tradesToDisplay = tradingPlanData.slice(startIndex, endIndex);

  tradesToDisplay.forEach((trade) => {
    const row = document.createElement("tr");
    row.setAttribute("data-id", trade.id);
    row.setAttribute("data-result", trade.result);

    let resultHtml = "";
    if (trade.result === "pending") {
      resultHtml = `
        <button class="win-btn" onclick="updateResult(this, ${trade.id}, true)">Win</button>
        <button class="lose-btn" onclick="updateResult(this, ${trade.id}, false)">Lose</button>
      `;
    } else {
      const pnlColor = trade.pnl >= 0 ? "#28a745" : "#dc3545";
      resultHtml = `
        <div style="margin-top:5px;color:${pnlColor};font-weight:bold;">
          ${trade.result === "win" ? "Win" : "Lose"} (${trade.pnl.toFixed(
        2
      )} USDT)
        </div>
      `;
    }

    row.innerHTML = `
      <td>${trade.id}</td>
      <td><input type="text" value="${
        trade.coin
      }" class="trade-coin-input" onchange="updateCoinName(${
      trade.id
    }, this.value)"></td>
      <td>${trade.positionSize.toFixed(2)} USDT</td>
      <td style="color: #dc3545;">-${trade.loss.toFixed(2)} USDT</td>
      <td style="color: #28a745;">+${trade.profit.toFixed(2)} USDT</td>
      <td>${resultHtml}</td>
    `;
    planBody.appendChild(row);
  });

  renderPagination();
}

function updateCoinName(tradeId, newCoinName) {
  const trade = tradingPlanData.find((t) => t.id === tradeId);
  if (trade) {
    trade.coin = newCoinName;
    localStorage.setItem("tradingPlanData", JSON.stringify(tradingPlanData));
  }
}

function updateResult(button, tradeId, isWin) {
  const trade = tradingPlanData.find((t) => t.id === tradeId);
  if (!trade) return;

  if (trade.result !== "pending") {
    alert(
      `Trade ${tradeId} sudah memiliki hasil (${trade.result}). Tidak bisa diubah lagi.`
    );
    return;
  }

  trade.pnl = isWin ? trade.profit : -trade.loss;
  trade.result = isWin ? "win" : "lose";
  trade.date = new Date().toISOString().slice(0, 10);

  localStorage.setItem("tradingPlanData", JSON.stringify(tradingPlanData));
  renderTable();
  updateProfitSummary();
}

function updateProfitSummary() {
  const currentInitialCapital = parseFloat(
    document.getElementById("initialCapital").value
  );
  let totalPnl = 0;

  tradingPlanData.forEach((trade) => {
    totalPnl += trade.pnl;
  });

  const newCapital = currentInitialCapital + totalPnl;
  document.getElementById(
    "currentCapital"
  ).innerText = `Current Capital: ${newCapital.toFixed(2)} USDT`;
  document.getElementById("profitResult").innerText = `${
    totalPnl >= 0 ? "+" : ""
  }${totalPnl.toFixed(2)} USDT`;
  document.getElementById("profitResult").style.color =
    totalPnl >= 0 ? "#28a745" : "#dc3545";
}

function renderPagination() {
  const paginationControls = document.getElementById("pagination-controls");
  paginationControls.innerHTML = "";

  const totalPages = Math.ceil(tradingPlanData.length / rowsPerPage);

  if (totalPages <= 1 && tradingPlanData.length <= rowsPerPage) {
    return;
  }

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

function saveTradingData() {
  localStorage.setItem("tradingPlanData", JSON.stringify(tradingPlanData));
  localStorage.setItem(
    "initialCapitalInput",
    document.getElementById("initialCapital").value
  );
  alert("Trading Plan berhasil disimpan!");
}

function showRecapModal() {
  const modal = document.getElementById("recapModal");
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  showHistoryTrading();
}

function hideRecapModal() {
  const modal = document.getElementById("recapModal");
  modal.classList.add("hidden");
  modal.style.display = "none";
  document.getElementById("recapResults").innerHTML = "";
}

function showHistoryTrading() {
  const recapResultsDiv = document.getElementById("recapResults");
  recapResultsDiv.innerHTML = "";

  let filteredTrades = tradingPlanData.filter(
    (trade) => trade.result !== "pending" && trade.date !== null
  );

  if (filteredTrades.length === 0) {
    recapResultsDiv.innerHTML = "<p>Belum ada trade yang diselesaikan.</p>";
    return;
  }

  filteredTrades.sort((a, b) => new Date(a.date) - new Date(b.date));

  let historyHtml = "<h3>Riwayat Trading Lengkap</h3>";
  historyHtml +=
    "<table><thead><tr><th>ID</th><th>Coin</th><th>Pos. Size</th><th>Result</th><th>PnL</th><th>Date</th></tr></thead><tbody>";

  filteredTrades.forEach((trade) => {
    const pnlColor = trade.pnl >= 0 ? "#28a745" : "#dc3545";
    historyHtml += `
      <tr>
          <td>${trade.id}</td>
          <td>${trade.coin}</td>
          <td>${trade.positionSize.toFixed(2)}</td>
          <td style="color:${pnlColor};">${trade.result}</td>
          <td style="color:${pnlColor};">${trade.pnl.toFixed(2)}</td>
          <td>${trade.date || "N/A"}</td>
      </tr>
    `;
  });
  historyHtml += "</tbody></table>";
  recapResultsDiv.innerHTML = historyHtml;
}

function exportTradingHistoryCsv() {
  let filteredTrades = tradingPlanData.filter(
    (trade) => trade.result !== "pending" && trade.date !== null
  );

  const exportDate = new Date();
  const datePart = exportDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timePart = exportDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Gunakan titik koma sebagai pemisah
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Data Ekspor Trading Plan\n";
  csvContent += `Tanggal Ekspor: ${datePart} Pukul ${timePart}\n`;
  csvContent += "No;Trade/Koin;Position Siz;Risk (Loss);Reward (Pr;Result\n"; // Header dengan titik koma

  filteredTrades.forEach((trade) => {
    // Escape koma dalam nama koin jika ada, lalu gabungkan dengan titik koma
    const coinName = `"${trade.coin.replace(/"/g, '""')}"`;
    const row = [
      trade.id,
      coinName,
      trade.positionSize.toFixed(2),
      trade.loss.toFixed(2),
      trade.profit.toFixed(2),
      trade.result,
    ].join(";"); // Gabungkan data dengan titik koma
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `trading_recap_ekspor_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("Riwayat trading berhasil diekspor ke CSV!");
}

function showCalendarRecap() {
  const modal = document.getElementById("calendarOnlyModal");
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  const datepickerContainer = document.getElementById(
    "datepickerContainerOnly"
  );
  const datepickerInput = document.getElementById("datepickerInputOnly");

  if (!datepickerOnly) {
    if (typeof Datepicker !== "undefined") {
      datepickerOnly = new Datepicker(datepickerContainer, {
        format: "yyyy-mm-dd",
        autohide: true,
        todayBtn: true,
        clearBtn: true,
      });
      datepickerContainer.addEventListener("changeDate", (e) => {
        datepickerInput.value = e.detail.date
          ? new Date(e.detail.date).toISOString().slice(0, 10)
          : "";
      });
    } else {
      console.error(
        "Datepicker library not found. Please ensure it's linked in your HTML."
      );
    }
  }

  if (datepickerInput.value) {
    datepickerOnly.setDate(datepickerInput.value);
  } else {
    datepickerOnly.setDate(null);
  }
}

function hideCalendarOnlyModal() {
  const modal = document.getElementById("calendarOnlyModal");
  modal.classList.add("hidden");
  modal.style.display = "none";
}

function applyDateFilterAndShowRecap() {
  hideCalendarOnlyModal();
  showRecapModal();

  const filterDate = document.getElementById("datepickerInputOnly").value;
  generateRecapDisplay(filterDate);
}

function clearDateFilterAndShowRecap() {
  document.getElementById("datepickerInputOnly").value = "";
  hideCalendarOnlyModal();
  showRecapModal();
  generateRecapDisplay(null);
}

function generateRecapDisplay(filterDate = null) {
  const recapResultsDiv = document.getElementById("recapResults");
  recapResultsDiv.innerHTML = "";

  let filteredTrades = tradingPlanData.filter(
    (trade) => trade.result !== "pending" && trade.date !== null
  );

  if (filterDate) {
    filteredTrades = filteredTrades.filter(
      (trade) => trade.date === filterDate
    );
  }

  if (filteredTrades.length === 0) {
    recapResultsDiv.innerHTML = `<p>Belum ada trade yang diselesaikan ${
      filterDate ? "pada tanggal " + filterDate : "di rentang yang dipilih"
    }.</p>`;
    return;
  }

  const dailyData = {};
  filteredTrades.forEach((trade) => {
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

  let dailyHtml = "<h3>Rekap Harian</h3>";
  Object.keys(dailyData)
    .sort()
    .forEach((date) => {
      const data = dailyData[date];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      dailyHtml += `
            <div>
                <span><strong>Tanggal: ${date}</strong></span>
                <span>Win: ${data.win}, Lose: ${data.lose}</span>
                <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            </div>
        `;
    });
  recapResultsDiv.innerHTML += dailyHtml;

  const monthlyData = {};
  filteredTrades.forEach((trade) => {
    if (trade.date) {
      const monthYear = trade.date.substring(0, 7);
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

  let monthlyHtml = "<h3>Rekap Bulanan</h3>";
  Object.keys(monthlyData)
    .sort()
    .forEach((monthYear) => {
      const data = monthlyData[monthYear];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      monthlyHtml += `
            <div>
                <span><strong>Bulan: ${monthYear}</strong></span>
                <span>Win: ${data.win}, Lose: ${data.lose}</span>
                <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            </div>
        `;
    });
  recapResultsDiv.innerHTML += monthlyHtml;

  const yearlyData = {};
  filteredTrades.forEach((trade) => {
    if (trade.date) {
      const year = trade.date.substring(0, 4);
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

  let yearlyHtml = "<h3>Rekap Tahunan</h3>";
  Object.keys(yearlyData)
    .sort()
    .forEach((year) => {
      const data = yearlyData[year];
      const pnlColor = data.pnl >= 0 ? "green" : "red";
      yearlyHtml += `
            <div>
                <span><strong>Tahun: ${year}</strong></span>
                <span>Win: ${data.win}, Lose: ${data.lose}</span>
                <span style="color:${pnlColor};">Total PnL: ${data.pnl.toFixed(
        2
      )} USDT</span>
            </div>
        `;
    });
  recapResultsDiv.innerHTML += yearlyHtml;
}

function loadChart() {
  const coin = document.getElementById("coinId").value.toUpperCase();
  if (!coin) {
    if (tvWidget) {
      tvWidget.remove();
      tvWidget = null;
    }
    document.getElementById("tvChart").innerHTML = "";
    return;
  }

  if (tvWidget) {
    tvWidget.remove();
    tvWidget = null;
  }
  document.getElementById("tvChart").innerHTML = "";

  tvWidget = new TradingView.widget({
    container_id: "tvChart",
    width: "100%",
    height: 500,
    symbol: `BINANCE:${coin}`,
    interval: "30",
    timezone: "Asia/Jakarta",
    theme: "dark",
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
    calendar: true,
    enable_publishing_social_features: true,
    show_popup_button: true,
  });
}

function renderToolbar() {
  const toolbar = document.getElementById("toolbar");
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
  if (tvWidget) {
    tvWidget.remove();
    tvWidget = null;
  }
}
