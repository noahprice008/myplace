import { useState } from "react";
import { Check, Crown, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProStatus } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

const PRICE = "$2.49";

const PERKS = [
  "Unlimited cashflow entries & custom categories",
  "PDF and CSV statement exports",
  "Full 24-hour schedule with locking",
  "Unlimited photos and post history",
  "Priority support",
];

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [pro, setPro] = useProStatus();
  const { t, locale } = useLanguage();
  const [paying, setPaying] = useState(false);

  const isPro = pro.plan !== "free";

  function checkout() {
    setPaying(true);
    window.setTimeout(() => {
      setPro({ plan: "monthly", since: new Date().toISOString() });
      setPaying(false);
      toast.success("You're on Pro (demo mode)");
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border-2 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-primary" />
            {isPro ? "You're on Pro" : "Upgrade to Pro"}
          </DialogTitle>
          <DialogDescription>
            {isPro
              ? "Thanks for supporting myplace. Manage your demo plan below."
              : "Unlock everything myplace has to offer."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        {isPro ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-3 text-sm font-bold">
              {`Pro · ${PRICE}/mo`} · active since{" "}
              {new Date(pro.since).toLocaleDateString(locale)}
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setPro({ plan: "free", since: "" });
                toast("Back on the free plan");
              }}
            >
              Cancel plan
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 text-center">
              <p className="text-3xl font-extrabold">{PRICE}</p>
              <p className="text-xs font-bold text-muted-foreground">{t("pro.perMonth")}</p>
            </div>

            <Button
              className="h-12 rounded-full text-base font-extrabold"
              disabled={paying}
              onClick={checkout}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> Pay {PRICE}
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Demo checkout — no card is charged and no payment details are collected.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
