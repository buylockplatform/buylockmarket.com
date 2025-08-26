// Simple toast hook for notifications
export function useToast() {
  const toast = ({ title, description, variant }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    // For now, just use console.log - can be enhanced later
    console.log(`Toast: ${title}${description ? ` - ${description}` : ""}`);
  };

  return { toast };
}