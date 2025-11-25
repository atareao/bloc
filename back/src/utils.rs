use comrak::Options;
use once_cell::sync::Lazy;

// Define las opciones una sola vez al inicio.
static MARKDOWN_OPTIONS: Lazy<Options> = Lazy::new(|| {
    let mut options = Options::default();
    options.extension.strikethrough = true; // ~~texto tachado~~
    options.extension.tagfilter = true; // Filtra ciertas etiquetas HTML crudas (raw HTML)
    options.extension.table = true; // Tablas estilo GFM
    options.extension.autolink = true; // Enlazado automático (www.ejemplo.com)
    options.extension.tasklist = true; // Listas de tareas (checkboxes)
    options.extension.superscript = true; // Superíndice (Ej: ^2^ → ²)
    options.extension.footnotes = true; // Notas al pie ([^1])
    options.extension.inline_footnotes = true; // Notas al pie en línea (^[nota])
    options.extension.description_lists = true; // Listas de descripción (Término: Definición)
    options.extension.multiline_block_quotes = true; // Citas en bloque multilínea (>>>)
    options.extension.alerts = true; // Alertas estilo GitHub (> [!note])
    options.extension.math_dollars = true; // Matemáticas con sintaxis $...$
    options.extension.math_code = true; // Matemáticas con bloques de código ```math
    options.extension.shortcodes = true; // Reemplaza :shortcodes: por emojis (requiere feature `shortcodes`)
    options.extension.wikilinks_title_after_pipe = true; // Enlaces Wiki [[url|título]]
    options.extension.wikilinks_title_before_pipe = true; // Enlaces Wiki [[título|url]]
    options.extension.underline = true; // Subrayado con doble guion bajo (__texto__)
    options.extension.subscript = true; // Subíndice (Ej: ~2~ → ₂)
    options.extension.spoiler = true; // Spoilers (||texto||)
    options.extension.greentext = true; // Comportamiento de citas en bloque tipo foros (imageboards)
    options.extension.cjk_friendly_emphasis = true; // Énfasis amigable con caracteres CJK
    options.extension.subtext = true; // Subtexto (comportamiento similar a subscript)
    options.extension.highlight = true; // Resaltado con doble signo de igual (==texto resaltado==)

    options.extension.header_ids = Some("content-".to_string()); // Añade IDs a los encabezados con prefijo "content-"

    options
});

pub fn markdown_to_html(markdown: &str) -> String {
    comrak::markdown_to_html(markdown, &MARKDOWN_OPTIONS)
}
