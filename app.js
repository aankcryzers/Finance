
document.addEventListener('DOMContentLoaded', function () {
    // --- MOCK DATA ---
    // Data mock untuk biaya karyawan
    let employeeCostData = [
        { id: 'emp1', date: '2023-10-01', name: 'Budi Santoso', position: 'Operator Excavator', base: 6000000, allowance: 1500000, overtime: 500000 },
        { id: 'emp2', date: '2023-10-01', name: 'Asep Sunandar', position: 'Driver Dump Truck', base: 5000000, allowance: 1200000, overtime: 750000 },
    ];
    // Data mock untuk biaya logistik
    let logisticsCostData = [
        { id: 'log1', date: '2023-10-02', unit: 'EX-01', fuelType: 'Solar', liters: 200, pricePerLiter: 10000 },
        { id: 'log2', date: '2023-10-02', unit: 'DT-05', fuelType: 'Solar', liters: 150, pricePerLiter: 10000 },
    ];
    // Data mock untuk biaya spare part
    let sparepartCostData = [
        { id: 'sp1', date: '2023-10-03', name: 'Filter Oli', code: 'FO-123', forUnit: 'EX-01', quantity: 2, unitPrice: 350000 },
        { id: 'sp2', date: '2023-10-04', name: 'Ban Luar', code: 'TY-789', forUnit: 'DT-05', quantity: 1, unitPrice: 4500000 },
    ];
    // Data mock untuk biaya rental dan aset
    let rentalAssetCostData = [
        { id: 'ra1', date: '2023-10-05', description: 'Sewa Bulldozer D85', type: 'Rental', unit: 'BD-01', totalCost: 15000000 },
        { id: 'ra2', date: '2023-10-06', description: 'Penyusutan Excavator EX-01', type: 'Aset (Penyusutan)', unit: 'EX-01', totalCost: 25000000 },
    ];

    // --- FORMATTER ---
    // Formatter untuk mata uang Rupiah Indonesia
    const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    
    // --- UI ELEMENTS ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const contentSections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const modals = document.querySelectorAll('.modal');

    // Dashboard KPI elements
    const kpiTotalCost = document.getElementById('kpi-total-cost');
    const kpiFuelCost = document.getElementById('kpi-fuel-cost');
    const kpiEmployeeCost = document.getElementById('kpi-employee-cost');
    const kpiSparepartCost = document.getElementById('kpi-sparepart-cost');

    // Chart instances
    let monthlyCostTrendChart;
    let costCompositionChart;

    // --- HELPER FUNCTIONS ---

    // Fungsi untuk menampilkan pesan kustom (menggantikan alert/confirm)
    function showMessage(message, type = 'alert', onConfirm = null) {
        let messageBox = document.getElementById('message-box');
        if (!messageBox) {
            messageBox = document.createElement('div');
            messageBox.id = 'message-box';
            messageBox.classList.add('message-box');
            document.body.appendChild(messageBox);
        }
        messageBox.innerHTML = `<p>${message}</p><button id="message-box-ok">OK</button>`;
        messageBox.style.display = 'flex';

        const okButton = document.getElementById('message-box-ok');
        okButton.onclick = () => {
            messageBox.style.display = 'none';
            if (type === 'confirm' && onConfirm) {
                onConfirm(true); // Indicate confirmation
            }
        };

        if (type === 'confirm') {
            messageBox.innerHTML = `<p>${message}</p>
                                    <div class="flex gap-4">
                                        <button id="message-box-cancel" class="bg-gray-600 hover:bg-gray-500">Batal</button>
                                        <button id="message-box-confirm">Ya</button>
                                    </div>`;
            const confirmButton = document.getElementById('message-box-confirm');
            const cancelButton = document.getElementById('message-box-cancel');

            confirmButton.onclick = () => {
                messageBox.style.display = 'none';
                if (onConfirm) onConfirm(true);
            };
            cancelButton.onclick = () => {
                messageBox.style.display = 'none';
                if (onConfirm) onConfirm(false);
            };
        }
    }

    // --- NAVIGATION ---
    // Mengatur event listener untuk tautan sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            // Sembunyikan semua bagian konten
            contentSections.forEach(section => section.classList.add('hidden'));
            // Tampilkan bagian konten yang ditargetkan
            document.getElementById(targetId).classList.remove('hidden');
            // Hapus kelas 'active' dari semua tautan sidebar
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Tambahkan kelas 'active' ke tautan yang diklik
            link.classList.add('active');
            // Sembunyikan sidebar di layar kecil setelah navigasi
            if (window.innerWidth < 1024) {
                sidebar.classList.add('-translate-x-full');
            }
            // Perbarui dashboard jika bagian yang dituju adalah dashboard
            if (targetId === 'dashboard') {
                renderAll();
            }
        });
    });

    // Mengatur event listener untuk tombol menu mobile
    mobileMenuButton.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });

    // --- MODAL HANDLING ---
    // Fungsi untuk membuka modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10); // Transisi opasitas
    }

    // Fungsi untuk menutup modal
    function closeModal(modal) {
        modal.classList.add('opacity-0'); // Transisi opasitas
        setTimeout(() => modal.classList.add('hidden'), 300); // Sembunyikan setelah transisi
    }

    // Event listener untuk tombol 'Tambah'
    document.getElementById('add-employee-cost-btn').addEventListener('click', () => openModal('employee-cost-modal'));
    document.getElementById('add-logistics-cost-btn').addEventListener('click', () => openModal('logistics-cost-modal'));
    document.getElementById('add-sparepart-cost-btn').addEventListener('click', () => openModal('sparepart-cost-modal'));
    document.getElementById('add-rental-asset-cost-btn').addEventListener('click', () => openModal('rental-asset-cost-modal'));
    
    // Event listener untuk menutup modal saat mengklik backdrop atau tombol 'Batal'
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('btn-cancel')) {
                closeModal(modal);
            }
        });
    });

    // --- TABLE RENDERERS (dengan fungsi Hapus) ---

    // Fungsi untuk merender tabel biaya karyawan
    function renderEmployeeTable() {
        const tbody = document.getElementById('employee-cost-table-body');
        tbody.innerHTML = ''; // Kosongkan tabel sebelum merender ulang
        employeeCostData.forEach((item, idx) => {
            const total = item.base + item.allowance + item.overtime;
            tbody.innerHTML += `
                <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                    <td class="px-6 py-4">${item.date}</td>
                    <td class="px-6 py-4 font-medium text-white">${item.name}</td>
                    <td class="px-6 py-4">${item.position}</td>
                    <td class="px-6 py-4 text-right">${currencyFormatter.format(item.base)}</td>
                    <td class="px-6 py-4 text-right">${currencyFormatter.format(item.allowance)}</td>
                    <td class="px-6 py-4 text-right">${currencyFormatter.format(item.overtime)}</td>
                    <td class="px-6 py-4 text-right font-semibold text-white">${currencyFormatter.format(total)}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs delete-employee-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
        // Event listener untuk tombol hapus
        tbody.querySelectorAll('.delete-employee-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                showMessage('Hapus data ini?', 'confirm', (confirmed) => {
                    if (confirmed) {
                        employeeCostData = employeeCostData.filter(item => item.id !== itemId);
                        renderAll(); // Render ulang semua tabel dan dashboard
                    }
                });
            });
        });
    }

    // Fungsi untuk merender tabel biaya logistik
    function renderLogisticsTable() {
        const tbody = document.getElementById('logistics-cost-table-body');
        tbody.innerHTML = ''; // Kosongkan tabel sebelum merender ulang
        logisticsCostData.forEach((item, idx) => {
            const total = item.liters * item.pricePerLiter;
            tbody.innerHTML += `
                <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                    <td class="px-6 py-4">${item.date}</td>
                    <td class="px-6 py-4 font-medium text-white">${item.unit}</td>
                    <td class="px-6 py-4">${item.fuelType}</td>
                    <td class="px-6 py-4 text-right">${item.liters.toLocaleString('id-ID')} Ltr</td>
                    <td class="px-6 py-4 text-right">${currencyFormatter.format(item.pricePerLiter)}</td>
                    <td class="px-6 py-4 text-right font-semibold text-white">${currencyFormatter.format(total)}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs delete-logistics-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
        // Event listener untuk tombol hapus
        tbody.querySelectorAll('.delete-logistics-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                showMessage('Hapus data ini?', 'confirm', (confirmed) => {
                    if (confirmed) {
                        logisticsCostData = logisticsCostData.filter(item => item.id !== itemId);
                        renderAll(); // Render ulang semua tabel dan dashboard
                    }
                });
            });
        });
    }

    // Fungsi untuk merender tabel biaya spare part
    function renderSparepartTable() {
        const tbody = document.getElementById('sparepart-cost-table-body');
        tbody.innerHTML = ''; // Kosongkan tabel sebelum merender ulang
        sparepartCostData.forEach((item, idx) => {
            const total = item.quantity * item.unitPrice;
            tbody.innerHTML += `
                <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                    <td class="px-6 py-4">${item.date}</td>
                    <td class="px-6 py-4 font-medium text-white">${item.name}</td>
                    <td class="px-6 py-4">${item.code || '-'}</td>
                    <td class="px-6 py-4">${item.forUnit}</td>
                    <td class="px-6 py-4 text-right">${item.quantity.toLocaleString('id-ID')}</td>
                    <td class="px-6 py-4 text-right">${currencyFormatter.format(item.unitPrice)}</td>
                    <td class="px-6 py-4 text-right font-semibold text-white">${currencyFormatter.format(total)}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs delete-sparepart-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
        // Event listener untuk tombol hapus
        tbody.querySelectorAll('.delete-sparepart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                showMessage('Hapus data ini?', 'confirm', (confirmed) => {
                    if (confirmed) {
                        sparepartCostData = sparepartCostData.filter(item => item.id !== itemId);
                        renderAll(); // Render ulang semua tabel dan dashboard
                    }
                });
            });
        });
    }

    // Fungsi untuk merender tabel biaya rental dan aset
    function renderRentalAssetTable() {
        const tbody = document.getElementById('rental-asset-cost-table-body');
        tbody.innerHTML = ''; // Kosongkan tabel sebelum merender ulang
        rentalAssetCostData.forEach((item, idx) => {
            tbody.innerHTML += `
                <tr class="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                    <td class="px-6 py-4">${item.date}</td>
                    <td class="px-6 py-4 font-medium text-white">${item.description}</td>
                    <td class="px-6 py-4">${item.type}</td>
                    <td class="px-6 py-4">${item.unit || '-'}</td>
                    <td class="px-6 py-4 text-right font-semibold text-white">${currencyFormatter.format(item.totalCost)}</td>
                    <td class="px-6 py-4 text-center">
                        <button class="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs delete-rental-asset-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
        });
        // Event listener untuk tombol hapus
        tbody.querySelectorAll('.delete-rental-asset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                showMessage('Hapus data ini?', 'confirm', (confirmed) => {
                    if (confirmed) {
                        rentalAssetCostData = rentalAssetCostData.filter(item => item.id !== itemId);
                        renderAll(); // Render ulang semua tabel dan dashboard
                    }
                });
            });
        });
    }

    // Fungsi untuk merender semua tabel
    function renderAllTables() {
        renderEmployeeTable();
        renderLogisticsTable();
        renderSparepartTable();
        renderRentalAssetTable();
    }

    // --- FORM SUBMISSIONS ---

    // Form untuk biaya karyawan
    document.getElementById('employee-cost-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(), // ID unik
            date: document.getElementById('emp-date').value,
            name: document.getElementById('emp-name').value,
            position: document.getElementById('emp-position').value,
            base: parseInt(document.getElementById('emp-base-salary').value),
            allowance: parseInt(document.getElementById('emp-allowance').value),
            overtime: parseInt(document.getElementById('emp-overtime').value),
        };
        employeeCostData.push(newEntry);
        closeModal(document.getElementById('employee-cost-modal'));
        this.reset(); // Reset form
        renderAll(); // Render ulang semua
        showMessage('Data biaya karyawan berhasil ditambahkan!', 'alert');
    });

    // Form untuk biaya logistik
    document.getElementById('logistics-cost-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(), // ID unik
            date: document.getElementById('log-date').value,
            unit: document.getElementById('log-unit').value,
            fuelType: document.getElementById('log-fuel-type').value,
            liters: parseInt(document.getElementById('log-liters').value),
            pricePerLiter: parseInt(document.getElementById('log-price-per-liter').value),
        };
        logisticsCostData.push(newEntry);
        closeModal(document.getElementById('logistics-cost-modal'));
        this.reset();
        renderAll();
        showMessage('Data biaya logistik/BBM berhasil ditambahkan!', 'alert');
    });

    // Form untuk biaya spare part
    document.getElementById('sparepart-cost-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(), // ID unik
            date: document.getElementById('sp-date').value,
            name: document.getElementById('sp-name').value,
            code: document.getElementById('sp-code').value,
            forUnit: document.getElementById('sp-unit').value,
            quantity: parseInt(document.getElementById('sp-quantity').value),
            unitPrice: parseInt(document.getElementById('sp-unit-price').value),
        };
        sparepartCostData.push(newEntry);
        closeModal(document.getElementById('sparepart-cost-modal'));
        this.reset();
        renderAll();
        showMessage('Data biaya spare part berhasil ditambahkan!', 'alert');
    });

    // Form untuk biaya rental dan aset
    document.getElementById('rental-asset-cost-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const newEntry = {
            id: Date.now().toString(), // ID unik
            date: document.getElementById('ra-date').value,
            description: document.getElementById('ra-description').value,
            type: document.getElementById('ra-type').value,
            unit: document.getElementById('ra-unit').value,
            totalCost: parseInt(document.getElementById('ra-total-cost').value),
        };
        rentalAssetCostData.push(newEntry);
        closeModal(document.getElementById('rental-asset-cost-modal'));
        this.reset();
        renderAll();
        showMessage('Data biaya rental & aset berhasil ditambahkan!', 'alert');
    });

    // --- EXPORT TO EXCEL ---

    // Fungsi generik untuk mengekspor data ke Excel
    function exportToExcel(data, filename) {
        if (data.length === 0) {
            showMessage('Tidak ada data untuk diekspor.', 'alert');
            return;
        }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `${filename}.xlsx`);
        showMessage('Data berhasil diekspor ke Excel!', 'alert');
    }

    document.getElementById('export-employee-cost-btn').addEventListener('click', () => {
        const formattedData = employeeCostData.map(item => ({
            Tanggal: item.date,
            Nama: item.name,
            Jabatan: item.position,
            'Gaji Pokok': item.base,
            Tunjangan: item.allowance,
            Lembur: item.overtime,
            'Total Gaji': item.base + item.allowance + item.overtime
        }));
        exportToExcel(formattedData, 'Biaya_Karyawan');
    });

    document.getElementById('export-logistics-cost-btn').addEventListener('click', () => {
        const formattedData = logisticsCostData.map(item => ({
            Tanggal: item.date,
            'Unit/Alat': item.unit,
            'Jenis BBM': item.fuelType,
            'Jumlah (Ltr)': item.liters,
            'Harga/Ltr': item.pricePerLiter,
            'Total Biaya': item.liters * item.pricePerLiter
        }));
        exportToExcel(formattedData, 'Biaya_Logistik_BBM');
    });

    document.getElementById('export-sparepart-cost-btn').addEventListener('click', () => {
        const formattedData = sparepartCostData.map(item => ({
            Tanggal: item.date,
            'Nama Part': item.name,
            'Kode Part': item.code,
            'Untuk Unit': item.forUnit,
            'Jumlah': item.quantity,
            'Harga Satuan': item.unitPrice,
            'Total Biaya': item.quantity * item.unitPrice
        }));
        exportToExcel(formattedData, 'Biaya_Sparepart');
    });

    document.getElementById('export-rental-asset-cost-btn').addEventListener('click', () => {
        const formattedData = rentalAssetCostData.map(item => ({
            Tanggal: item.date,
            Deskripsi: item.description,
            Jenis: item.type,
            Unit: item.unit,
            'Total Biaya': item.totalCost
        }));
        exportToExcel(formattedData, 'Biaya_Rental_Aset');
    });

    // --- DASHBOARD CHARTS & KPIS ---

    // Fungsi untuk memperbarui KPI di dashboard
    function updateKPIs() {
        const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

        let totalCostThisMonth = 0;
        let fuelCostThisMonth = 0;
        let employeeCostThisMonth = 0;
        let sparepartCostThisMonth = 0;

        employeeCostData.forEach(item => {
            if (item.date.startsWith(currentMonth)) {
                employeeCostThisMonth += (item.base + item.allowance + item.overtime);
            }
        });
        logisticsCostData.forEach(item => {
            if (item.date.startsWith(currentMonth)) {
                fuelCostThisMonth += (item.liters * item.pricePerLiter);
            }
        });
        sparepartCostData.forEach(item => {
            if (item.date.startsWith(currentMonth)) {
                sparepartCostThisMonth += (item.quantity * item.unitPrice);
            }
        });
        rentalAssetCostData.forEach(item => {
            if (item.date.startsWith(currentMonth)) {
                totalCostThisMonth += item.totalCost; // Rental & Aset langsung ditambahkan ke total
            }
        });

        totalCostThisMonth += fuelCostThisMonth + employeeCostThisMonth + sparepartCostThisMonth;

        kpiTotalCost.textContent = currencyFormatter.format(totalCostThisMonth);
        kpiFuelCost.textContent = currencyFormatter.format(fuelCostThisMonth);
        kpiEmployeeCost.textContent = currencyFormatter.format(employeeCostThisMonth);
        kpiSparepartCost.textContent = currencyFormatter.format(sparepartCostThisMonth);
    }

    // Fungsi untuk menginisialisasi atau memperbarui grafik
    function updateCharts() {
        // Data untuk tren biaya bulanan
        const monthlyData = {};
        [...employeeCostData, ...logisticsCostData, ...sparepartCostData, ...rentalAssetCostData].forEach(item => {
            const month = item.date.slice(0, 7); // 'YYYY-MM'
            let cost = 0;
            if (item.base !== undefined) { // Employee cost
                cost = item.base + item.allowance + item.overtime;
            } else if (item.liters !== undefined) { // Logistics cost
                cost = item.liters * item.pricePerLiter;
            } else if (item.quantity !== undefined) { // Sparepart cost
                cost = item.quantity * item.unitPrice;
            } else if (item.totalCost !== undefined) { // Rental/Asset cost
                cost = item.totalCost;
            }
            monthlyData[month] = (monthlyData[month] || 0) + cost;
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const monthlyCosts = sortedMonths.map(month => monthlyData[month]);

        const monthlyCtx = document.getElementById('monthlyCostTrendChart').getContext('2d');
        if (monthlyCostTrendChart) {
            monthlyCostTrendChart.destroy(); // Hancurkan instance chart yang ada
        }
        monthlyCostTrendChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: 'Total Biaya',
                    data: monthlyCosts,
                    borderColor: '#007aff',
                    backgroundColor: 'rgba(0, 122, 255, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#8e8e93' },
                        grid: { color: '#3a3a3c' }
                    },
                    y: {
                        ticks: { 
                            color: '#8e8e93',
                            callback: function(value) {
                                return currencyFormatter.format(value);
                            }
                        },
                        grid: { color: '#3a3a3c' }
                    }
                }
            }
        });

        // Data untuk komposisi biaya
        const compositionData = {
            'Karyawan': employeeCostData.reduce((sum, item) => sum + item.base + item.allowance + item.overtime, 0),
            'Logistik/BBM': logisticsCostData.reduce((sum, item) => sum + (item.liters * item.pricePerLiter), 0),
            'Spare Part': sparepartCostData.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
            'Rental & Aset': rentalAssetCostData.reduce((sum, item) => sum + item.totalCost, 0)
        };

        const compositionLabels = Object.keys(compositionData);
        const compositionValues = Object.values(compositionData);

        const compositionCtx = document.getElementById('costCompositionChart').getContext('2d');
        if (costCompositionChart) {
            costCompositionChart.destroy(); // Hancurkan instance chart yang ada
        }
        costCompositionChart = new Chart(compositionCtx, {
            type: 'doughnut',
            data: {
                labels: compositionLabels,
                datasets: [{
                    data: compositionValues,
                    backgroundColor: [
                        '#007aff', // Blue
                        '#FF9500', // Orange
                        '#FFCC00', // Yellow
                        '#AF52DE'  // Purple
                    ],
                    borderColor: '#1c1c1e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += currencyFormatter.format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Fungsi utama untuk merender semua komponen UI
    function renderAll() {
        renderAllTables();
        updateKPIs();
        updateCharts();
    }

    // Inisialisasi aplikasi saat DOM dimuat
    renderAll();
});
