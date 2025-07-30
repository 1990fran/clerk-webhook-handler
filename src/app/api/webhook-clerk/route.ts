import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  console.log("🚀 Webhook iniciado:", new Date().toISOString());
  const clerk = await clerkClient();

  try {
    const evt = await req.json();
    console.log("📦 Evento:", evt.type, JSON.stringify(evt.data));

    if (evt.type === 'organizationInvitation.accepted') {
      const { email_address, role, public_metadata } = evt.data;
      console.log("📧", email_address, "🎭", role);

      // 1) Encuentra al usuario por email
      const users = await clerk.users.getUserList({ emailAddress: [email_address] });
      if (users.data.length === 0) {
        console.warn("Usuario no existe:", email_address);
        return new Response("No user", { status: 200 });
      }
      const user = users.data[0];

      // 2) Actualiza el rol en Clerk
      const organizationId = process.env.NYU_ORG_ID!;
      await clerk.organizations.updateOrganizationMembership({
        organizationId,
        userId: user.id,
        role,
      });
      console.log("✅ Rol actualizado a", role, "para user", user.id);

      // 3) Lógica adicional (crear DB, etc.)
      await processUserRole(user.id, role, public_metadata?.access_career_compass);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    return new Response("Error", { status: 400 });
  }
}

// … tu función processUserRole igual que antes …

async function processUserRole(userId: string, role: string, access?: boolean) {
  console.log("🎭 === INICIANDO processUserRole ===");
  console.log("👤 UserID:", userId);
  console.log("🎯 Role:", role);
  console.log("🔑 Access:", access);

  if (role == "org:coach") {
    console.log("👨‍🏫 Procesando rol de coach");
    console.log("🚀 Access to Career Compass:", access);
    
    try {
      // Here you can call your functions to create the coach database and update the role
      console.log("📝 Creando base de datos de coach (comentado)");
      //await createCoachDatabase({ userId });
      console.log("🔄 Actualizando rol de coach (comentado)");
      //await updateCoachRole({ userId, access });
      console.log("✅ Procesamiento de coach completado");
    } catch (error) {
      console.error("❌ Error procesando coach:", error);
      throw error;
    }
  } else if (role == "org:student") {
    console.log("👨‍🎓 Procesando rol de estudiante");
    console.log("🚀 createStudentDatabase access:", access);
    
    try {
      console.log("🔄 Actualizando rol de estudiante (comentado)");
      //await updateStudentRole({ userId, access });
      console.log("📝 Creando base de datos de estudiante (comentado)");
      //await createStudentDatabase({ userId });
      console.log("✅ Procesamiento de estudiante completado");
    } catch (error) {
      console.error("❌ Error procesando estudiante:", error);
      throw error;
    }
  } else {
    console.log("⚠️ Rol no reconocido:", role);
  }
  
  console.log("🎭 === FINALIZANDO processUserRole ===");
}