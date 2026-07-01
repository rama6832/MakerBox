function validartamañoArchivo(tamañoBytes, limiteBytes = 50 * 1024 * 1024) {
    return tamañoBytes <= limiteBytes;
}

module.exports = validartamañoArchivo;