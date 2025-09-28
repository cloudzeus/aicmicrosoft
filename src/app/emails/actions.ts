"use server"

import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"
import { revalidatePath } from "next/cache"

export async function deleteEmailAction(messageId: string, currentPath: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await graphAPI.deleteEmail(messageId)
    revalidatePath(currentPath)
    return { success: true }
  } catch (error) {
    console.error("Error deleting email:", error)
    return { success: false, error: "Failed to delete email" }
  }
}

export async function forwardEmailAction(messageId: string, to: string[], comment: string, currentPath: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await graphAPI.forwardEmail(messageId, to, comment)
    revalidatePath(currentPath)
    return { success: true }
  } catch (error) {
    console.error("Error forwarding email:", error)
    return { success: false, error: "Failed to forward email" }
  }
}

export async function replyEmailAction(messageId: string, comment: string, currentPath: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await graphAPI.replyEmail(messageId, comment)
    revalidatePath(currentPath)
    return { success: true }
  } catch (error) {
    console.error("Error replying to email:", error)
    return { success: false, error: "Failed to reply to email" }
  }
}

export async function markEmailAsReadAction(messageId: string, isRead: boolean, currentPath: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await graphAPI.markEmailAsRead(messageId)
    revalidatePath(currentPath)
    return { success: true }
  } catch (error) {
    console.error("Error marking email as read:", error)
    return { success: false, error: "Failed to mark email as read" }
  }
}

export async function composeEmailAction(recipients: string[], subject: string, body: string, currentPath: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  try {
    await graphAPI.sendMail(subject, body, recipients)
    revalidatePath(currentPath)
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
