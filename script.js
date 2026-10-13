
"use strict";

// =====================================================
// REFERENCIAS
// =====================================================

const tablaRecogidas = document.getElementById("tabla-recogidas");


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function valorDe(elemento) {
    if (!elemento || elemento.value.trim() === "") {
        return 0;
    }

    const numero = Number(elemento.value);
    return Number.isFinite(numero) ? numero : 0;
}

function valorPorId(id) {
    return valorDe(document.getElementById(id));
}

function ponerValor(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = String(valor);
    }
}

function valorClasificacion(tipo, lado) {
    const selector =
        `.clasificacion-manual[data-tipo="${tipo}"][data-lado="${lado}"]`;

    return valorDe(document.querySelector(selector));
}


// =====================================================
// 1. NAVEGACIÓN CON ENTER EN RECOGIDAS
// =====================================================

tablaRecogidas.querySelectorAll("tbody input").forEach(input => {
    input.addEventListener("keydown", evento => {
        if (evento.key !== "Enter") return;

        evento.preventDefault();

        const filas = [
            ...tablaRecogidas.querySelectorAll("tbody tr")
        ];

        const filaActual = input.closest("tr");
        const celdasActuales = [
            ...filaActual.querySelectorAll("td")
        ];

        const indiceFila = filas.indexOf(filaActual);

        const indiceColumna = celdasActuales.findIndex(
            celda => celda.contains(input)
        );

        // Primero busca la siguiente casilla hacia abajo
        // en la misma columna.
        for (let i = indiceFila + 1; i < filas.length; i++) {
            const siguiente =
                filas[i].querySelectorAll("td")[indiceColumna]
                    ?.querySelector("input");

            if (siguiente) {
                siguiente.focus();
                siguiente.select();
                return;
            }
        }

        // Al llegar al final de la columna,
        // pasa a la siguiente columna desde arriba.
        for (
            let columna = indiceColumna + 1;
            columna < 12;
            columna++
        ) {
            for (let fila = 0; fila < filas.length; fila++) {
                const siguiente =
                    filas[fila]
                        .querySelectorAll("td")[columna]
                        ?.querySelector("input");

                if (siguiente) {
                    siguiente.focus();
                    siguiente.select();
                    return;
                }
            }
        }

        // Si se llega a la última columna y última fila,
        // deja el cursor en la primera casilla.
        const primeraCasilla =
            filas[0]?.querySelector("td input");

        if (primeraCasilla) {
            primeraCasilla.focus();
            primeraCasilla.select();
        }
    });
});


// =====================================================
// 2. SUMAS DE NÚMERO Y HORARIO DE RECOGIDAS
// =====================================================

function calcularTotalesRecogidas() {
    const filas = [
        ...tablaRecogidas.querySelectorAll("tbody tr")
    ];

    const totalesColumnas = Array(12).fill(0);

    let granTotal = 0;

    filas.forEach(fila => {
        const celdas = [...fila.querySelectorAll("td")];

        let totalFila = 0;

        // Columnas 1 a 11 y H Piso.
        for (let columna = 0; columna < 12; columna++) {
            const input =
                celdas[columna]?.querySelector("input");

            const valor = valorDe(input);

            totalFila += valor;
            totalesColumnas[columna] += valor;
        }

        fila.querySelector(".fila-total").textContent =
            String(totalFila);

        granTotal += totalFila;
    });

    // Suma vertical de cada columna.
    const celdasTotales = [
        ...tablaRecogidas.querySelectorAll(
            "tfoot .columna-total"
        )
    ];

    totalesColumnas.forEach((total, indice) => {
        if (celdasTotales[indice]) {
            celdasTotales[indice].textContent = String(total);
        }
    });

    // Total general de la tabla.
    tablaRecogidas.querySelector(".gran-total").textContent =
        String(granTotal);

    return {
        filas,
        totalesColumnas,
        granTotal
    };
}


// =====================================================
// 3. CLASIFICACIÓN DE HUEVO Y TOTALES POR PERSONA
// =====================================================

function calcularClasificacion() {
    const recogidas = calcularTotalesRecogidas();

    let totalIzquierda = 0;
    let totalDerecha = 0;

    // Suma las dos columnas de H. Tratado hasta Desecho.
    document.querySelectorAll(".clasificacion-manual")
        .forEach(input => {
            const valor = valorDe(input);

            if (input.dataset.lado === "izquierda") {
                totalIzquierda += valor;
            } else if (input.dataset.lado === "derecha") {
                totalDerecha += valor;
            }
        });

    ponerValor("total-persona-izquierda", totalIzquierda);
    ponerValor("total-persona-derecha", totalDerecha);

    // H. Limpio - mitad:
    // total de recogidas menos ambos totales por persona.
    const limpioMitad =
        recogidas.granTotal -
        totalIzquierda -
        totalDerecha;

    ponerValor("limpio-mitad", limpioMitad);

    // H. Limpio - izquierda:
    // suma de los totales de los salones 1 al 4,
    // menos el total de la persona izquierda.
    const primerosCuatroSalones =
        recogidas.filas.slice(0, 4).reduce((suma, fila) => {
            const totalFila = Number(
                fila.querySelector(".fila-total").textContent
            ) || 0;

            return suma + totalFila;
        }, 0);

    const limpioIzquierda =
        primerosCuatroSalones - totalIzquierda;

    ponerValor("limpio-izquierda", limpioIzquierda);

    // H. Limpio - derecha:
    // valor de la mitad menos el valor izquierdo.
    const limpioDerecha =
        limpioMitad - limpioIzquierda;

    ponerValor("limpio-derecha", limpioDerecha);

    return {
        recogidas,
        totalIzquierda,
        totalDerecha,
        limpioMitad,
        limpioIzquierda,
        limpioDerecha
    };
}


// =====================================================
// 4. INVENTARIO H. INCUBABLE
// =====================================================

function calcularIncubable(clasificacion) {
    // Entrada = H. Limpio (mitad)
    //          + H. Tratado (izquierda y derecha).

    const tratadoIzquierda =
        valorClasificacion("tratado", "izquierda");

    const tratadoDerecha =
        valorClasificacion("tratado", "derecha");

    const entrada =
        clasificacion.limpioMitad +
        tratadoIzquierda +
        tratadoDerecha;

    ponerValor("incubable-entrada", entrada);

    // Saldo = Inicial + Entrada - Salida.
    const inicial = valorPorId("incubable-inicial");
    const salida = valorPorId("incubable-salida");

    const saldo = inicial + entrada - salida;

    ponerValor("incubable-saldo", saldo);
}


// =====================================================
// 5. INVENTARIO H. NO CONFORME
// =====================================================

function calcularNoConforme(clasificacion) {
    const tratadoIzquierda =
        valorClasificacion("tratado", "izquierda");

    const tratadoDerecha =
        valorClasificacion("tratado", "derecha");

    const desechoIzquierda =
        valorClasificacion("desecho", "izquierda");

    const desechoDerecha =
        valorClasificacion("desecho", "derecha");

    // Entrada = Total recogidas
    //          - H. Limpio (mitad)
    //          - H. Tratado izquierda y derecha
    //          - Desecho izquierda y derecha.

    const entrada =
        clasificacion.recogidas.granTotal -
        clasificacion.limpioMitad -
        tratadoIzquierda -
        tratadoDerecha -
        desechoIzquierda -
        desechoDerecha;

    ponerValor("no-conforme-entrada", entrada);

    // Salida = suma de las dos casillas de Desecho.
    const salida =
        desechoIzquierda + desechoDerecha;

    ponerValor("no-conforme-salida", salida);

    // Según la fórmula indicada:
    // Saldo = Inicial + Entrada.
    const inicial = valorPorId("no-conforme-inicial");
    const saldo = inicial + entrada;

    ponerValor("no-conforme-saldo", saldo);
}


// =====================================================
// 6. ACTUALIZACIÓN GENERAL
// =====================================================

function actualizarTodo() {
    const clasificacion = calcularClasificacion();

    calcularIncubable(clasificacion);
    calcularNoConforme(clasificacion);
}


// =====================================================
// 7. EVENTOS DE LAS CASILLAS MANUALES
// =====================================================

// Recogidas: cualquier cambio actualiza todas las tablas.
tablaRecogidas.querySelectorAll("tbody input")
    .forEach(input => {
        input.addEventListener("input", actualizarTodo);
    });

// Clasificación: cualquier cambio actualiza los totales
// por persona, H. Limpio y ambos inventarios.
document.querySelectorAll(".clasificacion-manual")
    .forEach(input => {
        input.addEventListener("input", actualizarTodo);
    });

// Inicial y salida de H. Incubable son manuales.
document.getElementById("incubable-inicial")
    .addEventListener("input", actualizarTodo);

document.getElementById("incubable-salida")
    .addEventListener("input", actualizarTodo);

// Inicial de H. no conforme es manual.
document.getElementById("no-conforme-inicial")
    .addEventListener("input", actualizarTodo);


// =====================================================
// 8. PRIMER CÁLCULO AL ABRIR LA PÁGINA
// =====================================================

actualizarTodo();
