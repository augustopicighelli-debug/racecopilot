'use client';
// Cliente-side: instala GA4 y Meta Pixel en toda la app.
// Se monta una sola vez desde app/layout.tsx via <Providers>.
//
// Solo activa los pixels si las env vars están presentes — así en dev no cargan.
// ENV vars esperadas (en Vercel):
//   NEXT_PUBLIC_GA4_ID         = "G-XXXXXXX"
//   NEXT_PUBLIC_META_PIXEL_ID  = "123456789"

import Script from 'next/script';
import { useEffect } from 'react';
import { captureUTMs } from './utms';

// Lee IDs de entorno. Si no están, no cargamos el script.
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Componente que monta GA4 + Meta Pixel + captura UTMs del first-touch.
 * Se incluye desde app/layout.tsx dentro del body para cargarse en todas las páginas.
 */
export function AnalyticsPixels() {
  // En cada mount (primer render), capturar UTMs si es la primera visita
  useEffect(() => {
    captureUTMs();
  }, []);

  return (
    <>
      {/* ── Google Analytics 4 ─────────────────────────── */}
      {/* Solo se monta si hay ID configurado. strategy afterInteractive para no bloquear render */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', {
                // anonymize_ip requerido por GDPR en Europa
                anonymize_ip: true,
                // send_page_view default true pero lo explicitamos
                send_page_view: true,
              });
            `}
          </Script>
        </>
      )}

      {/* ── Meta Pixel (Facebook/Instagram) ───────────── */}
      {/* Solo se monta si hay ID. Captura PageView automático + estamos listos para eventos custom después */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

/**
 * Helper para trackear eventos custom en GA4 + Meta Pixel.
 * Uso: trackEvent('signup', { plan: 'yearly', source: 'seo' })
 */
export function trackEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === 'undefined') return;

  // GA4
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', eventName, params);
  }

  // Meta Pixel
  // Nombres estándar de Meta: Lead, CompleteRegistration, Subscribe, Purchase
  // Para eventos custom usar trackCustom. Acá asumimos que el caller pasa el nombre correcto.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq = (window as any).fbq;
  if (fbq) {
    // Lista corta de eventos estándar de Meta — el resto va como custom
    const standardEvents = [
      'PageView',
      'Lead',
      'CompleteRegistration',
      'Subscribe',
      'Purchase',
      'InitiateCheckout',
      'AddPaymentInfo',
      'StartTrial',
    ];
    if (standardEvents.includes(eventName)) {
      fbq('track', eventName, params);
    } else {
      fbq('trackCustom', eventName, params);
    }
  }
}
