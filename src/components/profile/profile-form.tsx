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
import {
  MapPin,
  Heart,
  Globe,
  Calendar,
  Hash,
  User,
  Eye,
  EyeOff,
  X,
  Plus,
} from "lucide-react";

type ProfileFormProps = {
  userId: string;
  email: string | undefined;
  initialName: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
  initialLocation: string | null;
  initialPronouns: string | null;
  initialInterests: string[] | null;
  initialWebsite: string | null;
  initialBirthday: string | null;
  initialRelationshipStatus: string | null;
  initialShowBirthday: boolean | null;
  initialShowAge: boolean | null;
  initialShowLocation: boolean | null;
};

export function ProfileForm({
  userId,
  email,
  initialName,
  initialBio,
  initialAvatarUrl,
  initialLocation,
  initialPronouns,
  initialInterests,
  initialWebsite,
  initialBirthday,
  initialRelationshipStatus,
  initialShowBirthday,
  initialShowAge,
  initialShowLocation,
}: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [interestInput, setInterestInput] = useState("");

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName ?? "",
      bio: initialBio ?? "",
      location: initialLocation ?? "",
      pronouns: (initialPronouns as any) ?? "",
      interests: initialInterests ?? [],
      website: initialWebsite ?? "",
      birthday: initialBirthday ?? "",
      relationship_status: (initialRelationshipStatus as any) ?? "",
      show_birthday: initialShowBirthday ?? true,
      show_age: initialShowAge ?? true,
      show_location: initialShowLocation ?? true,
    },
  });

  const interests = form.watch("interests") || [];

  function addInterest() {
    const trimmed = interestInput.trim().toLowerCase();
    if (!trimmed || interests.includes(trimmed)) return;
    form.setValue("interests", [...interests, trimmed]);
    setInterestInput("");
  }

  function removeInterest(interest: string) {
    form.setValue(
      "interests",
      interests.filter((i) => i !== interest)
    );
  }

  function calculateAge(birthday: string): number | null {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

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
    <Card className="rounded-2xl">
      <CardHeader className="px-6 py-5">
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your profile information to help others get to know you better.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <AvatarUpload
          userId={userId}
          avatarUrl={avatarUrl}
          name={form.watch("name") || initialName}
          email={email}
          onUploadComplete={(url) => setAvatarUrl(url || null)}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="size-4" />
                Basic Information
              </h3>

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
                name="pronouns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pronouns</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="she/her">She/Her</option>
                        <option value="he/him">He/Him</option>
                        <option value="they/them">They/Them</option>
                        <option value="any pronouns">Any pronouns</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="single">Single</option>
                        <option value="in a relationship">
                          In a relationship
                        </option>
                        <option value="it's complicated">
                          It's complicated
                        </option>
                        <option value="married">Married</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="size-4" />
                Location
              </h3>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City & Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New York, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="show_location"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">
                      Show location on my profile
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Birthday Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="size-4" />
                Birthday
              </h3>

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="show_birthday"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Show birthday</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_age"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Show age only</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("birthday") && form.watch("show_age") && (
                <p className="text-sm text-muted-foreground">
                  Your age will be displayed as: <strong>{calculateAge(form.watch("birthday"))} years old</strong>
                </p>
              )}
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Hash className="size-4" />
                Interests
              </h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest (e.g., music, travel)"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  maxLength={30}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addInterest}
                  disabled={!interestInput.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="hover:text-primary/80"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Add up to 10 interests to help others connect with you
              </p>
            </div>

            {/* Website Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="size-4" />
                Website
              </h3>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://yourwebsite.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Heart className="size-4" />
                About Me
              </h3>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others a bit about yourself..."
                        className="min-h-[120px] resize-y"
                        maxLength={500}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-full">
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
