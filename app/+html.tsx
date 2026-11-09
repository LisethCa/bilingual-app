// Plantilla HTML de la web (solo se usa al exportar / renderizar en web).
// Igual a la plantilla por defecto de Expo Router + el pixel de Meta.
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Se toma al hacer el build (Netlify > Environment variables)
const PIXEL_ID = (process.env.EXPO_PUBLIC_FB_PIXEL_ID || "").replace(/\D/g, "");

// Código base oficial del pixel de Meta. El PageView inicial va acá; los
// cambios de pantalla los envía app/_layout.tsx.
const pixelScript = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`;

// Verificación del dominio en Meta Business (opcional): solo el código del content
const DOMAIN_VERIFICATION = process.env.EXPO_PUBLIC_FB_DOMAIN_VERIFICATION || "";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {DOMAIN_VERIFICATION ? (
          <meta
            name="facebook-domain-verification"
            content={DOMAIN_VERIFICATION}
          />
        ) : null}
        <ScrollViewStyleReset />
        {PIXEL_ID ? (
          <>
            <script dangerouslySetInnerHTML={{ __html: pixelScript }} />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
