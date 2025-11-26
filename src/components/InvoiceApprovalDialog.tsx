import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface InvoiceApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  invoiceNumber: string;
  isLoading: boolean;
}

export const InvoiceApprovalDialog = ({
  open,
  onOpenChange,
  onApprove,
  onReject,
  invoiceNumber,
  isLoading,
}: InvoiceApprovalDialogProps) => {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(notes);
    } else if (action === "reject") {
      onReject(notes);
    }
    setNotes("");
    setAction(null);
  };

  const handleAction = (actionType: "approve" | "reject") => {
    setAction(actionType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {action === null
              ? `Revizie factură #${invoiceNumber}`
              : action === "approve"
              ? `Aprobă factură #${invoiceNumber}`
              : `Respinge factură #${invoiceNumber}`}
          </DialogTitle>
          <DialogDescription>
            {action === null
              ? "Alege acțiunea și adaugă un comentariu (opțional)."
              : action === "approve"
              ? "Adaugă un comentariu pentru aprobare (opțional)."
              : "Adaugă un motiv pentru respingere (recomandat)."}
          </DialogDescription>
        </DialogHeader>

        {action !== null && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Comentarii / Observații</Label>
              <Textarea
                id="notes"
                placeholder={
                  action === "approve"
                    ? "Ex: Toate detaliile sunt corecte. Aprobat pentru trimitere."
                    : "Ex: Lipsesc informații despre TVA. Vă rog să corectați..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {action === "reject"
                  ? "Comentariul va ajuta la înțelegerea motivelor respingerii."
                  : "Adaugă orice observații relevante pentru această factură."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {action === null ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Anulează
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction("reject")}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Respinge
              </Button>
              <Button
                variant="default"
                onClick={() => handleAction("approve")}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobă
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setAction(null);
                  setNotes("");
                }}
                disabled={isLoading}
              >
                Înapoi
              </Button>
              <Button
                variant={action === "approve" ? "default" : "destructive"}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Se procesează..."
                ) : action === "approve" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmă aprobare
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmă respingere
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
