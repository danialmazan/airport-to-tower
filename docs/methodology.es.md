# Metodología

Versión 1.0 · edición de 2026

## Cobertura

Esta edición contiene un marco fijo de 150 aglomeraciones urbanas. Combina un núcleo demográfico basado en *World Urbanization Prospects* de Naciones Unidas con ciudades adicionales para mejorar la representación de África, Europa, Norteamérica, Sudamérica y Oceanía. Tiene alcance global, pero no incluye todas las ciudades del mundo.

Cada edición registra la fuente del marco, la fecha límite de revisión, la instantánea de fuentes y la versión metodológica. Añadir o eliminar una ciudad es una decisión de edición, no una consecuencia casual de la disponibilidad de datos sobre torres.

## Aeropuertos

Se incluye un aeropuerto cuando ofrece servicios regulares de pasajeros que se pueden reservar durante la temporada actual o una temporada recurrente anunciada, y fuentes fiables lo presentan convencionalmente como aeropuerto de la ciudad. Puede estar fuera del municipio; la distancia no lo incluye ni excluye por sí sola. Los aeropuertos estacionales recurrentes se incluyen y se identifican.

Se excluyen aeropuertos exclusivamente chárter, de carga, militares, de aviación general, cerrados o propuestos. Un aeropuerto puede asociarse con varias ciudades si cada relación está respaldada de forma independiente. La condición de aeropuerto principal es descriptiva y no modifica la clasificación.

OurAirports se utiliza para el descubrimiento y las coordenadas del punto de referencia. Antes de publicar se deben verificar el servicio y la asociación con la ciudad mediante fuentes del aeropuerto, operador, autoridad aeronáutica o aerolínea.

## Más alta

Más alta significa el hito vertical permanente y terminado de mayor altura asociado con la identidad metropolitana reconocida de la ciudad. Se admiten edificios ocupados, torres exentas de observación o telecomunicaciones, monumentos y agujas de iglesia. Se excluyen mástiles arriostrados, grúas, aerogeneradores, chimeneas, torres eléctricas, obras temporales, estructuras demolidas y proyectos sin terminar.

La altura se mide hasta el punto físico permanente más alto sobre el suelo y se conserva la base de medición de la fuente. Es una definición deliberadamente más amplia que las clasificaciones de altura arquitectónica. Se conservan todas las estructuras con empate exacto según la mejor precisión publicada.

## Icónica

Icónica es una selección editorial: el hito vertical permanente con mayor asociación continuada con la ciudad en fuentes turísticas, culturales, arquitectónicas, municipales o equivalentes. La altura no es decisiva. Cada ciudad tiene una selección, un motivo y un nivel de confianza. Una estructura puede ser a la vez la más alta y la icónica.

## Coordenadas y distancia

Las coordenadas del aeropuerto representan su punto de referencia cuando está disponible. Las de la torre representan el centro de la planta o su base. Se conserva la precisión de la fuente sin inventar decimales.

La distancia se calcula al generar los datos como la geodésica inversa sobre el elipsoide WGS84 mediante GeographicLib. El registro conserva metros y kilómetros sin redondear. La tabla muestra una décima de kilómetro; la clasificación y el índice usan los metros sin redondear.

## Índice

La observación elegida recibe el valor 100:

`índice = distancia de la observación ÷ distancia base × 100`

La vista predeterminada no tiene base. Elegirla no produce otra clasificación porque todas las distancias positivas se multiplican por la misma constante. Es únicamente una escala comparativa. La base, el modo y los filtros se guardan en la URL.

## Revisión y limitaciones

Los horarios, la comercialización de ciudades, la finalización de edificios y las asociaciones con hitos cambian. Las importaciones automáticas generan candidatos, no decisiones finales. Wikidata y Wikipedia pueden ayudar a descubrirlos, pero se deben priorizar fuentes autorizadas. Las selecciones de baja confianza siguen visibles.

El mapa de detalle es ilustrativo. La línea muestrea la misma geodésica WGS84 del cálculo, aunque el mapa Web Mercator distorsiona formas y escalas. Un fallo de las teselas no afecta a la clasificación.
