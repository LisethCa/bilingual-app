import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Datos del responsable del tratamiento (Ley 1581 de 2012, Decreto 1377 de 2013).
// TODO: completar con los datos reales del cliente antes de publicar.
const RESPONSABLE = "[NOMBRE O RAZÓN SOCIAL]";
const DOCUMENTO = "[C.C. / NIT]";
const CIUDAD = "[CIUDAD], Colombia";
const EMAIL = "[EMAIL DE CONTACTO]";
const ULTIMA_ACTUALIZACION = "10 de noviembre de 2026";

type Section = { title: string; body: (string | string[])[] };

const SECTIONS: Section[] = [
  {
    title: "1. Quién es el responsable",
    body: [
      `El responsable del tratamiento de tus datos personales es ${RESPONSABLE}, identificado con ${DOCUMENTO}, con domicilio en ${CIUDAD}, titular de la plataforma Bilingual Site (bilingualsite.com).`,
      `Contacto para cualquier tema de datos personales: ${EMAIL}.`,
    ],
  },
  {
    title: "2. Qué datos recogemos",
    body: [
      [
        "Datos de cuenta: nombre, correo electrónico y, si entras con Google, tu foto de perfil. La contraseña la gestiona Firebase (Google) de forma cifrada; nosotros no la vemos.",
        "Datos de aprendizaje: lecciones completadas, ejercicios, puntos de experiencia (XP), racha de días, niveles comprados y fechas de compra y finalización.",
        "Datos de pago: nivel comprado, valor, fecha y estado del pago. Los datos de tu tarjeta o medio de pago los recibe directamente Mercado Pago; nosotros no los recibimos ni los guardamos.",
        "Grabaciones de voz: en los ejercicios de pronunciación, la grabación se envía a un servicio de transcripción para convertirla en texto. El audio se elimina apenas se obtiene la transcripción y no se guarda.",
        "Opiniones: si nos envías un comentario, guardamos el mensaje, la calificación, tu nombre, tu correo y el tipo de dispositivo.",
        "Datos de navegación: páginas visitadas, tipo de navegador y dispositivo, y acciones dentro del sitio, recogidos mediante el Pixel de Meta (ver punto 5).",
      ],
    ],
  },
  {
    title: "3. Para qué los usamos",
    body: [
      [
        "Crear y administrar tu cuenta y permitirte iniciar sesión.",
        "Guardar tu progreso y mostrarte tus niveles, XP, rachas e insignias.",
        "Procesar tus compras y darte acceso a los niveles adquiridos.",
        "Evaluar tu pronunciación en los ejercicios de voz.",
        "Responder tus mensajes y mejorar los contenidos de la plataforma.",
        "Medir el resultado de nuestros anuncios en Facebook e Instagram y mostrar publicidad relevante.",
        "Enviarte correos necesarios para el servicio, como la recuperación de contraseña.",
      ],
    ],
  },
  {
    title: "4. Con quién los compartimos",
    body: [
      "No vendemos tus datos. Solo los compartimos con los proveedores que necesitamos para prestar el servicio, que actúan como encargados del tratamiento:",
      [
        "Google Firebase: autenticación y base de datos.",
        "Mercado Pago: procesamiento de pagos.",
        "Groq: transcripción de las grabaciones de voz.",
        "Meta Platforms (Facebook / Instagram): medición de anuncios mediante el Pixel de Meta.",
        "Netlify y Render: alojamiento del sitio web y del servidor.",
      ],
      "Algunos de estos proveedores almacenan la información en servidores fuera de Colombia, principalmente en Estados Unidos. Al aceptar esta política autorizas esa transferencia internacional, que se hace con proveedores que cuentan con medidas de seguridad adecuadas.",
    ],
  },
  {
    title: "5. Pixel de Meta y almacenamiento local",
    body: [
      "Usamos el Pixel de Meta, una herramienta de Meta Platforms que registra ciertas acciones en el sitio: visitar una página, crear una cuenta, ver la oferta de un nivel, iniciar un pago y completar una compra (con su valor). Esta información nos ayuda a saber si nuestros anuncios funcionan y permite a Meta mostrarte publicidad relacionada. Meta trata estos datos según su propia política de privacidad (facebook.com/privacy/policy).",
      "Puedes limitar el uso de esta información para anuncios desde la configuración de anuncios de tu cuenta de Facebook o Instagram, o bloqueando las cookies de terceros en tu navegador.",
      "También guardamos pequeños datos en el almacenamiento local de tu navegador (por ejemplo, tu sesión iniciada y preferencias) para que la plataforma funcione correctamente.",
    ],
  },
  {
    title: "6. Niños, niñas y adolescentes",
    body: [
      "Bilingual Site puede ser usada por menores de edad. En ese caso, la cuenta debe crearla o autorizarla su padre, madre o representante legal, quien acepta esta política en nombre del menor. Respetamos el interés superior de los menores y solo tratamos los datos necesarios para su aprendizaje.",
    ],
  },
  {
    title: "7. Tus derechos",
    body: [
      "Como titular de los datos tienes derecho a:",
      [
        "Conocer, actualizar y rectificar tus datos personales.",
        "Solicitar prueba de la autorización que nos diste.",
        "Ser informado sobre el uso que le damos a tus datos.",
        "Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.",
        "Revocar la autorización y pedir la eliminación de tus datos, cuando no exista un deber legal o contractual de conservarlos.",
        "Acceder gratuitamente a tus datos personales.",
      ],
      "Puedes cambiar tu nombre y contraseña en cualquier momento desde la sección «Mi cuenta».",
    ],
  },
  {
    title: "8. Cómo ejercer tus derechos",
    body: [
      `Escríbenos a ${EMAIL} indicando tu nombre, el correo de tu cuenta y tu solicitud.`,
      [
        "Consultas: las respondemos en un máximo de 10 días hábiles (prorrogables 5 días hábiles más, avisándote el motivo).",
        "Reclamos (corrección, actualización, eliminación o revocatoria): los atendemos en un máximo de 15 días hábiles (prorrogables 8 días hábiles más, avisándote el motivo).",
      ],
    ],
  },
  {
    title: "9. Cuánto tiempo guardamos tus datos",
    body: [
      "Conservamos tus datos mientras tengas una cuenta activa. Si pides eliminar tu cuenta, borramos tus datos personales, salvo los registros de pagos que debamos conservar por obligaciones legales, contables o tributarias.",
    ],
  },
  {
    title: "10. Seguridad",
    body: [
      "Aplicamos medidas técnicas y administrativas razonables para proteger tu información: conexiones cifradas (HTTPS), autenticación gestionada por Firebase y acceso restringido a la base de datos.",
    ],
  },
  {
    title: "11. Cambios a esta política",
    body: [
      "Podemos actualizar esta política. Cuando haya cambios importantes te avisaremos dentro de la plataforma. La fecha de la última actualización aparece al inicio de este documento.",
    ],
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Política de privacidad</Text>
        <Text style={styles.updated}>
          Última actualización: {ULTIMA_ACTUALIZACION}
        </Text>
        <Text style={styles.intro}>
          En Bilingual Site cuidamos tus datos personales. Aquí te contamos qué
          información recogemos, para qué la usamos y cuáles son tus derechos,
          de acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de
          Colombia. Al crear una cuenta o usar la plataforma aceptas esta
          política.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {s.body.map((part, i) =>
              Array.isArray(part) ? (
                <View key={i} style={styles.list}>
                  {part.map((item) => (
                    <View key={item} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.paragraph}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text key={i} style={styles.paragraph}>
                  {part}
                </Text>
              ),
            )}
          </View>
        ))}

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${EMAIL}`)}
          style={styles.contactButton}
        >
          <Text style={styles.contactText}>Escríbenos: {EMAIL}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={styles.backButton}
        >
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F3EEFF" },
  content: { padding: 16, paddingBottom: 48, alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 760,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#4C1D95" },
  updated: { fontSize: 13, color: "#6B7280", marginTop: 4, marginBottom: 14 },
  intro: { fontSize: 15, lineHeight: 23, color: "#374151", marginBottom: 8 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 8,
  },
  paragraph: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: "#374151",
    marginBottom: 6,
  },
  list: { marginBottom: 6 },
  listItem: { flexDirection: "row", gap: 8, paddingLeft: 4 },
  bullet: { fontSize: 15, lineHeight: 23, color: "#9365FF" },
  contactButton: {
    marginTop: 24,
    backgroundColor: "#9365FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  contactText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  backButton: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  backText: { color: "#4C1D95", fontWeight: "600", fontSize: 15 },
});
