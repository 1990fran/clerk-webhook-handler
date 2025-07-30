// server/app/api/webhook-clerk/route.ts
import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  console.log("🚀 Webhook iniciado:", new Date().toISOString());
  const clerk = await clerkClient();

  try {
    const evt = await req.json();
    const type = evt.type;
    const data = evt.data;
    console.log("📦 Evento recibido:", type);

    // 1) Invitación creada: capturamos el role deseado
    if (type === "organizationInvitation.created") {
      const { email_address, role, public_metadata } = data;
      console.log("✉️ Invitación creada:", email_address, "con rol", role);

      // Guardar en tu DB o cache: mapear email → role deseado
      await saveDesiredRole(email_address, role, public_metadata);

      return new Response("Invitation.created handled", { status: 200 });
    }

    // 2) Invitación aceptada (usuario nuevo): actualizamos en Clerk y en tu sistema
    if (type === "organizationInvitation.accepted") {
      const { email_address, role, public_metadata } = data;
      console.log("📨 Invitación aceptada:", email_address, "con rol", role);

      // Buscar userId por email
      const users = await clerk.users.getUserList({ emailAddress: [email_address] });
      if (users.data.length === 0) {
        console.warn("Usuario no encontrado para accepted:", email_address);
        return new Response("No user", { status: 200 });
      }
      const userId = users.data[0].id;

      // Actualizar rol en Clerk
      const organizationId = process.env.NYU_ORG_ID!;
      await clerk.organizations.updateOrganizationMembership({
        organizationId,
        userId,
        role,
      });
      console.log("✅ Rol actualizado en Clerk a", role);

      // Lógica adicional
      await processUserRole(userId, role, public_metadata?.access_career_compass);
      return new Response("Invitation.accepted handled", { status: 200 });
    }

    // 3) Membresía creada: aparece siempre, también para usuarios existentes
    if (type === "organizationMembership.created" || type === "organization_membership.created") {
      console.log("📬 organizationMembership.created");

      const {
        organization: { id: organizationId },
        public_user_data: { user_id: userId },
        role: currentRole,
      } = data;

      console.log({ organizationId, userId, currentRole });

      // Recuperar el role deseado que guardamos antes (si existe)
      const desiredRole = await getDesiredRoleForUser(userId) ?? currentRole;

      // Si difiere del asignado, forzamos la actualización
      if (currentRole !== desiredRole) {
        await clerk.organizations.updateOrganizationMembership({
          organizationId,
          userId,
          role: desiredRole,
        });
        console.log("🔄 Rol forzado a:", desiredRole);
      }

      // Lógica adicional
      await processUserRole(userId, desiredRole);
      return new Response("Membership.created handled", { status: 200 });
    }

    // Otros eventos que quieras ignorar
    console.log("🔍 Evento no gestionado:", type);
    return new Response("Ignored", { status: 200 });

  } catch (err) {
    console.error("❌ Error en webhook:", err);
    return new Response("Error", { status: 400 });
  }
}

// Helpers: adapta a tu almacenamiento
async function saveDesiredRole(email: string, role: string, metadata: any) {
  // e.g., guarda en Redis o en tu base: key=email, value={role, metadata}
}

async function getDesiredRoleForUser(userId: string): Promise<string | null> {
  // e.g., mira en tu DB/cache según userId o email
  return null;
}

// Tu función existente
async function processUserRole(userId: string, role: string, access?: boolean) {
  console.log("🎭 === INICIANDO processUserRole ===");
  console.log("👤 UserID:", userId);
  console.log("🎯 Role:", role);
  console.log("🔑 Access:", access);

  if (role === "org:coach") {
    console.log("👨‍🏫 Procesando rol de coach");
    // await createCoachDatabase({ userId });
    // await updateCoachRole({ userId, access });
  } else if (role === "org:student") {
    console.log("👨‍🎓 Procesando rol de estudiante");
    // await updateStudentRole({ userId, access });
    // await createStudentDatabase({ userId });
  } else {
    console.log("⚠️ Rol no reconocido:", role);
  }

  console.log("🎭 === FINALIZANDO processUserRole ===");
}
