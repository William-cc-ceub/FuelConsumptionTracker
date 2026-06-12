document.addEventListener('DOMContentLoaded', () => {
  const fuelForm = document.getElementById('fuelForm');
  const entryTable = document.getElementById('entryTable');
  const avgConsumptionEl = document.getElementById('avgConsumption');
  const costPerKmEl = document.getElementById('costPerKm');
  const totalCostEl = document.getElementById('totalCost');
  const lastFillEl = document.getElementById('lastFill');
  const clearAllButton = document.getElementById('clearAll');
  const cancelEditButton = document.getElementById('cancelEdit');
  const recordCountEl = document.getElementById('recordCount');
  const chartCanvas = document.getElementById('consumptionChart');
  const showVehicleKmCheckbox = document.getElementById('showVehicleKm');
  const vehicleKmDisplay = document.getElementById('vehicleKmDisplay');
  const navVehiclesBtn = document.getElementById('navVehicles');
  const navHomeBtn = document.getElementById('navHome');
  const vehicleSelect = document.getElementById('vehicleId');

  const STORAGE_KEY = 'fuelConsumptionEntries';
  const VEHICLE_KEY = 'vehicles';
  let entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let vehicles = JSON.parse(localStorage.getItem(VEHICLE_KEY) || '[]').map((v) => ({
    ...v,
    id: v.id || generateId(),
    initialOdometer: v.initialOdometer != null ? v.initialOdometer : v.odometer,
  }));
  let editingId = null;
  let editingVehicleId = null;

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function generateId() {
    return `vehicle-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function getVehicleLabel(vehicle) {
    if (!vehicle) return 'Veículo removido';
    const plateText = vehicle.plate ? ` • ${vehicle.plate}` : '';
    return `${vehicle.make} ${vehicle.model}${plateText}`;
  }

  function populateVehicleSelect() {
    if (!vehicleSelect) return;
    vehicleSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = vehicles.length ? 'Selecione o veículo' : 'Cadastre um veículo primeiro';
    defaultOption.disabled = !vehicles.length;
    defaultOption.selected = true;
    vehicleSelect.appendChild(defaultOption);

    vehicles.forEach((vehicle) => {
      const option = document.createElement('option');
      option.value = vehicle.id;
      option.textContent = getVehicleLabel(vehicle);
      vehicleSelect.appendChild(option);
    });
  }

  function updateSummary() {
    if (!entries.length) {
      avgConsumptionEl.textContent = '0 L/100km';
      costPerKmEl.textContent = 'R$ 0,00';
      totalCostEl.textContent = 'R$ 0,00';
      lastFillEl.textContent = '-';
      recordCountEl.textContent = '0 registros';
      return;
    }

    const totalLiters = entries.reduce((sum, entry) => sum + entry.liters, 0);
    const totalKm = entries.reduce((sum, entry) => sum + entry.distance, 0);
    const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
    const avgConsumption = totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;

    avgConsumptionEl.textContent = `${avgConsumption.toFixed(2)} L/100km`;
    costPerKmEl.textContent = formatCurrency(costPerKm);
    totalCostEl.textContent = formatCurrency(totalCost);
    lastFillEl.textContent = entries[entries.length - 1].date;
    recordCountEl.textContent = `${entries.length} registro${entries.length > 1 ? 's' : ''}`;
  }

  function renderVehicleKm() {
    if (!showVehicleKmCheckbox || !vehicleKmDisplay) return;
    const show = showVehicleKmCheckbox.checked && vehicles.length;
    const kmValue = show ? Number(vehicles[0].odometer) || 0 : 0;

    vehicleKmDisplay.textContent = show ? `Km atual: ${kmValue.toFixed(0)} km` : '';
    if (vehicleTable) {
      const tableEl = vehicleTable.closest('table');
      if (tableEl) {
        tableEl.classList.toggle('hide-vehicle-km', !show);
      }
    }
  }

  function updateVehicleSummary() {
    const countEl = document.getElementById('vehicleCount');
    const listCountEl = document.getElementById('vehicleListCount');
    const formCountEl = document.getElementById('vehicleFormCount');
    const avgInitialEl = document.getElementById('vehicleAvgInitial');
    const avgCurrentEl = document.getElementById('vehicleAvgCurrent');
    if (!countEl || !listCountEl || !formCountEl || !avgInitialEl || !avgCurrentEl) return;
    if (!vehicles.length) {
      countEl.textContent = '0';
      listCountEl.textContent = '0';
      formCountEl.textContent = '0';
      avgInitialEl.textContent = '0 km';
      avgCurrentEl.textContent = '0 km';
      renderVehicleKm();
      return;
    }
    countEl.textContent = String(vehicles.length);
    listCountEl.textContent = String(vehicles.length);
    formCountEl.textContent = String(vehicles.length);
    const initialSum = vehicles.reduce((sum, vehicle) => sum + (Number(vehicle.initialOdometer) || 0), 0);
    const currentSum = vehicles.reduce((sum, vehicle) => sum + (Number(vehicle.odometer) || 0), 0);
    const avgInitial = initialSum / vehicles.length;
    const avgCurrent = currentSum / vehicles.length;

    avgInitialEl.textContent = `${avgInitial.toFixed(0)} km`;
    avgCurrentEl.textContent = `${avgCurrent.toFixed(0)} km`;
    renderVehicleKm();
  }

  function updateVehicleOdometer(newEntry, previousEntry = null) {
    const newVehicle = vehicles.find((v) => v.id === newEntry.vehicleId);
    const oldVehicle = previousEntry ? vehicles.find((v) => v.id === previousEntry.vehicleId) : null;
    const newDistance = Number(newEntry.distance) || 0;
    const oldDistance = previousEntry ? Number(previousEntry.distance) || 0 : 0;

    if (oldVehicle && (!newVehicle || oldVehicle.id !== newVehicle.id)) {
      oldVehicle.odometer = Math.max(0, Number(oldVehicle.odometer || 0) - oldDistance);
    }

    if (newVehicle) {
      if (oldVehicle && oldVehicle.id === newVehicle.id) {
        newVehicle.odometer = Math.max(0, Number(newVehicle.odometer || 0) + newDistance - oldDistance);
      } else {
        newVehicle.odometer = Math.max(0, Number(newVehicle.odometer || 0) + newDistance);
      }
    }
  }

  if (navVehiclesBtn) {
    navVehiclesBtn.addEventListener('click', () => { window.location.href = 'vehicles.html'; });
  }
  if (navHomeBtn) {
    navHomeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
  }

  function drawChart() {
    if (!chartCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.getBoundingClientRect();
    const clientWidth = Math.max(rect.width, 320);
    const clientHeight = Math.max(rect.height || 260, 200);
    chartCanvas.width = Math.floor(clientWidth * dpr);
    chartCanvas.height = Math.floor(clientHeight * dpr);
    const ctx = chartCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const width = clientWidth;
    const height = clientHeight;
    ctx.clearRect(0, 0, width, height);

    const entriesToShow = entries.slice(-6);
    if (!entriesToShow.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText('Adicione registros para ver o gráfico', 18, height / 2);
      return;
    }

    const labels = entriesToShow.map((entry) => entry.date);
    const values = entriesToShow.map((entry) => (entry.distance > 0 ? (entry.liters / entry.distance) * 100 : 0));
    const maxValue = Math.max(...values, 5);
    const padding = 32;
    const chartHeight = height - padding * 2;
    const barWidth = (width - padding * 2) / values.length - 14;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    for (let i = 0; i <= 5; i += 1) {
      const y = padding + (chartHeight / 5) * i;
      ctx.fillRect(padding, y, width - padding * 2, 1);
    }

    values.forEach((value, idx) => {
      const x = padding + idx * (barWidth + 14);
      const barHeight = (value / maxValue) * chartHeight;
      const y = height - padding - barHeight;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`${value.toFixed(1)}L/100`, x, y - 12);
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(labels[idx], x, height - padding + 18);
    });
  }

  function drawMonthlyChart(mode = 'byDate') {
    if (!chartCanvas) return;
    const dataRows = {};
    entries.forEach((e) => {
      const dt = new Date(e.date);
      if (isNaN(dt)) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!dataRows[key]) dataRows[key] = { km: 0, liters: 0, cost: 0, dateObj: new Date(dt.getFullYear(), dt.getMonth(), 1) };
      dataRows[key].km += e.distance;
      dataRows[key].liters += e.liters;
      dataRows[key].cost += e.cost;
    });

    let rows = Object.keys(dataRows).map(k => {
      const item = dataRows[k];
      const consumption = item.km > 0 ? (item.liters / item.km) * 100 : 0;
      return { key: k, monthLabel: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(item.dateObj), consumption, cost: item.cost, dateObj: item.dateObj };
    });

    if (mode === 'byCost') rows.sort((a, b) => b.cost - a.cost);
    else rows.sort((a, b) => a.dateObj - b.dateObj);

    // keep top 6 for chart
    rows = rows.slice(0, 6);

    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.getBoundingClientRect();
    const clientWidth = Math.max(rect.width, 320);
    const clientHeight = Math.max(rect.height || 180, 140);
    chartCanvas.width = Math.floor(clientWidth * dpr);
    chartCanvas.height = Math.floor(clientHeight * dpr);
    const ctx = chartCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const width = clientWidth;
    const height = clientHeight;
    ctx.clearRect(0, 0, width, height);

    if (!rows.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Sem dados para o gráfico mensal', 18, height / 2);
      return;
    }

    const labels = rows.map(r => r.monthLabel);
    const values = rows.map(r => mode === 'byCost' ? r.cost : r.consumption);
    const maxValue = Math.max(...values, 1);
    const padding = 36;
    const chartHeight = height - padding * 2;
    const barWidth = (width - padding * 2) / values.length - 14;

    ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
    for (let i = 0; i <= 4; i += 1) {
      const y = padding + (chartHeight / 4) * i;
      ctx.fillRect(padding, y, width - padding * 2, 1);
    }

    values.forEach((value, idx) => {
      const x = padding + idx * (barWidth + 14);
      const barHeight = (value / maxValue) * chartHeight;
      const y = height - padding - barHeight;
      ctx.fillStyle = mode === 'byCost' ? 'rgba(250, 204, 21, 0.95)' : 'rgba(56, 189, 248, 0.95)';
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = '#fff';
      ctx.font = '13px Inter, sans-serif';
      const text = mode === 'byCost' ? formatCurrency(value) : `${value.toFixed(1)}L/100`;
      ctx.fillText(text, x, y - 10);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(labels[idx], x, height - padding + 16);
    });
  }

    function renderMonthlySummary(mode = 'byDate') {
      const table = document.getElementById('monthlyTable');
      if (!table) return;
      const tbody = table.querySelector('tbody');
      const data = {};
      entries.forEach((e) => {
        const d = new Date(e.date);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!data[key]) data[key] = { km: 0, liters: 0, cost: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) };
        data[key].km += e.distance;
        data[key].liters += e.liters;
        data[key].cost += e.cost;
      });

      const rows = Object.keys(data).map((k) => {
        const item = data[k];
        const consumption = item.km > 0 ? (item.liters / item.km) * 100 : 0;
        return { key: k, monthLabel: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(item.dateObj), km: item.km, liters: item.liters, consumption, cost: item.cost, dateObj: item.dateObj };
      });

      if (!rows.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Sem dados mensais.</td></tr>';
        return;
      }

      if (mode === 'byCost') {
        rows.sort((a, b) => b.cost - a.cost);
      } else {
        rows.sort((a, b) => a.dateObj - b.dateObj);
      }

      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.monthLabel}</td>
          <td>${r.km.toFixed(0)}</td>
          <td>${r.liters.toFixed(2)}</td>
          <td>${r.consumption.toFixed(2)} L/100km</td>
          <td>${formatCurrency(r.cost)}</td>
        </tr>
      `).join('');
    }

  function renderEntries() {
    entryTable.innerHTML = '';

    if (!entries.length) {
      entryTable.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhum registro ainda.</td></tr>';
      drawChart();
      return;
    }

    entries.slice().reverse().forEach((entry, index) => {
      const row = document.createElement('tr');
      const displayIndex = entries.length - 1 - index;
      const vehicle = vehicles.find((v) => v.id === entry.vehicleId);
      const vehicleLabel = getVehicleLabel(vehicle);

      row.innerHTML = `
        <td>${entry.date}</td>
        <td>${vehicleLabel}</td>
        <td>${entry.distance.toFixed(1)} km</td>
        <td>${entry.liters.toFixed(2)} L</td>
        <td>${formatCurrency(entry.price)}</td>
        <td>${formatCurrency(entry.cost)}</td>
        <td>
          <button class="action-button" data-action="edit" data-id="${displayIndex}">Editar</button>
          <button class="action-button" data-action="delete" data-id="${displayIndex}">Excluir</button>
        </td>
      `;
      entryTable.appendChild(row);
    });

    drawChart();
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    if (entryTable) renderEntries();
    if (avgConsumptionEl) updateSummary();
    const monthlyModeEl = document.getElementById('monthlyMode');
    const mode = monthlyModeEl ? monthlyModeEl.value : 'byDate';
    renderMonthlySummary(mode);
    drawMonthlyChart(mode);
  }

  function saveVehicles() {
    localStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicles));
    renderVehicleList();
    updateVehicleSummary();
    populateVehicleSelect();
  }

  function resetForm() {
    if (fuelForm) fuelForm.reset();
    editingId = null;
    if (cancelEditButton) cancelEditButton.style.display = 'none';
  }

  function fillForm(entry) {
    document.getElementById('date').value = entry.date;
    document.getElementById('distance').value = entry.distance;
    document.getElementById('liters').value = entry.liters;
    document.getElementById('price').value = entry.price;
    document.getElementById('notes').value = entry.notes || '';
    if (vehicleSelect) vehicleSelect.value = entry.vehicleId || '';
    if (cancelEditButton) cancelEditButton.style.display = 'inline-flex';
  }

  if (fuelForm) {
    fuelForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const date = document.getElementById('date').value;
      const distance = parseFloat(document.getElementById('distance').value);
      const liters = parseFloat(document.getElementById('liters').value);
      const price = parseFloat(document.getElementById('price').value);
      const notes = document.getElementById('notes').value;
      const vehicleId = document.getElementById('vehicleId') ? document.getElementById('vehicleId').value : '';

      if (!date || distance <= 0 || liters <= 0 || price <= 0 || !vehicleId) {
        return;
      }

      const cost = liters * price;
      const entry = { date, distance, liters, price, cost, notes, vehicleId };
      let previousEntry = null;

      if (editingId !== null) {
        previousEntry = entries[editingId];
        entries[editingId] = entry;
      } else {
        entries.push(entry);
      }

      updateVehicleOdometer(entry, previousEntry);
      saveEntries();
      saveVehicles();
      resetForm();
      // Após salvar, volte para a página principal para ver o resumo
      window.location.href = 'index.html';
    });
  }

  /* Vehicle management */
  const vehicleForm = document.getElementById('vehicleForm');
  const vehicleTable = document.getElementById('vehicleTable');

  function renderVehicleList() {
    if (!vehicleTable) return;
    vehicleTable.innerHTML = '';
    if (!vehicles.length) {
      vehicleTable.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhum veículo cadastrado.</td></tr>';
      return;
    }
    vehicles.slice().reverse().forEach((v, idx) => {
      const displayIndex = vehicles.length - 1 - idx;
      const initialOdometer = v.initialOdometer != null ? v.initialOdometer : v.odometer;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${v.type}</td>
        <td>${v.make}</td>
        <td>${v.model}</td>
        <td>${v.year}</td>
        <td>${v.plate || '-'}</td>
        <td>${initialOdometer != null ? `${Number(initialOdometer).toFixed(0)} km` : '-'}</td>
        <td class="vehicle-odometer-col">${v.odometer != null ? `${Number(v.odometer).toFixed(0)} km` : '-'}</td>
        <td>
          <button class="action-button" data-action="edit-vehicle" data-id="${displayIndex}">Editar</button>
          <button class="action-button" data-action="delete-vehicle" data-id="${displayIndex}">Excluir</button>
        </td>
      `;
      vehicleTable.appendChild(row);
    });
  }

  function resetVehicleForm() {
    if (!vehicleForm) return;
    vehicleForm.reset();
    editingVehicleId = null;
    const cancelBtn = document.getElementById('cancelVehicleEdit');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  function fillVehicleForm(v) {
    if (!vehicleForm) return;
    document.getElementById('vType').value = v.type || '';
    document.getElementById('vMake').value = v.make || '';
    document.getElementById('vModel').value = v.model || '';
    document.getElementById('vYear').value = v.year || '';
    document.getElementById('vPlate').value = v.plate || '';
    document.getElementById('vOdometer').value = v.initialOdometer != null ? v.initialOdometer : (v.odometer || '');
    document.getElementById('vTank').value = v.tank || '';
    document.getElementById('vFuel').value = v.fuel || '';
    const cancelBtn = document.getElementById('cancelVehicleEdit');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
  }

  if (vehicleForm) {
    vehicleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('vType').value;
      const make = document.getElementById('vMake').value;
      const model = document.getElementById('vModel').value;
      const year = document.getElementById('vYear').value;
      const plate = document.getElementById('vPlate').value;
      const odometer = parseFloat(document.getElementById('vOdometer').value || '0');
      const tank = parseFloat(document.getElementById('vTank').value || '0');
      const fuel = document.getElementById('vFuel').value;

      if (!type || !make || !model || !year) return;

      const vehicle = { type, make, model, year, plate, odometer, tank, fuel };
      if (editingVehicleId !== null) {
        const existing = vehicles[editingVehicleId];
        vehicle.initialOdometer = existing?.initialOdometer != null ? existing.initialOdometer : odometer;
      } else {
        vehicle.initialOdometer = odometer;
      }

      if (editingVehicleId !== null) {
        vehicles[editingVehicleId] = vehicle;
      } else {
        vehicles.push(vehicle);
      }

      saveVehicles();
      resetVehicleForm();
    });

    vehicleForm.addEventListener('click', (evt) => {
      const target = evt.target;
      if (target && target.id === 'cancelVehicleEdit') {
        evt.preventDefault();
        resetVehicleForm();
      }
    });
  }

  if (vehicleTable) {
    vehicleTable.addEventListener('click', (evt) => {
      const button = evt.target.closest('button');
      if (!button) return;
      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      if (action === 'edit-vehicle') {
        editingVehicleId = id;
        fillVehicleForm(vehicles[id]);
      }
      if (action === 'delete-vehicle') {
        if (!confirm('Excluir este veículo?')) return;
        vehicles.splice(id, 1);
        saveVehicles();
      }
    });
  }

  if (entryTable) {
    entryTable.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === 'edit') {
        editingId = id;
        fillForm(entries[id]);
      }

      if (action === 'delete') {
        if (!confirm('Excluir este registro?')) return;
        entries.splice(id, 1);
        saveEntries();
      }
    });
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener('click', resetForm);
  }

  if (clearAllButton) {
    clearAllButton.addEventListener('click', () => {
    if (!confirm('Deseja realmente remover todos os registros?')) {
      return;
    }
    entries = [];
    saveEntries();
    resetForm();
    });
  }

  window.addEventListener('resize', () => {
    drawChart();
  });
  if (entryTable) {
    renderEntries();
    updateSummary();
    resetForm();
  }

  if (vehicleTable || vehicleForm) {
    renderVehicleList();
    updateVehicleSummary();
    resetVehicleForm();
  }
  if (vehicleSelect) {
    populateVehicleSelect();
  }
  // Atualiza contador/resumo de veículos também na página principal
  updateVehicleSummary();
  // render monthly summary on load
  const monthlyModeEl = document.getElementById('monthlyMode');
  if (monthlyModeEl) {
    monthlyModeEl.addEventListener('change', () => { renderMonthlySummary(monthlyModeEl.value); drawMonthlyChart(monthlyModeEl.value); });
  }
  if (showVehicleKmCheckbox) {
    showVehicleKmCheckbox.addEventListener('change', renderVehicleKm);
  }
  // Mobile link helper: show a QR code modal (uses Google Charts QR API)
  function showQrModal(url) {
    // remove existing
    const existing = document.getElementById('qrModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'qrModal';
    overlay.className = 'qr-modal-overlay';
    overlay.innerHTML = `
      <div class="qr-modal">
        <button class="qr-modal-close" aria-label="Fechar">×</button>
        <h3>Abra no celular</h3>
        <img id="qrImg" alt="QR code" src="https://chart.googleapis.com/chart?cht=qr&chs=260x260&chl=${encodeURIComponent(url)}" />
        <p class="qr-link">${url}</p>
        <div class="qr-actions">
          <button id="copyQrLink">Copiar link</button>
          <button id="openInNew">Abrir agora</button>
          <button id="downloadQr">Baixar QR</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('.qr-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const copyBtn = overlay.querySelector('#copyQrLink');
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => alert('Link copiado para a área de transferência.'))
          .catch(() => alert('Não foi possível copiar o link.'));
      } else {
        alert(url);
      }
    });

    const openBtn = overlay.querySelector('#openInNew');
    openBtn.addEventListener('click', () => { window.open(url, '_blank'); });
    const downloadBtn = overlay.querySelector('#downloadQr');
    downloadBtn.addEventListener('click', async () => {
      try {
        const img = overlay.querySelector('#qrImg');
        const resp = await fetch(img.src);
        const blob = await resp.blob();
        const a = document.createElement('a');
        a.id = 'qrDlAnchor';
        a.href = URL.createObjectURL(blob);
        a.download = 'qr_link.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 1500);
      } catch (err) {
        alert('Não foi possível baixar o QR.');
      }
    });
  }

  // Show only link modal (no QR)
  function showLinkModal(url) {
    const existing = document.getElementById('qrModal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'qrModal';
    overlay.className = 'qr-modal-overlay';
    overlay.innerHTML = `
      <div class="qr-modal">
        <button class="qr-modal-close" aria-label="Fechar">×</button>
        <h3>Abrir no celular</h3>
        <p class="qr-link">${url}</p>
        <div class="qr-actions">
          <button id="copyQrLink">Copiar link</button>
          <button id="openInNew">Abrir agora</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.qr-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    const copyBtn = overlay.querySelector('#copyQrLink');
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => alert('Link copiado para a área de transferência.'))
          .catch(() => alert('Não foi possível copiar o link.'));
      } else {
        alert(url);
      }
    });
    const openBtn = overlay.querySelector('#openInNew');
    openBtn.addEventListener('click', () => { window.open(url, '_blank'); });
  }

  function setupMobileLink() {
    const buttons = document.querySelectorAll('#openMobileBtn');
    if (!buttons || !buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const origin = window.location.origin;
        const path = window.location.pathname;
        const shareUrl = origin + path;
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
          // show small IP input modal
          const existingIp = document.getElementById('qrIpModal');
          if (existingIp) existingIp.remove();
          const ipModal = document.createElement('div');
          ipModal.id = 'qrIpModal';
          ipModal.className = 'qr-modal-overlay';
          ipModal.innerHTML = `
            <div class="qr-modal">
              <button class="qr-modal-close" aria-label="Fechar">×</button>
              <h3>Servidor local detectado</h3>
              <p>Digite o IP do seu computador na rede (ex: 192.168.1.10)</p>
              <input id="qrIpInput" placeholder="192.168.1.10" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid rgba(148,163,184,0.12); margin-top:0.5rem" />
              <div class="qr-actions" style="margin-top:0.75rem">
                <button id="qrIpGen">Gerar QR</button>
                <button id="qrIpCancel">Cancelar</button>
              </div>
            </div>`;
          document.body.appendChild(ipModal);
          ipModal.querySelector('.qr-modal-close').addEventListener('click', () => ipModal.remove());
          ipModal.querySelector('#qrIpCancel').addEventListener('click', () => ipModal.remove());
          ipModal.querySelector('#qrIpGen').addEventListener('click', () => {
            const ip = ipModal.querySelector('#qrIpInput').value.trim();
            if (!ip) return;
            const url = origin.replace(location.hostname, ip) + path;
            ipModal.remove();
            showLinkModal(url);
          });
        } else {
          showLinkModal(shareUrl);
        }
      });
    });
  }
  const initialMode = monthlyModeEl ? monthlyModeEl.value : 'byDate';
  renderMonthlySummary(initialMode);
  drawMonthlyChart(initialMode);
  renderVehicleKm();
});