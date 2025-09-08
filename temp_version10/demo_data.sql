-- Datos de demostración para BS27 Direct
-- Este script crea datos falsos para todas las funcionalidades del sistema

-- Insertar clientes de demostración
INSERT INTO public.clientes (id, nombre, telefono, email, tipo_cliente, fecha_registro, ultimo_contacto, proximo_seguimiento, notas) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Juan Carlos Pérez', '+52 81 1234-5678', 'juan.perez@email.com', 'individual', '2024-01-15 10:30:00-06', '2024-08-15 14:20:00-06', '2024-08-25 09:00:00-06', 'Cliente frecuente, siempre puntual con pagos'),
('550e8400-e29b-41d4-a716-446655440002', 'Transportes del Norte SA', '+52 81 8765-4321', 'contacto@transportesnorte.com', 'flotilla', '2024-02-20 08:45:00-06', '2024-08-18 16:30:00-06', '2024-08-28 11:00:00-06', 'Empresa con 15 vehículos, requiere descuentos por volumen'),
('550e8400-e29b-41d4-a716-446655440003', 'María Elena Rodríguez', '+52 81 5555-1234', 'maria.rodriguez@gmail.com', 'individual', '2024-03-10 15:20:00-06', '2024-08-10 10:15:00-06', '2024-08-22 14:00:00-06', 'Vehículo de lujo, muy exigente con la calidad'),
('550e8400-e29b-41d4-a716-446655440004', 'AutoPartes Revendedora', '+52 81 9999-8888', 'ventas@autopartes.mx', 'revendedor', '2024-04-05 12:00:00-06', '2024-08-19 09:45:00-06', '2024-08-26 16:30:00-06', 'Revendedor autorizado, maneja precios especiales'),
('550e8400-e29b-41d4-a716-446655440005', 'Roberto Silva González', '+52 81 7777-6666', 'roberto.silva@hotmail.com', 'individual', '2024-05-12 17:30:00-06', '2024-08-16 13:20:00-06', '2024-08-24 10:30:00-06', 'Cliente nuevo, muy interesado en servicios preventivos');

-- Insertar cotizaciones de demostración
INSERT INTO public.cotizaciones (id, cliente_id, vehiculo, problema, descripcion_trabajo, status, precio, fecha_creacion, fecha_envio, fecha_vencimiento, tipo_cliente, notas) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Honda Civic 2020', 'Ruido en frenos', 'Cambio de balatas delanteras y traseras, rectificado de discos', 'aceptada', 4500.00, '2024-08-10 09:00:00-06', '2024-08-10 14:30:00-06', '2024-08-17 23:59:59-06', 'individual', 'Cliente aceptó cotización inmediatamente'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Freightliner Cascadia', 'Falla en transmisión', 'Reparación de caja de velocidades, cambio de clutch', 'en_proceso', 25000.00, '2024-08-15 11:20:00-06', '2024-08-15 16:45:00-06', '2024-08-22 23:59:59-06', 'flotilla', 'Esperando aprobación de gerencia'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'BMW X5 2022', 'Sistema eléctrico', 'Diagnóstico y reparación de sistema eléctrico completo', 'enviada', 8500.00, '2024-08-18 14:15:00-06', '2024-08-18 17:20:00-06', '2024-08-25 23:59:59-06', 'individual', 'Cotización detallada enviada por email'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Toyota Corolla 2019', 'Mantenimiento preventivo', 'Cambio de aceite, filtros, revisión general', 'aceptada', 1200.00, '2024-08-12 10:30:00-06', '2024-08-12 12:00:00-06', '2024-08-19 23:59:59-06', 'revendedor', 'Precio especial por ser revendedor'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Nissan Sentra 2021', 'Aire acondicionado', 'Recarga de gas refrigerante y limpieza de sistema', 'rechazada', 2800.00, '2024-08-16 13:45:00-06', '2024-08-16 15:30:00-06', '2024-08-23 23:59:59-06', 'individual', 'Cliente consideró precio muy alto'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Honda Civic 2020', 'Cambio de llantas', 'Juego completo de llantas nuevas', 'pendiente', 6000.00, '2024-08-19 16:20:00-06', NULL, '2024-08-26 23:59:59-06', 'individual', 'Cotización en preparación'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Volvo VNL', 'Motor sobrecalentado', 'Reparación de sistema de enfriamiento, cambio de radiador', 'enviada', 18500.00, '2024-08-17 08:30:00-06', '2024-08-17 11:45:00-06', '2024-08-24 23:59:59-06', 'flotilla', 'Cotización urgente solicitada');

-- Insertar vehículos en proceso
INSERT INTO public.vehiculos (id, cliente_id, cotizacion_id, vehiculo, status, fecha_recibo, fecha_entrega, notas) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Honda Civic 2020', 'en_proceso', '2024-08-11 08:00:00-06', NULL, 'Esperando llegada de balatas importadas'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'BMW X5 2022', 'recibido', '2024-08-19 09:30:00-06', NULL, 'Vehículo recién ingresado, pendiente diagnóstico'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Toyota Corolla 2019', 'listo_entrega', '2024-08-13 07:45:00-06', NULL, 'Servicio completado, esperando al cliente'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Kenworth T680', 'en_proceso', '2024-08-05 14:20:00-06', NULL, 'Reparación mayor de motor, 15 días de estadía'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', NULL, 'Nissan Sentra 2021', 'recibido', '2024-08-20 10:15:00-06', NULL, 'Cliente decidió no proceder, vehículo listo para entrega'),
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Honda Accord 2018', 'entregado', '2024-07-28 11:00:00-06', '2024-08-02 16:30:00-06', 'Trabajo completado satisfactoriamente'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', NULL, 'BMW Serie 3 2020', 'listo_entrega', '2024-08-14 13:20:00-06', NULL, 'Reparación eléctrica completada'),
('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Peterbilt 579', 'en_proceso', '2024-08-08 09:45:00-06', NULL, 'Mantenimiento mayor de flotilla');

-- Insertar pagos
INSERT INTO public.pagos (id, cotizacion_id, vehiculo_id, monto_total, monto_pagado, fecha_vencimiento, metodo_pago, notas) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 4500.00, 4500.00, '2024-08-25 23:59:59-06', 'Efectivo', 'Pago completo al recibir vehículo'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003', 1200.00, 600.00, '2024-08-26 23:59:59-06', 'Transferencia', 'Pago parcial, saldo pendiente'),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 25000.00, 0.00, '2024-08-15 23:59:59-06', NULL, 'Pago vencido hace 6 días'),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440008', 18500.00, 9250.00, '2024-08-30 23:59:59-06', 'Cheque', 'Anticipo del 50%, saldo contra entrega'),
('880e8400-e29b-41d4-a716-446655440005', NULL, '770e8400-e29b-41d4-a716-446655440007', 3500.00, 0.00, '2024-08-20 23:59:59-06', NULL, 'Pago por estadía prolongada - VENCIDO');

-- Insertar notificaciones
INSERT INTO public.notificaciones (id, tipo, mensaje, cliente_id, cotizacion_id, vehiculo_id, urgente, fecha_creacion, fecha_programada, ejecutada) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'whatsapp', 'Su vehículo Honda Civic está listo para entrega', '550e8400-e29b-41d4-a716-446655440001', NULL, '770e8400-e29b-41d4-a716-446655440003', false, '2024-08-20 14:30:00-06', '2024-08-21 09:00:00-06', false),
('990e8400-e29b-41d4-a716-446655440002', 'pago', 'Recordatorio: Pago vencido de $25,000 - Freightliner Cascadia', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', NULL, true, '2024-08-21 08:00:00-06', '2024-08-21 10:00:00-06', false),
('990e8400-e29b-41d4-a716-446655440003', 'estadia', 'Vehículo con estadía prolongada (15 días) - Costo adicional: $3,600', '550e8400-e29b-41d4-a716-446655440002', NULL, '770e8400-e29b-41d4-a716-446655440004', true, '2024-08-20 16:45:00-06', '2024-08-21 08:30:00-06', false),
('990e8400-e29b-41d4-a716-446655440004', 'seguimiento', 'Seguimiento programado con cliente María Elena', '550e8400-e29b-41d4-a716-446655440003', NULL, NULL, false, '2024-08-19 12:20:00-06', '2024-08-22 14:00:00-06', false),
('990e8400-e29b-41d4-a716-446655440005', 'whatsapp', 'Cotización enviada para BMW X5 - Esperando respuesta', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', NULL, false, '2024-08-18 17:25:00-06', '2024-08-19 09:00:00-06', true),
('990e8400-e29b-41d4-a716-446655440006', 'pago', 'Recordatorio: Saldo pendiente de $600 - Toyota Corolla', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', NULL, false, '2024-08-20 11:15:00-06', '2024-08-21 11:00:00-06', false);

-- Insertar historial de contactos
INSERT INTO public.contactos (id, cliente_id, tipo, fecha, duracion, notas, exitoso, proximo_seguimiento) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'llamada', '2024-08-15 14:20:00-06', 8, 'Cliente satisfecho con el servicio, programó próximo mantenimiento', true, '2024-08-25 09:00:00-06'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'email', '2024-08-18 16:30:00-06', NULL, 'Enviado recordatorio de pago vencido', true, '2024-08-22 10:00:00-06'),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'whatsapp', '2024-08-10 10:15:00-06', 5, 'Consulta sobre garantía del trabajo anterior', true, '2024-08-22 14:00:00-06'),
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'presencial', '2024-08-19 09:45:00-06', 15, 'Visita para revisar precios especiales de revendedor', true, '2024-08-26 16:30:00-06'),
('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'llamada', '2024-08-16 13:20:00-06', 3, 'No contestó, dejé mensaje de voz', false, '2024-08-24 10:30:00-06'),
('aa0e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'whatsapp', '2024-08-12 11:30:00-06', 2, 'Confirmación de cita para entrega de vehículo', true, NULL),
('aa0e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'llamada', '2024-08-17 15:45:00-06', 12, 'Explicación detallada de reparación de transmisión', true, '2024-08-28 11:00:00-06');

-- Actualizar estadísticas de clientes (esto se hace automáticamente con los triggers, pero lo incluimos para asegurar)
UPDATE public.clientes SET 
    valor_total = (SELECT COALESCE(SUM(precio), 0) FROM public.cotizaciones WHERE cliente_id = clientes.id AND status = 'aceptada'),
    trabajos_realizados = (SELECT COUNT(*) FROM public.cotizaciones WHERE cliente_id = clientes.id AND status = 'aceptada');
