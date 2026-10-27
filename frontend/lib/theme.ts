export const THEME_KEY = "snow-wild-theme";

/**
 * Script exécuté avant l'affichage (dans <head>) : applique le mode sombre choisi
 * lors d'une visite précédente, pour éviter un flash blanc. Clair par défaut.
 */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
