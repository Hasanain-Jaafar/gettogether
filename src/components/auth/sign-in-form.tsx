"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { resolveLoginIdentifier } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignInForm() {
  const router = useRouter();
  const t = useTranslations("auth.signIn");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    setError(null);
    const { email } = await resolveLoginIdentifier(values.identifier.trim());
    if (!email) {
      setError(t("invalidCredentials"));
      return;
    }
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: values.password.trim(),
    });
    if (signInError) {
      const msg = signInError.message ?? "";
      const friendly =
        msg.toLowerCase().includes("invalid login credentials") ||
        msg.toLowerCase().includes("invalid_credentials")
          ? t("invalidCredentials")
          : msg.toLowerCase().includes("email not confirmed")
          ? t("emailNotConfirmed")
          : t("genericError", { message: msg || "unknown error" });
      setError(friendly);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <Card className="border-border/80 bg-card/95 shadow-xl shadow-primary/5 dark:shadow-primary/10 backdrop-blur-sm">
      <CardHeader className="space-y-1.5 pb-2">
        <CardTitle className="text-2xl tracking-tight">{t("title")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("identifier")}</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="username"
                      placeholder={t("identifierPlaceholder")}
                      className="bg-muted/50 border-border focus-visible:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("passwordPlaceholder")}
                      className="bg-muted/50 border-border focus-visible:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
