"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, User } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["admin", "user", "guest"]),
  is_active: z.boolean().default(false),
  bio: z.string().optional(),
})

interface UserEditDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  user?: {
    id: string
    name: string
    email: string
    role: "admin" | "user" | "guest"
    is_active: boolean
    bio?: string
  }
  onSave?: (values: z.infer<typeof formSchema>) => void
}

export function UserEditDialog({ open, setOpen, user, onSave }: UserEditDialogProps) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "user",
      is_active: user?.is_active || false,
      bio: user?.bio || "",
    },
  })

  const isSaving = form.formState.isSubmitting

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the data
    onSave?.(values)
    toast({
      title: "User updated.",
      description: "Your changes have been saved.",
    })
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit User</AlertDialogTitle>
          <AlertDialogDescription>
            Make changes to the user profile here. Click save when you're done.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="User name"
                      {...field}
                      className="border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-300 hover:border-muted-foreground/40 focus:shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
                      {...field}
                      type="email"
                      className="border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-300 hover:border-muted-foreground/40 focus:shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-300 hover:border-muted-foreground/40 focus:shadow-sm">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border px-3 py-2 shadow-sm transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 data-[state=closed]:bg-muted">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>Set the user as active or inactive.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="border-muted-foreground/20 focus-visible:ring-primary/30 transition-all duration-300 hover:border-muted-foreground/40 focus:shadow-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSaving}
                className="shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
