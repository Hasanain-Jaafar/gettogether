"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProfile } from "@/app/(dashboard)/profile/actions";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfileFormProps = {
  userId: string;
  email: string | undefined;
  initialName: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
};

export function ProfileForm({
  userId,
  email,
  initialName,
  initialBio,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName ?? "",
      bio: initialBio ?? "",
    },
  });

  async function onSubmit(values: ProfileInput) {
    const result = await updateProfile({
      ...values,
      avatar_url: avatarUrl,
    });
    if (result.success) {
      toast.success("Profile updated.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your name, bio, and avatar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AvatarUpload
          userId={userId}
          avatarUrl={avatarUrl}
          name={form.watch("name") || initialName}
          email={email}
          onUploadComplete={(url) => setAvatarUrl(url || null)}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="A short bio"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
