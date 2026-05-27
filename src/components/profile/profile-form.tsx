"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/app/[locale]/(dashboard)/profile/actions";
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
  const router = useRouter();
  const t = useTranslations("profile");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [interestInput, setInterestInput] = useState("");

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName ?? "",
      bio: initialBio ?? "",
      location: initialLocation ?? "",
      pronouns: (initialPronouns || undefined) as ProfileInput["pronouns"],
      interests: initialInterests ?? [],
      website: initialWebsite ?? "",
      birthday: initialBirthday ?? "",
      relationship_status: (initialRelationshipStatus || undefined) as ProfileInput["relationship_status"],
      show_birthday: initialShowBirthday ?? true,
      show_age: initialShowAge ?? true,
      show_location: initialShowLocation ?? true,
    },
  });

  const interests = useWatch({ control: form.control, name: "interests" }) || [];
  const name = useWatch({ control: form.control, name: "name" });
  const birthday = useWatch({ control: form.control, name: "birthday" });
  const showAge = useWatch({ control: form.control, name: "show_age" });

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
      toast.success(t("updated"));
      router.push(`/u/${userId}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-6 py-5">
        <CardTitle>{t("cardTitle")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <AvatarUpload
          userId={userId}
          avatarUrl={avatarUrl}
          name={name || initialName}
          email={email}
          onUploadComplete={(url) => setAvatarUrl(url || null)}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="size-4" />
                {t("basicInfo")}
              </h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("namePlaceholder")} {...field} />
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
                    <FormLabel>{t("pronouns")}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">{t("preferNotToSay")}</option>
                        <option value="she/her">{t("sheHer")}</option>
                        <option value="he/him">{t("heHim")}</option>
                        <option value="they/them">{t("theyThem")}</option>
                        <option value="any pronouns">{t("anyPronouns")}</option>
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
                    <FormLabel>{t("relationshipStatus")}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">{t("preferNotToSay")}</option>
                        <option value="single">{t("single")}</option>
                        <option value="in a relationship">{t("inRelationship")}</option>
                        <option value="it&apos;s complicated">{t("complicated")}</option>
                        <option value="married">{t("married")}</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="size-4" />
                {t("locationSection")}
              </h3>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cityCountry")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("cityPlaceholder")} {...field} />
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
                    <FormLabel className="text-sm">{t("showLocation")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="size-4" />
                {t("birthdaySection")}
              </h3>

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("birthday")}</FormLabel>
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
                      <FormLabel className="text-sm">{t("showBirthday")}</FormLabel>
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
                      <FormLabel className="text-sm">{t("showAge")}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {birthday && showAge && (
                <p className="text-sm text-muted-foreground">
                  {t("agePreview", { age: calculateAge(birthday) ?? 0 })}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Hash className="size-4" />
                {t("interestsSection")}
              </h3>

              <div className="flex gap-2">
                <Input
                  placeholder={t("addInterest")}
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
                  {interests.map((interest: string) => (
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
              <p className="text-xs text-muted-foreground">{t("interestsHint")}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="size-4" />
                {t("websiteSection")}
              </h3>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("personalWebsite")}</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder={t("websitePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Heart className="size-4" />
                {t("aboutMe")}
              </h3>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bio")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("bioPlaceholder")}
                        className="min-h-30 resize-y"
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
              {form.formState.isSubmitting ? t("saving") : t("save")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
