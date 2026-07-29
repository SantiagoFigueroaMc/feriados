const current_year = new Date().getFullYear();
const MIN_YEAR = current_year - 10;
const MAX_YEAR = current_year + 9;
const APP_VERSION = "v1"; // todo: add a clear storage fn when increasing to v2

document.querySelector("small#year-ranges").innerText = `${MIN_YEAR} - ${MAX_YEAR}`;
document.querySelector("small#ar-year-ranges").innerText = `${current_year - 6} - ${current_year + 1}`;
document.querySelector("small#br-year-ranges").innerText = `${current_year - 10} - ${current_year + 9}`;
document.querySelector("small#cl-year-ranges").innerText = `${current_year - 10} - ${current_year + 9}`;
document.querySelector("small#co-year-ranges").innerText = `${current_year - 2} - ${current_year + 1}`;
document.querySelector("small#mx-year-ranges").innerText = `${current_year - 2} - ${current_year + 6}`;
document.querySelector("small#pe-year-ranges").innerText = `${current_year - 2} - ${current_year + 6}`;
document.querySelector("small#uy-year-ranges").innerText = `${current_year - 2} - ${current_year + 6}`;

const contenedor = document.getElementById('feriados-contenedor');
const checkboxes = document.querySelectorAll('input[name="Paises"]');
const yearInput = document.querySelector('input[name="year"]');
const btnExportar = document.getElementById('btn-exportar');

// Objeto global para almacenar los datos crudos actuales (incluye la fecha original de la API)
let datosFeriadosActuales = {};

yearInput.value = new Date().getFullYear();

checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        g4_event({
            'event': 'country_checkbox_input_change',
            'country': e.target.value,
            'selected': e.target.checked,
        });
        
        renderizarColumnas();
    });
});

function getFromLocalStorage({ country, year }) {
    const data = localStorage.getItem(`feriados-nacionales:${country}:${year}:${APP_VERSION}`)
    return data ? JSON.parse(data) : null;
}

function saveToLocalStorage({ country, year, data }) {
    localStorage.setItem(`feriados-nacionales:${country}:${year}:${APP_VERSION}`, JSON.stringify(data));
}

function onYearInputChange(e) {
    let val = Number(e.target.value);

    g4_event({
        'event': 'year_input_change',
        'year': val,
    });

    if (val < MIN_YEAR) val = MIN_YEAR;
    if (val > MAX_YEAR) val = MAX_YEAR;
    yearInput.value = val;
    renderizarColumnas();
}

// Enrutador de APIs según el país seleccionado
async function obtenerFeriadosRemotos(codigoPais, year) {

    const localData = getFromLocalStorage({ country: codigoPais, year })
    if (localData) return localData;

    g4_event({
        'event': 'fetch_feriados',
        'contry': codigoPais,
        'year': year,
    });

    try {
        switch (codigoPais) {
            case 'CL': {
                const res = await fetch('https://api.boostr.cl/holidays.json');
                const json = await res.json();
                const data = json.data.map(f => ({ fecha: f.date, nombre: f.title }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'AR': {
                const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.fecha, nombre: f.nombre }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'BR': {
                // API pública de feriados nacionales brasileños
                const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.date, nombre: f.name }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'CO': {
                const res = await fetch(`https://nagerholidays.com/api/v4/Holidays/CO/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.date, nombre: f.name }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'MX': {
                const res = await fetch(`https://nagerholidays.com/api/v4/Holidays/MX/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.date, nombre: f.name }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'PE': {
                const res = await fetch(`https://nagerholidays.com/api/v4/Holidays/PE/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.date, nombre: f.name }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            case 'UY': {
                const res = await fetch(`https://nagerholidays.com/api/v4/Holidays/UY/${year}`);
                const datos = await res.json();
                const data = datos.map(f => ({ fecha: f.date, nombre: f.name }));
                saveToLocalStorage({ country: codigoPais, year, data });
                return data;
            }
            default:
                return [];
        }
    } catch (error) {
        console.error(`Error consultando calendario de ${codigoPais}:`, error);
        return null; // Controla errores de red individuales
    }
}

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const opciones = { day: 'numeric', month: 'short' };
    const fecha = new Date(fechaString + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Nueva función de ayuda para convertir YYYY-MM-DD a dd/MM/yyyy alternativo para Excel
function formatearFechaExcel(fechaString) {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split('-');
    return `${day}/${month}/${year}`;
}

async function renderizarColumnas() {
    contenedor.innerHTML = '';
    datosFeriadosActuales = {};
    let tieneDatos = false;

    for (const checkbox of checkboxes) {
        if (checkbox.checked) {
            const paisCodigo = checkbox.value;
            const pais_name = checkbox.parentElement.textContent.trim().replace(/\d{4}\s*-\s*\d{4}/, yearInput.value);
            let columna = document.getElementById(`${pais_name}`)
            if (!columna) {
                columna = document.createElement('div');
                columna.id=`${pais_name}`;
                columna.classList.add('pais-columna');
            }
            columna.innerHTML = `<h3>${pais_name}</h3><p class="loading">Sincronizando suscripción...</p>`;
            contenedor.appendChild(columna);

            const feriados = await obtenerFeriadosRemotos(paisCodigo, yearInput.value);
            const loader = columna.querySelector('.loading');
            if (loader) loader.remove();

            if (!feriados || feriados.length === 0) {
                columna.innerHTML += `<p style="color:red; font-size:0.85em;">Error al conectar con la suscripción del país.</p>`;
            } else {
                // Guardamos los feriados usando el código del país ('CL', 'AR', etc.) como clave
                datosFeriadosActuales[paisCodigo] = feriados;
                tieneDatos = true;

                const lista = document.createElement('ul');
                feriados.forEach(f => {
                    const item = document.createElement('li');
                    item.innerHTML = `<strong>${formatearFecha(f.fecha)}</strong> - ${f.nombre}`;
                    lista.appendChild(item);
                });
                columna.appendChild(lista);
            }
        }
    }

    btnExportar.disabled = !tieneDatos;
}

function g4_event(event_details){
window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event_details);
}

function exportarAExcel() {
    if (Object.keys(datosFeriadosActuales).length === 0) return;

    let contenidoCsv = "País;Fecha;Festividad\n";

    for (const [codigoPais, feriados] of Object.entries(datosFeriadosActuales)) {
        feriados.forEach(f => {
            const nombreLimpio = f.nombre.replace(/"/g, '""');
            // Convierte la fecha original (YYYY-MM-DD) al formato requerido dd/MM/yyyy
            const fechaExcel = formatearFechaExcel(f.fecha);

            contenidoCsv += `"${codigoPais}";"${fechaExcel}";"${nombreLimpio}"\n`;
        });
    }

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contenidoCsv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    g4_event({
        'event': 'descargar_excel',
        'countries': Object.keys(datosFeriadosActuales),
        'year': yearInput.value,
    })


    link.setAttribute("href", url);
    link.setAttribute("download", `Feriados_${yearInput.value}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

yearInput.addEventListener("change", onYearInputChange);
btnExportar.addEventListener("click", exportarAExcel);
