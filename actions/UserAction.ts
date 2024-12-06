import db from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createUser(body: {
  id: string;
  email: string;
  userLocalTime: string;
}) {
  const { id, email, userLocalTime } = body;

  try {
    console.log("Checking for existing user...");

    const accountExist = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (accountExist.length === 0) {
      console.log(`Inserting user into database: ${id}, ${email}`);

      const [userRow] = await db
        .insert(user)
        .values({
          id,
          email,
          created_at: new Date(userLocalTime),
          updated_at: new Date(userLocalTime),
        })
        .returning();

      console.log(`User created successfully: ${JSON.stringify(userRow)}`);
      return userRow;
    } else {
      console.error("User already exists in DB");
      return null;
    }
  } catch (error) {
    console.error("Database insertion error:", error);
  }
}

export async function updateUser(id: string, updates: Partial<{ email: string }>) {
  try {
    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();

    console.log(`User updated: ${JSON.stringify(updatedUser)}`);
    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    await db.delete(user).where(eq(user.id, id));
    console.log(`User with ID ${id} deleted.`);
    return true;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
}
