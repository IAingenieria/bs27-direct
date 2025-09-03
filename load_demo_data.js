// Script para cargar datos de demostración en Supabase
// Ejecutar con: node load_demo_data.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración de Supabase
const supabaseUrl = 'https://bfxrifelomxmfasymnla.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeHJpZmVsb214bWZhc3ltbmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNTgsImV4cCI6MjA3MDMzOTA1OH0.yTJcFwx_71qPNuP_nLYvlAEESqt81fTj08CXIP2IzTY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function loadDemoData() {
  console.log('🚀 Cargando datos de demostración...')

  try {
    // 1. Clientes
    console.log('📋 Insertando clientes...')
    const { error: clientesError } = await supabase
      .from('clientes')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'Juan Carlos Pérez',
          telefono: '+52 81 1234-5678',
          email: 'juan.perez@email.com',
          tipo_cliente: 'individual',
          fecha_registro: '2024-01-15T16:30:00.000Z',
          ultimo_contacto: '2024-08-15T20:20:00.000Z',
          proximo_seguimiento: '2024-08-25T15:00:00.000Z',
          notas: 'Cliente frecuente, siempre puntual con pagos'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nombre: 'Transportes del Norte SA',
          telefono: '+52 81 8765-4321',
          email: 'contacto@transportesnorte.com',
          tipo_cliente: 'flotilla',
          fecha_registro: '2024-02-20T14:45:00.000Z',
          ultimo_contacto: '2024-08-18T22:30:00.000Z',
          proximo_seguimiento: '2024-08-28T17:00:00.000Z',
          notas: 'Empresa con 15 vehículos, requiere descuentos por volumen'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          nombre: 'María Elena Rodríguez',
          telefono: '+52 81 5555-1234',
          email: 'maria.rodriguez@gmail.com',
          tipo_cliente: 'individual',
          fecha_registro: '2024-03-10T21:20:00.000Z',
          ultimo_contacto: '2024-08-10T16:15:00.000Z',
          proximo_seguimiento: '2024-08-22T20:00:00.000Z',
          notas: 'Vehículo de lujo, muy exigente con la calidad'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          nombre: 'AutoPartes Revendedora',
          telefono: '+52 81 9999-8888',
          email: 'ventas@autopartes.mx',
          tipo_cliente: 'revendedor',
          fecha_registro: '2024-04-05T18:00:00.000Z',
          ultimo_contacto: '2024-08-19T15:45:00.000Z',
          proximo_seguimiento: '2024-08-26T22:30:00.000Z',
          notas: 'Revendedor autorizado, maneja precios especiales'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          nombre: 'Roberto Silva González',
          telefono: '+52 81 7777-6666',
          email: 'roberto.silva@hotmail.com',
          tipo_cliente: 'individual',
          fecha_registro: '2024-05-12T23:30:00.000Z',
          ultimo_contacto: '2024-08-16T19:20:00.000Z',
          proximo_seguimiento: '2024-08-24T16:30:00.000Z',
          notas: 'Cliente nuevo, muy interesado en servicios preventivos'
        }
      ])

    if (clientesError) throw clientesError
    console.log('✅ Clientes insertados correctamente')

    // 2. Cotizaciones
    console.log('💰 Insertando cotizaciones...')
    const { error: cotizacionesError } = await supabase
      .from('cotizaciones')
      .insert([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          cliente_id: '550e8400-e29b-41d4-a716-446655440001',
          vehiculo: 'Honda Civic 2020',
          problema: 'Ruido en frenos',
          descripcion_trabajo: 'Cambio de balatas delanteras y traseras, rectificado de discos',
          status: 'aceptada',
          precio: 4500.00,
          fecha_creacion: '2024-08-10T15:00:00.000Z',
          fecha_envio: '2024-08-10T20:30:00.000Z',
          fecha_vencimiento: '2024-08-18T05:59:59.000Z',
          tipo_cliente: 'individual',
          notas: 'Cliente aceptó cotización inmediatamente'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          cliente_id: '550e8400-e29b-41d4-a716-446655440002',
          vehiculo: 'Freightliner Cascadia',
          problema: 'Falla en transmisión',
          descripcion_trabajo: 'Reparación de caja de velocidades, cambio de clutch',
          status: 'en_proceso',
          precio: 25000.00,
          fecha_creacion: '2024-08-15T17:20:00.000Z',
          fecha_envio: '2024-08-15T22:45:00.000Z',
          fecha_vencimiento: '2024-08-23T05:59:59.000Z',
          tipo_cliente: 'flotilla',
          notas: 'Esperando aprobación de gerencia'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440003',
          cliente_id: '550e8400-e29b-41d4-a716-446655440003',
          vehiculo: 'BMW X5 2022',
          problema: 'Sistema eléctrico',
          descripcion_trabajo: 'Diagnóstico y reparación de sistema eléctrico completo',
          status: 'enviada',
          precio: 8500.00,
          fecha_creacion: '2024-08-18T20:15:00.000Z',
          fecha_envio: '2024-08-18T23:20:00.000Z',
          fecha_vencimiento: '2024-08-26T05:59:59.000Z',
          tipo_cliente: 'individual',
          notas: 'Cotización detallada enviada por email'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440004',
          cliente_id: '550e8400-e29b-41d4-a716-446655440004',
          vehiculo: 'Toyota Corolla 2019',
          problema: 'Mantenimiento preventivo',
          descripcion_trabajo: 'Cambio de aceite, filtros, revisión general',
          status: 'aceptada',
          precio: 1200.00,
          fecha_creacion: '2024-08-12T16:30:00.000Z',
          fecha_envio: '2024-08-12T18:00:00.000Z',
          fecha_vencimiento: '2024-08-20T05:59:59.000Z',
          tipo_cliente: 'revendedor',
          notas: 'Precio especial por ser revendedor'
        }
      ])

    if (cotizacionesError) throw cotizacionesError
    console.log('✅ Cotizaciones insertadas correctamente')

    // 3. Vehículos
    console.log('🚗 Insertando vehículos...')
    const { error: vehiculosError } = await supabase
      .from('vehiculos')
      .insert([
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          cliente_id: '550e8400-e29b-41d4-a716-446655440001',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440001',
          vehiculo: 'Honda Civic 2020',
          status: 'en_proceso',
          fecha_recibo: '2024-08-11T14:00:00.000Z',
          notas: 'Esperando llegada de balatas importadas'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          cliente_id: '550e8400-e29b-41d4-a716-446655440003',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440003',
          vehiculo: 'BMW X5 2022',
          status: 'recibido',
          fecha_recibo: '2024-08-19T15:30:00.000Z',
          notas: 'Vehículo recién ingresado, pendiente diagnóstico'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440003',
          cliente_id: '550e8400-e29b-41d4-a716-446655440004',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440004',
          vehiculo: 'Toyota Corolla 2019',
          status: 'listo_entrega',
          fecha_recibo: '2024-08-13T13:45:00.000Z',
          notas: 'Servicio completado, esperando al cliente'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440004',
          cliente_id: '550e8400-e29b-41d4-a716-446655440002',
          vehiculo: 'Kenworth T680',
          status: 'en_proceso',
          fecha_recibo: '2024-08-05T20:20:00.000Z',
          notas: 'Reparación mayor de motor, 15 días de estadía'
        }
      ])

    if (vehiculosError) throw vehiculosError
    console.log('✅ Vehículos insertados correctamente')

    // 4. Pagos
    console.log('💳 Insertando pagos...')
    const { error: pagosError } = await supabase
      .from('pagos')
      .insert([
        {
          id: '880e8400-e29b-41d4-a716-446655440001',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440001',
          vehiculo_id: '770e8400-e29b-41d4-a716-446655440001',
          monto_total: 4500.00,
          monto_pagado: 4500.00,
          fecha_vencimiento: '2024-08-26T05:59:59.000Z',
          metodo_pago: 'Efectivo',
          notas: 'Pago completo al recibir vehículo'
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440002',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440004',
          vehiculo_id: '770e8400-e29b-41d4-a716-446655440003',
          monto_total: 1200.00,
          monto_pagado: 600.00,
          fecha_vencimiento: '2024-08-27T05:59:59.000Z',
          metodo_pago: 'Transferencia',
          notas: 'Pago parcial, saldo pendiente'
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440003',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440002',
          vehiculo_id: '770e8400-e29b-41d4-a716-446655440004',
          monto_total: 25000.00,
          monto_pagado: 0.00,
          fecha_vencimiento: '2024-08-16T05:59:59.000Z',
          notas: 'Pago vencido hace 5 días'
        }
      ])

    if (pagosError) throw pagosError
    console.log('✅ Pagos insertados correctamente')

    // 5. Notificaciones
    console.log('🔔 Insertando notificaciones...')
    const { error: notificacionesError } = await supabase
      .from('notificaciones')
      .insert([
        {
          id: '990e8400-e29b-41d4-a716-446655440001',
          tipo: 'whatsapp',
          mensaje: 'Su vehículo Toyota Corolla está listo para entrega',
          cliente_id: '550e8400-e29b-41d4-a716-446655440004',
          vehiculo_id: '770e8400-e29b-41d4-a716-446655440003',
          urgente: false,
          fecha_creacion: '2024-08-20T20:30:00.000Z',
          fecha_programada: '2024-08-21T15:00:00.000Z',
          ejecutada: false
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440002',
          tipo: 'pago',
          mensaje: 'Recordatorio: Pago vencido de $25,000 - Freightliner Cascadia',
          cliente_id: '550e8400-e29b-41d4-a716-446655440002',
          cotizacion_id: '660e8400-e29b-41d4-a716-446655440002',
          urgente: true,
          fecha_creacion: '2024-08-21T14:00:00.000Z',
          fecha_programada: '2024-08-21T16:00:00.000Z',
          ejecutada: false
        },
        {
          id: '990e8400-e29b-41d4-a716-446655440003',
          tipo: 'estadia',
          mensaje: 'Vehículo con estadía prolongada (15 días) - Costo adicional: $3,600',
          cliente_id: '550e8400-e29b-41d4-a716-446655440002',
          vehiculo_id: '770e8400-e29b-41d4-a716-446655440004',
          urgente: true,
          fecha_creacion: '2024-08-20T22:45:00.000Z',
          fecha_programada: '2024-08-21T14:30:00.000Z',
          ejecutada: false
        }
      ])

    if (notificacionesError) throw notificacionesError
    console.log('✅ Notificaciones insertadas correctamente')

    // 6. Contactos
    console.log('📞 Insertando contactos...')
    const { error: contactosError } = await supabase
      .from('contactos')
      .insert([
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440001',
          cliente_id: '550e8400-e29b-41d4-a716-446655440001',
          tipo: 'llamada',
          fecha: '2024-08-15T20:20:00.000Z',
          duracion: 8,
          notas: 'Cliente satisfecho con el servicio, programó próximo mantenimiento',
          exitoso: true,
          proximo_seguimiento: '2024-08-25T15:00:00.000Z'
        },
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440002',
          cliente_id: '550e8400-e29b-41d4-a716-446655440002',
          tipo: 'email',
          fecha: '2024-08-18T22:30:00.000Z',
          notas: 'Enviado recordatorio de pago vencido',
          exitoso: true,
          proximo_seguimiento: '2024-08-22T16:00:00.000Z'
        },
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440003',
          cliente_id: '550e8400-e29b-41d4-a716-446655440003',
          tipo: 'whatsapp',
          fecha: '2024-08-10T16:15:00.000Z',
          duracion: 5,
          notas: 'Consulta sobre garantía del trabajo anterior',
          exitoso: true,
          proximo_seguimiento: '2024-08-22T20:00:00.000Z'
        }
      ])

    if (contactosError) throw contactosError
    console.log('✅ Contactos insertados correctamente')

    console.log('\n🎉 ¡Datos de demostración cargados exitosamente!')
    console.log('\n📊 Resumen de datos insertados:')
    console.log('• 5 Clientes (Individual, Flotilla, Revendedor)')
    console.log('• 4 Cotizaciones (Diferentes estados)')
    console.log('• 4 Vehículos en proceso')
    console.log('• 3 Registros de pagos')
    console.log('• 3 Notificaciones pendientes')
    console.log('• 3 Contactos en historial')

  } catch (error) {
    console.error('❌ Error cargando datos:', error.message)
    process.exit(1)
  }
}

loadDemoData()
