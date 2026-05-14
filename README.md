
# 🎼 GenArxiu

**Generador de portades per a partitures musicals**  
Una eina web lleugera, sense dependències de servidor, per crear portades en PDF d'aspecte professional per a partitures, quaderns i edicions musicals.

---

## ✨ Característiques

- 📄 **Exportació PDF** en format A4 vertical i A5 horitzontal a alta resolució (3×)
- 🖥️ **Previsualització en temps real** mentre edites
- 🎨 **Disseny completament personalitzable** per a cada element (número, títol, compositor)
  - Tipografia (Arial, Georgia, Times New Roman, Palatino, Helvetica, Courier New…)
  - Mida de la font (pt)
  - **Negreta** i *cursiva*
  - Color de text
  - Subratllat
  - Justificació horitzontal (esquerra / centre / dreta) amb botons d'icones
  - Justificació vertical (dalt / centre / baix)
- 🖼️ **Fons** de color sòlid o imatge en mode *cover*
- 🔲 **Marc decoratiu** amb color personalitzable
- 🖼️ **Logotip opcional** amb control de mida (%) i posicionament
- 🌙 **Mode fosc** (estil Win98 fosc)
- 💾 **Import / Export** de configuració en JSON (compatible amb la versió Python original)
- 📝 Text llarg amb **ajust automàtic a múltiples línies**
- 🖱️ Interfície **estil Windows 98** — clara, concisa i sense distraccions

---

## 🚀 Ús

No cal instal·lar res. Descarrega els tres fitxers i obre `index.html` al navegador.

```
genarxiu/
├── index.html    ← obre aquest fitxer
├── styles.css
└── app.js
```

> ⚠️ Els tres fitxers han d'estar a la **mateixa carpeta**.  
> Funciona localment sense servidor, però necessita connexió a internet per carregar la llibreria jsPDF (CDN).

---

## 🖨️ Com generar una portada

1. Omple els camps de **Número de catàleg**, **Títol** i **Compositor**
2. Ajusta tipografia, mida, color, negreta/cursiva i justificació per a cada element
3. Opcionalment, afegeix un **logotip** i ajusta'n la mida
4. Tria el **color o imatge de fons**
5. Fes clic a **🖨 Generar PDF A4** o **🖨 PDF A5 horit.**

---

## ⌨️ Botons de la barra d'eines

| Botó | Acció |
|------|-------|
| 📂 Importar | Carrega una configuració JSON desada |
| 💾 Exportar | Desa la configuració actual en JSON |
| 🖨 PDF A4 | Genera i descarrega el PDF A4 vertical |
| 🖨 PDF A5 horit. | Genera i descarrega el PDF A5 horitzontal |
| 🌙 Fosc / ☀ Clar | Commuta el mode fosc |
| ❓ Quant a | Informació de l'aplicació |

---

## 💾 Configuració JSON

Pots desar i carregar configuracions per reutilitzar-les. El format JSON és compatible amb la **versió original en Python/ReportLab** del projecte.

```json
{
  "font_titol": "Georgia,serif",
  "mida_titol": 72,
  "bold_tit": true,
  "color_titol": "#1a1a6e",
  "just_titol": "C",
  "justv_titol": "C",
  "mostrar_quadre": true,
  "fons_color": "#f5f0e8"
}
```

---

## 🛠️ Tecnologies

| | |
|---|---|
| **Interfície** | HTML + CSS + JavaScript pur (sense frameworks) |
| **Estil** | Inspirat per Windows 98 / Win32 clàssic, amb mode fosc |
| **PDF** | [jsPDF](https://github.com/parallax/jsPDF) v2.5.1 (CDN) |
| **Render** | Canvas API (2× preview, 3× exportació) |

---

## 📁 Estructura del codi

```
index.html   — Estructura i controls de la interfície 
styles.css   — Estils, mode fosc, layout
app.js       — Tota la lògica: render, PDF, import/export 
```

---

## 🙏 Crèdits i llicència

**Desenvolupador:** [MarcMànyez](https://github.com/MarcManyez)  
**Llicència:** [GPLv3](LICENSE)  
**Versió:** v0.1  

Basat en el projecte original **GenArxiu** (Python / ReportLab / Tkinter).  
Reimplementació completa en web per MarcMànyez.

---

*Fet amb ♩ per a músics que volen portades boniques.*
