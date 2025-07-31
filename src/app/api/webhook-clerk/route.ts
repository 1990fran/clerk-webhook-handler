//import {
//  updateStudentRole,
//  createStudentDatabase,
//} from "@/lib/actions/student";
import { NextRequest } from "next/server";
//import { createCoachDatabase, updateCoachRole } from "@/lib/actions/coach";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await req.json();
    // Handle user creation
    /* if (evt.type === 'user.created') {
      const { id, first_name, last_name } = evt.data;

      const clerkCl = await clerkClient();
      const memberships = await clerkCl.users.getOrganizationMembershipList({ userId: id });
      const role = memberships.data[0].role.trim();

      await processUserRole(id, role);

      if (first_name) {
        await clerkCl.users.updateUser(id, {
          firstName: first_name,
          lastName: last_name,
        });
      }

    } */
    if (evt.type === "user.created") {
      const { id, /* first_name, last_name, */ unsafe_metadata } = evt.data;
      const { /* access_career_compass, */ role } = unsafe_metadata ?? {};

      const clerkCl = await clerkClient();
      const organizationId = process.env.NYU_ORG_ID!;
      //const role = 'org:admin'
      /* const memberships = await clerkCl.users.getOrganizationMembershipList({
        userId: id,
      }); */

      await clerkCl.organizations.updateOrganizationMembership({
        organizationId,
        userId: id as string,
        //role: role as string /* === "org:student" ? "org:student" : "org:coach" */,
        role: "org:coach", // For now, all new users are coaches
      });

      await processUserRole(id, role);

      /* if (first_name) {
        await clerkCl.users.updateUser(id, {
          firstName: first_name,
          lastName: last_name,
        });
      } */
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}

async function processUserRole(userId: string, role: string, access?: boolean) {
  if (role == "org:coach") {
    console.log("Processing coach role for user:", userId);
    console.log("Access:", access);

    //await createCoachDatabase({ userId });
    //await updateCoachRole({ userId, access });
  } else if (role == "org:student") {
    //await updateStudentRole({ userId, access });
    //await createStudentDatabase({ userId });
  }
}
