import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-16" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="text-sm mb-8 block" style={{ color: 'var(--muted-foreground)' }}>
          ← Inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de privacidad</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>
          Última actualización: abril 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>1. Qué datos recolectamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong style={{ color: 'var(--foreground)' }}>Cuenta:</strong> email y contraseña (hasheada por Supabase).</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Perfil del corredor:</strong> peso, nivel de sudoración.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Carreras:</strong> nombre, distancia, fecha, ciudad, tiempo objetivo, desnivel.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Tiempos de referencia:</strong> distancia, tiempo, fecha y frecuencia cardíaca opcional.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Productos de nutrición:</strong> geles, sales y otros productos que cargues.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Pago:</strong> Stripe gestiona los datos de tarjeta. Nosotros solo almacenamos el ID de cliente y suscripción de Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>2. Cómo usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para generar tu plan de carrera personalizado.</li>
              <li>Para enviarte recordatorios de carrera por email (podés desactivarlos).</li>
              <li>Para gestionar tu suscripción vía Stripe.</li>
              <li>Para mejorar el servicio (métricas anonimizadas).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>3. Con quién compartimos tus datos</h2>
            <p className="mb-2">No vendemos ni alquilamos tus datos. Solo los compartimos con:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong style={{ color: 'var(--foreground)' }}>Supabase</strong> — base de datos y autenticación.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Stripe</strong> — procesamiento de pagos.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Resend</strong> — envío de emails transaccionales.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Open-Meteo</strong> — pronóstico del clima (solo enviamos la ciudad, sin datos personales).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>4. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta,
              borramos todos tus datos dentro de los 30 días siguientes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>5. Tus derechos</h2>
            <p>
              Podés solicitar acceso, corrección o eliminación de tus datos en cualquier momento
              escribiéndonos a{' '}
              <a href="mailto:hola@racecopilot.app" style={{ color: '#f97316' }}>hola@racecopilot.app</a>.
              Respondemos en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>6. Cookies</h2>
            <p>
              Usamos cookies de sesión para mantenerte autenticado (gestionadas por Supabase Auth).
              No usamos cookies de terceros ni de rastreo publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>7. Seguridad</h2>
            <p>
              Tus datos se almacenan en servidores de Supabase con cifrado en reposo y en tránsito (HTTPS/TLS).
              Las contraseñas nunca se almacenan en texto plano.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>8. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad contactanos en{' '}
              <a href="mailto:hola@racecopilot.app" style={{ color: '#f97316' }}>hola@racecopilot.app</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
