import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Términos de Servicio | Togo",
};

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "en") {
    return <TermsEn locale={locale} />;
  }

  return <TermsEs locale={locale} />;
}

function TermsEs({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Términos de Servicio" lastUpdated="Última actualización: 21 de julio de 2026">
      <LegalSection heading="1. Aceptación de los términos">
        <p>
          Al crear una cuenta o usar ToGo (el &quot;Servicio&quot;), usted acepta estos Términos de
          Servicio. Si no está de acuerdo, no debe usar el Servicio. ToGo es operado por Jhonathan Calvo,
          con domicilio en Colombia.
        </p>
      </LegalSection>

      <LegalSection heading="2. Descripción del servicio">
        <p>
          ToGo es una plataforma SaaS que permite a negocios (restaurantes, tiendas, farmacias y otros
          giros) gestionar su catálogo, recibir y procesar pedidos, y automatizar la comunicación con sus
          clientes a través de WhatsApp, usando la Plataforma de WhatsApp Business de Meta conectada por el
          propio negocio.
        </p>
      </LegalSection>

      <LegalSection heading="3. Cuentas y elegibilidad">
        <p>
          Para usar ToGo debe ser mayor de edad y tener capacidad legal para contratar en nombre del
          negocio que registra. Usted es responsable de mantener la confidencialidad de sus credenciales de
          acceso y de toda actividad que ocurra bajo su cuenta. Debe proporcionar información veraz y
          mantenerla actualizada.
        </p>
      </LegalSection>

      <LegalSection heading="4. Planes, límites y pagos">
        <p>
          ToGo ofrece distintos planes con límites de funcionalidades (por ejemplo, número de sedes o
          usuarios). Los precios y condiciones de cada plan se muestran dentro del panel de administración
          o se comunican directamente al negocio. Nos reservamos el derecho de actualizar los planes
          disponibles, notificando los cambios con antelación razonable.
        </p>
      </LegalSection>

      <LegalSection heading="5. Uso de WhatsApp Business Platform">
        <p>
          Al conectar su cuenta de WhatsApp Business (WABA) a ToGo, el negocio declara que cuenta con la
          autorización necesaria para operar dicha cuenta y se compromete a cumplir la Política Comercial de
          WhatsApp y las Condiciones de la Plataforma de Meta, incluyendo (sin limitarse a):
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>No enviar mensajes no solicitados (spam) ni contenido prohibido por Meta.</li>
          <li>Respetar la ventana de 24 horas para mensajes de conversación y usar plantillas aprobadas para mensajes iniciados por la empresa fuera de esa ventana.</li>
          <li>Obtener el consentimiento adecuado de sus propios clientes antes de contactarlos por WhatsApp.</li>
        </ul>
        <p>
          ToGo puede suspender la conexión de WhatsApp de un negocio si detecta un incumplimiento de estas
          reglas o si Meta así lo requiere.
        </p>
      </LegalSection>

      <LegalSection heading="6. Responsabilidades del negocio">
        <p>
          El negocio es responsable de la veracidad de la información de su catálogo, precios, políticas de
          entrega y devoluciones, así como de la atención a sus clientes finales y del cumplimiento de las
          leyes de protección al consumidor y protección de datos aplicables a su operación.
        </p>
      </LegalSection>

      <LegalSection heading="7. Uso aceptable">
        <p>Usted se compromete a no usar el Servicio para:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Actividades ilegales o fraudulentas.</li>
          <li>Enviar contenido difamatorio, engañoso o que infrinja derechos de terceros.</li>
          <li>Intentar acceder sin autorización a sistemas de ToGo o de otros usuarios.</li>
          <li>Interferir con el funcionamiento normal de la plataforma (por ejemplo, mediante ataques o sobrecarga deliberada).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="8. Propiedad intelectual">
        <p>
          ToGo y su tecnología, marca y diseño son propiedad de Jhonathan Calvo. El negocio conserva todos
          los derechos sobre su propio contenido (catálogo, imágenes, marca) que carga en la plataforma, y
          otorga a ToGo una licencia limitada para almacenarlo y mostrarlo únicamente con el fin de prestar
          el Servicio.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disponibilidad del servicio">
        <p>
          Procuramos que el Servicio esté disponible de forma continua, pero no garantizamos que sea
          ininterrumpido o libre de errores. Podemos realizar mantenimientos programados o de emergencia
          que afecten temporalmente la disponibilidad.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitación de responsabilidad">
        <p>
          En la medida permitida por la ley, ToGo no será responsable por daños indirectos, incidentales o
          consecuentes derivados del uso del Servicio, incluyendo pérdida de ventas o de datos, salvo en
          casos de dolo o culpa grave.
        </p>
      </LegalSection>

      <LegalSection heading="11. Terminación">
        <p>
          Usted puede dejar de usar el Servicio y solicitar el cierre de su cuenta en cualquier momento.
          ToGo puede suspender o cancelar cuentas que incumplan estos Términos o las políticas de Meta,
          previa notificación cuando sea razonablemente posible.
        </p>
      </LegalSection>

      <LegalSection heading="12. Modificaciones">
        <p>
          Podemos actualizar estos Términos ocasionalmente. Los cambios entrarán en vigor al publicarse en
          esta página con una nueva fecha de actualización.
        </p>
      </LegalSection>

      <LegalSection heading="13. Ley aplicable">
        <p>
          Estos Términos se rigen por las leyes de Colombia. Cualquier controversia se someterá a los
          jueces competentes de Colombia, salvo que la ley disponga algo distinto.
        </p>
      </LegalSection>

      <LegalSection heading="14. Contacto">
        <p>
          Para preguntas sobre estos Términos, escríbanos a{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

function TermsEn({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Terms of Service" lastUpdated="Last updated: July 21, 2026">
      <LegalSection heading="1. Acceptance of terms">
        <p>
          By creating an account or using ToGo (the &quot;Service&quot;), you agree to these Terms of
          Service. ToGo is operated by Jhonathan Calvo, based in Colombia.
        </p>
      </LegalSection>

      <LegalSection heading="2. Service description">
        <p>
          ToGo is a SaaS platform that lets businesses (restaurants, stores, pharmacies and others) manage
          their catalog, receive and process orders, and automate customer communication over WhatsApp,
          using Meta&apos;s WhatsApp Business Platform connected by the business itself.
        </p>
      </LegalSection>

      <LegalSection heading="3. Accounts and eligibility">
        <p>
          You must be of legal age and have authority to contract on behalf of the business you register.
          You are responsible for keeping your credentials confidential and for all activity under your
          account, and for providing accurate, up-to-date information.
        </p>
      </LegalSection>

      <LegalSection heading="4. Plans and payments">
        <p>
          ToGo offers different plans with feature limits (e.g. number of locations or users). Pricing and
          terms for each plan are shown in the admin panel or communicated directly to the business. We may
          update available plans, notifying changes with reasonable advance notice.
        </p>
      </LegalSection>

      <LegalSection heading="5. Use of the WhatsApp Business Platform">
        <p>
          By connecting a WhatsApp Business Account (WABA) to ToGo, the business represents it has the
          necessary authorization to operate that account and agrees to comply with WhatsApp&apos;s
          Business Policy and Meta&apos;s Platform Terms, including not sending unsolicited messages,
          respecting the 24-hour messaging window and using approved templates for business-initiated
          messages outside of it, and obtaining proper consent from its own customers.
        </p>
      </LegalSection>

      <LegalSection heading="6. Business responsibilities">
        <p>
          The business is responsible for the accuracy of its catalog, pricing, delivery and return
          policies, for its own customer service, and for complying with applicable consumer-protection and
          data-protection laws.
        </p>
      </LegalSection>

      <LegalSection heading="7. Acceptable use">
        <p>You agree not to use the Service for illegal or fraudulent activity, to infringe third-party rights, to attempt unauthorized access to ToGo or other users&apos; systems, or to interfere with the platform&apos;s normal operation.</p>
      </LegalSection>

      <LegalSection heading="8. Intellectual property">
        <p>
          ToGo and its technology, brand and design are owned by Jhonathan Calvo. The business retains all
          rights to its own content (catalog, images, brand) uploaded to the platform, and grants ToGo a
          limited license to store and display it solely to provide the Service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Service availability">
        <p>We aim for continuous availability but do not guarantee uninterrupted or error-free service, and may perform scheduled or emergency maintenance.</p>
      </LegalSection>

      <LegalSection heading="10. Limitation of liability">
        <p>To the extent permitted by law, ToGo is not liable for indirect, incidental or consequential damages arising from use of the Service, except in cases of willful misconduct or gross negligence.</p>
      </LegalSection>

      <LegalSection heading="11. Termination">
        <p>You may stop using the Service and request account closure at any time. ToGo may suspend or cancel accounts that breach these Terms or Meta&apos;s policies, with notice when reasonably possible.</p>
      </LegalSection>

      <LegalSection heading="12. Changes">
        <p>We may update these Terms from time to time. Changes take effect when posted on this page with a new update date.</p>
      </LegalSection>

      <LegalSection heading="13. Governing law">
        <p>These Terms are governed by the laws of Colombia, and disputes will be subject to the competent courts of Colombia unless the law provides otherwise.</p>
      </LegalSection>

      <LegalSection heading="14. Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
