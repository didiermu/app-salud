# MarkItDown - Conversión de documentos a Markdown

## Instalación

```bash
pip3 install 'markitdown[pdf]'
```

## Uso

### Archivo individual (imprime en terminal)

```bash
python3 convert-to-md.py archivo.pdf
```

### Guardar a un archivo .md

```bash
python3 convert-to-md.py archivo.pdf -o salida.md
```

### Convertir una carpeta completa

```bash
python3 convert-to-md.py ./docs -o ./markdown
```

### Vía npm

```bash
npm run convert -- archivo.pdf
npm run convert -- archivo.pdf -o salida.md
npm run convert -- ./docs -o ./markdown
```

## Formatos soportados

| Tipo | Extensiones |
|------|------------|
| Documentos | PDF, DOCX, XLSX, PPTX, TXT |
| Web | HTML, HTM, XML |
| Datos | CSV, JSON |
| Audio | MP3, WAV |
| Video | MP4 |
| Imágenes | JPG, JPEG, PNG, TIFF |
| Archivos | ZIP |

## Ejemplo

```bash
python3 convert-to-md.py public/rutina.pdf -o public/rutina.md
```
