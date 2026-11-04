import { useState } from 'react';
import PageHeader from '../components/PageHeader';

const TABS = [
  { id: 'terms', label: 'Términos y condiciones' },
  { id: 'privacy', label: 'Protección de datos' },
] as const;

export default function Legal() {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="space-y-5">
      <PageHeader title="Legal" backTo="/" />

      <div className="seg" role="tablist" aria-label="Documentos legales">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'active' : ''}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'terms' ? <Terms /> : <Privacy />}
    </div>
  );
}

function Terms() {
  return (
    <article className="card space-y-4 text-sm leading-relaxed text-zinc-300">
      <h2 className="text-base font-semibold text-zinc-100">Términos y condiciones de uso de Crewzy</h2>
      <p className="text-xs text-zinc-500">Última actualización: 4 de noviembre de 2026</p>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">1. Objeto</h3>
        <p>
          Crewzy es una aplicación web (PWA) para organizar planes, gastos compartidos, apuestas y
          campeonatos entre grupos de amigos. El uso de la app implica la aceptación de estos términos.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">2. Créditos de juego</h3>
        <p>
          Los créditos ("Crewzys") son una moneda virtual de juego, sin valor monetario real. Crewzy no
          gestiona dinero real ni actúa como casa de apuestas. Cualquier acuerdo económico entre usuarios
          es ajeno a la app y responsabilidad exclusiva de los participantes. El usuario que crea una apuesta
          o un grupo recibe créditos de recompensa por su actividad.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">3. Uso permitido</h3>
        <p>
          Debes tener al menos 18 años. No puedes usar la app para actividades ilegales, acoso, fraude o
          cualquier conducta que vulnere la ley o los derechos de terceros. El administrador del grupo puede
          eliminar miembros y el grupo completo.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">4. Privacidad de las apuestas</h3>
        <p>
          Las apuestas que tienen como objetivo a un usuario no son visibles para ese usuario, por diseño.
          El resto de miembros del grupo puede verlas.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">5. Cuenta y seguridad</h3>
        <p>
          Eres responsable de mantener la confidencialidad de tu contraseña. Puedes cerrar sesión en todos
          tus dispositivos desde Ajustes. Crewzy puede suspender cuentas que incumplan estos términos.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">6. Disponibilidad</h3>
        <p>
          La app se ofrece "tal cual". Podemos modificar, suspender o interrumpir funcionalidades sin previo
          aviso. No garantizamos disponibilidad ininterrumpida.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">7. Limitación de responsabilidad</h3>
        <p>
          Crewzy no se responsabiliza de pérdidas de créditos, datos o acuerdos entre usuarios. El uso de la
          app es bajo tu propio riesgo.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">8. Cambios</h3>
        <p>
          Podemos actualizar estos términos. El uso continuado de la app tras los cambios implica su
          aceptación.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">9. Contacto</h3>
        <p>Para consultas: giocavallic@gmail.com</p>
      </section>
    </article>
  );
}

function Privacy() {
  return (
    <article className="card space-y-4 text-sm leading-relaxed text-zinc-300">
      <h2 className="text-base font-semibold text-zinc-100">Política de protección de datos (RGPD)</h2>
      <p className="text-xs text-zinc-500">Última actualización: 4 de noviembre de 2026</p>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">1. Responsable</h3>
        <p>
          El responsable del tratamiento es el titular de la app Crewzy (giocavallic@gmail.com). Los datos se
          alojan en Supabase (región UE, eu-west-1).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">2. Datos que recogemos</h3>
        <p>
          Email, nombre de perfil, foto (opcional), grupos, planes, apuestas, mensajes de chat y créditos.
          No recogemos datos de pago (no hay pagos en la app).
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">3. Finalidad</h3>
        <p>
          Prestar el servicio de la app: autenticación, sincronización entre dispositivos, comunicación en
          grupos y funcionamiento de apuestas/campeonatos.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">4. Base legal</h3>
        <p>Consentimiento del usuario al registrarse y aceptar estos términos.</p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">5. Conservación</h3>
        <p>
          Los datos se conservan mientras la cuenta esté activa. Puedes solicitar la eliminación de tu cuenta
          y datos escribiendo a giocavallic@gmail.com.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">6. Derechos</h3>
        <p>
          Tienes derecho de acceso, rectificación, supresión, limitación, portabilidad y oposición. Para
          ejercerlos, contacta con giocavallic@gmail.com.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">7. Seguridad</h3>
        <p>
          Usamos Row Level Security (RLS) en la base de datos para que cada usuario solo acceda a sus datos.
          Las contraseñas se almacenan cifradas por Supabase Auth.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-zinc-200">8. Cookies / almacenamiento local</h3>
        <p>
          Usamos almacenamiento local del navegador para la sesión y preferencias (tema, animaciones). No
          usamos cookies de terceros.
        </p>
      </section>
    </article>
  );
}
