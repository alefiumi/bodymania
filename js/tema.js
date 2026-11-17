/* Sfondo chiaro o scuro scelto con il pulsante 🌙/☀️ (bodymania-theme): si applica prima di disegnare la pagina.
   File a parte e non script in linea, così la Content-Security-Policy può vietare tutti gli script in linea. */
try{const t=localStorage.getItem("bodymania-theme");if(t)document.documentElement.dataset.theme=t;}catch(e){}
