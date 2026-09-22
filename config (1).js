/* =========================================================
   CONFIGURACIÓN DE LA TIENDA
   Cambia aquí lo básico: nombre, WhatsApp, colores y la
   hoja de Google Sheets de donde salen los productos.
   No hace falta tocar ningún otro archivo.
   ========================================================= */
const SHOP_CONFIG = {
  // Nombre que se muestra en la web
  shopName: "MOVALA",

  // Número de WhatsApp en formato internacional, SIN espacios ni "+"
  // Ejemplo España: 34611222333
  whatsappNumber: "34656662558",

  // Mensaje que aparece ya escrito al abrir WhatsApp desde el botón general
  whatsappDefaultMessage: "¡Hola! Te escribo desde tu web, me gustaría hacerte una consulta 😊",

  // URL del CSV publicado de la hoja de Google Sheets con los productos.
  // Ver GUIA.md, paso "Publicar la hoja como CSV", para obtener este enlace.
  productsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSW4CTJYzJTS5WD9sSPKLOGTPL7e9mETVwuhfPc0dcUP5S3tkveirGGMXZ2bcqXizm_zkAdg1JsyAff/pub?gid=1218807277&single=true&output=csv",

  // Colores principales (puedes cambiarlos por los que más le gusten a mamá)
  colors: {
    primary: "#8a5a45",      // color principal (botones, acentos)
    primaryDark: "#6e4535",
    background: "#faf8f5",
    text: "#221d1a"
  }
};
