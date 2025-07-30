import { NextRequest } from "next/server";
import { Webhook } from "svix";

async function processUserRole(userId: string, role: string, access?: boolean) {
  // Aquí pondrás tu lógica de BD según el rol
  console.log("Asignando rol", role, "al usuario", userId, "con acceso:", access);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const webhook = new Webhook(process.env.CLERK_SECRET_KEY!);

    // Verificar la firma
    const evt = webhook.verify(payload, headers) as any;

    console.log("Evento recibido:", evt.type);

    if (evt.type === "organizationMembership.created") {
      const { role, public_user_data } = evt.data;
      const userId = public_user_data.user_id;
      const access = public_user_data.public_metadata?.access_career_compass;
      await processUserRole(userId, role, access);
    }

    if (evt.type === "organizationInvitation.accepted") {
      const { email_address, role } = evt.data;
      console.log(`Invitación aceptada: ${email_address}, rol: ${role}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (err) {
    console.error("Error procesando webhook:", err);
    return new Response("Invalid signature or error", { status: 400 });
  }
}
