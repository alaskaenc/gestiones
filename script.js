// script.js
// Define la URL base de tu API de Node.js
const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // --- Variables Globales y Constantes ---
    // Ya no usamos localStorage directamente para sales, rates, sellers.
    // Los datos se cargarán desde la API.
    let exchangeRates = {};
    let sales = [];
    let predefinedSellers = [];

    let editingSaleId = null; // Variable para almacenar el ID de la venta que se está editando

    // --- Variables de Paginación ---
    let currentPage = 1;
    const itemsPerPage = 10; // Puedes ajustar este número de elementos por página

    // --- Elementos del DOM ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Pestaña de Cotizaciones
    const usdToArsInput = document.getElementById('usdToArs');
    const pygToArsInput = document.getElementById('pygToArs');
    const brlToArsInput = document.getElementById('brlToArs');
    const saveRatesBtn = document.getElementById('saveRates');
    const currentUsdRateSpan = document.getElementById('currentUsdRate');
    const currentPygRateSpan = document.getElementById('currentPygRate');
    const currentBrlRateSpan = document.getElementById('currentBrlRate');
    // Nuevos botones para Exportar/Importar Datos
    const exportAllDataBtn = document.getElementById('exportAllData');
    const importFileInput = document.getElementById('importFileInput');
    const importDataBtn = document.getElementById('importData'); // Corrección aquí: se eliminó la reasignación de 'document'


    // Pestaña Cargar Boleta
    const saleDateInput = document.getElementById('saleDateInput');
    const sellerNameInput = document.getElementById('sellerName');
    const sellerNamesDatalist = document.getElementById('sellerNames');
    const saleAmountInput = document.getElementById('saleAmount'); // Ahora es un textarea
    const saleCurrencySelect = document.getElementById('saleCurrency');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const commissionRateInput = document.getElementById('commissionRate');
    const enableCommissionEditCheckbox = document.getElementById('enableCommissionEdit'); // Checkbox para activar/desactivar edición de comisión

    const isWholesaleCheckbox = document.getElementById('isWholesale');
    const paseAmountGroup = document.getElementById('paseAmountGroup'); // Contenedor del monto de pase
    const paseAmountInput = document.getElementById('paseAmount');
    const paseCurrencyGroup = document.getElementById('paseCurrencyGroup'); // Contenedor de la moneda de pase
    const paseCurrencySelect = document.getElementById('paseCurrency'); // Selector de moneda de pase

    // NOTA: Se eliminan los elementos y lógica relacionados con 'Pago Confirmado' aquí.

    const addSaleBtn = document.getElementById('addSale');
    const cancelEditBtn = document.getElementById('cancelEditBtn'); // Botón para cancelar la edición
    const dailySummaryPreview = document.getElementById('dailySummaryPreview'); // Elemento para la vista previa diaria

    // Pestaña Listado de Boletas
    const salesTableBody = document.querySelector('#salesTable tbody');
    const salesTableHeader = document.querySelector('#salesTable thead');
    const totalSalesArsSpan = document.getElementById('totalSalesArs');
    const totalCommissionsArsSpan = document.getElementById('totalCommissionsArs');
    const totalDepositCommissionsArsSpan = document.getElementById('totalDepositCommissionsArs');
    const filterSellerInput = document.getElementById('filterSeller');
    const resetFilterBtn = document.getElementById('resetFilter');
    const paginationControls = document.createElement('div'); // Contenedor para los controles de paginación
    paginationControls.id = 'paginationControls';
    paginationControls.classList.add('flex', 'justify-center', 'mt-4', 'space-x-2');
    document.getElementById('listado-boletas').appendChild(paginationControls); // Se añade a la sección de listado-boletas
    const deleteAllSalesBtn = document.getElementById('deleteAllSales'); // Botón para eliminar todas las ventas

    // NUEVOS FILTROS DE FECHA PARA LISTADO DE BOLETAS
    const listSalesStartDateFilter = document.getElementById('listSalesStartDateFilter');
    const listSalesEndDateFilter = document.getElementById('listSalesEndDateFilter');
    const showAllListSalesBtn = document.getElementById('showAllListSalesBtn');

    // NOTA: Se elimina el filtro para estado de pago.
    // const paymentStatusFilter = document.getElementById('paymentStatusFilter');

    // Pestaña Resumen por Vendedor
    const summaryTableBody = document.querySelector('#summaryTable tbody');
    const summaryTable = document.getElementById('summaryTable');
    const exportSummaryTableBtn = document.getElementById('exportSummaryTable');
    const summarySellerFilter = document.getElementById('summarySellerFilter');
    const sellerNamesSummaryDatalist = document.getElementById('sellerNamesSummary');
    const summaryStartDateFilter = document.getElementById('summaryStartDateFilter');
    const summaryEndDateFilter = document.getElementById('summaryEndDateFilter');
    const summaryResetFiltersBtn = document.getElementById('summaryResetFiltersBtn');

    // Pestaña Resumen Detallado por Moneda
    const detailedSummaryContent = document.getElementById('detailedSummaryContent');
    const filterDetailedSellerInput = document.getElementById('filterDetailedSeller');
    const exportDetailedSummaryBtn = document.getElementById('exportDetailedSummaryBtn'); // ID correcto
    // NUEVOS FILTROS DE FECHA PARA RESUMEN DETALLADO
    const detailedStartDateFilter = document.getElementById('detailedStartDateFilter');
    const detailedEndDateFilter = document.getElementById('detailedEndDateFilter');
    const showAllDetailedSalesBtn = document.getElementById('showAllDetailedSalesBtn');

    // Pestaña Gestionar Vendedores
    const newSellerNameInput = document.getElementById('newSellerName');
    const addSellerBtn_manageSellers = document.getElementById('addSeller');
    const sellersTableBody = document.getElementById('sellersTableBody');

    // Elementos del Modal Personalizado (para confirmaciones)
    const customModal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');
    const closeButton = document.querySelector('.close-button');

    // Elemento para las Notificaciones Toast
    const toastContainer = document.getElementById('toastContainer');

    // --- Definiciones para columnas de resumen por método de pago y moneda ---
    const ALL_PAYMENT_METHODS = ['Efectivo', 'Transf', 'Tarjeta', 'Usdt', 'Yasin', 'Mercado Pago', 'Otros'];
    const ALL_CURRENCIES = ['USD', 'PYG', 'BRL', 'ARS'];

    // Define combinaciones específicas de método de pago y moneda a mostrar
    const DISPLAY_METHOD_CURRENCY_COMBINATIONS = [];
    ALL_PAYMENT_METHODS.forEach(pm => {
        ALL_CURRENCIES.forEach(curr => {
            // Excluir combinaciones específicas
            if (!(
                (curr === 'BRL' && (pm === 'Transf' || pm === 'Tarjeta' || pm === 'Otros' || pm === 'Usdt' || pm === 'Yasin' || pm === 'Mercado Pago')) ||
                (pm === 'Yasin' && curr === 'USD') ||
                (pm === 'Mercado Pago' && curr === 'PYG') ||
                (pm === 'Mercado Pago' && curr === 'USD') ||
                (pm === 'Yasin' && curr === 'ARS') ||
                (pm === 'Yasin' && curr === 'PYG') ||
                (pm === 'Transf' && curr === 'ARS') ||
                (pm === 'Tarjeta' && curr === 'ARS') ||
                (pm === 'Tarjeta' && curr === 'USD') ||
                (pm === 'Usdt' && curr === 'ARS') ||
                (pm === 'Usdt' && curr === 'PYG') ||
                (pm === 'Otros' && curr === 'ARS') ||
                (pm === 'Otros' && curr === 'PYG')

            )) {
                DISPLAY_METHOD_CURRENCY_COMBINATIONS.push({ method: pm, currency: curr });
            }
        });
    });

    // --- Funciones de Utilidad (ahora interactuando con la API) ---
    async function fetchData(endpoint) {
        try {
            console.log(`Intentando cargar datos de: ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                console.error(`Error HTTP cargando ${endpoint}: estado ${response.status}`);
                throw new Error(`Error HTTP! estado: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Datos cargados de ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`Error cargando datos de ${endpoint}:`, error);
            showToast(`Error cargando datos de ${endpoint}. Revisa la consola y asegúrate de que el servidor esté funcionando.`, 'error');
            return null;
        }
    }

    async function postData(endpoint, data) {
        try {
            console.log(`Intentando enviar datos a: ${API_BASE_URL}${endpoint} con payload:`, data);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error HTTP enviando a ${endpoint}: estado ${response.status}, mensaje: ${errorData.error || 'Error desconocido'}`);
                throw new Error(`Error HTTP! estado: ${response.status}, mensaje: ${errorData.error || 'Error desconocido'}`);
            }
            const result = await response.json();
            console.log(`Datos enviados a ${endpoint} con éxito:`, result);
            return result;
        } catch (error) {
            console.error(`Error guardando datos en ${endpoint}: ${error.message}`, 'error');
            return null;
        }
    }

    async function putData(endpoint, data) {
        try {
            console.log(`Intentando actualizar datos en: ${API_BASE_URL}${endpoint} con payload:`, data);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error HTTP actualizando ${endpoint}: estado ${response.status}, mensaje: ${errorData.message || 'Error desconocido'}`);
                throw new Error(`Error HTTP! estado: ${response.status}, mensaje: ${errorData.message || 'Error desconocido'}`);
            }
            const result = await response.json();
            console.log(`Datos actualizados en ${endpoint} con éxito:`, result);
            return result;
        } catch (error) {
            console.error(`Error actualizando ${endpoint}:`, error);
            showToast(`Error actualizando datos en ${endpoint}: ${error.message}`, 'error');
            return null;
        }
    }

    async function deleteData(endpoint) {
        try {
            console.log(`Intentando eliminar datos de: ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error HTTP eliminando de ${endpoint}: estado ${response.status}, mensaje: ${errorData.message || 'Error desconocido'}`);
                throw new Error(`Error HTTP! estado: ${response.status}, mensaje: ${errorData.message || 'Error desconocido'}`);
            }
            const result = await response.json();
            console.log(`Datos eliminados de ${endpoint} con éxito:`, result);
            return result;
        } catch (error) {
            console.error(`Error eliminando de ${endpoint}:`, error);
            showToast(`Error eliminando datos de ${endpoint}: ${error.message}`, 'error');
            return null;
        }
    }

    // Función para formatear moneda
    function formatCurrency(amount, currency = 'ARS') {
        let options = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            currencyDisplay: 'symbol'
        };

        let locale;

        if (currency === 'PYG') {
            options.minimumFractionDigits = 0;
            options.maximumFractionDigits = 0;
            locale = 'es-AR';
            options.currencyDisplay = 'code';
        } else if (currency === 'ARS') {
            locale = 'es-AR';
            options.currencyDisplay = 'symbol';
        } else if (currency === 'USD') {
            locale = 'en-US';
            options.currencyDisplay = 'symbol';
        } else if (currency === 'BRL') {
            locale = 'pt-BR';
            options.currencyDisplay = 'symbol';
        } else {
            locale = 'en-US';
            options.currencyDisplay = 'symbol';
        }

        return new Intl.NumberFormat(locale, options).format(amount);
    }

    // Función de ayuda para formatear números para la exportación a Excel, evitando la conversión de fechas para 0 y decimales pequeños
    function formatNumberForExcel(value, decimalPlaces = 2) {
        if (value === null || value === undefined || isNaN(value) || parseFloat(value) === 0) {
            return '';
        }

        const numericValue = parseFloat(value);
        return numericValue.toFixed(decimalPlaces);
    }

    function convertToArs(amount, currency) {
        switch (currency) {
            case 'USD':
                return amount * exchangeRates.usdToArs;
            case 'PYG':
                // Nota: PYG es / exchangeRates, asegurando que se obtenga el equivalente en ARS
                return amount / exchangeRates.pygToArs;
            case 'BRL':
                return amount * exchangeRates.brlToArs;
            case 'ARS':
            default:
                return amount;
        }
    }

    // Nueva función de ayuda para convertir el monto entre dos monedas
    function convertAmount(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        let amountInArs;
        // Paso 1: Convertir de la moneda de origen a ARS
        switch (fromCurrency) {
            case 'USD':
                amountInArs = amount * exchangeRates.usdToArs;
                break;
            case 'PYG':
                amountInArs = amount / exchangeRates.pygToArs;
                break;
            case 'BRL':
                amountInArs = amount * exchangeRates.brlToArs;
                break;
            case 'ARS':
            default:
                amountInArs = amount; // Ya está en ARS
                break;
        }

        // Paso 2: Convertir de ARS a la moneda de destino
        switch (toCurrency) {
            case 'USD':
                return amountInArs / exchangeRates.usdToArs;
            case 'PYG':
                return amountInArs * exchangeRates.pygToArs;
                break;
            case 'BRL':
                return amountInArs / exchangeRates.brlToArs;
            case 'ARS':
            default:
                return amountInArs; // El destino es ARS
        }
    }

    // --- Funciones del Modal Personalizado (solo para confirmaciones) ---
    function showConfirm(message, onConfirm, onCancel) {
        modalMessage.textContent = message;
        modalButtons.innerHTML = '';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Sí';
        confirmBtn.classList.add('btn', 'success');
        confirmBtn.onclick = () => {
            customModal.style.display = 'none';
            if (onConfirm) onConfirm();
        };
        modalButtons.appendChild(confirmBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'No';
        cancelBtn.classList.add('btn', 'secondary');
        cancelBtn.onclick = () => {
            customModal.style.display = 'none';
            if (onCancel) onCancel();
        };
        modalButtons.appendChild(cancelBtn);

        customModal.style.display = 'flex';
    }

    closeButton.addEventListener('click', () => {
        customModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == customModal) {
            customModal.style.display = 'none';
        }
    });

    // --- Función de Notificación Toast (para alertas rápidas) ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        if (type === 'error') {
            toast.classList.add('error');
        }
        toast.textContent = message;
        toastContainer.appendChild(toast);

        void toast.offsetWidth;

        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';

            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true });
        }, 2500);
    }

    // --- Gestión de Cotizaciones ---
    async function updateCurrentRatesDisplay() {
        const ratesData = await fetchData('/rates');
        if (ratesData) {
            exchangeRates = ratesData;
            if (usdToArsInput) usdToArsInput.value = exchangeRates.usdToArs;
            if (pygToArsInput) pygToArsInput.value = exchangeRates.pygToArs;
            if (brlToArsInput) brlToArsInput.value = exchangeRates.brlToArs;

            if (currentUsdRateSpan) currentUsdRateSpan.textContent = formatCurrency(exchangeRates.usdToArs, 'ARS') + ' / USD';
            if (currentPygRateSpan) currentPygRateSpan.textContent = exchangeRates.pygToArs.toLocaleString('es-AR', { minimumFractionDigits: 2 }) + ' PYG / ARS';
            if (currentBrlRateSpan) currentBrlRateSpan.textContent = formatCurrency(exchangeRates.brlToArs, 'ARS') + ' / BRL';
        } else {
            // Establece valores por defecto si la API falla en cargar las tasas
            exchangeRates = { usdToArs: 1000, pygToArs: 7692.31, brlToArs: 200 };
            if (usdToArsInput) usdToArsInput.value = exchangeRates.usdToArs;
            if (pygToArsInput) pygToArsInput.value = exchangeRates.pygToArs;
            if (brlToArsInput) brlToArsInput.value = exchangeRates.brlToArs;
            if (currentUsdRateSpan) currentUsdRateSpan.textContent = formatCurrency(exchangeRates.usdToArs, 'ARS') + ' / USD';
            if (currentPygRateSpan) currentPygRateSpan.textContent = exchangeRates.pygToArs.toLocaleString('es-AR', { minimumFractionDigits: 2 }) + ' PYG / ARS';
            if (currentBrlRateSpan) currentBrlRateSpan.textContent = formatCurrency(exchangeRates.brlToArs, 'ARS') + ' / BRL';
        }
    }

    if (saveRatesBtn) {
        saveRatesBtn.addEventListener('click', async () => {
            const newRates = {
                usdToArs: parseFloat(usdToArsInput.value),
                pygToArs: parseFloat(pygToArsInput.value),
                brlToArs: parseFloat(brlToArsInput.value)
            };
            const result = await postData('/rates', newRates);
            if (result) {
                await updateCurrentRatesDisplay();
                await loadAllData(); // Recargar todos los datos después de cambiar las tasas
                showToast('Cotizaciones guardadas correctamente.');
            }
        });
    } else {
        console.error('Error: saveRatesBtn es null.');
    }

    // --- Gestión de Boletas ---
    if (addSaleBtn) {
        addSaleBtn.addEventListener('click', async () => {
            if (editingSaleId) {
                await updateSale();
            } else {
                await addNewSale();
            }
        });
    } else {
        console.error('Error: addSaleBtn es null.');
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editingSaleId = null;
            resetForm(true);
            showTab('listado-boletas');
            showToast('Edición cancelada.');
        });
    } else {
        console.error('Error: cancelEditBtn es null.');
    }

    // Escuchadores de eventos consolidados para botones de exportación
    if (exportSummaryTableBtn) {
        exportSummaryTableBtn.addEventListener('click', () => {
            exportSummaryTableToExcel();
        });
    } else {
        console.error('Error: exportSummaryTableBtn es null.');
    }

    if (exportDetailedSummaryBtn) {
        exportDetailedSummaryBtn.addEventListener('click', () => {
            exportDetailedSummaryToExcel();
        });
    } else {
        console.error('Error: exportDetailedSummaryBtn es null.');
    }

    async function addNewSale() {
        try {
            const saleDate = saleDateInput.value;
            const sellerName = sellerNameInput.value.trim();
            const saleAmountsRaw = saleAmountInput.value.trim();
            const defaultCurrency = saleCurrencySelect.value;
            const paymentMethod = paymentMethodSelect.value;
            const commissionRate = parseFloat(commissionRateInput.value) / 10;
            const commissionDepositRate = 0.06;
            const isWholesale = isWholesaleCheckbox.checked;

            let paseAmount = 0;
            let paseCurrency = 'ARS';

            if (isWholesale && paseAmountInput && paseCurrencySelect) {
                paseAmount = parseFloat(paseAmountInput.value);
                paseCurrency = paseCurrencySelect.value;
            }

            if (!saleDate || !sellerName || saleAmountsRaw === '' || isNaN(commissionRate) || commissionRate < 0) {
                showToast('Por favor, completa todos los campos obligatorios y asegúrate de que las tasas sean válidas.', 'error');
                return;
            }
            if (isWholesale && (isNaN(paseAmount) || paseAmount < 0)) {
                showToast('Por favor, ingresa un monto de pase válido o deshabilita la opción de Mayorista.', 'error');
                return;
            }

            const currencyRegex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]{3})?/i;
            const salesEntries = saleAmountsRaw.split(/[\n,]+/).map(s => s.trim()).filter(s => s !== '');

            if (salesEntries.length === 0) {
                showToast('Por favor, ingresa al menos un monto de venta válido.', 'error');
                return;
            }

            let salesAddedCount = 0;
            let hasError = false;

            for (const entry of salesEntries) { // Usa for...of para operaciones asíncronas
                const match = entry.match(currencyRegex);
                if (match) {
                    const amount = parseFloat(match[1]);
                    const currency = (match[2] ? match[2].toUpperCase() : defaultCurrency).trim();

                    const allowedCurrencies = ['ARS', 'USD', 'PYG', 'BRL'];

                    if (isNaN(amount) || amount <= 0) {
                        showToast(`Monto inválido ignorado: "${entry}".`, 'error');
                        hasError = true;
                        continue; // Salta a la siguiente entrada
                    }
                    if (!allowedCurrencies.includes(currency)) {
                        showToast(`Moneda inválida "${currency}" para el monto "${amount}". Boleta no agregada.`, 'error');
                        hasError = true;
                        continue; // Salta a la siguiente entrada
                    }

                    let actualPaseAmountInSaleCurrency = 0;
                    if (isWholesale && paseAmount > 0) {
                        if (!allowedCurrencies.includes(paseCurrency)) {
                            showToast(`Moneda de pase inválida "${paseCurrency}".`, 'error');
                            hasError = true;
                            continue; // Salta a la siguiente entrada
                        }
                        actualPaseAmountInSaleCurrency = convertAmount(paseAmount, paseCurrency, currency);
                    }

                    const netAmountVal = amount - actualPaseAmountInSaleCurrency;
                    const netAmountArsVal = convertToArs(netAmountVal, currency);
                    const grossCommissionArsVal = netAmountArsVal * commissionRate;
                    const commissionDepositArsVal = grossCommissionArsVal * commissionDepositRate;
                    const finalCommissionArsVal = grossCommissionArsVal - commissionDepositArsVal;

                    const newSale = {
                        date: saleDate,
                        seller: sellerName,
                        originalAmount: amount, // Se mantiene el monto original
                        currency: currency,
                        paymentMethod: paymentMethod,
                        paseAmount: paseAmount,
                        paseCurrency: paseCurrency,
                        netAmount: netAmountVal, // Monto neto (original - pase) en la moneda de venta
                        netAmountArs: parseFloat(netAmountArsVal.toFixed(2)), // Monto neto (original - pase) en ARS
                        commissionRate: commissionRate,
                        grossCommissionArs: parseFloat(grossCommissionArsVal.toFixed(2)),
                        commissionDepositRate: parseFloat(commissionDepositArsVal.toFixed(2)) > 0 ? commissionDepositRate : 0,
                        commissionDepositArs: parseFloat(commissionDepositArsVal.toFixed(2)),
                        commissionArs: parseFloat(finalCommissionArsVal.toFixed(2)),
                        type: isWholesale ? 'Mayorista' : 'Minorista'
                        // isPaymentConfirmed se ha eliminado
                    };

                    const result = await postData('/sales', newSale);
                    if (result) {
                        salesAddedCount++;
                    }
                } else {
                    showToast(`Formato de monto inválido para la entrada: "${entry}". Esperado: 'monto moneda' o 'monto'.`, 'error');
                    hasError = true;
                }
            }

            if (salesAddedCount === 0 && !hasError) {
                showToast('No se pudo agregar ninguna boleta. Revisa los montos ingresados.', 'error');
                return;
            }

            await loadAllData(); // Recargar todos los datos de la API después de agregar
            currentPage = 1;
            // Se elimina el argumento `paymentStatusFilter.value` ya que la funcionalidad fue removida.
            renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value);
            renderSummaryTable(summaryStartDateFilter.value, summaryEndDateFilter.value, summarySellerFilter.value);
            renderDetailedSummary(filterDetailedSellerInput.value, detailedStartDateFilter.value, detailedEndDateFilter.value); // Pasa filtros de fecha
            updateDailySummaryPreview();
            resetForm();
            if (salesAddedCount > 0) {
                showToast(`${salesAddedCount} boleta(s) agregada(s) correctamente.`);
            }

            if (sellerName && !predefinedSellers.includes(sellerName)) {
                const sellerResult = await postData('/sellers', { name: sellerName });
                if (sellerResult) {
                    await loadAllData(); // Recargar vendedores después de añadir uno nuevo
                    showToast(`Vendedor "${sellerName}" añadido.`);
                }
            }
        } catch (error) {
            console.error('Error al añadir boleta:', error);
            showToast('Ocurrió un error al añadir la boleta. Consulta la consola para más detalles.', 'error');
        }
    }

    async function updateSale() {
        try {
            const saleToUpdateIndex = sales.findIndex(sale => sale.id === editingSaleId);
            if (saleToUpdateIndex === -1) {
                showToast('Error: No se encontró la boleta para actualizar.', 'error');
                return;
            }

            const saleDate = saleDateInput.value;
            const sellerName = sellerNameInput.value.trim();
            const saleAmountsRaw = saleAmountInput.value.trim();
            const defaultCurrency = saleCurrencySelect.value;
            const paymentMethod = paymentMethodSelect.value;
            const commissionRate = parseFloat(commissionRateInput.value) / 10;
            const commissionDepositRate = 0.06;
            const isWholesale = isWholesaleCheckbox.checked;

            let paseAmount = 0;
            let paseCurrency = 'ARS';

            if (isWholesale && paseAmountInput && paseCurrencySelect) {
                paseAmount = parseFloat(paseAmountInput.value);
                paseCurrency = paseCurrencySelect.value;
            }

            if (!saleDate || !sellerName || saleAmountsRaw === '' || isNaN(commissionRate) || commissionRate < 0) {
                showToast('Por favor, completa todos los campos obligatorios y asegúrate de que las tasas sean válidas.', 'error');
                return;
            }
            if (isWholesale && (isNaN(paseAmount) || paseAmount < 0)) {
                showToast('Por favor, ingresa un monto de pase válido o deshabilita la opción de Mayorista.', 'error');
                return;
            }

            const currencyRegex = /(\d+(?:\.\d+)?)\s*([a-zA-Z]{3})?/i;
            const salesEntries = saleAmountsRaw.split(/[\n,]+/).map(s => s.trim()).filter(s => s !== '');

            if (salesEntries.length === 0) {
                showToast('Por favor, ingresa al menos un monto de venta válido para la actualización.', 'error');
                return;
            }

            if (salesEntries.length > 1) {
                showToast('Solo se permite un monto de venta al editar una boleta. Por favor, ingresa solo un monto.', 'error');
                return;
            }

            const entry = salesEntries[0];
            const match = entry.match(currencyRegex);

            if (!match) {
                showToast(`Formato de monto inválido para la entrada: "${entry}".`, 'error');
                return;
            }

            const amount = parseFloat(match[1]);
            const currency = (match[2] ? match[2].toUpperCase() : defaultCurrency).trim();
            const allowedCurrencies = ['ARS', 'USD', 'PYG', 'BRL'];

            if (isNaN(amount) || amount <= 0) {
                showToast(`Monto inválido para la actualización: "${entry}".`, 'error');
                return;
            }
            if (!allowedCurrencies.includes(currency)) {
                showToast(`Moneda inválida "${currency}" para el monto "${amount}". Boleta no actualizada.`, 'error');
                return;
            }

            let actualPaseAmountInSaleCurrency = 0;
            if (isWholesale && paseAmount > 0) {
                if (!allowedCurrencies.includes(paseCurrency)) {
                    showToast(`Moneda de pase inválida "${paseCurrency}".`, 'error');
                    return;
                }
                actualPaseAmountInSaleCurrency = convertAmount(paseAmount, paseCurrency, currency);
            }

            const netAmountVal = amount - actualPaseAmountInSaleCurrency;
            const netAmountArsVal = convertToArs(netAmountVal, currency);
            const grossCommissionArsVal = netAmountArsVal * commissionRate;
            const commissionDepositArsVal = grossCommissionArsVal * commissionDepositRate;
            const finalCommissionArsVal = grossCommissionArsVal - commissionDepositArsVal;

            const updatedSale = {
                ...sales[saleToUpdateIndex], // Mantener el ID original
                date: saleDate,
                seller: sellerName,
                originalAmount: amount, // Se mantiene el monto original
                currency: currency,
                paymentMethod: paymentMethod,
                paseAmount: paseAmount,
                paseCurrency: paseCurrency,
                netAmount: netAmountVal, // Monto neto (original - pase) en la moneda de venta
                netAmountArs: parseFloat(netAmountArsVal.toFixed(2)), // Monto neto (original - pase) en ARS
                commissionRate: commissionRate,
                grossCommissionArs: parseFloat(grossCommissionArsVal.toFixed(2)),
                commissionDepositRate: parseFloat(commissionDepositArsVal.toFixed(2)) > 0 ? commissionDepositRate : 0,
                commissionDepositArs: parseFloat(commissionDepositArsVal.toFixed(2)),
                commissionArs: parseFloat(finalCommissionArsVal.toFixed(2)),
                type: isWholesale ? 'Mayorista' : 'Minorista'
                // isPaymentConfirmed se ha eliminado
            };

            const result = await putData(`/sales/${editingSaleId}`, updatedSale);
            if (result) {
                await loadAllData(); // Recargar todos los datos después de la actualización
                showToast('Boleta actualizada correctamente.');

                if (sellerName && !predefinedSellers.includes(sellerName)) {
                    const sellerResult = await postData('/sellers', { name: sellerName });
                    if (sellerResult) {
                        await loadAllData(); // Recargar vendedores después de añadir uno nuevo
                        showToast(`Vendedor "${sellerName}" añadido.`);
                    }
                }
                editingSaleId = null;
                resetForm(true);
                showTab('listado-boletas');
            }
        } catch (error) {
            console.error('Error al actualizar boleta:', error);
            showToast('Ocurrió un error al actualizar la boleta. Consulta la consola para más detalles.', 'error');
        }
    }

    if (isWholesaleCheckbox) {
        isWholesaleCheckbox.addEventListener('change', () => {
            // Controla la visibilidad de los campos de pase
            const isChecked = isWholesaleCheckbox.checked;
            if (paseAmountGroup) {
                paseAmountGroup.style.display = isChecked ? 'block' : 'none';
            } else {
                console.error('Error: paseAmountGroup es null.');
            }
            if (paseCurrencyGroup) {
                paseCurrencyGroup.style.display = isChecked ? 'block' : 'none';
            } else {
                console.error('Error: paseCurrencyGroup es null.');
            }

            // Si se desmarca, restablece los valores del pase a 0 y la moneda a USD
            if (!isChecked) {
                if (paseAmountInput) {
                    paseAmountInput.value = 0;
                } else {
                    console.error('Error: paseAmountInput es null.');
                }
                if (paseCurrencySelect) {
                    paseCurrencySelect.value = 'USD';
                } else {
                    console.error('Error: paseCurrencySelect es null.');
                }
            }
        });
    } else {
        console.error('Error: isWholesaleCheckbox es null.');
    }

    // --- NUEVA FUNCIONALIDAD: Habilitar/Deshabilitar Tasa de Comisión ---
    if (enableCommissionEditCheckbox && commissionRateInput) {
        enableCommissionEditCheckbox.addEventListener('change', () => {
            commissionRateInput.disabled = !enableCommissionEditCheckbox.checked;
            if (!enableCommissionEditCheckbox.checked) {
                commissionRateInput.value = 0.03; // Vuelve al valor predeterminado si se deshabilita
            }
        });
    } else {
        console.error('Error: enableCommissionEditCheckbox o commissionRateInput son null.');
    }

    // NOTA: Se elimina la lógica de control del checkbox de Pago Confirmado basada en el Método de Pago.

    // Función para restablecer el formulario y controlar el estado del botón "Agregar/Actualizar Boleta"
    function resetForm(fullReset = false) {
        if (fullReset) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            if (saleDateInput) saleDateInput.value = `${year}-${month}-${day}`;
            if (sellerNameInput) sellerNameInput.value = '';
        }

        if (saleAmountInput) saleAmountInput.value = '';
        if (saleCurrencySelect) saleCurrencySelect.value = 'ARS';
        if (paymentMethodSelect) paymentMethodSelect.value = 'Efectivo';
        
        // NOTA: Se elimina el dispatchEvent para paymentMethodSelect ya no es necesario.

        // Reinicia el checkbox y el estado del input de comisión
        if (enableCommissionEditCheckbox) enableCommissionEditCheckbox.checked = false;
        if (commissionRateInput) {
            commissionRateInput.disabled = true; // Deshabilitado por defecto
            commissionRateInput.value = 0.03;   // Valor por defecto
        }

        // Reinicia los campos de pase y los oculta
        if (isWholesaleCheckbox) isWholesaleCheckbox.checked = false;
        if (paseAmountGroup) paseAmountGroup.style.display = 'none';
        if (paseAmountInput) paseAmountInput.value = 0;
        if (paseCurrencyGroup) paseCurrencyGroup.style.display = 'none'; // Oculta el grupo de moneda de pase
        if (paseCurrencySelect) paseCurrencySelect.value = 'USD'; // Restablece la moneda de pase

        if (addSaleBtn) {
            addSaleBtn.textContent = 'Agregar Boleta';
            addSaleBtn.classList.remove('info');
            addSaleBtn.classList.add('primary');
        }
        if (cancelEditBtn) {
            cancelEditBtn.classList.add('hidden');
        }
        editingSaleId = null;
    }

    // --- Nueva función para actualizar la vista previa diaria en la pestaña "Cargar Boleta" ---
    function updateDailySummaryPreview() {
        const currentDate = saleDateInput.value;
        const currentSeller = sellerNameInput.value.trim();

        if (!dailySummaryPreview) {
            console.error('Error: dailySummaryPreview es null. No se puede actualizar la vista previa.');
            return;
        }

        if (!currentDate || !currentSeller) {
            dailySummaryPreview.innerHTML = '<p class="text-gray-500">Completa la fecha y el vendedor para ver el resumen del día.</p>';
            return;
        }

        const salesForCurrentDayAndSeller = sales.filter(sale =>
            sale.date === currentDate && sale.seller === currentSeller
        ).sort((a, b) => b.id - a.id);

        if (salesForCurrentDayAndSeller.length === 0) {
            dailySummaryPreview.innerHTML = `<p class="text-gray-500">No hay boletas registradas para ${currentSeller} en la fecha ${currentDate.split('-').reverse().join('/')}.</p>`;
            return;
        }

        let totalAmountArs = 0;
        let totalCommissions = 0;
        let previewHtml = `<h4 class="text-lg font-bold text-blue-700 mb-3">Boletas de ${currentSeller} (${currentDate.split('-').reverse().join('/')}):</h4><ul class="list-disc pl-5 space-y-2">`;

        salesForCurrentDayAndSeller.forEach(sale => {
            previewHtml += `
                <li class="border-b border-gray-300 pb-2">
                    <span class="font-bold text-gray-800">Monto: ${formatCurrency(sale.originalAmount, sale.currency)}</span>
                    (Neto <span class="font-semibold text-gray-800">$</span>: <span class="font-semibold">${formatCurrency(sale.netAmountArs, 'ARS')}</span>)<br>
                    Comisión Neta <span class="font-semibold text-green-600">$</span>: <span class="font-semibold text-green-600">${formatCurrency(sale.commissionArs, 'ARS')}</span>
                    <span class="text-sm text-gray-600"> (${sale.type}, ${sale.paymentMethod})</span>
                    <!-- isPaymentConfirmed ha sido eliminado del preview -->
                </li>
            `;
            totalAmountArs += sale.netAmountArs;
            totalCommissions += sale.commissionArs;
        });

        previewHtml += `</ul>
            <div class="font-bold mt-5 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800">
                <p class="text-xl">Venta Neta Total del Día ($): <span class="text-blue-900">${formatCurrency(totalAmountArs, 'ARS')}</span></p>
                <p class="text-xl">Comisión Neta Total del Día ($): <span class="text-green-900">${formatCurrency(totalCommissions, 'ARS')}</span></p>
            </div>
        `;
        dailySummaryPreview.innerHTML = previewHtml;
    }

    if (saleDateInput) {
        saleDateInput.addEventListener('change', updateDailySummaryPreview);
    } else {
        console.error('Error: saleDateInput es null.');
    }
    if (sellerNameInput) {
        sellerNameInput.addEventListener('input', updateDailySummaryPreview);
    } else {
        console.error('Error: sellerNameInput es null.');
    }

    // --- Listado de Boletas ---
    // Se elimina el argumento `paymentStatus` y su lógica de filtrado de esta función.
    function renderSalesTable(filterSeller = '', page = currentPage, items = itemsPerPage, startDate = '', endDate = '') {
        if (!salesTableBody) {
            console.error('Error: salesTableBody es null. No se puede renderizar la tabla de ventas.');
            return;
        }
        salesTableBody.innerHTML = '';
        let totalSales = 0;
        let totalCommissions = 0;
        let totalDepositCommissions = 0;

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            let end = null;
            if (endDate) {
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Añadir un día para incluir la fecha de fin completa
            }
            const matchesSeller = (sale.seller || '').toLowerCase().includes(filterSeller.toLowerCase());
            const dateInRange = (!start || saleDate >= start) && (!end || saleDate < end);

            // NOTA: Se elimina el filtrado por estado de pago aquí.
            return matchesSeller && dateInRange;
        }).sort((a, b) => {
            const dateA = (a.date && !isNaN(new Date(a.date))) ? new Date(a.date) : new Date('1900-01-01');
            const dateB = (b.date && !isNaN(new Date(b.date))) ? new Date(b.date) : new Date('1900-01-01');
            return dateB - dateA;
        });

        // Lógica de paginación
        const totalItems = filteredSales.length;
        const totalPages = Math.ceil(totalItems / items);
        const startIndex = (page - 1) * items;
        const endIndex = Math.min(startIndex + items, totalItems);

        const salesToDisplay = filteredSales.slice(startIndex, endIndex);

        // Remover el encabezado de "Estado Pago" y ajustar "Acciones"
        const currentSalesHeaderRow = salesTableHeader.querySelector('tr');
        if (currentSalesHeaderRow) {
            const paymentStatusHeader = currentSalesHeaderRow.querySelector('th.payment-status-header');
            if (paymentStatusHeader) {
                paymentStatusHeader.remove();
            }
            // Asegurarse de que 'Acciones' sea el último encabezado si fue insertado antes
            let actionsHeader = currentSalesHeaderRow.querySelector('th.actions-header');
            if (actionsHeader && actionsHeader !== currentSalesHeaderRow.lastChild) {
                currentSalesHeaderRow.appendChild(actionsHeader);
            }
            // Si actionsHeader no tenía la clase 'actions-header' por alguna razón en versiones anteriores,
            // esta parte lo añade para futuras referencias:
            if (!actionsHeader) { // Si aún no existe el encabezado de Acciones (lo que sería raro aquí)
                actionsHeader = document.createElement('th');
                actionsHeader.textContent = 'Acciones';
                actionsHeader.classList.add('px-4', 'py-2', 'border', 'border-gray-300', 'bg-gray-200', 'text-gray-700', 'text-sm', 'font-semibold', 'rounded-md', 'actions-header');
                currentSalesHeaderRow.appendChild(actionsHeader);
            }
        }


        if (salesToDisplay.length === 0 && totalItems > 0) { // Si no hay elementos en la página actual pero sí en total
            currentPage = 1; // Restablecer a la primera página
            renderSalesTable(filterSeller, currentPage, itemsPerPage, startDate, endDate); // Volver a renderizar la primera página
            return;
        } else if (salesToDisplay.length === 0 && totalItems === 0) { // Si no hay elementos en absoluto
            const row = salesTableBody.insertRow();
            // Colspan ajustado a 14 (eliminado el estado de pago)
            row.innerHTML = '<td colspan="14" style="text-align: center;">No hay boletas para mostrar.</td>';
            if (totalSalesArsSpan) totalSalesArsSpan.textContent = formatCurrency(0);
            if (totalCommissionsArsSpan) totalCommissionsArsSpan.textContent = formatCurrency(0);
            if (totalDepositCommissionsArsSpan) totalDepositCommissionsArsSpan.textContent = formatCurrency(0);
            renderPaginationControls(0, 0); // No se necesitan controles de paginación
            return;
        }

        salesToDisplay.forEach(sale => {
            const row = salesTableBody.insertRow();

            const displayDate = (sale.date === '' || sale.date === 0 || isNaN(new Date(sale.date))) ? '' : sale.date;
            row.insertCell().textContent = displayDate;

            row.insertCell().textContent = sale.seller;
            row.insertCell().textContent = formatCurrency(sale.originalAmount, sale.currency);
            row.insertCell().textContent = sale.currency;
            row.insertCell().textContent = sale.paymentMethod;
            row.insertCell().textContent = sale.paseAmount > 0 ? `${formatCurrency(sale.paseAmount, sale.paseCurrency)} (${sale.paseCurrency})` : '0'; // Mostrar monto y moneda del pase
            row.insertCell().textContent = formatCurrency(sale.netAmountArs, 'ARS');
            row.insertCell().textContent = (parseFloat(sale.commissionRate) * 10).toFixed(2);
            row.insertCell().textContent = formatCurrency(sale.grossCommissionArs, 'ARS');
            row.insertCell().textContent = (parseFloat(sale.commissionDepositRate) * 100).toFixed(2);
            row.insertCell().textContent = formatCurrency(sale.commissionDepositArs, 'ARS');
            row.insertCell().textContent = formatCurrency(sale.commissionArs, 'ARS');
            row.insertCell().textContent = sale.type;

            // NOTA: Se elimina la CELDA para Estado del Pago.

            const actionsCell = row.insertCell();
            actionsCell.classList.add('flex', 'gap-2', 'items-center', 'justify-center');

            const modifyBtn = document.createElement('button');
            modifyBtn.textContent = 'Modificar';
            modifyBtn.classList.add('btn', 'info', 'text-sm', 'px-2', 'py-1');
            modifyBtn.onclick = () => modifySale(sale.id);
            actionsCell.appendChild(modifyBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.classList.add('btn', 'danger', 'text-sm', 'px-2', 'py-1');
            deleteBtn.onclick = () => deleteSale(sale.id);
            actionsCell.appendChild(deleteBtn);

            // NOTA: Se elimina el BOTÓN de Confirmar Pago.
        });

        // Calcular totales para todas las ventas filtradas, no solo la página actual para una visualización precisa
        filteredSales.forEach(sale => {
            totalSales += sale.netAmountArs;
            totalCommissions += sale.commissionArs;
            totalDepositCommissions += sale.commissionDepositArs;
        });

        if (totalSalesArsSpan) totalSalesArsSpan.textContent = formatCurrency(totalSales, 'ARS');
        if (totalCommissionsArsSpan) totalCommissionsArsSpan.textContent = formatCurrency(totalCommissions, 'ARS');
        if (totalDepositCommissionsArsSpan) totalDepositCommissionsArsSpan.textContent = formatCurrency(totalDepositCommissions, 'ARS');

        renderPaginationControls(totalPages, page);
    }

    // NOTA: Se elimina la función `confirmPayment`.


    // Event listeners for Listado de Boletas date filters
    if (listSalesStartDateFilter) {
        listSalesStartDateFilter.addEventListener('change', () => {
            currentPage = 1;
            renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
        });
    }
    if (listSalesEndDateFilter) {
        listSalesEndDateFilter.addEventListener('change', () => {
            currentPage = 1;
            renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
        });
    }
    if (showAllListSalesBtn) {
        showAllListSalesBtn.addEventListener('click', () => {
            if (listSalesStartDateFilter) listSalesStartDateFilter.value = '';
            if (listSalesEndDateFilter) listSalesEndDateFilter.value = '';
            // NOTA: Se elimina el reinicio del filtro de estado de pago.
            currentPage = 1;
            renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, '', ''); // Se elimina el argumento 'all'
            showToast('Mostrando todas las boletas en el listado.');
        });
    }

    // NOTA: Se elimina el Event listener para el filtro de estado de pago.
    // if (paymentStatusFilter) { ... }

    function renderPaginationControls(totalPages, currentPage) {
        if (!paginationControls) {
            console.error('Error: paginationControls es null. No se pueden renderizar los controles de paginación.');
            return;
        }
        paginationControls.innerHTML = ''; // Limpiar controles anteriores

        if (totalPages <= 1) {
            return; // No se necesita paginación si solo hay una o ninguna página
        }

        const maxPageButtons = 5; // Número máximo de botones de página a mostrar

        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        // Ajustar startPage si endPage alcanza totalPages pero la ventana no está completa
        if (endPage === totalPages) {
            startPage = Math.max(1, totalPages - maxPageButtons + 1); // Corrected here: Math.Max -> Math.max
        }

        // Botón Anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.classList.add('btn', 'secondary', 'px-3', 'py-1', 'rounded-md');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
            }
        });
        paginationControls.appendChild(prevButton);

        // Botón de la primera página (si no está en el rango visible y totalPages > maxPageButtons)
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.classList.add('btn', 'secondary', 'px-3', 'py-1', 'rounded-md', 'hover:bg-gray-200');
            firstPageButton.addEventListener('click', () => {
                currentPage = 1;
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
            });
            paginationControls.appendChild(firstPageButton);

            if (startPage > 2) { // Añadir puntos suspensivos si hay más que solo la página 1 y el rango visible
                const ellipsisSpan = document.createElement('span');
                ellipsisSpan.textContent = '...';
                ellipsisSpan.classList.add('px-2', 'py-1', 'text-gray-600');
                paginationControls.appendChild(ellipsisSpan);
            }
        }

        // Botones de número de página
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.add('btn', 'secondary', 'px-3', 'py-1', 'rounded-md');
            if (i === currentPage) {
                pageButton.classList.add('active-page', 'bg-blue-600', 'text-white', 'hover:bg-blue-700');
            } else {
                pageButton.classList.add('hover:bg-gray-200');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
            });
            paginationControls.appendChild(pageButton);
        }

        // Botón de la última página (si no está en el rango visible y totalPages > maxPageButtons)
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) { // Añadir puntos suspensivos si hay más que solo la última página y el rango visible
                const ellipsisSpan = document.createElement('span');
                ellipsisSpan.textContent = '...';
                ellipsisSpan.classList.add('px-2', 'py-1', 'text-gray-600');
                paginationControls.appendChild(ellipsisSpan);
            }
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.classList.add('btn', 'secondary', 'px-3', 'py-1', 'rounded-md', 'hover:bg-gray-200');
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
            });
            paginationControls.appendChild(lastPageButton);
        }

        // Botón Siguiente
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.classList.add('btn', 'secondary', 'px-3', 'py-1', 'rounded-md');
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
            }
        });
        paginationControls.appendChild(nextButton);
    }

    function modifySale(id) {
        const saleToModify = sales.find(sale => sale.id === id);
        if (!saleToModify) {
            showToast('No se encontró la boleta para modificar.', 'error');
            return;
        }

        editingSaleId = id;

        saleDateInput.value = saleToModify.date;
        sellerNameInput.value = saleToModify.seller;
        saleAmountInput.value = `${saleToModify.originalAmount} ${saleToModify.currency}`;
        saleCurrencySelect.value = saleToModify.currency;
        paymentMethodSelect.value = saleToModify.paymentMethod;

        // Al modificar, se activa la opción de comisión personalizada y se habilita el campo
        if (enableCommissionEditCheckbox) enableCommissionEditCheckbox.checked = true;
        if (commissionRateInput) {
            commissionRateInput.disabled = false;
            commissionRateInput.value = (saleToModify.commissionRate * 10).toFixed(2);
        }

        isWholesaleCheckbox.checked = saleToModify.type === 'Mayorista';
        // Mostrar y establecer los campos de pase al modificar una venta mayorista
        if (isWholesaleCheckbox.checked) {
            if (paseAmountGroup) paseAmountGroup.style.display = 'block';
            if (paseCurrencyGroup) paseCurrencyGroup.style.display = 'block';
            if (paseAmountInput) paseAmountInput.value = saleToModify.paseAmount;
            if (paseCurrencySelect) paseCurrencySelect.value = saleToModify.paseCurrency || 'USD'; // Usa la moneda guardada o 'USD' por defecto
        } else {
            if (paseAmountGroup) paseAmountGroup.style.display = 'none';
            if (paseCurrencyGroup) paseCurrencyGroup.style.display = 'none';
            if (paseAmountInput) paseAmountInput.value = 0;
            if (paseCurrencySelect) paseCurrencySelect.value = 'USD';
        }

        // NOTA: Se elimina la lógica de establecer el estado del checkbox de pago y mensaje al modificar.

        addSaleBtn.textContent = 'Actualizar Boleta';
        addSaleBtn.classList.remove('primary');
        addSaleBtn.classList.add('info');
        cancelEditBtn.classList.remove('hidden'); // Asegúrate de que esté visible para cancelar

        showTab('cargar-boleta');
        showToast('Editando boleta. Realiza cambios y haz clic en "Actualizar Boleta".');
    }

    async function deleteSale(id) {
        showConfirm('¿Estás seguro de que quieres eliminar esta boleta?', async () => {
            const result = await deleteData(`/sales/${id}`);
            if (result) {
                await loadAllData(); // Recargar todos los datos después de eliminar
                const totalItems = sales.filter(sale => (sale.seller || '').toLowerCase().includes(filterSellerInput.value.toLowerCase())).length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    currentPage = totalPages;
                } else if (totalPages === 0) {
                    currentPage = 1;
                }
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
                renderSummaryTable(summaryStartDateFilter.value, summaryEndDateFilter.value, summarySellerFilter.value);
                renderDetailedSummary(filterDetailedSellerInput.value, detailedStartDateFilter.value, detailedEndDateFilter.value); // Pasa filtros de fecha
                updateDailySummaryPreview();
                showToast('Boleta eliminada.');
            }
        });
    }

    // Modificación de la Función: Eliminar Todas las Ventas (ahora es "Limpiar Vista")
    if (deleteAllSalesBtn) {
        deleteAllSalesBtn.addEventListener('click', () => {
            showConfirm('¿Estás seguro de que quieres OCULTAR todas las boletas pasadas? Esto mostrará solo las boletas de hoy en adelante, pero NO las eliminará de la base de datos. Puedes usar los filtros de fecha para ver todas las boletas nuevamente.', () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayDateString = `${year}-${month}-${day}`;

                // Establece los filtros de fecha para "hoy en adelante" en todas las pestañas relevantes
                if (listSalesStartDateFilter) listSalesStartDateFilter.value = todayDateString;
                if (listSalesEndDateFilter) listSalesEndDateFilter.value = ''; // Sin fecha fin para incluir el futuro
                if (summaryStartDateFilter) summaryStartDateFilter.value = todayDateString;
                if (summaryEndDateFilter) summaryEndDateFilter.value = '';
                if (detailedStartDateFilter) detailedStartDateFilter.value = todayDateString;
                if (detailedEndDateFilter) detailedEndDateFilter.value = '';
                // NOTA: Se elimina el reinicio del filtro de estado de pago.

                // Renderiza todas las tablas afectadas con los nuevos filtros
                renderSalesTable(filterSellerInput.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value);
                renderSummaryTable(summaryStartDateFilter.value, summaryEndDateFilter.value, summarySellerFilter.value);
                renderDetailedSummary(filterDetailedSellerInput.value, detailedStartDateFilter.value, detailedEndDateFilter.value);
                updateDailySummaryPreview();

                showToast('Vista de boletas despejada para nuevas entradas. Los datos anteriores permanecen guardados y puedes verlos usando los filtros de fecha.', 'success');
            }, () => {
                showToast('Operación cancelada.', 'info');
            });
        });
    } else {
        console.error('Error: deleteAllSalesBtn es null.');
    }

    if (filterSellerInput) {
        filterSellerInput.addEventListener('input', (e) => {
            currentPage = 1; // Restablecer a la primera página al cambiar el filtro
            renderSalesTable(e.target.value, currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
        });
    } else {
        console.error('Error: filterSellerInput es null.');
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (filterSellerInput) filterSellerInput.value = '';
            currentPage = 1; // Restablecer a la primera página al restablecer el filtro
            renderSalesTable('', currentPage, itemsPerPage, listSalesStartDateFilter.value, listSalesEndDateFilter.value); // Se elimina el argumento `paymentStatusFilter.value`
        });
    } else {
        console.error('Error: resetFilterBtn es null.');
    }

    // --- Resumen por Vendedor ---
    function renderSummaryTable(startDate = '', endDate = '', seller = '') {
        if (!summaryTableBody) {
            console.error('Error: summaryTableBody es null. No se puede renderizar la tabla de resumen.');
            return;
        }
        summaryTableBody.innerHTML = '';

        const summary = {};

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            let end = null;
            if (endDate) {
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Añadir un día para incluir la fecha de fin completa
            }
            const matchesSeller = seller ? (sale.seller || '').toLowerCase().includes(seller.toLowerCase()) : true;

            const dateInRange = (!start || saleDate >= start) && (!end || saleDate < end);
            return dateInRange && matchesSeller;
        });

        const globalTotalsByCurrency = {};
        ALL_CURRENCIES.forEach(curr => { globalTotalsByCurrency[curr] = 0; });

        const globalTotalsByPaymentMethodAndCurrency = {};
        // Inicializar globalTotalsByPaymentMethodAndCurrency para todas las combinaciones
        ALL_PAYMENT_METHODS.forEach(pm => {
            globalTotalsByPaymentMethodAndCurrency[pm] = {};
            ALL_CURRENCIES.forEach(curr => {
                globalTotalsByPaymentMethodAndCurrency[pm][curr] = 0;
            });
        });

        let globalTotalDepositCommissions = 0;
        let globalTotalGrossCommissions = 0;
        // Objeto para almacenar los totales de caja en efectivo por moneda original
        let cashTotals = { ARS: 0, USD: 0, PYG: 0, BRL: 0 }; 

        filteredSales.forEach(sale => {
            const sellerName = sale.seller || 'Unknown';
            if (!summary[sellerName]) {
                summary[sellerName] = {
                    totalSalesArs: 0,
                    totalCommissionsArs: 0,
                    totalDepositCommissionsArs: 0,
                    totalGrossCommissionsArs: 0,
                    totalOriginalUsd: 0,
                    totalOriginalPyg: 0,
                    totalOriginalBrl: 0,
                    totalOriginalArs: 0,
                    paymentMethodsByCurrency: {}
                };
                // Inicializar paymentMethodsByCurrency del vendedor para todas las combinaciones
                ALL_PAYMENT_METHODS.forEach(pm => {
                    summary[sellerName].paymentMethodsByCurrency[pm] = {};
                    ALL_CURRENCIES.forEach(curr => {
                        summary[sellerName].paymentMethodsByCurrency[pm][curr] = 0;
                    });
                });
            }
            summary[sellerName].totalSalesArs += sale.netAmountArs; // Venta Neta (sin pase)
            summary[sellerName].totalCommissionsArs += sale.commissionArs; // Comisión Neta (sin pase)
            summary[sellerName].totalDepositCommissionsArs += sale.commissionDepositArs;
            summary[sellerName].totalGrossCommissionsArs += sale.grossCommissionArs; // Comisión Bruta (sin pase)

            if (sale.currency === 'USD') {
                summary[sellerName].totalOriginalUsd += sale.originalAmount;
                globalTotalsByCurrency['USD'] += sale.originalAmount;
            } else if (sale.currency === 'PYG') {
                summary[sellerName].totalOriginalPyg += sale.originalAmount;
                globalTotalsByCurrency['PYG'] += sale.originalAmount;
            } else if (sale.currency === 'BRL') {
                summary[sellerName].totalOriginalBrl += sale.originalAmount;
                globalTotalsByCurrency['BRL'] += sale.originalAmount;
            } else if (sale.currency === 'ARS') {
                summary[sellerName].totalOriginalArs += sale.originalAmount;
                globalTotalsByCurrency['ARS'] += sale.originalAmount;
            }

            const paymentMethodKey = (sale.paymentMethod || '').trim().toLowerCase(); // Normalizar para la clave
            const currencyKey = sale.currency || 'ARS';

            // Asegurarse de que los objetos anidados existan para los totales específicos del vendedor antes de sumar
            if (!summary[sellerName].paymentMethodsByCurrency[paymentMethodKey]) {
                summary[sellerName].paymentMethodsByCurrency[paymentMethodKey] = {};
            }
            if (summary[sellerName].paymentMethodsByCurrency[paymentMethodKey][currencyKey] === undefined) {
                summary[sellerName].paymentMethodsByCurrency[paymentMethodKey][currencyKey] = 0;
            }
            // Aquí se suma netAmount (monto en su moneda original después del pase) para el desglose por método/moneda
            summary[sellerName].paymentMethodsByCurrency[paymentMethodKey][currencyKey] += sale.netAmount;

            // Asegurarse de que los objetos anidados existan para los totales globales antes de sumar
            if (!globalTotalsByPaymentMethodAndCurrency[paymentMethodKey]) {
                globalTotalsByPaymentMethodAndCurrency[paymentMethodKey] = {};
            }
            if (globalTotalsByPaymentMethodAndCurrency[paymentMethodKey][currencyKey] === undefined) {
                globalTotalsByPaymentMethodAndCurrency[paymentMethodKey][currencyKey] = 0;
            }
            // Aquí se suma netAmount (monto en su moneda original después del pase) para el desglose global por método/moneda
            globalTotalsByPaymentMethodAndCurrency[paymentMethodKey][currencyKey] += sale.netAmount;

            globalTotalDepositCommissions += sale.commissionDepositArs;
            globalTotalGrossCommissions += sale.grossCommissionArs;

            // MODIFICACIÓN CLAVE AQUÍ: Suma al total consolidado de caja en su MONEDA ORIGINAL (incluyendo pase) si es 'Efectivo'
            if (paymentMethodKey === 'efectivo') {
                cashTotals[sale.currency] += sale.originalAmount;
            }
        });

        const sortedSellers = Object.keys(summary).sort();

        let headerHtml = `
            <th>Vendedor</th>
            <th>Venta Total ($ars)</th>
            <th>Comisión Total ($ars)</th>
            <th>Comisión Vendedor ($ars)</th>
            <th>Comisión Depósito ($ars)</th>
        `;
        headerHtml += `
            <th>Total Ventas USD</th>
            <th>Total Ventas PYG</th>
            <th>Total Ventas BRL</th>
            <th>TOTAL ARS SIN %</th>
        `;

        // Modificar DISPLAY_METHOD_CURRENCY_COMBINATIONS para usar claves normalizadas en los encabezados
        DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
            headerHtml += `<th>${(combo.method).toLowerCase()} (${combo.currency})</th>`; // Convertir a minúsculas aquí también
        });


        let currentThead = summaryTable.querySelector('thead');
        let headerRow = summaryTable.querySelector('thead tr');

        if (!currentThead) {
            currentThead = document.createElement('thead');
            summaryTable.prepend(currentThead); // Anteponer thead si no existe
        }
        if (!headerRow) {
            headerRow = document.createElement('tr');
            currentThead.appendChild(headerRow); // Añadir tr al thead
        }
        headerRow.innerHTML = headerHtml;

        if (sortedSellers.length === 0) {
            const row = summaryTableBody.insertRow();
            row.innerHTML = `<td colspan="${headerRow.children.length}" style="text-align: center;">No hay datos de vendedores para mostrar con los filtros aplicados.</td>`;
            // También limpia y oculta los totales de caja si no hay ventas
            const cashTotalsRow = summaryTableBody.insertRow();
            cashTotalsRow.id = 'cashTotalsRow'; // Añade un ID para poder manipularla
            cashTotalsRow.innerHTML = `<td colspan="${headerRow.children.length}" class="font-bold text-lg text-center text-gray-600"></td>`;
            return;
        }

        sortedSellers.forEach(seller => {
            const row = summaryTableBody.insertRow();
            row.insertCell().textContent = seller;
            row.insertCell().textContent = formatCurrency(summary[seller].totalSalesArs, 'ARS');
            row.insertCell().textContent = formatCurrency(summary[seller].totalGrossCommissionsArs, 'ARS');
            row.insertCell().textContent = formatCurrency(summary[seller].totalCommissionsArs, 'ARS');
            row.insertCell().textContent = formatCurrency(summary[seller].totalDepositCommissionsArs, 'ARS');

            row.insertCell().textContent = formatCurrency(summary[seller].totalOriginalUsd, 'USD');
            row.insertCell().textContent = formatCurrency(summary[seller].totalOriginalPyg, 'PYG');
            row.insertCell().textContent = formatCurrency(summary[seller].totalOriginalBrl, 'BRL');
            row.insertCell().textContent = formatCurrency(summary[seller].totalOriginalArs, 'ARS');

            DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
                const normalizedComboMethod = (combo.method || '').trim().toLowerCase();
                const amount = (summary[seller].paymentMethodsByCurrency[normalizedComboMethod] && summary[seller].paymentMethodsByCurrency[normalizedComboMethod][combo.currency] !== undefined)
                    ? summary[seller].paymentMethodsByCurrency[normalizedComboMethod][combo.currency]
                    : 0;
                row.insertCell().textContent = formatCurrency(amount, combo.currency);
            });
        });

        const totalRow = summaryTableBody.insertRow();
        totalRow.classList.add('totals-row', 'font-bold', 'bg-gray-100'); // Añadir estilos para resaltar
        totalRow.insertCell().textContent = 'TOTAL GENERAL';
        totalRow.insertCell().textContent = formatCurrency(Object.values(summary).reduce((acc, curr) => Number(acc) + Number(curr.totalSalesArs), 0), 'ARS');
        totalRow.insertCell().textContent = formatCurrency(globalTotalGrossCommissions, 'ARS');
        totalRow.insertCell().textContent = formatCurrency(Object.values(summary).reduce((acc, curr) => Number(acc) + Number(curr.totalCommissionsArs), 0), 'ARS');
        totalRow.insertCell().textContent = formatCurrency(globalTotalDepositCommissions, 'ARS');

        // Modificación: Añadir el nombre de la moneda a los totales generales
        totalRow.insertCell().textContent = `USD: ${formatCurrency(globalTotalsByCurrency['USD'], 'USD')}`;
        totalRow.insertCell().textContent = `PYG: ${formatCurrency(globalTotalsByCurrency['PYG'], 'PYG')}`;
        totalRow.insertCell().textContent = `BRL: ${formatCurrency(globalTotalsByCurrency['BRL'], 'BRL')}`;
        totalRow.insertCell().textContent = `ARS: ${formatCurrency(globalTotalsByCurrency['ARS'], 'ARS')}`;

        DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
            const normalizedComboMethod = (combo.method || '').trim().toLowerCase(); // Normalizar para la búsqueda
            const amount = (globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod] && globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod][combo.currency] !== undefined)
                ? globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod][combo.currency]
                : 0;
            totalRow.insertCell().textContent = formatCurrency(amount, combo.currency);
        });

        // --- FILA PARA RESUMEN DE CAJA (EFECTIVO) ---
        const cashTotalsRow = summaryTableBody.insertRow();
        cashTotalsRow.id = 'cashTotalsRow'; // Añade un ID para poder manipularla
        cashTotalsRow.classList.add('font-bold', 'bg-green-100', 'text-green-800', 'text-xl'); // Estilos para resaltar

        // Primera celda: Muestra el texto "TOTAL CAJA (EFECTIVO):"
        cashTotalsRow.insertCell().outerHTML = `<td colspan="5" class="text-right pr-4 font-extrabold text-2xl text-green-900">TOTAL CAJA (EFECTIVO): </td>`;

        // Suma de los totales de efectivo por moneda (incluyendo pase)
        cashTotalsRow.insertCell().outerHTML = `<td class="text-center font-bold">USD: ${formatCurrency(cashTotals['USD'], 'USD')}</td>`; // Columna USD
        cashTotalsRow.insertCell().outerHTML = `<td class="text-center font-bold">PYG: ${formatCurrency(cashTotals['PYG'], 'PYG')}</td>`; // Columna PYG
        cashTotalsRow.insertCell().outerHTML = `<td class="text-center font-bold">BRL: ${formatCurrency(cashTotals['BRL'], 'BRL')}</td>`; // Columna BRL
        cashTotalsRow.insertCell().outerHTML = `<td class="text-center font-bold">ARS: ${formatCurrency(cashTotals['ARS'], 'ARS')}</td>`; // Columna ARS

        // Rellenar las celdas restantes con espacios vacíos o guiones
        const remainingCellsForCashRow = headerRow.children.length - (5 + 4); // 5 de colspan + 4 de las monedas
        for (let i = 0; i < remainingCellsForCashRow; i++) {
            cashTotalsRow.insertCell().textContent = ''; // Celda vacía
        }
    }

    // --- Resumen Detallado por Moneda ---
    function renderDetailedSummary(filterSeller = '', startDate = '', endDate = '') {
        if (!detailedSummaryContent) {
            console.error('Error: detailedSummaryContent es null. No se puede renderizar el resumen detallado.');
            return;
        }
        detailedSummaryContent.innerHTML = '';
        const detailedSummary = {};

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            let end = null;
            if (endDate) {
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Incluye la fecha de fin completa
            }
            const matchesSeller = filterSeller ? (sale.seller || '').toLowerCase().includes(filterSeller.toLowerCase()) : true;
            const dateInRange = (!start || saleDate >= start) && (!end || saleDate < end);
            return matchesSeller && dateInRange;
        });

        if (filteredSales.length === 0) {
            detailedSummaryContent.innerHTML = '<p style="text-align: center;">No hay datos detallados para mostrar con el filtro actual.</p>';
            return;
        }

        filteredSales.forEach(sale => {
            const sellerName = sale.seller || 'Unknown';
            const saleDate = sale.date;
            const saleCurrency = sale.currency || 'N/A';
            const originalAmount = parseFloat(sale.originalAmount) || 0;
            const paseTotal = parseFloat(sale.paseAmount) || 0;
            const paseCurrencyStored = sale.paseCurrency || 'USD'; // Recuperar moneda de pase almacenada
            const netAmount = parseFloat(sale.netAmount) || 0;
            const netAmountArs = parseFloat(sale.netAmountArs) || 0;

            const commissionRate = parseFloat(sale.commissionRate) || 0.03;
            const grossCommissionArs = parseFloat(sale.grossCommissionArs) || 0;
            const commissionDepositRate = parseFloat(sale.commissionDepositRate) || 0.06;
            const commissionDepositArs = parseFloat(sale.commissionDepositArs) || 0;
            const netCommissionArs = parseFloat(sale.commissionArs) || 0;
            const paymentMethod = sale.paymentMethod || 'Efectivo';
            const type = sale.type || 'Minorista';
            // isPaymentConfirmed ha sido eliminado

            if (!detailedSummary[sellerName]) {
                detailedSummary[sellerName] = {};
            }
            if (!detailedSummary[sellerName][saleDate]) {
                detailedSummary[sellerName][saleDate] = {};
            }
            if (!detailedSummary[sellerName][saleDate][type]) {
                detailedSummary[sellerName][saleDate][type] = {
                    'ARS': { originalSum: 0, paseSum: 0, netSum: 0, netInArsSum: 0, grossCommissionArsSum: 0, commissionDepositSum: 0, netCommissionSum: 0, individualSales: [] },
                    'USD': { originalSum: 0, paseSum: 0, netSum: 0, netInArsSum: 0, grossCommissionArsSum: 0, commissionDepositSum: 0, netCommissionSum: 0, individualSales: [] },
                    'PYG': { originalSum: 0, paseSum: 0, netSum: 0, netInArsSum: 0, grossCommissionArsSum: 0, commissionDepositSum: 0, netCommissionSum: 0, individualSales: [] },
                    'BRL': { originalSum: 0, paseSum: 0, netSum: 0, netInArsSum: 0, grossCommissionArsSum: 0, commissionDepositSum: 0, netCommissionSum: 0, individualSales: [] }
                };
            }
            detailedSummary[sellerName][saleDate][type][saleCurrency].originalSum += originalAmount;
            detailedSummary[sellerName][saleDate][type][saleCurrency].paseSum += paseTotal;
            detailedSummary[sellerName][saleDate][type][saleCurrency].netSum += netAmount; // Usar netAmount
            detailedSummary[sellerName][saleDate][type][saleCurrency].netInArsSum += netAmountArs; // Usar netAmountArs
            detailedSummary[sellerName][saleDate][type][saleCurrency].grossCommissionArsSum += grossCommissionArs;
            detailedSummary[sellerName][saleDate][type][saleCurrency].commissionDepositSum += commissionDepositArs;
            detailedSummary[sellerName][saleDate][type][saleCurrency].netCommissionSum += netCommissionArs;

            detailedSummary[sellerName][saleDate][type][saleCurrency].individualSales.push(sale);
        });

        const sortedSellers = Object.keys(detailedSummary).sort();

        sortedSellers.forEach(sellerName => {
            const sellerSales = detailedSummary[sellerName];
            const sortedDates = Object.keys(sellerSales).sort((a, b) => {
                const [yearA, monthA, dayA] = a.split('-').map(Number);
                const [yearB, monthB, dayB] = b.split('-').map(Number);
                const dateA = new Date(yearA, monthA - 1, dayA);
                const dateB = new Date(yearB, monthB - 1, dayB);
                return dateA - dateB;
            });

            const sellerDiv = document.createElement('div');
            sellerDiv.classList.add('seller-summary-block', 'bg-white', 'rounded-lg', 'shadow-md', 'p-6', 'mb-8', 'border-t-4', 'border-blue-500');
            sellerDiv.innerHTML = `<h3 class="text-2xl font-bold text-blue-700 mb-4">Vendedor: ${sellerName}</h3>`;

            let sellerTotalNetArs = 0;
            let sellerTotalCommissionArs = 0;

            sortedDates.forEach(date => {
                const dailySales = sellerSales[date];
                const dateDiv = document.createElement('div');
                dateDiv.classList.add('date-summary-block', 'mb-6', 'p-4', 'border', 'border-gray-200', 'rounded-md', 'bg-gray-50');
                const displayDate = (date === '' || date === 0 || isNaN(new Date(date))) ? '' : date.split('-').reverse().join('/');
                dateDiv.innerHTML = `<h4 class="text-xl font-semibold text-gray-800 mb-3">Fecha: ${displayDate}</h4>`;

                const types = ['Mayorista', 'Minorista'];

                let dailyTotalNetArs = 0;
                let dailyTotalCommissionArs = 0;

                types.forEach(type => {
                    if (dailySales[type]) {
                        const typeDiv = document.createElement('div');
                        typeDiv.classList.add('sale-type-block', 'border-b', 'border-gray-200', 'pb-4', 'mb-4', 'last:border-b-0', 'last:pb-0', 'last:mb-0'); // Añadir clases para estilos
                        typeDiv.innerHTML = `<h5 class="text-lg font-bold text-gray-700 mb-2">Tipo: ${type}</h5>`;

                        const currencyDetailList = document.createElement('ul');
                        currencyDetailList.classList.add('list-disc', 'pl-5', 'space-y-2'); // Añadir clases para estilos

                        let allIndividualSalesForType = [];
                        for (const currency in dailySales[type]) {
                            if (dailySales[type][currency].individualSales) {
                                allIndividualSalesForType = allIndividualSalesForType.concat(dailySales[type][currency].individualSales);
                            }
                        }

                        allIndividualSalesForType.sort((a, b) => b.id - a.id); // Ordenar por ID descendente para el más nuevo primero

                        if (allIndividualSalesForType.length > 0) {
                            currencyDetailList.innerHTML += `<p class="font-bold text-gray-700 mt-4 mb-2">Boletas Individuales:</p>`;
                            allIndividualSalesForType.forEach(individualSale => {
                                currencyDetailList.innerHTML += `
                                    <li class="border-b border-gray-300 pb-2">
                                        <span class="font-bold text-blue-600">${individualSale.currency}:</span>
                                        <span class="font-medium">${formatCurrency(individualSale.originalAmount, individualSale.currency)}</span>
                                        (${individualSale.paymentMethod})<br>
                                        &nbsp;&nbsp;Pase: <span class="font-semibold">${individualSale.paseAmount > 0 ? `${formatCurrency(individualSale.paseAmount, individualSale.paseCurrency)} (${individualSale.paseCurrency})` : '0'}</span><br>
                                        &nbsp;&nbsp;Monto Neto: <span class="font-semibold">${formatCurrency(individualSale.netAmount, individualSale.currency)}</span><br>
                                        &nbsp;&nbsp;Equiv. $ (Neto): <span class="font-semibold">${formatCurrency(individualSale.netAmountArs, 'ARS')}</span><br>
                                        &nbsp;&nbsp;Comisión Bruta: <span class="text-sm">${(parseFloat(individualSale.commissionRate) * 10).toFixed(2)}%</span> (<span class="font-semibold">${formatCurrency(individualSale.grossCommissionArs, 'ARS')}</span>)<br>
                                        &nbsp;&nbsp;Comisión Depósito: <span class="text-sm">${(parseFloat(individualSale.commissionDepositRate) * 100).toFixed(2)}%</span> (<span class="font-semibold">${formatCurrency(individualSale.commissionDepositArs, 'ARS')}</span>)<br>
                                        &nbsp;&nbsp;Comisión Neta: <span class="font-bold text-green-700">${formatCurrency(individualSale.commissionArs, 'ARS')}</span>
                                        <!-- isPaymentConfirmed ha sido eliminado del resumen detallado -->
                                    </li>
                                `;
                            });
                        }

                        typeDiv.appendChild(currencyDetailList);

                        let specificCurrencyTotalsHtml = '';
                        let typeTotalNetArs = 0;
                        let typeTotalCommissionArs = 0;

                        ALL_CURRENCIES.forEach(curr => {
                            if (dailySales[type][curr] && dailySales[type][curr].originalSum > 0) {
                                specificCurrencyTotalsHtml += `
                                    <li class="text-lg">
                                        ${curr} (Original): <span class="font-bold">${formatCurrency(dailySales[type][curr].originalSum, curr)}</span>
                                    </li>
                                `;
                            }
                            typeTotalNetArs += dailySales[type][curr]?.netInArsSum || 0; // Usar netInArsSum
                            typeTotalCommissionArs += dailySales[type][curr]?.netCommissionSum || 0;
                        });

                        if(specificCurrencyTotalsHtml) {
                            typeDiv.innerHTML += `<p class="font-bold text-gray-700 mt-4 mb-2">Totales de Venta ${type} del Día por Moneda Original:</p><ul class="list-disc pl-5 space-y-1">${specificCurrencyTotalsHtml}</ul>`;
                        }

                        typeDiv.innerHTML += `
                            <p class="font-bold text-gray-700 mt-4 mb-2"><strong>Totales ${type} en ARS ($):</strong></p>
                            <ul class="list-disc pl-5 space-y-1">
                                <li class="text-lg">Venta Neta Total Pesos: <span class="font-bold text-blue-800">${formatCurrency(typeTotalNetArs, 'ARS')}</span></li>
                                <li class="text-lg">Comisión Neta Total Pesos: <span class="font-bold text-green-800">${formatCurrency(typeTotalCommissionArs, 'ARS')}</span></li>
                            </ul>
                        `;

                        dateDiv.appendChild(typeDiv);

                        dailyTotalNetArs += typeTotalNetArs;
                        dailyTotalCommissionArs += dailyTotalCommissionArs;
                    }
                });

                sellerDiv.appendChild(dateDiv);

                sellerTotalNetArs += dailyTotalNetArs;
                sellerTotalCommissionArs += dailyTotalCommissionArs;
            });

            detailedSummaryContent.appendChild(sellerDiv);
        });
    }

    // Event listeners for Resumen Detallado date filters
    if (filterDetailedSellerInput) {
        filterDetailedSellerInput.addEventListener('input', (e) => {
            renderDetailedSummary(e.target.value, detailedStartDateFilter.value, detailedEndDateFilter.value);
        });
    } else {
        console.error('Error: filterDetailedSellerInput es null.');
    }
    if (detailedStartDateFilter) {
        detailedStartDateFilter.addEventListener('change', () => {
            renderDetailedSummary(filterDetailedSellerInput.value, detailedStartDateFilter.value, detailedEndDateFilter.value);
        });
    }
    if (detailedEndDateFilter) {
        detailedEndDateFilter.addEventListener('change', () => {
            renderDetailedSummary(filterDetailedSellerInput.value, detailedStartDateFilter.value, detailedEndDateFilter.value);
        });
    }
    if (showAllDetailedSalesBtn) {
        showAllDetailedSalesBtn.addEventListener('click', () => {
            if (detailedStartDateFilter) detailedStartDateFilter.value = '';
            if (detailedEndDateFilter) detailedEndDateFilter.value = '';
            renderDetailedSummary(filterDetailedSellerInput.value, '', '');
            showToast('Mostrando todos los detalles en el resumen detallado.');
        });
    }


    // --- Función de Exportación a Excel para Resumen Detallado ---
    function exportDetailedSummaryToExcel() {
        const filterSeller = document.getElementById('filterDetailedSeller').value.trim().toLowerCase();
        const startDate = detailedStartDateFilter.value;
        const endDate = detailedEndDateFilter.value;

        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            let end = null;
            if (endDate) {
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Incluye la fecha de fin completa
            }
            const matchesSeller = filterSeller ? (sale.seller || '').toLowerCase().includes(filterSeller.toLowerCase()) : true;
            const dateInRange = (!start || saleDate >= start) && (!end || saleDate < end);
            return matchesSeller && dateInRange;
        });

        if (filteredSales.length === 0) {
            showToast('No hay datos para exportar. Asegúrate de que haya ventas registradas con el filtro actual.', 'error');
            return;
        }

        const tempTable = document.createElement('table');
        tempTable.style.display = 'none';
        tempTable.id = 'exportTableDetailed';

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        tempTable.appendChild(thead);
        tempTable.appendChild(tbody);

        const headerRow = thead.insertRow();
        const headers = [
            "Vendedor", "Fecha", "Tipo de Venta",
            "Moneda Original", "Monto Original", "Pase", "Moneda de Pase", "Equiv. $ (Neto)",
            "Tasa Comisión Bruta (%)", "Comisión Bruta ($)",
            "Tasa Comisión Depósito (%)", "Comisión Depósito ($)",
            "Comisión Neta ($)", "Método de Pago"
            // "Estado Pago" ha sido eliminado
        ];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const sortedSalesForExport = [...filteredSales].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() === dateB.getTime()) {
                return (a.seller || '').localeCompare(b.seller || '');
            }
            return dateA - dateB;
        });

        sortedSalesForExport.forEach(sale => {
            const row = tbody.insertRow();
            row.insertCell().textContent = sale.seller;
            row.insertCell().textContent = (sale.date === '' || sale.date === 0 || isNaN(new Date(sale.date))) ? '' : sale.date;
            row.insertCell().textContent = sale.type;
            row.insertCell().textContent = sale.currency;

            row.insertCell().textContent = formatNumberForExcel(sale.originalAmount, sale.currency === 'PYG' ? 0 : 2);
            row.insertCell().textContent = formatNumberForExcel(sale.paseAmount, sale.paseCurrency === 'PYG' ? 0 : 2);
            row.insertCell().textContent = sale.paseCurrency;
            row.insertCell().textContent = formatNumberForExcel(sale.netAmountArs, 2);

            row.insertCell().textContent = formatNumberForExcel(sale.commissionRate * 10, 2);
            row.insertCell().textContent = formatNumberForExcel(sale.grossCommissionArs, 2);

            row.insertCell().textContent = formatNumberForExcel(sale.commissionDepositRate * 100, 2);
            row.insertCell().textContent = formatNumberForExcel(sale.commissionDepositArs, 2);
            row.insertCell().textContent = formatNumberForExcel(sale.commissionArs, 2);
            row.insertCell().textContent = sale.paymentMethod;
            // row.insertCell().textContent = sale.isPaymentConfirmed ? 'Confirmado' : 'Pendiente'; ha sido eliminado
        });

        document.body.appendChild(tempTable);

        try {
            if (typeof Table2Excel !== 'undefined') {
                const table2excel = new Table2Excel();
                let filename = 'Resumen_Detallado_Ventas';
                if (filterSeller) filename += `_${filterSeller.replace(/\s/g, '_')}`;
                if (startDate && endDate) filename += `_Desde_${startDate}_Hasta_${endDate}`;
                else if (startDate) filename += `_Desde_${startDate}`;
                else if (endDate) filename += `_Hasta_${endDate}`;

                table2excel.export(tempTable, filename);
                showToast('Resumen detallado exportado a Excel correctamente.', 'success');
            } else {
                showToast('Error: La librería Table2Excel no está cargada o no es globalmente accesible.', 'error');
                console.error('Table2Excel no está definida. Asegúrate de que el script esté cargado y sea accesible.');
            }
        } catch (e) {
            showToast(`Error exportando resumen detallado a Excel: ${e.message}`, 'error');
            console.error('Error durante la exportación a Excel del resumen detallado:', e);
        } finally {
            document.body.removeChild(tempTable);
        }
    }


    // Esta función maneja específicamente la exportación para la tabla de resumen general
    function exportSummaryTableToExcel() {
        const tempTable = document.createElement('table');
        tempTable.style.display = 'none';
        tempTable.id = 'exportTableGeneral';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        tempTable.appendChild(thead);
        tempTable.appendChild(tbody);

        const summary = {};

        const startDate = summaryStartDateFilter.value;
        const endDate = summaryEndDateFilter.value;
        const seller = summarySellerFilter.value.trim();

        const salesToProcess = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = startDate ? new Date(startDate) : null;
            let end = null;
            if (endDate) {
                end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Añadir un día para incluir la fecha de fin completa
            }
            const matchesSeller = seller ? (sale.seller || '').toLowerCase().includes(seller.toLowerCase()) : true;

            const dateInRange = (!start || saleDate >= start) && (!end || saleDate < end);
            return dateInRange && matchesSeller;
        });

        const globalTotalsByCurrency = {};
        ALL_CURRENCIES.forEach(curr => { globalTotalsByCurrency[curr] = 0; });

        const globalTotalsByPaymentMethodAndCurrency = {};
        ALL_PAYMENT_METHODS.forEach(pm => {
            globalTotalsByPaymentMethodAndCurrency[pm] = {};
            ALL_CURRENCIES.forEach(curr => {
                globalTotalsByPaymentMethodAndCurrency[pm][curr] = 0;
            });
        });

        let globalTotalDepositCommissions = 0;
        let globalTotalGrossCommissions = 0;
        // Objeto para almacenar los totales de caja en efectivo por moneda original para la exportación
        let cashTotals = { ARS: 0, USD: 0, PYG: 0, BRL: 0 }; 

        salesToProcess.forEach(sale => {
            const sellerName = sale.seller || 'Unknown';
            if (!summary[sellerName]) {
                summary[sellerName] = {
                    totalSalesArs: 0,
                    totalCommissionsArs: 0,
                    totalDepositCommissionsArs: 0,
                    totalGrossCommissionsArs: 0,
                    totalOriginalUsd: 0,
                    totalOriginalPyg: 0,
                    totalOriginalBrl: 0,
                    totalOriginalArs: 0,
                    paymentMethodsByCurrency: {}
                };
                ALL_PAYMENT_METHODS.forEach(pm => {
                    summary[sellerName].paymentMethodsByCurrency[pm] = {};
                    ALL_CURRENCIES.forEach(curr => {
                        summary[sellerName].paymentMethodsByCurrency[pm][curr] = 0;
                    });
                });
            }
            summary[sellerName].totalSalesArs += sale.netAmountArs;
            summary[sellerName].totalCommissionsArs += sale.commissionArs;
            summary[sellerName].totalDepositCommissionsArs += sale.commissionDepositArs;
            summary[sellerName].totalGrossCommissionsArs += sale.grossCommissionArs;

            if (sale.currency === 'USD') {
                summary[sellerName].totalOriginalUsd += sale.originalAmount;
                globalTotalsByCurrency['USD'] += sale.originalAmount;
            } else if (sale.currency === 'PYG') {
                summary[sellerName].totalOriginalPyg += sale.originalAmount;
                globalTotalsByCurrency['PYG'] += sale.originalAmount;
            } else if (sale.currency === 'BRL') {
                summary[sellerName].totalOriginalBrl += sale.originalAmount;
                globalTotalsByCurrency['BRL'] += sale.originalAmount;
            } else if (sale.currency === 'ARS') {
                summary[sellerName].totalOriginalArs += sale.originalAmount;
                globalTotalsByCurrency['ARS'] += sale.originalAmount;
            }

            const paymentMethodKey = (sale.paymentMethod || '').trim().toLowerCase(); // Normalizar para la clave
            const currencyKey = sale.currency || 'ARS';

            if (!summary[sellerName].paymentMethodsByCurrency[paymentMethodKey]) {
                summary[sellerName].paymentMethodsByCurrency[paymentMethodKey] = {};
            }
            if (summary[sellerName].paymentMethodsByCurrency[paymentMethodKey][currencyKey] === undefined) {
                summary[sellerName].paymentMethodsByCurrency[paymentMethodKey][currencyKey] = 0;
            }
            globalTotalsByPaymentMethodAndCurrency[paymentMethodKey][currencyKey] += sale.netAmount;
            globalTotalDepositCommissions += sale.commissionDepositArs;
            globalTotalGrossCommissions += sale.grossCommissionArs;

            // MODIFICACIÓN CLAVE AQUÍ PARA EXPORTACIÓN: Suma al total consolidado de caja en su MONEDA ORIGINAL (incluyendo pase) si es 'Efectivo'
            if (paymentMethodKey === 'efectivo') {
                cashTotals[sale.currency] += sale.originalAmount;
            }
        });

        const sortedSellers = Object.keys(summary).sort();

        let headerHtml = `
            <th>Vendedor</th>
            <th>Venta Neta Total ($)</th>
            <th>Comisión Bruta Total ($)</th>
            <th>Comisión Neta Total ($)</th>
            <th>Comisión Depósito Total ($)</th>
        `;
        headerHtml += `
            <th>Total Ventas USD </th>
            <th>Total Ventas PYG</th>
            <th>Total Ventas BRL</th>
            <th>Total Ventas ARS</th>
        `;

        DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
            headerHtml += `<th>${(combo.method).toLowerCase()} (${combo.currency})</th>`; // Convertir a minúsculas aquí también
        });

        const headerRow = thead.insertRow();
        headerRow.innerHTML = headerHtml;

        if (sortedSellers.length === 0) {
            showToast('No hay datos de vendedores para exportar con los filtros aplicados.', 'error');
            return;
        }

        sortedSellers.forEach(seller => {
            const row = tbody.insertRow();
            row.insertCell().textContent = seller;

            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalSalesArs, 2);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalGrossCommissionsArs, 2);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalCommissionsArs, 2);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalDepositCommissionsArs, 2);

            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalOriginalUsd, 2);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalOriginalPyg, 0);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalOriginalBrl, 2);
            row.insertCell().textContent = formatNumberForExcel(summary[seller].totalOriginalArs, 2);

            DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
                const normalizedComboMethod = (combo.method || '').trim().toLowerCase();
                const amount = (summary[seller].paymentMethodsByCurrency[normalizedComboMethod] && summary[seller].paymentMethodsByCurrency[normalizedComboMethod][combo.currency] !== undefined)
                    ? summary[seller].paymentMethodsByCurrency[normalizedComboMethod][combo.currency]
                    : 0;
                row.insertCell().textContent = formatNumberForExcel(amount, combo.currency === 'PYG' ? 0 : 2);
            });
        });

        const totalRow = tbody.insertRow();
        totalRow.insertCell().textContent = 'TOTAL GENERAL';

        totalRow.insertCell().textContent = formatNumberForExcel(Object.values(summary).reduce((acc, curr) => Number(acc) + Number(curr.totalSalesArs), 0), 2);
        totalRow.insertCell().textContent = formatNumberForExcel(globalTotalGrossCommissions, 2);
        totalRow.insertCell().textContent = formatNumberForExcel(Object.values(summary).reduce((acc, curr) => Number(acc) + Number(curr.totalCommissionsArs), 0), 2);
        totalRow.insertCell().textContent = formatNumberForExcel(globalTotalDepositCommissions, 2);

        // Modificación para la exportación a Excel: Añadir el nombre de la moneda
        totalRow.insertCell().textContent = `USD: ${formatNumberForExcel(globalTotalsByCurrency['USD'], 2)}`;
        totalRow.insertCell().textContent = `PYG: ${formatNumberForExcel(globalTotalsByCurrency['PYG'], 0)}`;
        totalRow.insertCell().textContent = `BRL: ${formatNumberForExcel(globalTotalsByCurrency['BRL'], 2)}`;
        totalRow.insertCell().textContent = `ARS: ${formatNumberForExcel(globalTotalsByCurrency['ARS'], 2)}`;

        DISPLAY_METHOD_CURRENCY_COMBINATIONS.forEach(combo => {
            const normalizedComboMethod = (combo.method || '').trim().toLowerCase(); // Normalizar para la búsqueda
            const amount = (globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod] && globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod][combo.currency] !== undefined)
                ? globalTotalsByPaymentMethodAndCurrency[normalizedComboMethod][combo.currency]
                : 0;
            row.insertCell().textContent = formatNumberForExcel(amount, combo.currency === 'PYG' ? 0 : 2);
        });

        // Fila de TOTAL CAJA (EFECTIVO) para la exportación
        const cashTotalsExportRow = tbody.insertRow();
        // Se muestra el total consolidado de caja en ARS directamente en la primera celda.
        cashTotalsExportRow.insertCell().outerHTML = `<th colspan="5" style="text-align: right;">TOTAL CAJA (EFECTIVO):</th>`;
        cashTotalsExportRow.insertCell().outerHTML = `<th style="text-align: center;">USD: ${formatNumberForExcel(cashTotals['USD'] || 0, 2)}</th>`;
        cashTotalsExportRow.insertCell().outerHTML = `<th style="text-align: center;">PYG: ${formatNumberForExcel(cashTotals['PYG'] || 0, 0)}</th>`;
        cashTotalsExportRow.insertCell().outerHTML = `<th style="text-align: center;">BRL: ${formatNumberForExcel(cashTotals['BRL'] || 0, 2)}</th>`;
        cashTotalsExportRow.insertCell().outerHTML = `<th style="text-align: center;">ARS: ${formatNumberForExcel(cashTotals['ARS'] || 0, 2)}</th>`;

        // Rellenar las celdas restantes con espacios vacíos para la exportación
        const remainingCellsForExportCashRow = headerRow.children.length - (5 + 4);
        for (let i = 0; i < remainingCellsForExportCashRow; i++) {
            cashTotalsExportRow.insertCell().textContent = '';
        }

        document.body.appendChild(tempTable);

        try {
            if (typeof Table2Excel !== 'undefined') {
                const table2excel = new Table2Excel();
                let filename = 'Resumen_General_Vendedor';
                if (seller) filename += `_${seller.replace(/\s/g, '_')}`;
                if (startDate && endDate) filename += `_Desde_${startDate}_Hasta_${endDate}`;
                else if (startDate) filename += `_Desde_${startDate}`;
                else if (endDate) filename += `_Hasta_${endDate}`;

                table2excel.export(tempTable, filename);
                showToast('Resumen general exportado a Excel correctamente.');
            } else {
                showToast('Error: La librería Table2Excel no está cargada o no es globalmente accesible.', 'error');
                console.error('Table2Excel no está definida. Asegúrate de que el script esté cargado y sea accesible.');
            }
        } catch (e) {
            showToast(`Error exportando resumen general a Excel: ${e.message}`, 'error');
            console.error('Error durante la exportación a Excel del resumen general:', e);
        } finally {
            document.body.removeChild(tempTable);
        }
    }

    // --- Escuchadores de Eventos para nuevos filtros en Resumen por Vendedor ---
    function applySummaryFilters() {
        const startDate = summaryStartDateFilter.value;
        const endDate = summaryEndDateFilter.value;
        const seller = summarySellerFilter.value;
        renderSummaryTable(startDate, endDate, seller);
    }

    if (summarySellerFilter) {
        summarySellerFilter.addEventListener('input', applySummaryFilters);
    } else {
        console.error('Error: summarySellerFilter es null.');
    }
    if (summaryStartDateFilter) {
        summaryStartDateFilter.addEventListener('change', applySummaryFilters);
    } else {
        console.error('Error: summaryStartDateFilter es null.');
    }
    if (summaryEndDateFilter) {
        summaryEndDateFilter.addEventListener('change', applySummaryFilters);
    } else {
        console.error('Error: summaryEndDateFilter es null.');
    }

    if (summaryResetFiltersBtn) {
        summaryResetFiltersBtn.addEventListener('click', () => {
            if (summarySellerFilter) summarySellerFilter.value = '';
            if (summaryStartDateFilter) summaryStartDateFilter.value = '';
            if (summaryEndDateFilter) summaryEndDateFilter.value = '';
            applySummaryFilters();
        });
    } else {
        console.error('Error: summaryResetFiltersBtn es null.');
    }

    // --- Nuevas Funciones para Gestionar Vendedores ---
    async function updateSellersDatalist() {
        const sellersData = await fetchData('/sellers');
        if (sellersData) {
            predefinedSellers = sellersData;
            if (sellerNamesDatalist) {
                sellerNamesDatalist.innerHTML = '';
            } else {
                console.error('Error: sellerNamesDatalist es null.');
            }

            if (sellerNamesSummaryDatalist) {
                sellerNamesSummaryDatalist.innerHTML = '';
            } else {
                console.error('Error: sellerNamesSummaryDatalist es null.');
            }

            predefinedSellers.sort((a, b) => a.localeCompare(b)).forEach(seller => {
                const option1 = document.createElement('option');
                option1.value = seller;
                if (sellerNamesDatalist) {
                    sellerNamesDatalist.appendChild(option1);
                }

                const option2 = document.createElement('option');
                option2.value = seller;
                if (sellerNamesSummaryDatalist) {
                    sellerNamesSummaryDatalist.appendChild(option2);
                }
            });
        }
    }

    function renderSellersTable() {
        if (!sellersTableBody) {
            console.error('Error: sellersTableBody es null. No se puede renderizar la tabla de vendedores.');
            return;
        }
        sellersTableBody.innerHTML = '';
        if (predefinedSellers.length === 0) {
            const row = sellersTableBody.insertRow();
            row.innerHTML = '<td colspan="2" style="text-align: center;">No hay vendedores cargados.</td>';
            return;
        }
        predefinedSellers.sort((a, b) => a.localeCompare(b)).forEach(seller => {
            const row = sellersTableBody.insertRow();
            row.insertCell().textContent = seller;

            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.classList.add('btn', 'danger');
            deleteBtn.onclick = () => deleteSeller(seller);
            actionsCell.appendChild(deleteBtn);
        });
    }

    if (addSellerBtn_manageSellers) {
        addSellerBtn_manageSellers.addEventListener('click', async () => {
            if (!newSellerNameInput) {
                console.error('Error: newSellerNameInput es null.');
                return;
            }
            const newSeller = newSellerNameInput.value.trim();
            if (newSeller) {
                const result = await postData('/sellers', { name: newSeller });
                if (result) {
                    await updateSellersDatalist();
                    renderSellersTable();
                    newSellerNameInput.value = '';
                    showToast(`Vendedor "${newSeller}" añadido.`);
                } else {
                    // La función postData ya muestra un toast, pero se podría refinar aquí
                    // según el contenido del `result`.
                }
            } else {
                showToast('Por favor, introduce un nombre para el vendedor.', 'error');
            }
        });
    } else {
        console.error('Error: addSellerBtn_manageSellers es null.');
    }

    async function deleteSeller(sellerToDelete) {
        showConfirm(`¿Estás seguro de que quieres eliminar a "${sellerToDelete}"? Esto no eliminará las boletas existentes de este vendedor.`, async () => {
            const result = await deleteData(`/sellers/${sellerToDelete}`);
            if (result) {
                await updateSellersDatalist();
                renderSellersTable();
                showToast(`Vendedor "${sellerToDelete}" eliminado.`);
            }
        });
    }

    // --- Funciones de Exportación/Importación de Datos ---
    if (exportAllDataBtn) {
        exportAllDataBtn.addEventListener('click', async () => {
            const allData = await postData('/backup', {}); // Envía un cuerpo vacío para la solicitud de respaldo
            if (allData) {
                const dataStr = JSON.stringify(allData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date();
                const filename = `alaska_fashion_backup_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.json`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('Todos los datos exportados correctamente.');
            }
        });
    } else {
        console.error('Error: exportAllDataBtn es null.');
    }

    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => {
            if (!importFileInput.files || importFileInput.files.length === 0) {
                showToast('Por favor, selecciona un archivo de respaldo JSON para importar.', 'error');
                return;
            }
            const file = importFileInput.files[0];
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    showConfirm('¿Estás seguro de que quieres RESTAURAR los datos? Esto SOBRESCRIBIRÁ todos los datos actuales (cotizaciones, boletas y vendedores).', async () => {
                        const result = await postData('/restore', importedData);
                        if (result) {
                            await loadAllData();
                            showToast('Datos restaurados correctamente desde el archivo de respaldo.', 'success');
                            importFileInput.value = '';
                        }
                    }, () => {
                        showToast('Restauración de datos cancelada.', 'info');
                        importFileInput.value = '';
                    });
                } catch (error) {
                    showToast('Error al leer o parsear el archivo de respaldo. Asegúrate de que sea un archivo JSON válido.', 'error');
                    console.error('Error al parsear el archivo importado:', error);
                    importFileInput.value = '';
                }
            };

            reader.onerror = () => {
                showToast('Error al leer el archivo. Inténtalo de nuevo.', 'error');
                console.error('Error de FileReader:', reader.error);
                importFileInput.value = '';
            };

            reader.readAsText(file);
        });
    } else {
        console.error('Error: importDataBtn o importFileInput son null.');
    }

    // --- Lógica de Pestañas ---
    async function showTab(tabId) { // Made async here
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const targetButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);

        if (targetButton) {
            targetButton.classList.add('active');
        } else {
            console.error(`Error: Botón de pestaña con data-tab="${tabId}" no encontrado.`);
        }
        if (targetContent) {
            targetContent.classList.add('active');
        } else {
            console.error(`Error: Contenido de pestaña con id="${tabId}" no encontrado.`);
        }

        // Siempre cargar todos los datos de la API para asegurar que estén frescos
        await loadAllData();

        // Renderiza el contenido de la pestaña activa con los filtros correspondientes
        if (tabId === 'listado-boletas') {
            renderSalesTable(
                filterSellerInput ? filterSellerInput.value : '',
                currentPage,
                itemsPerPage,
                listSalesStartDateFilter ? listSalesStartDateFilter.value : '',
                listSalesEndDateFilter ? listSalesEndDateFilter.value : ''
                // Se elimina el argumento `paymentStatusFilter.value`
            );
        } else if (tabId === 'resumen-vendedor') {
            applySummaryFilters();
        } else if (tabId === 'resumen-detallado-moneda') {
            renderDetailedSummary(
                filterDetailedSellerInput ? filterDetailedSellerInput.value : '',
                detailedStartDateFilter ? detailedStartDateFilter.value : '',
                detailedEndDateFilter ? detailedEndDateFilter.value : ''
            );
        } else if (tabId === 'cotizaciones') {
            updateCurrentRatesDisplay();
        } else if (tabId === 'gestionar-vendedores') {
            renderSellersTable();
        } else if (tabId === 'cargar-boleta') {
            updateDailySummaryPreview();
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // --- Carga Inicial de Datos (Nueva función para cargar todos los datos iniciales) ---
    async function loadAllData() {
        const [ratesData, salesData, sellersData] = await Promise.all([
            fetchData('/rates'),
            fetchData('/sales'),
            fetchData('/sellers')
        ]);

        if (ratesData) exchangeRates = ratesData;
        else exchangeRates = { usdToArs: 1000, pygToArs: 7692.31, brlToArs: 200 }; // Valores por defecto si la API falla

        if (salesData) sales = salesData;
        else sales = []; // Valores por defecto si la API falla

        if (sellersData) predefinedSellers = sellersData;
        else predefinedSellers = []; // Valores por defecto si la API falla

        updateCurrentRatesDisplay();
        updateSellersDatalist();
        renderSellersTable();
        // Las llamadas a renderSalesTable, renderSummaryTable, renderDetailedSummary
        // se hacen ahora dentro de showTab cuando se activa la pestaña correspondiente.
        // updateDailySummaryPreview() también se llama en cargar-boleta.
    }

    // --- Inicialización al Cargar la Página ---
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDateString = `${year}-${month}-${day}`;

    if (saleDateInput) saleDateInput.value = todayDateString;

    // Establece el estado inicial del campo de comisión al cargar la página
    if (commissionRateInput) {
        commissionRateInput.disabled = true; // Deshabilitado por defecto
        commissionRateInput.value = 0.03;   // Valor por defecto
    }
    if (enableCommissionEditCheckbox) {
        enableCommissionEditCheckbox.checked = false; // Checkbox desmarcado por defecto
    }

    // Ocultar los campos de pase al cargar la página
    if (isWholesaleCheckbox) isWholesaleCheckbox.checked = false;
    if (paseAmountGroup) paseAmountGroup.style.display = 'none';
    if (paseAmountInput) paseAmountInput.value = 0;
    if (paseCurrencyGroup) paseCurrencyGroup.style.display = 'none'; // Oculta el grupo de moneda de pase
    if (paseCurrencySelect) paseCurrencySelect.value = 'USD'; // Valor por defecto

    // Inicializa los filtros de fecha para 'Listado de Boletas' y 'Resumen Detallado'
    // Por defecto, se mostrarán todas las boletas al cargar la página.
    // El botón "Eliminar Todas las Boletas" modificará estos valores.
    if (listSalesStartDateFilter) listSalesStartDateFilter.value = '';
    if (listSalesEndDateFilter) listSalesEndDateFilter.value = '';
    if (detailedStartDateFilter) detailedStartDateFilter.value = '';
    if (detailedEndDateFilter) detailedEndDateFilter.value = '';
    // NOTA: Se elimina la inicialización del filtro de estado de pago.

    await loadAllData(); // Cargar todos los datos iniciales de la API
    showTab('cotizaciones'); // Muestra la primera pestaña al cargar

    // NOTA: Se elimina el dispatchEvent para paymentMethodSelect ya no es necesario.
});
