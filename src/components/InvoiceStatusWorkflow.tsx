import { CheckCircle, Circle, Clock, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceStatusWorkflowProps {
  status: string;
  accountantApproved: boolean;
  approvalNotes?: string;
  spvSentAt?: string | null;
  className?: string;
}

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
  rejected?: boolean;
}

export const InvoiceStatusWorkflow = ({ 
  status, 
  accountantApproved,
  approvalNotes,
  spvSentAt,
  className 
}: InvoiceStatusWorkflowProps) => {
  
  // Determine if invoice was rejected
  const isRejected = !accountantApproved && approvalNotes && status === 'draft';
  
  // Define workflow steps
  const steps: WorkflowStep[] = [
    {
      id: 'draft',
      label: 'Ciornă',
      icon: <Circle className="w-5 h-5" />,
      completed: status !== 'draft' || (status === 'draft' && !isRejected),
      active: status === 'draft' && !isRejected,
      rejected: false,
    },
    {
      id: 'finalized',
      label: 'Finalizată',
      icon: <Clock className="w-5 h-5" />,
      completed: (status === 'sent' || status === 'paid') || accountantApproved,
      active: status === 'sent' && !accountantApproved && !isRejected,
      rejected: false,
    },
    {
      id: 'approved',
      label: 'Aprobată de contabil',
      icon: accountantApproved ? <CheckCircle className="w-5 h-5" /> : isRejected ? <XCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />,
      completed: accountantApproved,
      active: !accountantApproved && status === 'sent' && !isRejected,
      rejected: isRejected,
    },
    {
      id: 'sent_to_spv',
      label: 'Trimisă la SPV',
      icon: <Send className="w-5 h-5" />,
      completed: !!spvSentAt,
      active: accountantApproved && !spvSentAt,
      rejected: false,
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-10">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              isRejected ? "bg-destructive" : "bg-primary"
            )}
            style={{
              width: `${(steps.filter(s => s.completed).length / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="flex justify-between items-start">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center" style={{ flex: 1 }}>
              {/* Icon container */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 mb-2",
                  step.rejected 
                    ? "bg-destructive/10 border-destructive text-destructive"
                    : step.completed
                    ? "bg-primary text-primary-foreground border-primary"
                    : step.active
                    ? "bg-primary/20 border-primary text-primary animate-pulse"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step.rejected ? (
                  <XCircle className="w-5 h-5" />
                ) : step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors",
                    step.rejected
                      ? "text-destructive"
                      : step.completed
                      ? "text-foreground"
                      : step.active
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {step.rejected && step.id === 'approved' ? 'Respinsă' : step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Rejection note */}
        {isRejected && approvalNotes && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs font-semibold text-destructive mb-1">Motiv respingere:</p>
            <p className="text-xs text-destructive/80">{approvalNotes}</p>
          </div>
        )}

        {/* Approval note */}
        {accountantApproved && approvalNotes && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1">Comentariu aprobare:</p>
            <p className="text-xs text-green-800 dark:text-green-300">{approvalNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
