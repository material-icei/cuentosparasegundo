# 📚 Antología de Cuentos — 2° Grado

Libro digital interactivo con efecto flipbook para el aula.  
Diseñado con HTML, CSS y JavaScript puro. Listo para publicar en **GitHub Pages**.

---

## 🚀 Publicar en GitHub Pages

1. Subí todos los archivos a tu repositorio de GitHub
2. Entrá a **Settings → Pages**
3. En *Source*, seleccioná **Deploy from a branch**
4. Elegí la rama `main` y carpeta `/ (root)`
5. Cliqueá **Save**
6. En unos minutos, tu antología estará en:  
   `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`

---

## 📁 Estructura del proyecto

```
antologia/
│
├── index.html                  ← Portada principal (índice de cuentos)
│
├── assets/
│   ├── css/
│   │   ├── main.css            ← Estilos de la portada
│   │   └── flipbook.css        ← Estilos del lector flipbook
│   └── js/
│       ├── stars.js            ← Estrellas animadas de fondo
│       └── flipbook.js         ← Motor de pasar páginas
│
└── cuentos/
    ├── _template/              ← 📋 COPIÁ ESTA CARPETA para cada cuento nuevo
    │   └── index.html
    │
    └── el-libro-que-susurra/   ← Ejemplo completo
        ├── index.html
        ├── imagenes/           ← Imágenes del cuento (.jpg / .png / .webp)
        ├── audio/              ← Narración (narracion.mp3)
        └── video/              ← Video corto (.mp4)
```

---

## ➕ Cómo agregar un nuevo cuento

### Paso 1 — Crear la carpeta del cuento
Copiá la carpeta `cuentos/_template/` y renombrala:
```
cuentos/nombre-del-cuento/
```

### Paso 2 — Agregar los archivos multimedia
```
cuentos/nombre-del-cuento/
├── imagenes/   → tus imágenes .jpg / .png
├── audio/      → narracion.mp3
└── video/      → video.mp4
```

### Paso 3 — Editar el `index.html` del cuento
Abrí `cuentos/nombre-del-cuento/index.html` y:
- Cambiá `--cover-color` y `--cover-color2` con tus colores
- Cambiá el emoji y título en la tapa
- Editá el texto en los bloques `<div class="page">`
- Agregá/quitá páginas según necesites
- Actualizá `totalPages` en el script final

### Paso 4 — Agregar la tarjeta en `index.html`
En el archivo `index.html` raíz, dentro de `<div class="books-grid">`, copiá y pegá este bloque:

```html
<article class="book-card" 
         style="--card-color:#COLOR1; --card-color2:#COLOR2;" 
         onclick="window.location='cuentos/nombre-del-cuento/index.html'">
  <div class="card-cover">
    <div class="card-emoji">🌟</div>
    <div class="card-glow"></div>
  </div>
  <div class="card-info">
    <h2 class="card-title">Nombre del cuento</h2>
    <p class="card-desc">Breve descripción del cuento.</p>
    <div class="card-meta">
      <span class="tag">🎬 Video</span>
      <span class="tag">🖼 Imágenes</span>
      <span class="tag">🎙 Audio</span>
    </div>
  </div>
  <div class="card-btn">Leer ✨</div>
</article>
```

---

## 🎨 Tipos de páginas disponibles

| Tipo          | Qué incluye                        |
|---------------|------------------------------------|
| Tapa          | Emoji + título + botón inicio      |
| Solo texto    | Párrafos y diálogos del cuento     |
| Texto + imagen| Imagen + texto debajo              |
| Texto + video | Reproductor de video + texto       |
| Texto + audio | Audio de narración + texto         |
| Página final  | Mensaje de fin + botón volver      |

---

## 🖥️ Compatibilidad

- ✅ Chrome / Edge / Firefox / Safari
- ✅ Celular y tablet (swipe táctil)
- ✅ Teclado: ← → para navegar páginas
- ✅ Sin dependencias externas (solo Google Fonts)

---

Hecho con 💛 para lectores valientes de 2° grado.
