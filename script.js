const tabla = document.getElementById("tabla-recogidas");

const inputs = tabla.querySelectorAll("input");

inputs.forEach(input => {
    input.addEventListener("input", calcularTotales);
});


function obtenerValor(input) {

    const valor = parseFloat(input.value);

    if (isNaN(valor)) {
        return 0;
    }

    return valor;
}


function calcularTotales() {

    const filas = tabla.querySelectorAll("tbody tr");

    /*
        ==============================
        SUMA HORIZONTAL
        ==============================
        
        Suma cada fila:
        1 + 2 + 3 + ... + 11 + H Piso
    */

    filas.forEach(fila => {

        const celdas = fila.querySelectorAll("td");

        let totalFila = 0;

        // Las primeras 12 celdas son:
        // 1,2,3,4,5,6,7,8,9,10,11,H Piso

        for (let i = 0; i < 12; i++) {

            const input = celdas[i].querySelector("input");

            if (input) {
                totalFila += obtenerValor(input);
            }
        }

        const total = fila.querySelector(".fila-total");

        total.textContent = totalFila;
    });


    /*
        ==============================
        SUMA VERTICAL
        ==============================

        Suma cada columna:
        Salón 1
        Salón 2
        ...
        Salón 12
        Des
    */

    const filaTotal = tabla.querySelector("tfoot tr");

    const totalesColumnas =
        filaTotal.querySelectorAll(".columna-total");


    for (let columna = 0; columna < 12; columna++) {

        let totalColumna = 0;

        filas.forEach(fila => {

            const celdas = fila.querySelectorAll("td");

            const input = celdas[columna].querySelector("input");

            if (input) {
                totalColumna += obtenerValor(input);
            }

        });

        totalesColumnas[columna].textContent = totalColumna;
    }


    /*
        ==============================
        GRAN TOTAL
        ==============================

        Suma todos los valores
        de la tabla.
    */

    let granTotal = 0;

    filas.forEach(fila => {

        const celdas = fila.querySelectorAll("td");

        for (let i = 0; i < 12; i++) {

            const input = celdas[i].querySelector("input");

            if (input) {
                granTotal += obtenerValor(input);
            }

        }

    });

    const celdaGranTotal =
        tabla.querySelector(".gran-total");

    celdaGranTotal.textContent = granTotal;
}


// Calcular al cargar la página
calcularTotales();
