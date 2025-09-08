-- Insertar datos de prueba para testing
-- Primero, insertar un cliente de prueba
INSERT INTO clientes (id, nombre, telefono, email, tipo_cliente) 
VALUES (
  'test-client-001',
  'Juan Pérez Test',
  '81-1234-5678',
  'juan.test@email.com',
  'particular'
) ON CONFLICT (id) DO NOTHING;

-- Insertar una cotización de prueba
INSERT INTO cotizaciones (
  id,
  cliente_id,
  vehiculo,
  descripcion_trabajo,
  precio,
  status,
  anticipo,
  pago1,
  liquidacion,
  created_at
) VALUES (
  'test-quote-001',
  'test-client-001',
  'Honda Civic 2020',
  'Reparación de motor y cambio de aceite',
  15000.00,
  'pendiente',
  0,
  0,
  0,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar otra cotización para probar diferentes estados
INSERT INTO cotizaciones (
  id,
  cliente_id,
  vehiculo,
  descripcion_trabajo,
  precio,
  status,
  anticipo,
  pago1,
  liquidacion,
  created_at
) VALUES (
  'test-quote-002',
  'test-client-001',
  'Toyota Corolla 2019',
  'Pintura completa y reparación de carrocería',
  25000.00,
  'en_proceso',
  5000,
  0,
  0,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insertar un vehículo de prueba
INSERT INTO vehiculos (
  id,
  folio,
  cliente_id,
  marca,
  modelo,
  status_vehiculo,
  problema_reportado,
  created_at
) VALUES (
  'test-vehicle-001',
  'VEH-001',
  'test-client-001',
  'Honda',
  'Civic',
  'recibido',
  'Motor hace ruido extraño',
  NOW()
) ON CONFLICT (id) DO NOTHING;
