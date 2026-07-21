import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Política de Privacidad | Togo",
};

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale === "en") {
    return <PrivacyPolicyEn locale={locale} />;
  }

  return <PrivacyPolicyEs locale={locale} />;
}

function PrivacyPolicyEs({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Política de Privacidad" lastUpdated="Última actualización: 21 de julio de 2026">
      <LegalSection heading="1. Quiénes somos">
        <p>
          ToGo (&quot;ToGo&quot;, &quot;nosotros&quot; o &quot;la Plataforma&quot;) es una plataforma de
          automatización de pedidos por WhatsApp operada por Jhonathan Calvo, con domicilio en Colombia.
          Esta Política de Privacidad describe cómo recopilamos, usamos, compartimos y protegemos la
          información cuando usted usa nuestros sitios (admin.togoapp.co, catalogo.togoapp.co) y nuestra
          API (api.togoapp.co), incluyendo las conversaciones que se gestionan a través de la Plataforma
          de WhatsApp Business de Meta.
        </p>
        <p>
          Si tiene preguntas sobre esta política, puede escribirnos a{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. A quién aplica esta política">
        <p>Esta política aplica a dos tipos de personas:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Negocios y sus equipos</strong> que crean una cuenta en ToGo para gestionar pedidos,
            catálogo y su cuenta de WhatsApp Business.
          </li>
          <li>
            <strong>Clientes finales</strong> que escriben por WhatsApp a un negocio que usa ToGo para
            hacer pedidos o consultas. ToGo procesa estos mensajes en nombre del negocio, actuando como
            proveedor de tecnología (Tech Provider) sobre la Plataforma de WhatsApp Business de Meta.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Información que recopilamos">
        <p>
          <strong>De los negocios y usuarios del panel de administración:</strong> nombre, correo
          electrónico, número de teléfono, contraseña (almacenada cifrada), nombre del negocio, sedes,
          categoría/industria, catálogo de productos, rol y permisos dentro del equipo.
        </p>
        <p>
          <strong>De los clientes finales que escriben por WhatsApp:</strong> número de teléfono, nombre de
          perfil de WhatsApp, contenido de los mensajes enviados (texto, imágenes, ubicación cuando se
          comparte), dirección de entrega si la proporciona, historial de pedidos y pagos asociados.
        </p>
        <p>
          <strong>Datos técnicos y de uso:</strong> dirección IP, tipo de dispositivo y navegador, registros
          de actividad (logs) del sistema, y una cookie de sesión necesaria para mantener la sesión
          iniciada en el panel de administración.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cómo usamos la Plataforma de WhatsApp Business de Meta">
        <p>
          Cada negocio conecta su propia cuenta de WhatsApp Business (WABA) a ToGo. Con esa autorización,
          ToGo envía y recibe mensajes en nombre del negocio, incluyendo respuestas generadas
          automáticamente mediante inteligencia artificial para agilizar la atención (por ejemplo, mostrar
          el catálogo, confirmar pedidos o responder preguntas frecuentes), siempre bajo la supervisión y
          responsabilidad del negocio. No usamos el contenido de estos mensajes para fines publicitarios
          ajenos al negocio, ni lo vendemos a terceros.
        </p>
      </LegalSection>

      <LegalSection heading="5. Para qué usamos la información">
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestar y operar el servicio (gestión de pedidos, catálogo, mensajería, pagos).</li>
          <li>Autenticar cuentas y proteger la plataforma contra accesos no autorizados.</li>
          <li>Dar soporte técnico y responder solicitudes de los negocios y sus clientes.</li>
          <li>Mejorar el producto y detectar fallas o abusos del servicio.</li>
          <li>Cumplir obligaciones legales y contractuales, incluidas las Condiciones de la Plataforma de Meta.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Con quién compartimos la información">
        <p>
          No vendemos datos personales. Compartimos información únicamente con proveedores que nos ayudan
          a operar el servicio (encargados del tratamiento), bajo obligaciones de confidencialidad y
          seguridad:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Meta / WhatsApp Business Platform, para el envío y recepción de mensajes.</li>
          <li>Proveedores de infraestructura en la nube para alojar la base de datos y el backend.</li>
          <li>Proveedores de hosting para los sitios web del panel y catálogo.</li>
          <li>Proveedores de almacenamiento de imágenes y de envío de correos transaccionales.</li>
          <li>Proveedores de inteligencia artificial utilizados para generar respuestas automáticas.</li>
        </ul>
        <p>También podemos compartir información si la ley lo exige o para proteger nuestros derechos.</p>
      </LegalSection>

      <LegalSection heading="7. Conservación de datos">
        <p>
          Conservamos la información mientras la cuenta esté activa y por el tiempo adicional necesario
          para cumplir obligaciones legales, contables o fiscales, o para resolver disputas. Un negocio
          puede solicitar la eliminación de sus datos y de los datos de sus clientes en cualquier momento
          (vea nuestras{" "}
          <a href={`/${"es"}/legal/data-deletion`} className="text-[#6366F1] hover:underline">
            Instrucciones de Eliminación de Datos
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection heading="8. Sus derechos">
        <p>
          De acuerdo con la Ley 1581 de 2012 de Colombia (Habeas Data) y buenas prácticas internacionales de
          protección de datos, usted tiene derecho a conocer, actualizar, rectificar y solicitar la
          supresión de sus datos personales, así como a revocar la autorización otorgada para su
          tratamiento, salvo que exista un deber legal o contractual de conservarlos.
        </p>
        <p>
          Para ejercer estos derechos escriba a{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>{" "}
          o siga las instrucciones de nuestra página de{" "}
          <a href={`/${"es"}/legal/data-deletion`} className="text-[#6366F1] hover:underline">
            Eliminación de Datos
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="9. Seguridad">
        <p>
          Ciframos las contraseñas y los tokens de acceso sensibles, protegemos las conexiones mediante
          HTTPS/TLS y aplicamos controles de acceso basados en roles dentro de cada negocio. Ningún sistema
          es 100% infalible, pero trabajamos activamente para proteger la información.
        </p>
      </LegalSection>

      <LegalSection heading="10. Menores de edad">
        <p>
          ToGo no está dirigido a menores de 18 años y no recopilamos intencionalmente información de
          menores. Si detectamos que se ha recopilado información de un menor sin el consentimiento
          adecuado, la eliminaremos.
        </p>
      </LegalSection>

      <LegalSection heading="11. Cookies">
        <p>
          Usamos una cookie técnica (httpOnly) necesaria para mantener la sesión del panel de
          administración. No usamos cookies de publicidad de terceros.
        </p>
      </LegalSection>

      <LegalSection heading="12. Transferencias internacionales">
        <p>
          Algunos de nuestros proveedores de infraestructura procesan datos fuera de Colombia. En esos
          casos adoptamos medidas contractuales razonables para proteger la información conforme a esta
          política.
        </p>
      </LegalSection>

      <LegalSection heading="13. Cambios a esta política">
        <p>
          Podemos actualizar esta política ocasionalmente. Publicaremos cualquier cambio en esta misma
          página junto con la fecha de última actualización.
        </p>
      </LegalSection>

      <LegalSection heading="14. Contacto">
        <p>
          Si tiene preguntas, solicitudes o inquietudes sobre esta política, escríbanos a{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

function PrivacyPolicyEn({ locale }: { locale: string }) {
  return (
    <LegalLayout locale={locale} title="Privacy Policy" lastUpdated="Last updated: July 21, 2026">
      <LegalSection heading="1. Who we are">
        <p>
          ToGo (&quot;ToGo&quot;, &quot;we&quot; or &quot;the Platform&quot;) is a WhatsApp order-automation
          platform operated by Jhonathan Calvo, based in Colombia. This Privacy Policy explains how we
          collect, use, share and protect information when you use our sites (admin.togoapp.co,
          catalogo.togoapp.co) and our API (api.togoapp.co), including conversations handled through
          Meta&apos;s WhatsApp Business Platform.
        </p>
        <p>
          Questions about this policy can be sent to{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. Who this policy applies to">
        <ul className="list-disc pl-5 space-y-1">
          <li>Businesses and their teams who create a ToGo account to manage orders, catalog and their WhatsApp Business account.</li>
          <li>
            End customers who message a ToGo-powered business on WhatsApp to place orders or ask
            questions. ToGo processes these messages on the business&apos;s behalf, acting as a Tech
            Provider on Meta&apos;s WhatsApp Business Platform.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Information we collect">
        <p>
          <strong>From businesses and admin panel users:</strong> name, email, phone number, password
          (stored encrypted), business name, locations, industry/category, product catalog, role and
          permissions.
        </p>
        <p>
          <strong>From end customers messaging on WhatsApp:</strong> phone number, WhatsApp profile name,
          message content (text, images, shared location), delivery address if provided, order and
          payment history.
        </p>
        <p>
          <strong>Technical and usage data:</strong> IP address, device/browser type, system logs, and a
          session cookie required to keep the admin panel session active.
        </p>
      </LegalSection>

      <LegalSection heading="4. How we use Meta's WhatsApp Business Platform">
        <p>
          Each business connects its own WhatsApp Business Account (WABA) to ToGo. With that
          authorization, ToGo sends and receives messages on the business&apos;s behalf, including
          AI-generated automated responses to speed up service (e.g. showing the catalog, confirming
          orders, answering FAQs), always under the business&apos;s supervision and responsibility. We do
          not use message content for advertising unrelated to the business, nor do we sell it to third
          parties.
        </p>
      </LegalSection>

      <LegalSection heading="5. How we use the information">
        <ul className="list-disc pl-5 space-y-1">
          <li>Providing and operating the service (orders, catalog, messaging, payments).</li>
          <li>Authenticating accounts and protecting the platform from unauthorized access.</li>
          <li>Providing support and responding to requests from businesses and their customers.</li>
          <li>Improving the product and detecting failures or abuse.</li>
          <li>Complying with legal obligations, including Meta&apos;s Platform Terms.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Who we share information with">
        <p>
          We do not sell personal data. We share information only with providers that help us operate the
          service (processors), under confidentiality and security obligations: Meta / WhatsApp Business
          Platform, cloud infrastructure providers hosting our database and backend, hosting providers for
          our web apps, image storage and transactional email providers, and AI providers used to generate
          automated responses.
        </p>
      </LegalSection>

      <LegalSection heading="7. Data retention">
        <p>
          We retain information while the account is active and for as long as needed to meet legal,
          accounting or tax obligations. A business can request deletion of its data and its
          customers&apos; data at any time — see our{" "}
          <a href={`/${"en"}/legal/data-deletion`} className="text-[#6366F1] hover:underline">
            Data Deletion Instructions
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="8. Your rights">
        <p>
          You may have the right to access, correct, update and request deletion of your personal data, and
          to withdraw consent for its processing, unless a legal or contractual duty requires us to keep
          it. To exercise these rights, contact{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="9. Security">
        <p>
          We encrypt passwords and sensitive access tokens, protect connections via HTTPS/TLS, and apply
          role-based access controls within each business account.
        </p>
      </LegalSection>

      <LegalSection heading="10. Children">
        <p>
          ToGo is not directed to individuals under 18 and we do not knowingly collect information from
          minors.
        </p>
      </LegalSection>

      <LegalSection heading="11. Cookies">
        <p>
          We use a technical (httpOnly) cookie required to keep the admin panel session active. We do not
          use third-party advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes to this policy">
        <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
      </LegalSection>

      <LegalSection heading="13. Contact">
        <p>
          Questions or requests can be sent to{" "}
          <a href="mailto:somos@togoapp.co" className="text-[#6366F1] hover:underline">
            somos@togoapp.co
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
