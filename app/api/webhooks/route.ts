import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, updateUser, deleteUser } from "@/actions/UserAction";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env or .env.local");
  }

  const headerPayload = await headers(); // Await headers
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;

    console.log("Webhook verification successful");
  } catch (err) {
    console.error("Webhook verification failed", err);
    return new Response("Error occurred", { status: 400 });
  }

  const { id } = evt.data;
  if (!id) {
    console.error("User ID is undefined");
    return new Response("Error: User ID is undefined", { status: 400 });
  }

  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { email_addresses } = evt.data;

      if (!email_addresses || email_addresses.length === 0) {
        console.error(`No email addresses found for user ${id}`);
        return new Response("No email addresses found", { status: 400 });
      }

      const userEmail = email_addresses[0].email_address;
      console.log(`Creating user - ID: ${id}, Email: ${userEmail}`);

      try {
        await createUser({ id, email: userEmail, userLocalTime: new Date().toISOString() });
        return new Response("User created", { status: 200 });
      } catch (error) {
        console.error("User creation failed", error);
        return new Response("User creation failed: " + String(error), { status: 500 });
      }
    }

    case "user.updated": {
      const { email_addresses } = evt.data;

      if (!email_addresses || email_addresses.length === 0) {
        console.error(`No email addresses found for user ${id}`);
        return new Response("No email addresses found", { status: 400 });
      }

      const userEmail = email_addresses[0].email_address;
      const updates = { email: userEmail };

      console.log(`Updating user - ID: ${id}`);

      try {
        await updateUser(id, updates);
        return new Response("User updated", { status: 200 });
      } catch (error) {
        console.error("User update failed", error);
        return new Response("User update failed: " + String(error), { status: 500 });
      }
    }

    case "user.deleted": {
      console.log(`Deleting user - ID: ${id}`);

      try {
        await deleteUser(id);
        return new Response("User deleted", { status: 200 });
      } catch (error) {
        console.error("User deletion failed", error);
        return new Response("User deletion failed: " + String(error), { status: 500 });
      }
    }

    default:
      console.log(`Unhandled event type: ${eventType}`);
      return new Response("Event type not handled", { status: 200 });
  }
}
