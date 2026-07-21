import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Eliminación de Datos | Togo",
};

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "en") {
    return <DataDeletionEn locale={locale} />;
  }

  return <DataDeletionEs locale={locale} />;
}

function DataDeletionEs({ locale }: { locale: string }) {
  return (
    <LegalLayout
      locale={locale}
      title="Instrucciones de Eliminación de Datos"
      lastUpdated="Última actualización: 21 de julio de 2026"
    >
      <LegalSection heading="1. Su derecho a eliminar sus datos">
        <p>
          Usted puede solicitar en cualquier momento que eliminemos su información personal de ToGo. Las
          instrucciones dependen de si usted es un negocio (dueño/operador de una cuenta ToGo) o un cliente
          final que ha escrito por WhatsApp a un negocio que usa ToGo.
        </p>
      </LegalSection>

      <LegalSection heading="2. Si usted es dueño u operador de un negocio">
        <p>Para solicitar la eliminación de su cuenta y de los datos asociados a su negocio:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Envíe un correo a{" "}
            <a href="mailto:somos@togoapp.co?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20datos" className="text-[#6366F1] hover:underline">
              somos@togoapp.co
            </a>{" "}
            desde el correo asociado a su cuenta, con el asunto &quot;Solicitud de eliminación de datos&quot;.
          </li>
          <li>Indique el nombre del negocio y el correo o número de teléfono registrado en ToGo.</li>
          <li>
            Confirmaremos la solicitud y procederemos a eliminar la cuenta, el catálogo, los usuarios del
            equipo y el historial de pedidos y conversaciones asociados, dentro de un plazo máximo de 30
            días calendario.
          </li>
        </ol>
        <p>
          Podremos conservar cierta información (por ejemplo, registros de facturación) durante el tiempo
          adicional exigido por obligaciones legales, contables o fiscales, incluso después de eliminar la
          cuenta.
        </p>
      </LegalSection>

      <LegalSection heading="3. Si usted es un cliente final que escribió por WhatsApp">
        <p>
          Si usted le escribió por WhatsApp a un negocio que usa ToGo (por ejemplo, para hacer un pedido) y
          desea que eliminemos sus datos:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Envíe un correo a{" "}
            <a href="mailto:somos@togoapp.co?subject=Eliminaci%C3%B3n%20de%20datos%20-%20cliente%20WhatsApp" className="text-[#6366F1] hover:underline">
              somos@togoapp.co
            </a>{" "}
            indicando el número de WhatsApp desde el que escribió y el nombre del negocio con el que
            conversó.
          </li>
          <li>Verificaremos la solicitud y eliminaremos su información (mensajes, nombre de perfil, dirección y pedidos asociados) de nuestros sistemas dentro de 30 días calendario.</li>
          <li>
            También puede solicitar la eliminación directamente al negocio con el que conversó, ya que él
            es el titular de la relación con usted; nosotros procesamos los datos en su nombre.
          </li>
        </ol>
      </LegalSection>

      <LegalSection heading="4. Qué se elimina y qué se conserva">
        <p>
          Eliminaremos la información personal identificable (nombre, número de teléfono, mensajes,
          dirección, historial de pedidos) de nuestros sistemas activos. Podemos conservar información
          agregada o anonimizada (que ya no lo identifica) para fines estadísticos, así como los registros
          que la ley exija conservar por razones contables o fiscales, durante el tiempo legalmente
          requerido.
        </p>
      </LegalSection>

      <LegalSection heading="5. Tiempo de procesamiento">
        <p>
          Procesamos las solicitudes de eliminación dentro de un plazo máximo de 30 días calendario desde
          que verificamos la identidad del solicitante.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contacto">
        <p>
          Para cualquier solicitud relacionada con la eliminación de datos, escríbanos a{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

function DataDeletionEn({ locale }: { locale: string }) {
  return (
    <LegalLayout
      locale={locale}
      title="Data Deletion Instructions"
      lastUpdated="Last updated: July 21, 2026"
    >
      <LegalSection heading="1. Your right to delete your data">
        <p>
          You may request at any time that we delete your personal information from ToGo. Instructions
          depend on whether you are a business (owner/operator of a ToGo account) or an end customer who
          messaged a ToGo-powered business on WhatsApp.
        </p>
      </LegalSection>

      <LegalSection heading="2. If you are a business owner or operator">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Email{" "}
            <a href="mailto:somos@togoapp.co?subject=Data%20deletion%20request" className="text-[#6366F1] hover:underline">
              somos@togoapp.co
            </a>{" "}
            from the email address associated with your account, with subject &quot;Data deletion
            request&quot;.
          </li>
          <li>Include your business name and the email or phone number registered with ToGo.</li>
          <li>
            We will confirm the request and delete the account, catalog, team users, and associated order
            and conversation history within 30 calendar days.
          </li>
        </ol>
        <p>
          We may retain certain information (e.g. billing records) for as long as required by legal,
          accounting or tax obligations, even after the account is deleted.
        </p>
      </LegalSection>

      <LegalSection heading="3. If you are an end customer who messaged on WhatsApp">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Email{" "}
            <a href="mailto:somos@togoapp.co?subject=Data%20deletion%20-%20WhatsApp%20customer" className="text-[#6366F1] hover:underline">
              somos@togoapp.co
            </a>{" "}
            with the WhatsApp number you messaged from and the name of the business you spoke with.
          </li>
          <li>We will verify the request and delete your information (messages, profile name, address and associated orders) within 30 calendar days.</li>
          <li>You may also request deletion directly from the business you spoke with, as they own the customer relationship; we process data on their behalf.</li>
        </ol>
      </LegalSection>

      <LegalSection heading="4. What gets deleted vs. retained">
        <p>
          We delete personally identifiable information (name, phone number, messages, address, order
          history) from our active systems. We may retain aggregated or anonymized data for statistical
          purposes, and records legally required for accounting or tax purposes for as long as the law
          requires.
        </p>
      </LegalSection>

      <LegalSection heading="5. Processing time">
        <p>Deletion requests are processed within a maximum of 30 calendar days from identity verification.</p>
      </LegalSection>

      <LegalSection heading="6. Contact">
        <p>
          For any data deletion request, email{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
