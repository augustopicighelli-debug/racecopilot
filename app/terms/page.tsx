import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-16" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="text-sm mb-8 block" style={{ color: 'var(--muted-foreground)' }}>
          ← Inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Términos de uso</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>
          Última actualización: abril 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>1. Aceptación</h2>
            <p>
              Al registrarte y usar RaceCopilot aceptás estos términos. Si no estás de acuerdo, no uses el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>2. El servicio</h2>
            <p>
              RaceCopilot genera planes de hidratación, nutrición y ritmo para carreras de running.
              Los planes son recomendaciones basadas en modelos matemáticos y datos climáticos —
              no reemplazan el consejo de un profesional de la salud o un entrenador certificado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>3. Suscripción y pagos</h2>
            <p>
              RaceCopilot ofrece una prueba gratuita de 7 días. Al finalizar el período de prueba,
              se cobra automáticamente el plan seleccionado (mensual o anual) mediante Stripe.
              Podés cancelar en cualquier momento desde tu perfil. La cancelación es efectiva al
              final del período de facturación en curso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>4. Reembolsos</h2>
            <p>
              Los cargos realizados luego del período de prueba no son reembolsables, salvo que
              la ley aplicable establezca lo contrario. Si cancelás dentro de los 7 días de prueba,
              no se realizará ningún cobro.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>5. Cuenta</h2>
            <p>
              Sos responsable de mantener la seguridad de tu cuenta y contraseña. No compartás
              tus credenciales. RaceCopilot no se hace responsable por pérdidas derivadas del
              acceso no autorizado a tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>6. Uso aceptable</h2>
            <p>
              No podés usar RaceCopilot para actividades ilegales, para dañar a terceros, ni para
              intentar acceder a sistemas sin autorización. Nos reservamos el derecho de suspender
              cuentas que violen estas condiciones.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>7. Limitación de responsabilidad</h2>
            <p>
              RaceCopilot se provee "tal como está". No garantizamos que el servicio esté libre
              de errores o disponible en todo momento. En ningún caso seremos responsables por
              daños indirectos, incidentales o consecuentes derivados del uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>8. Modificaciones</h2>
            <p>
              Podemos modificar estos términos en cualquier momento. Te notificaremos por email
              ante cambios significativos. El uso continuado del servicio implica la aceptación
              de los términos actualizados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>9. Contacto</h2>
            <p>
              Para consultas sobre estos términos escribinos a{' '}
              <a href="mailto:hola@racecopilot.app" style={{ color: '#f97316' }}>hola@racecopilot.app</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
