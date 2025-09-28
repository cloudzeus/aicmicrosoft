"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { UserMultiSelect } from "@/components/ui/user-multi-select"
import { FaVideo, FaCalendarPlus } from "react-icons/fa"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string().min(1, "Start is required"),
  end: z.string().min(1, "End is required"),
  attendees: z.array(z.string()),
  location: z.string(),
  description: z.string(),
  isOnlineMeeting: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function NewTeamsMeeting() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      start: "",
      end: "",
      attendees: [],
      location: "",
      description: "",
      isOnlineMeeting: true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true)
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          attendees: values.attendees.join(", ")
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      setOpen(false)
      form.reset()
    } catch (e) {
      console.error("Failed to create meeting", e)
      alert("Failed to create meeting. Please ensure you are signed in with Microsoft 365 and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-20 flex-col gap-2">
          <FaVideo className="w-6 h-6" />
          NEW TEAMS MEETING
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaCalendarPlus className="w-5 h-5" />
            CREATE TEAMS MEETING
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TITLE</FormLabel>
                  <FormControl>
                    <Input placeholder="Project Sync" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>START</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>END</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ATTENDEES</FormLabel>
                  <FormControl>
                    <UserMultiSelect selected={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LOCATION (OPTIONAL)</FormLabel>
                  <FormControl>
                    <Input placeholder="Teams or Room A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DESCRIPTION</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Agenda, notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isOnlineMeeting"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between py-2">
                  <FormLabel>CREATE TEAMS ONLINE MEETING</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


