import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useLogin,
  getGetMeQueryKey,
  setAuthTokenGetter,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const qc = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (data: any) => {
          if (data?.token) {
            localStorage.setItem("authToken", data.token);
            if (data?.refreshToken)
              localStorage.setItem("refreshToken", data.refreshToken);
            setAuthTokenGetter(() => localStorage.getItem("authToken"));
          }
          qc.resetQueries({ queryKey: getGetMeQueryKey() });
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Credenciais inválidas",
            description: "Verifique seu e-mail e senha.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-primary rounded-xl p-3 mb-4">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sistema OS</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão de Vendas e Ordens de Serviço
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-email"
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-senha"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                data-testid="button-login"
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Acesso restrito a colaboradores autorizados
        </p>
      </div>
    </div>
  );
}
