import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SpvConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  invoiceNumber: string;
}

export const SpvConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  invoiceNumber,
}: SpvConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trimite factura la ANAF?</AlertDialogTitle>
          <AlertDialogDescription>
            Sunteți sigur că doriți să trimiteți factura <strong>{invoiceNumber}</strong> către ANAF (SPV)?
            <br /><br />
            <span className="text-destructive font-semibold">Această acțiune nu poate fi anulată.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anulează</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
            Trimite la ANAF
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
