# Formación EI

Plataforma interna para solicitudes de capacitación, cotizaciones, aprobación por umbral y seguimiento de OC del ERP.

La aplicación web está en [`formacion-app`](formacion-app).

## Arranque rápido

El proyecto remoto **formacion-ei** ya está creado (São Paulo, `ggkkhlywawovwhnhddbb`) y la migración inicial ya está aplicada. Las claves locales están en `formacion-app/.env.local` (no se sube a git).

1. En [Authentication → Providers](https://supabase.com/dashboard/project/ggkkhlywawovwhnhddbb/auth/providers) desactiva “Confirm email” si quieres entrar al toque en el MVP (eso no se puede cambiar por MCP).
2. `cd formacion-app && npm run dev`

El primer usuario que se registre entra como **solicitante**. Para promover un admin:

```sql
update public.profiles
set app_role = 'admin'
where email = 'tu.correo@empresa.cl';
```

## Roles

- Solicitante: crea y sigue sus solicitudes.
- Formación · Rol general / Rol privado: cada equipo solo ve las solicitudes de su rol.
- Presupuesto: aprueba cuando la cotización supera el umbral.
- Admin: usuarios, umbral y visibilidad total.

La OC oficial se emite en el ERP; aquí solo se registra el número.
