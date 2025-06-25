let transactions = [];
let filteredTransactions = [];
let pieChart, barChart, lineChart;

function init() {
  transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  filteredTransactions = [...transactions];
  loadCategories();
  setupCharts();
  render();
  updateCharts();
}
window.onload = init;

function addTransaction() {
  const amt = parseFloat(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value.trim();
  const desc = document.getElementById('description').value.trim();
  const date = document.getElementById('date').value;
  if (!amt || !category || !date) return alert('Please fill all required fields.');

  const tx = { id: Date.now(), amount: type === 'expense' ? -amt : amt, type, category, desc, date };
  transactions.push(tx);
  saveAndFilter();
}

function deleteTx(id) {
  transactions = transactions.filter(tx => tx.id !== id);
  saveAndFilter();
}

function saveAndFilter() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  loadCategories();
  applyFilter();
}

function applyFilter() {
  const key = document.getElementById('searchKeyword').value.toLowerCase();
  const date = document.getElementById('filterDate').value;
  const cat = document.getElementById('filterCategory').value;

  filteredTransactions = transactions.filter(tx => {
    const mKey = !key || tx.desc.toLowerCase().includes(key) || tx.category.toLowerCase().includes(key);
    const mDate = !date || tx.date === date;
    const mCat = !cat || tx.category === cat;
    return mKey && mDate && mCat;
  });
  render();
  updateCharts();
}

function render() {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';
  let income = 0, expense = 0;

  filteredTransactions.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.type}</td>
      <td>₹${Math.abs(tx.amount).toFixed(2)}</td>
      <td>${tx.category}</td>
      <td>${tx.desc}</td>
      <td><button onclick="deleteTx(${tx.id})">Delete</button></td>`;
    tbody.appendChild(tr);
    if (tx.amount > 0) income += tx.amount;
    else expense += -tx.amount;
  });

  document.getElementById('totalIncome').textContent = `₹${income.toFixed(2)}`;
  document.getElementById('totalExpense').textContent = `₹${expense.toFixed(2)}`;
  document.getElementById('netSavings').textContent = `₹${(income - expense).toFixed(2)}`;
}

function loadCategories() {
  const sel = document.getElementById('filterCategory');
  const cats = [...new Set(transactions.map(tx => tx.category))];
  sel.innerHTML = `
    <option value="">All</option>
    ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
  `;
}

function setupCharts() {
  const commonOpts = { responsive: true, maintainAspectRatio: false };

  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: ['#C2185B','#F8BBD0'] }] },
    options: commonOpts
  });

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels: [], datasets: [{ label: 'Amount', data: [], backgroundColor: '#C2185B' }] },
    options: commonOpts
  });

  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Trend', data: [], borderColor: '#C2185B', backgroundColor: '#F8BBD0', fill: true }] },
    options: commonOpts
  });
}

function updateCharts() {
  const byCat = {}, byDate = {};
  filteredTransactions.forEach(tx => {
    byCat[tx.category] = (byCat[tx.category]||0) + Math.abs(tx.amount);
    byDate[tx.date]   = (byDate[tx.date]||0) + tx.amount;
  });

  const cats = Object.keys(byCat), catVals = cats.map(c => byCat[c]);
  pieChart.data.labels = barChart.data.labels = cats;
  pieChart.data.datasets[0].data = barChart.data.datasets[0].data = catVals;
  pieChart.update(); barChart.update();

  const dates = Object.keys(byDate).sort(), dateVals = dates.map(d => byDate[d]);
  lineChart.data.labels = dates;
  lineChart.data.datasets[0].data = dateVals;
  lineChart.update();
}
