-- ============================================================
-- AgroMap — Datos semilla (seed)
-- Genera 45 asociadas + visitas simuladas
-- ============================================================

do $$
declare
  asociada_id bigint;
  v_fecha date;
  v_prox date;
  v_tipo text;
  v_obs text;
  rec record;
  nombres text[] := array[
    'María López', 'Ana Martínez', 'Carmen García', 'Rosa Pérez', 'Lucía Ramírez',
    'Sofía Torres', 'Elena Vargas', 'Laura Mendoza', 'Patricia Ríos', 'Diana Castro',
    'Martha Jiménez', 'Claudia Ortiz', 'Verónica Ruiz', 'Silvia Herrera', 'Gloria Medina',
    'Teresa Vega', 'Ruth Silva', 'Liliana Peña', 'Beatriz Campos', 'Julia Delgado',
    'Adriana Flores', 'Carolina Mora', 'Gabriela Rivas', 'Isabel Acosta', 'Marina Guzmán',
    'Angélica Cruz', 'Paola Navarro', 'Raquel Salazar', 'Natalia Paredes', 'Andrea Lozano',
    'Yolanda Rojas', 'Esperanza Gil', 'Luisa Sandoval', 'Rocío Chávez', 'Inés Molina',
    'Cecilia Roldán', 'Elsa Cárdenas', 'Olga Fuentes', 'Alicia Bravo', 'Berta Tovar',
    'Amanda Vega', 'Sara Pineda', 'Mónica Espinoza', 'Manuela Cordero', 'Leticia Arenas'
  ];
  telefonos text[] := array[
    '3101234567', '3107654321', '3209876543', '3204567890', '3112345678',
    '3123456789', '3134567890', '3145678901', '3156789012', '3167890123'
  ];
  tipos_persona text[] := array['madre cabeza de hogar', 'Adulto mayor', 'viuda'];
  tipos_visita text[] := array['visita', 'seguimiento', 'capacitacion'];
  observaciones text[] := array[
    'Revisión general de la huerta. Buen estado.',
    'Se aplicó abono orgánico. Cultivos en crecimiento.',
    'Capacitación en control de plagas. Asistencia completa.',
    'Seguimiento de siembra. Todo en orden.',
    'Recomendación de sistema de riego. Pendiente implementar.',
    'Cosecha exitosa. Se registró producción.',
    'Se entregaron semillas de tomate y lechuga.',
    'Taller de compostaje. Participación activa.',
    'Revisión de suelo. Se recomienda abono nitrogenado.',
    'Visita de rutina. Huerta en mantenimiento.'
  ];
  idx int;
  sector_nombre text;
  s record;
  lat_base double precision;
  lng_base double precision;
  lat_final double precision;
  lng_final double precision;
  num_v int;
begin
  for idx in 1..array_length(nombres, 1) loop
    sector_nombre := (select nombre from sectores order by id limit 1 offset ((idx - 1) % 19));
    select lat_base, lng_base into lat_base, lng_base from sectores where nombre = sector_nombre;

    lat_final := round((lat_base + (((idx - 1) % 7) - 3) * 0.002)::numeric, 4);
    lng_final := round((lng_base + ((floor((idx - 1) / 7.0)::int - 2) * 0.002))::numeric, 4);

    insert into asociadas (nombre, edad, telefono, num_personas, sector_id, area_huerta,
      productos, fecha_siembra, fecha_ultima_visita, num_visitas, tipo_persona, observaciones, lat, lng)
    values (
      nombres[idx],
      25 + ((idx - 1) % 28),
      telefonos[1 + ((idx - 1) % 10)],
      2 + ((idx - 1) % 4),
      (select id from sectores where nombre = sector_nombre),
      format('%s m²', 20 + ((idx - 1) % 7) * 10),
      case sector_nombre
        when 'El Municipio' then 'Tiendas, Comercio, Servicios, Artesanías, Comida'
        when 'Vereda Bellavista' then 'Tomate, Cebolla, Lechuga, Pimentón, Repollo'
        when 'Vereda Cabrera' then 'Papa, Maíz, Fríjol, Arveja, Habas'
        when 'Vereda Cabuyayaco' then 'Yuca, Plátano, Ñame, Caña, Cacao'
        when 'Vereda Campoalegre' then 'Zanahoria, Papa, Fríjol, Arveja, Habichuela'
        when 'Vereda El Cedro' then 'Madera, Café, Plátano, Yuca, Maíz'
        when 'Vereda El Ejido' then 'Fresa, Mora, Lulo, Granadilla, Curuba'
        when 'Vereda Fátima Carrizayaco' then 'Café, Cacao, Caña, Plátano, Yuca'
        when 'Vereda La Cumbre' then 'Papa, Habas, Arveja, Maíz, Cebolla'
        when 'Vereda Las Cochas' then 'Espinaca, Acelga, Brócoli, Coliflor, Apio'
        when 'Vereda Leandro Agreda' then 'Café, Cacao, Caña, Plátano, Yuca'
        when 'Vereda Llano Grande' then 'Plátano, Yuca, Ñame, Batata, Malanga'
        when 'Vereda Machindinoy' then 'Maíz, Fríjol, Calabaza, Pepino, Lechuga'
        when 'Vereda Palmas' then 'Pimentón, Repollo, Cilantro, Perejil, Tomate'
        when 'Vereda Sagrado Corazón de Jesús' then 'Fresa, Mora, Granadilla, Lulo, Curuba'
        when 'Vereda San Félix Sinsayaco' then 'Tomate, Cebolla, Lechuga, Maíz, Yuca'
        when 'Vereda San José la Hidráulica' then 'Zanahoria, Papa, Fríjol, Arveja, Habas'
        when 'Vereda Tamabioy' then 'Caña, Plátano, Yuca, Cacao, Café'
        when 'Vereda Villaflor' then 'Zanahoria, Papa, Fríjol, Arveja, Habas'
      end,
      (date '2025-03-21' - (60 + (idx - 1) * 3)),
      (date '2025-03-21' - (5 + ((idx - 1) % 30))),
      1 + ((idx - 1) % 6),
      (tipos_persona[1 + ((idx - 1) % 3)])::tipo_persona,
      observaciones[1 + ((idx - 1) % 10)],
      lat_final,
      lng_final
    ) returning id into asociada_id;

    num_v := 1 + ((idx - 1) % 6);
    for v_idx in 0..(num_v - 1) loop
      v_fecha := (date '2025-03-21' - (v_idx * 20));
      v_prox := v_fecha + 30 + ((idx - 1) % 5) * 7;
      v_tipo := tipos_visita[1 + (v_idx % 3)];
      v_obs := observaciones[1 + ((idx - 1 + v_idx) % 10)];

      insert into visitas (asociada_id, fecha, tipo, observaciones, proxima_visita)
      values (
        asociada_id,
        v_fecha,
        v_tipo::tipo_visita,
        v_obs,
        case when v_prox > current_date then v_prox else null end
      );
    end loop;
  end loop;
end $$;
