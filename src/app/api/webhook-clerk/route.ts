//import {
//  updateStudentRole,
//  createStudentDatabase,
//} from "@/lib/actions/student";
import { NextRequest } from "next/server";
//import { createCoachDatabase, updateCoachRole } from "@/lib/actions/coach";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  console.log("🚀 Webhook iniciado - Timestamp:", new Date().toISOString());
  
  try {
    const evt = await req.json();
    console.log("📦 Evento recibido:", JSON.stringify(evt, null, 2));
    console.log("🔍 Tipo de evento:", evt.type);

    // Handle user creation
    /* if (evt.type === 'user.created') {
      console.log("👤 Procesando user.created");
      const { id, first_name, last_name } = evt.data;
      console.log("📋 Datos del usuario:", { id, first_name, last_name });

      const clerkCl = await clerkClient();
      const memberships = await clerkCl.users.getOrganizationMembershipList({ userId: id });
      console.log("🏢 Membresías encontradas:", memberships.data.length);
      const role = memberships.data[0].role.trim();
      console.log("🎭 Rol asignado:", role);

      await processUserRole(id, role);

      if (first_name) {
        console.log("✏️ Actualizando nombre del usuario");
        await clerkCl.users.updateUser(id, {
          firstName: first_name,
          lastName: last_name,
        });
        console.log("✅ Nombre actualizado correctamente");
      }
    } */

    if (evt.type == 'organizationInvitation.accepted') {
      console.log("📨 Procesando organizationInvitation.accepted");
      const { email_address, role, public_metadata } = evt.data;
      console.log("📧 Email:", email_address);
      console.log("🎭 Rol:", role);
      console.log("📊 Metadata pública:", JSON.stringify(public_metadata, null, 2));
      
      const { firstName, lastName, access_career_compass } = public_metadata ?? {};
      console.log("👤 Datos extraídos:", { firstName, lastName, access_career_compass });

      // Look for the email
      const clerkCl = await clerkClient();
      console.log("🔎 Buscando usuario por email:", email_address);
      const users = await clerkCl.users.getUserList({ emailAddress: [email_address] });
      console.log("👥 Usuarios encontrados:", users.data.length);

      if (users.data.length > 0) {
        const user = users.data[0];
        console.log("👤 Usuario encontrado:", user.id);
        console.log("📧 Emails del usuario:", user.emailAddresses?.map(e => e.emailAddress));
        
        const emailObj = user.emailAddresses?.find(e => e.emailAddress === email_address);
        console.log("🎯 Email coincidente encontrado:", !!emailObj);

        if (emailObj) {
          console.log("✏️ Actualizando usuario con email existente");
          await clerkCl.users.updateUser(user.id, {
            primaryEmailAddressID: emailObj.id,
            firstName,
            lastName,
          });
          console.log("✅ Usuario actualizado correctamente");
        } else {
          console.log("➕ Creando nuevo email para el usuario");
          // Fallback: crear el email si no existe y marcarlo como primario
          const newEmail = await clerkCl.emailAddresses.createEmailAddress({
            userId: user.id,
            emailAddress: email_address,
            verified: true,
            primary: true,
          });
          console.log("📧 Nuevo email creado:", newEmail.id);

          await clerkCl.users.updateUser(user.id, {
            firstName,
            lastName,
            primaryEmailAddressID: newEmail.id,
          });
          console.log("✅ Usuario actualizado con nuevo email");
        }
        
        console.log("🔄 Procesando rol del usuario");
        await processUserRole(user.id, role, access_career_compass);
      } else {
        console.log("❌ No se encontró usuario con el email:", email_address);
      }
    }

    if (evt.type === "user.created") {
    const { id, unsafe_metadata } = evt.data;
    const { role } = unsafe_metadata ?? {};

    const clerkCl = await clerkClient();
    const organizationId = process.env.NYU_ORG_ID!;

    console.log("🔎 Obteniendo membresías del usuario", id);
    const { data: memberships } = await clerkCl.users.getOrganizationMembershipList({ userId: id });
    const membership = memberships.find(m => m.organization.id === organizationId);

    if (!membership) {
        throw new Error(`No membership found for user ${id} in organization ${organizationId}`);
    }

    console.log("🔄 Actualizando rol por tipo");
    await clerkCl.organizations.updateOrganizationMembership({
        organizationId,
        userId: id,
        role: role as string,
    });
    console.log("✅ Rol actualizado correctamente");

    await processUserRole(id, role);
    }
    console.log("✅ Webhook procesado exitosamente");
    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("❌ Error completo:", err);
    console.error("🔍 Stack trace:", err instanceof Error ? err.stack : "No stack available");
    console.error("📊 Error stringificado:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    return new Response("Error verifying webhook", { status: 400 });
  }
}

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