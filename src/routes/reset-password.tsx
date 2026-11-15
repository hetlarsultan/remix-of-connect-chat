import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة - شات عالمي" },
      { name: "description", content: "عيّن كلمة مرور جديدة لحسابك في شات عالمي من رابط الاستعادة الآمن." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة - شات عالمي" },
      { property: "og:description", content: "استعادة الوصول إلى حساب شات عالمي بكلمة مرور جديدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecking(false);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error("انتهت صلاحية الرابط أو تعذر تغيير كلمة المرور. اطلب رابطاً جديداً.");
      return;
    }
    toast.success("تم تغيير كلمة المرور بنجاح");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-xl p-6 space-y-5">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-primary/15 text-primary"><KeyRound className="size-7" /></div>
          <h1 className="text-2xl font-bold">كلمة مرور جديدة</h1>
          <p className="text-sm text-muted-foreground">اختر كلمة مرور قوية لحسابك في شات عالمي.</p>
        </div>

        {checking ? (
          <div className="flex justify-center py-6 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
        ) : ready ? (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة (6+ أحرف)"
              autoComplete="new-password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="تأكيد كلمة المرور الجديدة"
              autoComplete="new-password"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" disabled={saving} className="w-full gradient-brand text-white py-3.5 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              حفظ كلمة المرور والدخول
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">رابط الاستعادة غير صالح أو منتهي. اطلب رابطاً جديداً من صفحة الدخول.</p>
            <Link to="/auth" className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">طلب رابط جديد</Link>
          </div>
        )}
      </div>
    </div>
  );
}
