// Cliente Stripe para uso exclusivo en el servidor (API routes, Server Actions).
// NUNCA importar este archivo desde componentes 'use client'.
import Stripe from 'stripe';

// Inicializa el cliente con la secret key y la versión de API pinneada.
// El "!" indica que confiamos en que la env var existe (si no, falla en runtime con mensaje claro).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});
